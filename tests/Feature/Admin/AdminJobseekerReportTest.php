<?php

use App\Models\Application;
use App\Models\CandidateProfile;
use App\Models\Company;
use App\Models\JobListing;
use App\Models\ScrapedJob;
use App\Models\User;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

test('admin can view jobseeker application report and analytics data', function () {
    $admin = User::factory()->admin()->create();
    $employer = User::factory()->employer()->create();
    $candidate = User::factory()->candidate()->create();
    $profile = CandidateProfile::create([
        'user_id' => $candidate->id,
        'full_name' => 'Candidate Report',
    ]);
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Report Company',
        'slug' => 'report-company-'.uniqid(),
        'description' => 'Company for report test.',
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'title' => 'Senior Analyst',
        'slug' => 'senior-analyst-'.uniqid(),
        'description' => 'Analyze data.',
        'status' => 'published',
        'published_at' => now(),
    ]);
    Application::create([
        'job_listing_id' => $job->id,
        'candidate_id' => $profile->id,
        'status' => 'hired',
        'applied_at' => Carbon::now(),
    ]);

    $this->actingAs($admin)
        ->get(route('admin.jobseeker-reports', ['search' => 'Senior']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/jobseeker-reports')
            ->where('filters.search', 'Senior')
            ->where('summary.total_applications', 1)
            ->where('summary.unique_candidates', 1)
            ->where('summary.hired_candidates', 1)
            ->where('jobs.data.0.applications', 1)
            ->where('statusCounts.hired', 1)
            ->where('applicants.data.0.candidate', 'Candidate Report')
            ->where('applicants.data.0.company', 'Report Company')
            ->has('trend', 12)
            ->has('topJobs', 1));
});

test('non admin users cannot view jobseeker application report', function () {
    $this->actingAs(User::factory()->candidate()->create())
        ->get(route('admin.jobseeker-reports'))
        ->assertForbidden();
});

test('admin can view external job applications in external tab', function () {
    $admin = User::factory()->admin()->create();
    $candidate = User::factory()->candidate()->create();
    $profile = CandidateProfile::create([
        'user_id' => $candidate->id,
        'full_name' => 'External Candidate',
    ]);
    $scrapedJob = ScrapedJob::create([
        'source_platform' => 'dealls',
        'source_job_id' => 'external-report-1',
        'source_url' => 'https://dealls.com/jobs/external-report-1',
        'company_name' => 'External Company',
        'title' => 'External Product Manager',
        'description' => 'External job for report.',
        'status' => 'reviewed',
        'imported_at' => now(),
    ]);
    Application::create([
        'scraped_job_id' => $scrapedJob->id,
        'candidate_id' => $profile->id,
        'status' => 'applied',
        'applied_at' => now(),
    ]);

    $this->actingAs($admin)
        ->get(route('admin.jobseeker-reports', ['tab' => 'external']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/jobseeker-reports')
            ->where('filters.tab', 'external')
            ->where('externalApplicants.data.0.candidate', 'External Candidate')
            ->where('externalApplicants.data.0.company', 'External Company')
            ->where('externalApplicants.data.0.platform', 'dealls')
            ->etc());
});
