<?php

use App\Models\CandidateProfile;
use App\Models\Company;
use App\Models\Interview;
use App\Models\JobListing;
use App\Models\User;

test('candidate can confirm and decline own interview', function () {
    $candidateUser = User::factory()->candidate()->create();
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Kandidat',
        'work_mode_pref' => 'any',
    ]);
    $employer = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Karivia',
        'slug' => 'karivia',
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'title' => 'QA Engineer',
        'slug' => 'qa-engineer',
        'description' => 'Test products.',
        'status' => 'published',
        'published_at' => now(),
    ]);
    $application = $candidate->applications()->create([
        'job_listing_id' => $job->id,
        'status' => 'interview',
        'applied_at' => now(),
    ]);
    $interview = Interview::create([
        'application_id' => $application->id,
        'scheduled_by' => $employer->id,
        'scheduled_at' => now()->addDay(),
        'mode' => 'online',
        'location_url' => 'https://meet.example.com/interview',
        'status' => 'scheduled',
    ]);

    $this->actingAs($candidateUser)
        ->patch(route('candidate.interviews.confirm', $interview))
        ->assertRedirect();

    expect($interview->refresh()->status)->toBe('confirmed');

    $this->actingAs($candidateUser)
        ->patch(route('candidate.interviews.decline', $interview))
        ->assertRedirect();

    expect($interview->refresh()->status)->toBe('cancelled');
});
