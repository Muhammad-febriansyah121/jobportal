<?php

use App\Models\User;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('candidate users are redirected to the candidate dashboard', function () {
    $user = User::factory()->candidate()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('candidate.dashboard'));
});

test('mentor users can visit the generic dashboard', function () {
    $user = User::factory()->mentor()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
});
