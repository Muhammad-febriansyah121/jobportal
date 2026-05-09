<?php

use App\Models\ActivityLog;
use Laravel\Fortify\Features;

beforeEach(function () {
    $this->skipUnlessFortifyHas(Features::registration());
});

test('registration screen can be rendered', function () {
    $response = $this->get(route('register'));

    $response->assertOk();
});

test('new users can register', function () {
    $response = $this->post(route('register.store'), [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'role' => 'candidate',
        'preferred_role' => 'Frontend Engineer',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('candidate.dashboard', absolute: false));

    expect(ActivityLog::where('action', 'register_user')->whereHas('actor', fn ($query) => $query->where('email', 'test@example.com'))->exists())->toBeTrue();
});
