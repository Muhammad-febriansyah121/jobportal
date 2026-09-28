<?php

use App\Models\CandidateProfile;
use App\Models\Company;
use App\Models\JobListing;
use App\Models\User;

test('expired saved jobs are not presented as open', function () {
    $candidateUser = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Kandidat',
        'work_mode_pref' => 'any',
    ]);
    $employer = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Karivia Tech',
        'slug' => 'karivia-tech-saved-job',
        'is_active' => true,
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'title' => 'Backend Engineer',
        'slug' => 'backend-engineer-expired-saved',
        'description' => 'Build APIs.',
        'work_mode' => 'remote',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'status' => 'published',
        'published_at' => now()->subWeek(),
        'closes_at' => now()->subMinute(),
    ]);

    $candidate->savedJobs()->create(['job_listing_id' => $job->id]);

    $this->actingAs($candidateUser)
        ->get(route('candidate.saved-jobs.index'))
        ->assertInertia(fn ($page) => $page
            ->component('candidate/saved-jobs')
            ->where('savedJobs.data.0.id', $candidate->savedJobs()->first()->id)
            ->where('savedJobs.data.0.status', 'published')
            ->where('savedJobs.data.0.is_open', false)
        );
});
