<?php

use App\Models\Application;
use App\Models\CandidateProfile;
use App\Models\ScrapedJob;
use App\Models\User;

test('admin analytics uses external jobs and applications', function () {
    $admin = User::factory()->admin()->create();
    $candidate = User::factory()->candidate()->create();
    $profile = CandidateProfile::create([
        'user_id' => $candidate->id,
        'full_name' => 'Analytics Candidate',
    ]);
    $job = ScrapedJob::create([
        'source_platform' => 'dealls',
        'source_job_id' => 'analytics-external-1',
        'source_url' => 'https://dealls.com/jobs/analytics-external-1',
        'company_name' => 'Analytics External Company',
        'title' => 'Analytics External Job',
        'description' => 'External analytics job.',
        'status' => 'reviewed',
        'imported_at' => now(),
    ]);
    Application::create([
        'scraped_job_id' => $job->id,
        'candidate_id' => $profile->id,
        'status' => 'applied',
        'applied_at' => now(),
    ]);

    $this->actingAs($admin)
        ->get(route('admin.analytics'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/analytics')
            ->where('totals.jobs_live', 1)
            ->where('totals.applications_month', 1)
            ->where('applicationFunnel.applied', 1)
            ->where('jobsByStatus.reviewed', 1)
            ->etc());
});
