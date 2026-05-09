<?php

use App\Models\User;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\actingAs;

test('employer can view whatsapp settings page', function () {
    config()->set('services.whatsapp.base_url', 'http://127.0.0.1:3000');
    config()->set('services.whatsapp.api_key', 'wa-secret');

    $employer = User::factory()->employer()->create([
        'phone' => '628111223344',
        'notification_settings' => [
            'whatsapp' => [
                'enabled' => true,
                'session_id' => 'session-123',
            ],
        ],
    ]);

    Http::fake([
        'http://127.0.0.1:3000/sessions/session-123' => Http::response([
            'data' => [
                'id' => 'session-123',
                'label' => 'HR Karivia',
                'state' => 'WAITING_QR',
                'phoneNumber' => '628777000111',
                'qrCode' => 'base64-qr',
            ],
        ], 200),
    ]);

    actingAs($employer)
        ->get(route('employer.whatsapp.edit'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('employer/whatsapp')
            ->where('phone', '628111223344')
            ->where('settings.enabled', true)
            ->where('settings.session_id', 'session-123')
            ->where('session.id', 'session-123')
            ->where('session.state', 'WAITING_QR')
            ->where('session.phone_number', '628777000111')
            ->etc()
        );
});

test('employer whatsapp page normalizes qr_ready session state from gateway', function () {
    config()->set('services.whatsapp.base_url', 'http://127.0.0.1:3000');
    config()->set('services.whatsapp.api_key', 'wa-secret');

    $employer = User::factory()->employer()->create([
        'notification_settings' => [
            'whatsapp' => [
                'enabled' => true,
                'session_id' => 'session-qr-ready',
            ],
        ],
    ]);

    Http::fake([
        'http://127.0.0.1:3000/sessions/session-qr-ready' => Http::response([
            'data' => [
                'id' => 'session-qr-ready',
                'label' => 'HR Karivia',
                'state' => 'qr_ready',
                'phoneNumber' => null,
                'qrCode' => 'data:image/png;base64,qr-image',
            ],
        ], 200),
    ]);

    actingAs($employer)
        ->get(route('employer.whatsapp.edit'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('employer/whatsapp')
            ->where('session.id', 'session-qr-ready')
            ->where('session.state', 'WAITING_QR')
            ->where('session.qr_code', 'data:image/png;base64,qr-image')
            ->etc()
        );
});

test('employer can update whatsapp settings', function () {
    $employer = User::factory()->employer()->create([
        'notification_settings' => [
            'whatsapp' => [
                'enabled' => false,
            ],
        ],
    ]);

    actingAs($employer)
        ->patch(route('employer.whatsapp.update'), [
            'enabled' => true,
            'session_id' => 'session-abc',
        ])
        ->assertRedirect();

    $employer->refresh();

    expect(data_get($employer->notification_settings, 'whatsapp.enabled'))->toBeTrue();
    expect(data_get($employer->notification_settings, 'whatsapp.session_id'))->toBe('session-abc');
});

test('employer can create whatsapp session from settings page', function () {
    config()->set('services.whatsapp.base_url', 'http://127.0.0.1:3000');
    config()->set('services.whatsapp.api_key', 'wa-secret');

    $employer = User::factory()->employer()->create();

    Http::fake([
        'http://127.0.0.1:3000/sessions/connect' => Http::response([
            'data' => [
                'id' => 'session-new-001',
                'label' => 'Employer Session',
                'state' => 'WAITING_QR',
            ],
        ], 200),
    ]);

    actingAs($employer)
        ->post(route('employer.whatsapp.connect'), [
            'label' => 'Employer Session',
            'is_new_number' => true,
        ])
        ->assertRedirect();

    $employer->refresh();

    expect(data_get($employer->notification_settings, 'whatsapp.enabled'))->toBeTrue();
    expect(data_get($employer->notification_settings, 'whatsapp.session_id'))->toBe('session-new-001');
});

test('employer can disconnect whatsapp session from settings page', function () {
    config()->set('services.whatsapp.base_url', 'http://127.0.0.1:3000');
    config()->set('services.whatsapp.api_key', 'wa-secret');

    $employer = User::factory()->employer()->create([
        'notification_settings' => [
            'whatsapp' => [
                'enabled' => true,
                'session_id' => 'session-delete-001',
            ],
        ],
    ]);

    Http::fake([
        'http://127.0.0.1:3000/sessions/session-delete-001' => Http::response([], 200),
    ]);

    actingAs($employer)
        ->delete(route('employer.whatsapp.disconnect'))
        ->assertRedirect();

    $employer->refresh();

    expect(data_get($employer->notification_settings, 'whatsapp.enabled'))->toBeFalse();
    expect(data_get($employer->notification_settings, 'whatsapp.session_id'))->toBeNull();
});

test('employer can send whatsapp test message from settings page', function () {
    config()->set('services.whatsapp.base_url', 'http://127.0.0.1:3000');
    config()->set('services.whatsapp.api_key', 'wa-secret');

    $employer = User::factory()->employer()->create([
        'notification_settings' => [
            'whatsapp' => [
                'enabled' => true,
                'session_id' => 'session-test-001',
            ],
        ],
    ]);

    Http::preventStrayRequests();
    Http::fake([
        'http://127.0.0.1:3000/sessions/session-test-001' => Http::response([
            'data' => [
                'id' => 'session-test-001',
                'label' => 'HR Karivia',
                'state' => 'CONNECTED',
                'phoneNumber' => '628111223344',
            ],
        ], 200),
        'http://127.0.0.1:3000/messages/send' => Http::response([
            'data' => [
                'messageId' => 'msg-123',
                'status' => 'queued',
            ],
        ], 200),
    ]);

    actingAs($employer)
        ->post(route('employer.whatsapp.test'), [
            'phone_number' => '628123456789',
        ])
        ->assertRedirect();

    Http::assertSent(function (Request $request) {
        return $request->url() === 'http://127.0.0.1:3000/messages/send'
            && $request->hasHeader('x-api-key', 'wa-secret')
            && $request['sessionId'] === 'session-test-001'
            && $request['to'] === '628123456789'
            && str_contains((string) $request['text'], 'Tes koneksi WhatsApp berhasil');
    });
});
