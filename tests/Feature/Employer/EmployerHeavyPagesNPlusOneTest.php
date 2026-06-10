<?php

use App\Models\Application;
use App\Models\CandidateCv;
use App\Models\CandidateProfile;
use App\Models\Company;
use App\Models\Industry;
use App\Models\JobListing;
use App\Models\Skill;
use App\Models\User;
use Illuminate\Support\Facades\DB;

use function Pest\Laravel\actingAs;

/**
 * Runtime N+1 guard for the heaviest employer listing pages. Each page is hit
 * twice — once with few rows, once with many — and the query count must stay
 * flat (small constant delta). A per-row relation lazy-load would make the count
 * scale with the number of rows and fail the bound.
 */
function seedEmployerContext(): array
{
    $employer = User::factory()->employer()->create();
    $industry = Industry::create(['name' => 'Teknologi', 'slug' => 'teknologi']);
    $skill = Skill::create(['name' => 'Laravel', 'slug' => 'laravel', 'category' => 'Backend']);
    $company = Company::create([
        'owner_id' => $employer->id,
        'industry_id' => $industry->id,
        'name' => 'Karivia Tech',
        'slug' => 'karivia-tech',
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);

    return compact('employer', 'industry', 'skill', 'company');
}

function makeJobWithApplication(array $ctx, int $i): void
{
    $job = JobListing::create([
        'company_id' => $ctx['company']->id,
        'created_by' => $ctx['employer']->id,
        'industry_id' => $ctx['industry']->id,
        'title' => "Backend Engineer $i",
        'slug' => "backend-engineer-$i",
        'description' => 'Bangun API.',
        'work_mode' => 'hybrid',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'status' => 'published',
        'published_at' => now(),
    ]);

    $candidateUser = User::factory()->candidate()->create();
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => "Kandidat $i",
        'headline' => 'Backend Developer',
        'preferred_industry_id' => $ctx['industry']->id,
        'profile_completion' => 90,
    ]);
    $candidate->skills()->attach($ctx['skill']->id, ['years_exp' => 3, 'proficiency' => 'advanced']);
    $cv = CandidateCv::create([
        'candidate_id' => $candidate->id,
        'file_url' => '/storage/demo/cv.pdf',
        'source' => 'manual',
        'is_primary' => true,
        'uploaded_at' => now(),
    ]);

    Application::create([
        'job_listing_id' => $job->id,
        'candidate_id' => $candidate->id,
        'candidate_cv_id' => $cv->id,
        'status' => 'shortlisted',
        'ai_fit_score' => 86,
        'applied_at' => now()->subMinutes($i),
    ]);
}

/**
 * Returns query count for a GET request after warming the route once.
 */
function countPageQueries(User $employer, string $url): int
{
    actingAs($employer)->get($url)->assertOk();

    DB::flushQueryLog();
    DB::enableQueryLog();
    actingAs($employer)->get($url)->assertOk();
    $count = count(DB::getQueryLog());
    DB::disableQueryLog();

    return $count;
}

test('employer heavy pages do not N+1 as rows grow', function () {
    $ctx = seedEmployerContext();

    // Start with 2 jobs+applications.
    foreach (range(1, 2) as $i) {
        makeJobWithApplication($ctx, $i);
    }

    $pages = [
        'dashboard' => route('employer.dashboard'),
        'candidates' => route('employer.candidates.index'),
        'jobs' => route('employer.jobs.index'),
    ];

    $before = [];
    foreach ($pages as $key => $url) {
        $before[$key] = countPageQueries($ctx['employer'], $url);
    }

    // Grow to 12 jobs+applications (10 more rows on every listing).
    foreach (range(3, 12) as $i) {
        makeJobWithApplication($ctx, $i);
    }

    $after = [];
    foreach ($pages as $key => $url) {
        $after[$key] = countPageQueries($ctx['employer'], $url);
    }

    // 10 extra rows must not add ~10+ queries per page. Allow a tiny constant
    // delta (a couple of aggregate/count widgets may shift), but reject linear
    // growth that signals N+1.
    foreach ($pages as $key => $url) {
        $delta = $after[$key] - $before[$key];
        expect($delta)->toBeLessThanOrEqual(3, "Page [$key] grew by $delta queries for 10 extra rows (before={$before[$key]}, after={$after[$key]}) — likely N+1");
    }

    // Surface the actual numbers for the report.
    fwrite(STDERR, "\nEmployer page query counts (2 rows → 12 rows):\n");
    foreach ($pages as $key => $url) {
        fwrite(STDERR, sprintf("  %-12s %2d → %2d  (Δ%+d)\n", $key, $before[$key], $after[$key], $after[$key] - $before[$key]));
    }
});
