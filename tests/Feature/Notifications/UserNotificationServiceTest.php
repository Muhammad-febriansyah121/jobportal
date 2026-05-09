<?php

use App\Models\User;
use App\Services\UserNotificationService;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;

test('user notification service stores notification and sends employer whatsapp message', function () {
    config()->set('services.whatsapp.base_url', 'http://127.0.0.1:3000');
    config()->set('services.whatsapp.api_key', 'wa-secret');
    config()->set('services.whatsapp.default_session_id', '11111111-1111-1111-1111-111111111111');

    Http::fake([
        'http://127.0.0.1:3000/messages/send' => Http::response([
            'data' => [
                'sessionId' => '22222222-2222-2222-2222-222222222222',
                'messageId' => 'wamid.test',
            ],
        ], 201),
    ]);

    $employer = User::factory()->employer()->create([
        'phone' => '081234567890',
        'notification_settings' => [
            'whatsapp' => [
                'enabled' => true,
                'session_id' => '22222222-2222-2222-2222-222222222222',
            ],
        ],
    ]);

    $notification = app(UserNotificationService::class)->sendToUser(
        $employer,
        'application_submitted',
        'Lamaran baru masuk',
        'Ada lamaran baru untuk Backend Engineer.',
        [
            'application_id' => 99,
            'job_listing_id' => 7,
        ],
    );

    expect($notification->user_id)->toBe($employer->id);

    $this->assertDatabaseHas('user_notifications', [
        'user_id' => $employer->id,
        'type' => 'application_submitted',
        'title' => 'Lamaran baru masuk',
    ]);

    Http::assertSent(function (Request $request): bool {
        $payload = $request->data();

        return $request->url() === 'http://127.0.0.1:3000/messages/send'
            && $request->hasHeader('x-api-key', 'wa-secret')
            && ($payload['sessionId'] ?? null) === '22222222-2222-2222-2222-222222222222'
            && ($payload['to'] ?? null) === '081234567890'
            && str_contains((string) ($payload['text'] ?? ''), 'Lamaran Baru Masuk');
    });
});

test('user notification service falls back to global employer session id', function () {
    config()->set('services.whatsapp.base_url', 'http://127.0.0.1:3000');
    config()->set('services.whatsapp.api_key', 'wa-secret');
    config()->set('services.whatsapp.default_session_id', '33333333-3333-3333-3333-333333333333');

    Http::fake([
        'http://127.0.0.1:3000/messages/send' => Http::response([
            'data' => [
                'sessionId' => '33333333-3333-3333-3333-333333333333',
                'messageId' => 'wamid.default',
            ],
        ], 201),
    ]);

    $employer = User::factory()->employer()->create([
        'phone' => '+62 812-0000-9999',
        'notification_settings' => [
            'in_app' => true,
        ],
    ]);

    app(UserNotificationService::class)->sendToUser(
        $employer,
        'company_verification',
        'Verifikasi perlu revisi',
        'Silakan perbarui dokumen verifikasi perusahaan.',
        [
            'company_id' => 3,
            'verification_id' => 8,
        ],
    );

    Http::assertSent(function (Request $request): bool {
        $payload = $request->data();

        return ($payload['sessionId'] ?? null) === '33333333-3333-3333-3333-333333333333'
            && ($payload['to'] ?? null) === '+62 812-0000-9999'
            && str_contains((string) ($payload['text'] ?? ''), 'Verifikasi perlu revisi');
    });
});
