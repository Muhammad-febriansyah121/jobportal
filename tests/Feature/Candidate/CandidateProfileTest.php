<?php

use App\Actions\Candidate\ResolveCandidateProfile;
use App\Models\Industry;
use App\Models\Skill;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

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
            'availability' => '1_month',
            'preferred_industry_id' => $industry->id,
            'preferred_role' => 'Frontend Engineer',
            'skill_ids' => [$skill->id],
            'experiences' => [
                [
                    'company_name' => 'PT Karivia Indonesia',
                    'job_title' => 'Frontend Engineer',
                    'start_date' => '2023-01-01',
                    'end_date' => '2024-01-01',
                ],
            ],
            'educations' => [
                [
                    'institution' => 'Universitas Indonesia',
                    'degree' => 'S1',
                    'field_of_study' => 'Informatika',
                    'start_year' => 2019,
                    'end_year' => 2023,
                    'gpa' => 3.75,
                ],
            ],
        ])
        ->assertRedirect(route('candidate.dashboard'));

    $this->assertDatabaseHas('candidate_profiles', [
        'user_id' => $candidate->id,
        'full_name' => 'Ayu Lestari',
        'preferred_role' => 'Frontend Engineer',
        'preferred_industry_id' => $industry->id,
    ]);

    $candidateProfile = $candidate->refresh()->candidateProfile()->firstOrFail();

    $this->assertDatabaseHas('candidate_skill', [
        'candidate_id' => $candidateProfile->id,
        'skill_id' => $skill->id,
    ]);
    $this->assertDatabaseHas('candidate_experiences', [
        'candidate_id' => $candidateProfile->id,
        'company_name' => 'PT Karivia Indonesia',
        'job_title' => 'Frontend Engineer',
    ]);
    $this->assertDatabaseHas('candidate_educations', [
        'candidate_id' => $candidateProfile->id,
        'institution' => 'Universitas Indonesia',
        'degree' => 'S1',
    ]);

    expect($candidate->refresh()->onboarding_completed_at)->toBeNull();
});

test('candidate can add custom skills during onboarding', function () {
    $candidate = User::factory()->candidate()->create();
    $existing = Skill::create(['name' => 'Laravel', 'slug' => 'laravel']);

    $this->actingAs($candidate)
        ->post(route('candidate.onboarding.store'), [
            'full_name' => 'Budi Santoso',
            'work_mode_pref' => 'remote',
            'skill_ids' => [$existing->id],
            'new_skills' => ['Rust', 'WebAssembly', 'Rust'],
        ])
        ->assertRedirect(route('candidate.dashboard'));

    $candidateProfile = $candidate->refresh()->candidateProfile()->firstOrFail();

    $this->assertDatabaseHas('skills', ['name' => 'Rust', 'slug' => 'rust']);
    $this->assertDatabaseHas('skills', ['name' => 'WebAssembly', 'slug' => 'webassembly']);

    expect(Skill::where('slug', 'rust')->count())->toBe(1);
    expect($candidateProfile->skills()->pluck('skills.id'))
        ->toContain($existing->id, Skill::where('slug', 'rust')->value('id'));
});

test('candidate onboarding reuses an existing skill instead of duplicating it', function () {
    $candidate = User::factory()->candidate()->create();
    $existing = Skill::create(['name' => 'Go', 'slug' => 'go']);

    $this->actingAs($candidate)
        ->post(route('candidate.onboarding.store'), [
            'full_name' => 'Citra',
            'work_mode_pref' => 'remote',
            'new_skills' => ['go'],
        ])
        ->assertRedirect(route('candidate.dashboard'));

    expect(Skill::where('slug', 'go')->count())->toBe(1);

    $candidateProfile = $candidate->refresh()->candidateProfile()->firstOrFail();
    expect($candidateProfile->skills()->pluck('skills.id'))->toContain($existing->id);
});

test('candidate onboarding saves multiple experiences and educations', function () {
    $candidate = User::factory()->candidate()->create();

    $this->actingAs($candidate)
        ->post(route('candidate.onboarding.store'), [
            'full_name' => 'Budi',
            'work_mode_pref' => 'any',
            'experiences' => [
                [
                    'company_name' => 'PT Karivia',
                    'job_title' => 'Senior Developer',
                    'start_date' => '2023-01-01',
                    'is_current' => '1',
                ],
                [
                    'company_name' => 'PT Mitra Tech',
                    'job_title' => 'Junior Developer',
                    'start_date' => '2021-06-01',
                    'end_date' => '2022-12-31',
                ],
                [
                    'company_name' => 'CV Lainnya',
                    'job_title' => 'Intern',
                    'start_date' => '2020-07-01',
                    'end_date' => '2021-05-31',
                ],
            ],
            'educations' => [
                [
                    'institution' => 'Universitas Indonesia',
                    'degree' => 'S1',
                    'field_of_study' => 'Informatika',
                    'start_year' => 2019,
                    'end_year' => 2023,
                ],
                [
                    'institution' => 'SMA Negeri 1',
                    'degree' => 'SMA',
                    'field_of_study' => 'IPA',
                    'start_year' => 2016,
                    'end_year' => 2019,
                ],
            ],
        ])
        ->assertRedirect(route('candidate.dashboard'));

    $candidateProfile = $candidate->refresh()->candidateProfile()->firstOrFail();

    expect($candidateProfile->experiences()->count())->toBe(3);
    expect($candidateProfile->educations()->count())->toBe(2);

    $this->assertDatabaseHas('candidate_experiences', [
        'candidate_id' => $candidateProfile->id,
        'company_name' => 'PT Karivia',
    ]);
    $this->assertDatabaseHas('candidate_experiences', [
        'candidate_id' => $candidateProfile->id,
        'company_name' => 'PT Mitra Tech',
        'is_current' => false,
    ]);
    $this->assertDatabaseHas('candidate_experiences', [
        'candidate_id' => $candidateProfile->id,
        'company_name' => 'CV Lainnya',
    ]);
    $this->assertDatabaseHas('candidate_educations', [
        'candidate_id' => $candidateProfile->id,
        'institution' => 'SMA Negeri 1',
        'degree' => 'SMA',
    ]);
});

test('candidate onboarding replaces pre-existing experiences and educations on resubmit', function () {
    $candidate = User::factory()->candidate()->create();
    $profile = app(ResolveCandidateProfile::class)->handle($candidate->refresh());

    $profile->experiences()->create([
        'company_name' => 'CV-Parser Inserted Co',
        'job_title' => 'Auto-Filled Title',
        'start_date' => '2020-01-01',
        'is_current' => false,
    ]);
    $profile->educations()->create([
        'institution' => 'CV-Parser Inserted School',
        'degree' => 'Auto',
        'field_of_study' => 'Auto',
        'start_year' => 2015,
        'end_year' => 2019,
    ]);

    $this->actingAs($candidate)
        ->post(route('candidate.onboarding.store'), [
            'full_name' => 'Citra',
            'work_mode_pref' => 'remote',
            'experiences' => [
                [
                    'company_name' => 'PT Dipilih Manual',
                    'job_title' => 'Senior Engineer',
                    'start_date' => '2024-02-01',
                    'is_current' => '1',
                ],
            ],
            'educations' => [
                [
                    'institution' => 'Universitas Gadjah Mada',
                    'degree' => 'S1',
                    'field_of_study' => 'Teknik Informatika',
                    'start_year' => 2018,
                    'end_year' => 2022,
                ],
            ],
        ])
        ->assertRedirect(route('candidate.dashboard'));

    $profile->refresh();

    expect($profile->experiences()->count())->toBe(1);
    expect($profile->educations()->count())->toBe(1);

    $this->assertDatabaseMissing('candidate_experiences', [
        'candidate_id' => $profile->id,
        'company_name' => 'CV-Parser Inserted Co',
    ]);
    $this->assertDatabaseHas('candidate_experiences', [
        'candidate_id' => $profile->id,
        'company_name' => 'PT Dipilih Manual',
        'job_title' => 'Senior Engineer',
    ]);
    $this->assertDatabaseMissing('candidate_educations', [
        'candidate_id' => $profile->id,
        'institution' => 'CV-Parser Inserted School',
    ]);
    $this->assertDatabaseHas('candidate_educations', [
        'candidate_id' => $profile->id,
        'institution' => 'Universitas Gadjah Mada',
    ]);
});

test('candidate onboarding keeps existing experiences when none are submitted', function () {
    $candidate = User::factory()->candidate()->create();
    $profile = app(ResolveCandidateProfile::class)->handle($candidate->refresh());

    $profile->experiences()->create([
        'company_name' => 'PT Existing',
        'job_title' => 'Engineer',
        'start_date' => '2022-01-01',
        'is_current' => true,
    ]);

    $this->actingAs($candidate)
        ->post(route('candidate.onboarding.store'), [
            'full_name' => 'Dewi',
            'work_mode_pref' => 'hybrid',
            'experiences' => [
                ['company_name' => '', 'job_title' => '', 'start_date' => '', 'end_date' => ''],
            ],
        ])
        ->assertRedirect(route('candidate.dashboard'));

    expect($profile->refresh()->experiences()->count())->toBe(1);
    $this->assertDatabaseHas('candidate_experiences', [
        'candidate_id' => $profile->id,
        'company_name' => 'PT Existing',
    ]);
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
            'availability' => 'none',
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

test('candidate profile edit page shows missing completion checklist', function () {
    $candidate = User::factory()->candidate()->create([
        'name' => 'Bima Santoso',
    ]);

    $this->actingAs($candidate)
        ->get(route('candidate.profile.edit'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('candidate/profile')
            ->where('profile.full_name', 'Bima Santoso')
            ->has('profile.profile_completion_missing')
            ->where('profile.profile_completion_missing.0.label', 'Headline profil')
            ->where('profile.profile_completion_missing', fn ($items): bool => collect($items)->contains(
                fn (array $item): bool => $item['key'] === 'profile_photo' && $item['label'] === 'Foto profil'
            )));
});

test('candidate with incomplete onboarding is redirected when opening locked menus', function () {
    $candidate = User::factory()->candidate()->create([
        'onboarding_completed_at' => null,
    ]);

    $this->actingAs($candidate)
        ->get(route('candidate.applications.index'))
        ->assertRedirect(route('candidate.onboarding.edit'));
});

test('candidate with incomplete onboarding can access profile data tabs', function () {
    $candidate = User::factory()->candidate()->create([
        'onboarding_completed_at' => null,
    ]);

    $this->actingAs($candidate)
        ->get(route('candidate.skills.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('candidate/skills')
            ->has('candidateSkills')
        );
});

test('candidate with completed onboarding can access candidate menus', function () {
    $candidate = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);

    $this->actingAs($candidate)
        ->get(route('candidate.applications.index'))
        ->assertOk();
});

test('candidate with 100 profile completion auto-unlocks onboarded routes', function () {
    $candidate = User::factory()->candidate()->create([
        'onboarding_completed_at' => null,
    ]);

    $candidate->candidateProfile()->updateOrCreate(
        ['user_id' => $candidate->id],
        [
            'full_name' => $candidate->name,
            'work_mode_pref' => 'any',
            'profile_completion' => 100,
        ],
    );

    $this->actingAs($candidate)
        ->get(route('candidate.applications.index'))
        ->assertOk();

    expect($candidate->refresh()->onboarding_completed_at)->not->toBeNull();
});

test('refreshCompletion auto-sets onboarding_completed_at when profile reaches 100%', function () {
    $candidate = User::factory()->candidate()->create([
        'onboarding_completed_at' => null,
        'avatar_url' => 'https://example.com/avatar.jpg',
    ]);
    $profile = $candidate->candidateProfile()->firstOrCreate(
        ['user_id' => $candidate->id],
        ['full_name' => $candidate->name, 'work_mode_pref' => 'any'],
    );
    $industry = Industry::create(['name' => 'Tech Auto', 'slug' => 'tech-auto']);
    $skill = Skill::create(['name' => 'Vue', 'slug' => 'vue']);

    $profile->update([
        'full_name' => 'Test User',
        'headline' => 'Engineer',
        'bio' => 'Some bio',
        'location_city' => 'Jakarta',
        'location_province' => 'DKI Jakarta',
        'expected_salary_min' => 10000000,
        'work_mode_pref' => 'remote',
        'availability' => 'Immediate',
        'preferred_industry_id' => $industry->id,
    ]);
    $profile->skills()->syncWithoutDetaching([$skill->id => ['proficiency' => 'intermediate']]);
    $profile->educations()->create(['institution' => 'UI', 'degree' => 'S1', 'field_of_study' => 'CS', 'start_year' => 2018, 'end_year' => 2022]);
    $profile->experiences()->create(['company_name' => 'PT X', 'job_title' => 'Dev', 'start_date' => '2022-02-01', 'is_current' => true]);
    $profile->cvs()->create(['file_url' => 'cv.pdf', 'is_primary' => true, 'uploaded_at' => now()]);

    $action = app(ResolveCandidateProfile::class);
    $action->refreshCompletion($profile);

    expect($candidate->refresh()->onboarding_completed_at)->not->toBeNull();
});
