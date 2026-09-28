<?php

use App\Models\CandidateProfile;
use App\Models\Company;
use App\Models\Industry;
use App\Models\JobListing;
use App\Models\Skill;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Builds a published job in the given industry with two attached skills.
 */
function makePublishedJob(Company $company, User $employer, Industry $industry, string $slug): JobListing
{
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'industry_id' => $industry->id,
        'title' => 'Engineer '.$slug,
        'slug' => $slug,
        'description' => 'Build things.',
        'work_mode' => 'remote',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'salary_min' => 12000000,
        'salary_max' => 18000000,
        'status' => 'published',
        'published_at' => now(),
    ]);

    $skills = Skill::factory()->count(2)->create();
    $job->skills()->attach($skills->pluck('id')->mapWithKeys(
        fn (int $id): array => [$id => ['is_required' => true, 'min_years' => 2]]
    )->all());

    return $job;
}

test('similar jobs do not trigger N+1 queries', function () {
    $candidateUser = User::factory()->candidate()->create(['onboarding_completed_at' => now()]);
    CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Kandidat',
        'work_mode_pref' => 'any',
    ]);

    $employer = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Karivia Tech',
        'slug' => 'karivia-tech',
        'is_verified' => true,
    ]);
    $industry = Industry::factory()->create();

    $main = makePublishedJob($company, $employer, $industry, 'main-job');
    makePublishedJob($company, $employer, $industry, 'similar-1');

    // Warm up so the candidate_job_views row exists; both measured requests then
    // take the same (update) path and only the similar-job count varies.
    $this->actingAs($candidateUser)->get(route('candidate.jobs.show', $main))->assertOk();

    // Count only the queries that the N+1 would multiply: per-row industry and
    // skills lookups. Dashboard widgets on the page add unrelated, constant noise.
    $countRelationQueries = function () use ($candidateUser, $main): int {
        DB::flushQueryLog();
        DB::enableQueryLog();
        $this->actingAs($candidateUser)->get(route('candidate.jobs.show', $main))->assertOk();
        $relationQueries = collect(DB::getQueryLog())
            ->filter(fn (array $log): bool => str_contains($log['query'], '"industries"')
                || str_contains($log['query'], '"skills"')
                || str_contains($log['query'], '"job_listing_skill"'))
            ->count();
        DB::disableQueryLog();

        return $relationQueries;
    };

    $relationQueriesWithOne = $countRelationQueries();

    // Add three more similar jobs (same industry), each with skills + industry.
    foreach (range(2, 4) as $i) {
        makePublishedJob($company, $employer, $industry, "similar-$i");
    }

    $relationQueriesWithFour = $countRelationQueries();

    // Eager loading keeps industry/skills queries flat regardless of similar-job
    // count. Without the fix, each extra similar job adds 2 lazy queries.
    expect($relationQueriesWithFour)->toBe($relationQueriesWithOne);
});

test('similar jobs exclude expired published jobs', function () {
    $candidateUser = User::factory()->candidate()->create(['onboarding_completed_at' => now()]);
    CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Kandidat',
        'work_mode_pref' => 'any',
    ]);

    $employer = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Karivia Tech',
        'slug' => 'karivia-tech',
    ]);
    $industry = Industry::factory()->create();

    $main = makePublishedJob($company, $employer, $industry, 'main-open-job');
    $expired = makePublishedJob($company, $employer, $industry, 'similar-expired');
    $expired->update(['closes_at' => now()->subMinute()]);

    $this->actingAs($candidateUser)
        ->get(route('candidate.jobs.show', $main))
        ->assertInertia(fn ($page) => $page->where(
            'similarJobs',
            fn ($jobs): bool => $jobs->isEmpty(),
        ));
});
