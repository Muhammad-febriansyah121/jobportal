<?php

use App\Models\ActivityLog;
use App\Models\CandidateCv;
use App\Models\CandidateProfile;
use App\Models\Company;
use App\Models\JobListing;
use App\Models\User;

test('candidate can save and apply to a published job', function () {
    $candidateUser = User::factory()->candidate()->create();
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Kandidat',
        'work_mode_pref' => 'any',
    ]);
    $cv = CandidateCv::create([
        'candidate_id' => $candidate->id,
        'file_url' => '/storage/candidate-cvs/cv.pdf',
        'source' => 'upload',
        'is_primary' => true,
        'uploaded_at' => now(),
    ]);
    $employer = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Karivia Tech',
        'slug' => 'karivia-tech',
        'is_verified' => true,
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'title' => 'Backend Engineer',
        'slug' => 'backend-engineer',
        'description' => 'Build APIs.',
        'work_mode' => 'remote',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'salary_min' => 12000000,
        'salary_max' => 18000000,
        'status' => 'published',
        'published_at' => now(),
    ]);

    $this->actingAs($candidateUser)
        ->post(route('candidate.jobs.save', $job))
        ->assertRedirect();

    $this->assertDatabaseHas('saved_jobs', [
        'candidate_id' => $candidate->id,
        'job_listing_id' => $job->id,
    ]);

    $this->actingAs($candidateUser)
        ->post(route('candidate.jobs.apply', $job), [
            'candidate_cv_id' => $cv->id,
            'cover_letter' => 'Saya cocok untuk posisi ini.',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('applications', [
        'candidate_id' => $candidate->id,
        'job_listing_id' => $job->id,
        'candidate_cv_id' => $cv->id,
        'status' => 'applied',
    ]);

    $this->assertDatabaseHas('application_status_histories', [
        'to_status' => 'applied',
        'changed_by' => $candidateUser->id,
    ]);

    $this->assertDatabaseHas('user_notifications', [
        'user_id' => $employer->id,
        'type' => 'application_submitted',
    ]);

    expect(ActivityLog::where('actor_id', $candidateUser->id)->where('action', 'candidate_jobs_save')->exists())->toBeTrue();
    expect(ActivityLog::where('actor_id', $candidateUser->id)->where('action', 'candidate_jobs_apply')->exists())->toBeTrue();
});

test('candidate cannot apply twice to the same job', function () {
    $candidateUser = User::factory()->candidate()->create();
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Kandidat',
        'work_mode_pref' => 'any',
    ]);
    $cv = CandidateCv::create([
        'candidate_id' => $candidate->id,
        'file_url' => '/storage/candidate-cvs/cv.pdf',
        'source' => 'upload',
        'is_primary' => true,
        'uploaded_at' => now(),
    ]);
    $employer = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Karivia Tech',
        'slug' => 'karivia-tech-dua',
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'title' => 'Product Designer',
        'slug' => 'product-designer',
        'description' => 'Design product.',
        'work_mode' => 'hybrid',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'status' => 'published',
        'published_at' => now(),
    ]);
    $candidate->applications()->create([
        'job_listing_id' => $job->id,
        'candidate_cv_id' => $cv->id,
        'status' => 'applied',
        'applied_at' => now(),
    ]);

    $this->actingAs($candidateUser)
        ->post(route('candidate.jobs.apply', $job), [
            'candidate_cv_id' => $cv->id,
            'cover_letter' => 'Melamar ulang.',
        ])
        ->assertSessionHasErrors('job');
});
