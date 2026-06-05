<?php

use App\Models\ActivityLog;
use App\Models\User;
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
        'phone' => '081234567890',
        'role' => 'candidate',
        'preferred_role' => 'Frontend Engineer',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('verification.notice', absolute: false));

    expect(ActivityLog::where('action', 'register_user')->whereHas('actor', fn ($query) => $query->where('email', 'test@example.com'))->exists())->toBeTrue();
    expect(User::where('email', 'test@example.com')->value('phone'))->toBe('081234567890');
});

test('registration requires a phone number', function () {
    $response = $this->from(route('register'))->post(route('register.store'), [
        'name' => 'Test User',
        'email' => 'nophone@example.com',
        'role' => 'candidate',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertSessionHasErrors('phone');
    $this->assertGuest();
    expect(User::where('email', 'nophone@example.com')->exists())->toBeFalse();
});
