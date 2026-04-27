<?php

use App\Models\Skill;
use App\Models\User;

test('candidate can add a custom skill without superadmin', function () {
    $candidate = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);

    $this->actingAs($candidate)
        ->post(route('candidate.skills.store'), [
            'skill_name' => 'Golang',
            'years_exp' => 2,
            'proficiency' => 'intermediate',
        ])
        ->assertRedirect();

    $skill = Skill::query()->where('name', 'Golang')->first();

    expect($skill)->not->toBeNull();

    $candidateProfile = $candidate->candidateProfile()->first();
    expect($candidateProfile)->not->toBeNull();

    $this->assertDatabaseHas('candidate_skill', [
        'candidate_id' => $candidateProfile?->id,
        'skill_id' => $skill?->id,
        'years_exp' => 2,
        'proficiency' => 'intermediate',
    ]);
});

test('candidate custom skill input reuses existing skill by name', function () {
    $existingSkill = Skill::create([
        'name' => 'React',
        'slug' => 'react',
    ]);

    $candidate = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);

    $this->actingAs($candidate)
        ->post(route('candidate.skills.store'), [
            'skill_name' => 'react',
            'years_exp' => 3,
            'proficiency' => 'advanced',
        ])
        ->assertRedirect();

    expect(Skill::query()->whereRaw('LOWER(name) = ?', ['react'])->count())->toBe(1);

    $candidateProfile = $candidate->candidateProfile()->first();
    expect($candidateProfile)->not->toBeNull();

    $this->assertDatabaseHas('candidate_skill', [
        'candidate_id' => $candidateProfile?->id,
        'skill_id' => $existingSkill->id,
        'years_exp' => 3,
        'proficiency' => 'advanced',
    ]);
});

test('candidate can still add skill from existing skill list', function () {
    $skill = Skill::create([
        'name' => 'Laravel',
        'slug' => 'laravel',
    ]);

    $candidate = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);

    $this->actingAs($candidate)
        ->post(route('candidate.skills.store'), [
            'skill_id' => $skill->id,
            'years_exp' => 4,
            'proficiency' => 'expert',
        ])
        ->assertRedirect();

    $candidateProfile = $candidate->candidateProfile()->first();
    expect($candidateProfile)->not->toBeNull();

    $this->assertDatabaseHas('candidate_skill', [
        'candidate_id' => $candidateProfile?->id,
        'skill_id' => $skill->id,
        'years_exp' => 4,
        'proficiency' => 'expert',
    ]);
});
