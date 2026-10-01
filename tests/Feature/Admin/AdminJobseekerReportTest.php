<?php

use App\Models\Application;
use App\Models\CandidateProfile;
use App\Models\Company;
use App\Models\JobListing;
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
            ->has('trend', 12)
            ->has('topJobs', 1));
});

test('non admin users cannot view jobseeker application report', function () {
    $this->actingAs(User::factory()->candidate()->create())
        ->get(route('admin.jobseeker-reports'))
        ->assertForbidden();
});
