<?php

use App\Models\User;
use App\Support\EmployerEmailPreferences;
use Illuminate\Support\Facades\Crypt;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\actingAs;

test('employer can view email settings with empty defaults', function () {
    $employer = User::factory()->employer()->create([
        'email' => 'hr@karivia.test',
        'notification_settings' => null,
    ]);

    actingAs($employer)
        ->get(route('employer.email-settings.edit'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('employer/email-settings')
            ->where('user_email', 'hr@karivia.test')
            ->where('smtp.enabled', false)
            ->where('smtp.host', '')
            ->where('smtp.port', null)
            ->where('smtp.encryption', 'tls')
            ->where('smtp.password_set', false)
            ->where('smtp.last_tested_at', null)
        );
});

test('employer can save smtp credentials with encrypted password', function () {
    $employer = User::factory()->employer()->create([
        'notification_settings' => [
            'whatsapp' => ['enabled' => true],
        ],
    ]);

    actingAs($employer)
        ->patch(route('employer.email-settings.update'), [
            'enabled' => true,
            'host' => 'smtp.gmail.com',
            'port' => 587,
            'username' => 'hr@perusahaan.com',
            'password' => 'super-secret',
            'encryption' => 'tls',
            'from_address' => 'hr@perusahaan.com',
            'from_name' => 'Tim HR',
        ])
        ->assertRedirect();

    $employer->refresh();
    $smtp = $employer->notification_settings['email_smtp'];

    expect($smtp['enabled'])->toBeTrue()
        ->and($smtp['host'])->toBe('smtp.gmail.com')
        ->and($smtp['port'])->toBe(587)
        ->and($smtp['username'])->toBe('hr@perusahaan.com')
        ->and($smtp['encryption'])->toBe('tls')
        ->and($smtp['from_address'])->toBe('hr@perusahaan.com')
        ->and($smtp['from_name'])->toBe('Tim HR')
        ->and(Crypt::decryptString($smtp['password']))->toBe('super-secret');

    expect($employer->notification_settings['whatsapp']['enabled'])->toBeTrue();
});

test('employer can keep existing password when leaving password field blank', function () {
    $employer = User::factory()->employer()->create([
        'notification_settings' => [
            'email_smtp' => [
                'enabled' => true,
                'host' => 'smtp.example.com',
                'port' => 587,
                'username' => 'hr@x.com',
                'password' => Crypt::encryptString('original-password'),
                'encryption' => 'tls',
                'from_address' => 'hr@x.com',
                'from_name' => 'HR',
            ],
        ],
    ]);

    actingAs($employer)
        ->patch(route('employer.email-settings.update'), [
            'enabled' => true,
            'host' => 'smtp.example.com',
            'port' => 587,
            'username' => 'hr@x.com',
            'password' => '',
            'encryption' => 'tls',
            'from_address' => 'hr@x.com',
            'from_name' => 'HR Updated',
        ])
        ->assertRedirect();

    $employer->refresh();
    $smtp = $employer->notification_settings['email_smtp'];

    expect(Crypt::decryptString($smtp['password']))->toBe('original-password')
        ->and($smtp['from_name'])->toBe('HR Updated');
});

test('candidate cannot access employer email settings', function () {
    $candidate = User::factory()->candidate()->create();

    actingAs($candidate)
        ->get(route('employer.email-settings.edit'))
        ->assertForbidden();
});

test('employer cannot send test email when configuration incomplete', function () {
    $employer = User::factory()->employer()->create([
        'notification_settings' => null,
    ]);

    actingAs($employer)
        ->post(route('employer.email-settings.test'), [
            'to' => 'tes@karivia.test',
        ])
        ->assertRedirect();
});

test('email settings page hides password but flags it as set', function () {
    $employer = User::factory()->employer()->create([
        'notification_settings' => [
            'email_smtp' => [
                'enabled' => true,
                'host' => 'smtp.example.com',
                'port' => 587,
                'username' => 'hr@x.com',
                'password' => Crypt::encryptString('rahasia'),
                'encryption' => 'tls',
                'from_address' => 'hr@x.com',
                'from_name' => 'HR',
            ],
        ],
    ]);

    actingAs($employer)
        ->get(route('employer.email-settings.edit'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('employer/email-settings')
            ->where('smtp.password', '')
            ->where('smtp.password_set', true)
            ->where('smtp.host', 'smtp.example.com')
        );
});

test('decryptPassword returns plaintext for stored encrypted password', function () {
    $employer = User::factory()->employer()->create([
        'notification_settings' => [
            'email_smtp' => [
                'password' => Crypt::encryptString('plaintext-secret'),
            ],
        ],
    ]);

    expect(EmployerEmailPreferences::decryptPassword($employer))->toBe('plaintext-secret');
    expect(EmployerEmailPreferences::decryptPassword(null))->toBeNull();
});
