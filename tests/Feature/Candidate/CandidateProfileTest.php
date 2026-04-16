<?php

use App\Models\Industry;
use App\Models\Skill;
use App\Models\User;

test('candidate can complete onboarding and attach primary skills', function () {
    $candidate = User::factory()->candidate()->create(['name' => 'Ayu']);
    $industry = Industry::create(['name' => 'Technology', 'slug' => 'technology']);
    $skill = Skill::create(['name' => 'React', 'slug' => 'react']);

    $this->actingAs($candidate)
        ->post(route('candidate.onboarding.store'), [
            'full_name' => 'Ayu Lestari',
            'headline' => 'Frontend Developer',
            'bio' => 'Fokus di React dan design system.',
            'location_city' => 'Jakarta',
            'location_province' => 'DKI Jakarta',
            'expected_salary_min' => 8000000,
            'expected_salary_max' => 14000000,
            'work_mode_pref' => 'hybrid',
            'availability' => '30 hari',
            'preferred_industry_id' => $industry->id,
            'preferred_role' => 'Frontend Engineer',
            'skill_ids' => [$skill->id],
        ])
        ->assertRedirect(route('candidate.dashboard'));

    $this->assertDatabaseHas('candidate_profiles', [
        'user_id' => $candidate->id,
        'full_name' => 'Ayu Lestari',
        'preferred_role' => 'Frontend Engineer',
        'preferred_industry_id' => $industry->id,
    ]);

    $this->assertDatabaseHas('candidate_skill', [
        'candidate_id' => $candidate->candidateProfile->id,
        'skill_id' => $skill->id,
    ]);

    expect($candidate->refresh()->onboarding_completed_at)->not->toBeNull();
});

test('candidate can update profile preferences', function () {
    $candidate = User::factory()->candidate()->create();

    $this->actingAs($candidate)
        ->patch(route('candidate.profile.update'), [
            'full_name' => 'Bima Santoso',
            'headline' => 'Data Analyst',
            'bio' => 'Mengolah data produk dan bisnis.',
            'location_city' => 'Bandung',
            'location_province' => 'Jawa Barat',
            'expected_salary_min' => 9000000,
            'expected_salary_max' => 16000000,
            'work_mode_pref' => 'remote',
            'availability' => 'Immediate',
            'linkedin_url' => 'https://linkedin.com/in/bima',
            'github_url' => 'https://github.com/bima',
            'portfolio_url' => 'https://bima.example.com',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('candidate_profiles', [
        'user_id' => $candidate->id,
        'full_name' => 'Bima Santoso',
        'work_mode_pref' => 'remote',
        'expected_salary_min' => 9000000,
        'expected_salary_max' => 16000000,
    ]);
});
