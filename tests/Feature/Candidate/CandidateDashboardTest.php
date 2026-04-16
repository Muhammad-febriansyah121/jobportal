<?php

use App\Models\CandidateProfile;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('candidate users are redirected to the candidate dashboard', function () {
    $candidate = User::factory()->candidate()->create();

    $this->actingAs($candidate)
        ->get(route('dashboard'))
        ->assertRedirect(route('candidate.dashboard'));
});

test('candidate users can view the candidate dashboard', function () {
    $candidate = User::factory()->candidate()->create(['name' => 'Nadia Kandidat']);

    $this->actingAs($candidate)
        ->get(route('candidate.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('candidate/dashboard')
            ->where('profile.full_name', 'Nadia Kandidat')
            ->has('metrics')
            ->has('recommendedJobs')
        );

    expect(CandidateProfile::whereBelongsTo($candidate)->exists())->toBeTrue();
});

test('non candidate users cannot access candidate routes', function () {
    $employer = User::factory()->employer()->create();

    $this->actingAs($employer)
        ->get(route('candidate.dashboard'))
        ->assertForbidden();
});
