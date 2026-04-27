<?php

use App\Models\AiRecommendation;
use App\Models\CandidateProfile;
use App\Models\Company;
use App\Models\Industry;
use App\Models\JobListing;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('candidate users are redirected to the candidate dashboard', function () {
    $candidate = User::factory()->candidate()->create();

    $this->actingAs($candidate)
        ->get(route('dashboard'))
        ->assertRedirect(route('candidate.dashboard'));
});

test('candidate users can view the candidate dashboard', function () {
    $candidate = User::factory()->candidate()->create([
        'name' => 'Nadia Kandidat',
        'avatar_url' => 'https://example.com/nadia.png',
    ]);

    $this->actingAs($candidate)
        ->get(route('candidate.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('candidate/dashboard')
            ->where('profile.full_name', 'Nadia Kandidat')
            ->where('profile.avatar_url', 'https://example.com/nadia.png')
            ->has('profile.profile_completion_missing')
            ->where('profile.profile_completion_missing.0.label', 'Headline profil')
            ->has('metrics')
            ->has('cvBuilder')
            ->where('cvBuilder.has_free_draft_available', true)
            ->has('recommendedJobs')
        );

    expect(CandidateProfile::whereBelongsTo($candidate)->exists())->toBeTrue();
});

test('candidate dashboard uses ai recommendations when available', function () {
    $candidateUser = User::factory()->candidate()->create(['name' => 'Budi Santoso']);
    $employer = User::factory()->employer()->create();
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Budi Santoso',
        'headline' => 'UI/UX Designer',
        'profile_completion' => 85,
    ]);
    $industry = Industry::factory()->create();
    $company = Company::create([
        'owner_id' => $employer->id,
        'industry_id' => $industry->id,
        'name' => 'Tokopedia',
        'slug' => 'tokopedia',
        'company_size' => '1000+',
        'hq_city' => 'Jakarta',
        'hq_province' => 'DKI Jakarta',
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'industry_id' => $industry->id,
        'title' => 'Product Designer',
        'slug' => 'product-designer',
        'description' => 'Design system role.',
        'location_city' => 'Jakarta',
        'location_province' => 'DKI Jakarta',
        'work_mode' => 'remote',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'status' => 'published',
        'is_salary_visible' => false,
        'published_at' => now(),
    ]);

    AiRecommendation::create([
        'candidate_id' => $candidate->id,
        'job_listing_id' => $job->id,
        'score' => 98,
        'reason' => 'Skill desain dan preferensi role sangat sesuai.',
    ]);

    $this->actingAs($candidateUser)
        ->get(route('candidate.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('recommendedJobs.0.title', 'Product Designer')
            ->where('recommendedJobs.0.match_score', 98)
            ->where('recommendedJobs.0.match_reason', 'Skill desain dan preferensi role sangat sesuai.')
        );
});

test('non candidate users cannot access candidate routes', function () {
    $employer = User::factory()->employer()->create();

    $this->actingAs($employer)
        ->get(route('candidate.dashboard'))
        ->assertForbidden();
});
