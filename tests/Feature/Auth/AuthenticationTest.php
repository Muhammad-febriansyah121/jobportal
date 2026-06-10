<?php

use App\Models\ActivityLog;
use App\Models\CandidateProfile;
use App\Models\Setting;
use App\Models\User;
use App\Services\RecaptchaService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Testing\AssertableInertia as Assert;
use Laravel\Fortify\Features;

test('login screen can be rendered', function () {
    $response = $this->get(route('login'));

    $response->assertOk();
});

test('login screen directs new users to candidate register by default', function () {
    $response = $this->get(route('login'));

    $response
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('auth/login')
            ->where('canRegister', true),
        );
});

test('login screen stores redirect target as intended url when provided', function () {
    $targetUrl = '/candidate/jobs/backend-engineer?apply=1';

    $this->get(route('login', ['redirect' => $targetUrl]))
        ->assertOk();

    expect(session('url.intended'))->toBe($targetUrl);
});

test('register account type chooser can be rendered', function () {
    $response = $this->get(route('register'));

    $response->assertOk();
});

test('candidate register page can be rendered', function () {
    $response = $this->get(route('register', ['type' => 'candidate']));

    $response->assertOk();
});

test('employer register page can be rendered', function () {
    $response = $this->get(route('register', ['type' => 'employer']));

    $response->assertOk();
});

test('candidate can register and profile is created', function () {
    $response = $this->post(route('register.store'), [
        'name' => 'Kandidat Demo',
        'email' => 'candidate@example.com',
        'phone' => '081234567890',
        'role' => 'candidate',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $user = User::query()->where('email', 'candidate@example.com')->first();

    expect($user)->not->toBeNull();
    expect($user?->role)->toBe('candidate');

    $candidateProfile = CandidateProfile::query()
        ->where('user_id', $user?->id)
        ->first();

    expect($candidateProfile)->not->toBeNull();
    expect($candidateProfile?->full_name)->toBe('Kandidat Demo');

    $this->assertAuthenticated();
    $response->assertRedirect();
});

test('employer can register without candidate profile', function () {
    $response = $this->post(route('register.store'), [
        'name' => 'Recruiter Demo',
        'email' => 'employer@example.com',
        'phone' => '081234567890',
        'role' => 'employer',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $user = User::query()->where('email', 'employer@example.com')->first();

    expect($user)->not->toBeNull();
    expect($user?->role)->toBe('employer');
    expect(CandidateProfile::query()->where('user_id', $user?->id)->exists())->toBeFalse();

    $this->assertAuthenticated();
    $response->assertRedirect();
});

test('register is blocked when recaptcha is enabled and token is missing', function () {
    Setting::set('recaptcha_site_key', 'test-site-key');
    Setting::set('recaptcha_secret_key', 'test-secret-key');

    $response = $this->from(route('register', ['type' => 'candidate']))
        ->post(route('register.store'), [
            'name' => 'Kandidat Demo',
            'email' => 'candidate-recaptcha-fail@example.com',
            'phone' => '081234567890',
            'role' => 'candidate',
            'preferred_role' => 'Backend Developer',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

    $response->assertRedirect(route('register', ['type' => 'candidate']));
    $response->assertSessionHasErrors('email');
    $this->assertGuest();
});

test('register succeeds when recaptcha is enabled and token is valid', function () {
    Setting::set('recaptcha_site_key', 'test-site-key');
    Setting::set('recaptcha_secret_key', 'test-secret-key');

    $this->mock(RecaptchaService::class, function ($mock): void {
        $mock->shouldReceive('verify')->once()->andReturnTrue();
    });

    $response = $this->post(route('register.store'), [
        'name' => 'Kandidat Recaptcha',
        'email' => 'candidate-recaptcha-ok@example.com',
        'phone' => '081234567890',
        'role' => 'candidate',
        'preferred_role' => 'Backend Developer',
        'password' => 'password',
        'password_confirmation' => 'password',
        'recaptcha_token' => 'valid-token-from-frontend',
    ]);

    $response->assertRedirect();
    $this->assertAuthenticated();
    expect(User::query()->where('email', 'candidate-recaptcha-ok@example.com')->exists())->toBeTrue();
});

test('users can authenticate using the login screen', function () {
    $user = User::factory()->create();

    $response = $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('candidate.dashboard', absolute: false));

    $this->assertDatabaseHas('activity_logs', [
        'actor_id' => $user->id,
        'action' => 'login_user',
    ]);
});

test('users are redirected to intended url after login when redirect query is provided', function () {
    $user = User::factory()->create();
    $intended = '/candidate/jobs/backend-engineer?apply=1';

    $this->get(route('login', ['redirect' => $intended]))
        ->assertOk();

    $response = $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect($intended);
});

test('users with two factor enabled are redirected to two factor challenge', function () {
    $this->skipUnlessFortifyHas(Features::twoFactorAuthentication());

    Features::twoFactorAuthentication([
        'confirm' => true,
        'confirmPassword' => true,
    ]);

    $user = User::factory()->create();

    $user->forceFill([
        'two_factor_secret' => encrypt('test-secret'),
        'two_factor_recovery_codes' => encrypt(json_encode(['code1', 'code2'])),
        'two_factor_confirmed_at' => now(),
    ])->save();

    $response = $this->post(route('login'), [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $response->assertRedirect(route('two-factor.login'));
    $response->assertSessionHas('login.id', $user->id);
    $this->assertGuest();
});

test('users can not authenticate with invalid password', function () {
    $user = User::factory()->create();

    $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'wrong-password',
    ]);

    $this->assertGuest();
});

test('users can logout', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('logout'));

    $this->assertGuest();
    $response->assertRedirect(route('home'));

    expect(ActivityLog::where('actor_id', $user->id)->where('action', 'logout_user')->exists())->toBeTrue();
});

test('users are rate limited', function () {
    $user = User::factory()->create();

    RateLimiter::increment(md5('login'.implode('|', [$user->email, '127.0.0.1'])), amount: 5);

    $response = $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'wrong-password',
    ]);

    $response->assertTooManyRequests();
});

test('existing users can authenticate using google login', function () {
    $user = User::factory()->employer()->create([
        'email' => 'google-user@example.com',
    ]);

    Setting::set('google_login_client_id', 'test-google-client-id.apps.googleusercontent.com');

    Http::fake([
        'https://oauth2.googleapis.com/tokeninfo*' => Http::response([
            'aud' => 'test-google-client-id.apps.googleusercontent.com',
            'email' => 'google-user@example.com',
            'email_verified' => 'true',
        ], 200),
    ]);

    $response = $this->post(route('auth.google.login'), [
        'credential' => 'valid-google-id-token',
    ]);

    $this->assertAuthenticatedAs($user);
    $response->assertRedirect(route('employer.dashboard', absolute: false));
});

test('google login is rejected when client id does not match', function () {
    User::factory()->create([
        'email' => 'google-user@example.com',
    ]);

    Setting::set('google_login_client_id', 'expected-client-id.apps.googleusercontent.com');

    Http::fake([
        'https://oauth2.googleapis.com/tokeninfo*' => Http::response([
            'aud' => 'another-client-id.apps.googleusercontent.com',
            'email' => 'google-user@example.com',
            'email_verified' => 'true',
        ], 200),
    ]);

    $response = $this->from(route('login'))->post(route('auth.google.login'), [
        'credential' => 'valid-google-id-token',
    ]);

    $this->assertGuest();
    $response->assertRedirect(route('login'));
    $response->assertSessionHasErrors('google');
});

test('google login is rejected when account does not exist', function () {
    Setting::set('google_login_client_id', 'test-google-client-id.apps.googleusercontent.com');

    Http::fake([
        'https://oauth2.googleapis.com/tokeninfo*' => Http::response([
            'aud' => 'test-google-client-id.apps.googleusercontent.com',
            'email' => 'not-found@example.com',
            'email_verified' => 'true',
        ], 200),
    ]);

    $response = $this->from(route('login'))->post(route('auth.google.login'), [
        'credential' => 'valid-google-id-token',
    ]);

    $this->assertGuest();
    $response->assertRedirect(route('login'));
    $response->assertSessionHasErrors('google');
});

test('google login is rejected for inactive accounts', function () {
    User::factory()->create([
        'email' => 'inactive-user@example.com',
        'is_active' => false,
    ]);

    Setting::set('google_login_client_id', 'test-google-client-id.apps.googleusercontent.com');

    Http::fake([
        'https://oauth2.googleapis.com/tokeninfo*' => Http::response([
            'aud' => 'test-google-client-id.apps.googleusercontent.com',
            'email' => 'inactive-user@example.com',
            'email_verified' => 'true',
        ], 200),
    ]);

    $response = $this->from(route('login'))->post(route('auth.google.login'), [
        'credential' => 'valid-google-id-token',
    ]);

    $this->assertGuest();
    $response->assertRedirect(route('login'));
    $response->assertSessionHasErrors('google');
});

test('google register callback creates an active candidate account', function () {
    Setting::set('google_login_client_id', 'test-google-client-id.apps.googleusercontent.com');
    Setting::set('google_login_client_secret', 'test-google-client-secret');

    session([
        'google_oauth_state' => 'secure-google-state',
        'google_oauth_intent' => 'register',
    ]);

    Http::fake([
        'https://oauth2.googleapis.com/token' => Http::response([
            'id_token' => 'valid-google-id-token',
        ], 200),
        'https://oauth2.googleapis.com/tokeninfo*' => Http::response([
            'aud' => 'test-google-client-id.apps.googleusercontent.com',
            'email' => 'new-google-user@example.com',
            'email_verified' => 'true',
            'name' => 'New Google User',
        ], 200),
    ]);

    $response = $this->get(route('auth.google.callback', [
        'state' => 'secure-google-state',
        'code' => 'google-authorization-code',
    ]));

    $user = User::query()->where('email', 'new-google-user@example.com')->first();

    expect($user)->not->toBeNull();
    expect($user?->role)->toBe('candidate');
    expect($user?->is_active)->toBeTrue();
    expect($user?->email_verified_at)->not->toBeNull();
    expect(CandidateProfile::query()->where('user_id', $user?->id)->exists())->toBeTrue();

    $this->assertAuthenticatedAs($user);
    $response->assertRedirect(route('candidate.dashboard', absolute: false));
});
