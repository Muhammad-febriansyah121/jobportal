<?php

use App\Models\Application;
use App\Models\CandidateProfile;
use App\Models\Company;
use App\Models\CompanyReview;
use App\Models\JobListing;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

function createPublishedJobForCompany(Company $company, User $owner): JobListing
{
    return JobListing::create([
        'company_id' => $company->id,
        'created_by' => $owner->id,
        'title' => 'Backend Engineer',
        'slug' => 'backend-engineer-'.$company->id.'-'.uniqid(),
        'description' => 'Build reliable backend service.',
        'work_mode' => 'remote',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'status' => 'published',
        'published_at' => now(),
    ]);
}

test('candidate with hired status can create company review', function () {
    $employer = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'PT Karivia Teknologi',
        'slug' => 'pt-karivia-teknologi',
        'description' => 'Perusahaan teknologi.',
        'verification_status' => 'approved',
        'is_verified' => true,
        'is_active' => true,
    ]);

    $job = createPublishedJobForCompany($company, $employer);

    $candidateUser = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => $candidateUser->name,
        'work_mode_pref' => 'any',
    ]);

    Application::create([
        'job_listing_id' => $job->id,
        'candidate_id' => $candidate->id,
        'status' => 'hired',
    ]);

    $this->actingAs($candidateUser)
        ->post(route('candidate.companies.reviews.store', $company->slug), [
            'rating' => 5,
            'title' => 'Lingkungan kerja supportif',
            'review' => 'Proses rekrutmen cepat dan budaya kerja tim sangat kolaboratif.',
        ])
        ->assertRedirect(route('companies.show', $company->slug));

    $review = CompanyReview::query()
        ->where('company_id', $company->id)
        ->where('candidate_id', $candidate->id)
        ->first();

    expect($review)->not->toBeNull();
    expect($review?->status)->toBe('pending');
    expect($review?->rating)->toBe(5);

    $this->actingAs($candidateUser)
        ->get(route('companies.show', $company->slug))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('companies/show')
            ->where('company.review_access.can_submit', true)
            ->where('company.review_access.my_review.rating', 5)
        );
});

test('candidate without hired status cannot create company review', function () {
    $employer = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'PT Karivia Data',
        'slug' => 'pt-karivia-data',
        'description' => 'Perusahaan data.',
        'verification_status' => 'approved',
        'is_verified' => true,
        'is_active' => true,
    ]);

    $job = createPublishedJobForCompany($company, $employer);

    $candidateUser = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => $candidateUser->name,
        'work_mode_pref' => 'any',
    ]);

    Application::create([
        'job_listing_id' => $job->id,
        'candidate_id' => $candidate->id,
        'status' => 'applied',
    ]);

    $this->actingAs($candidateUser)
        ->post(route('candidate.companies.reviews.store', $company->slug), [
            'rating' => 4,
            'title' => 'Belum bisa submit',
            'review' => 'Saya belum berstatus hired.',
        ])
        ->assertForbidden();

    expect(CompanyReview::query()
        ->where('company_id', $company->id)
        ->where('candidate_id', $candidate->id)
        ->exists())->toBeFalse();
});
