<?php

use App\Models\Application;
use App\Models\CandidateProfile;
use App\Models\ScrapedJob;
use App\Models\User;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

test('admin can view jobseeker application report and analytics data', function () {
    $admin = User::factory()->admin()->create();
    $candidate = User::factory()->candidate()->create();
    $profile = CandidateProfile::create([
        'user_id' => $candidate->id,
        'full_name' => 'Candidate Report',
    ]);
    $job = ScrapedJob::create([
        'source_platform' => 'dealls',
        'source_job_id' => 'report-job-1',
        'source_url' => 'https://dealls.com/jobs/report-job-1',
        'company_name' => 'Report Company',
        'title' => 'Senior Analyst',
        'description' => 'Analyze data.',
        'status' => 'reviewed',
        'imported_at' => now(),
    ]);
    Application::create([
        'scraped_job_id' => $job->id,
        'candidate_id' => $profile->id,
        'status' => 'hired',
        'email_status' => 'sent',
        'email_sent_at' => now(),
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
            ->where('jobs.data.0.status', 'sent')
            ->where('statusCounts.hired', 1)
            ->where('applicants.data.0.candidate', 'Candidate Report')
            ->where('applicants.data.0.company', 'Report Company')
            ->where('applicants.data.0.email_status', 'sent')
            ->has('trend', 12)
            ->has('topJobs', 1));
});

test('non admin users cannot view jobseeker application report', function () {
    $this->actingAs(User::factory()->candidate()->create())
        ->get(route('admin.jobseeker-reports'))
        ->assertForbidden();
});

test('admin can view external job applications in candidates tab', function () {
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
        ->get(route('admin.jobseeker-reports', ['tab' => 'candidates']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/jobseeker-reports')
            ->where('filters.tab', 'candidates')
            ->where('applicants.data.0.candidate', 'External Candidate')
            ->where('applicants.data.0.company', 'External Company')
            ->etc());
});
