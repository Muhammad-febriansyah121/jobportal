<?php

use App\Models\Setting;
use App\Models\User;
use App\Services\AiService;
use Illuminate\Support\Facades\Http;

test('admin can save ai model in web settings', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.settings.update'), [
            'ai_model' => 'gpt-5',
            'ai_api_key' => 'test-key',
        ])
        ->assertRedirect();

    expect(Setting::get('ai_model'))->toBe('gpt-5');
});

test('admin can save whatsapp gateway settings in web settings', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.settings.update'), [
            'whatsapp_gateway_url' => 'http://127.0.0.1:3000',
            'whatsapp_gateway_api_key' => 'wa-key',
            'whatsapp_gateway_default_session_id' => 'session-default-001',
            'whatsapp_gateway_connect_timeout' => 4,
            'whatsapp_gateway_timeout' => 12,
        ])
        ->assertRedirect();

    expect(Setting::get('whatsapp_gateway_url'))->toBe('http://127.0.0.1:3000');
    expect(Setting::get('whatsapp_gateway_api_key'))->toBe('wa-key');
    expect(Setting::get('whatsapp_gateway_default_session_id'))->toBe('session-default-001');
    expect(Setting::get('whatsapp_gateway_connect_timeout'))->toBe('4');
    expect(Setting::get('whatsapp_gateway_timeout'))->toBe('12');
});

test('ai service uses ai model from settings', function () {
    Setting::set('ai_api_key', 'test-key');
    Setting::set('ai_model', 'gpt-5');

    Http::fake([
        '*' => Http::response([
            'choices' => [
                ['message' => ['content' => 'ok']],
            ],
        ]),
    ]);

    $aiService = app(AiService::class);
    $aiService->chat([
        ['role' => 'user', 'content' => 'Halo'],
    ]);

    Http::assertSent(function ($request) {
        return $request->data()['model'] === 'gpt-5';
    });
});

test('ai service captures token usage from chat response', function () {
    Setting::set('ai_api_key', 'test-key');
    Setting::set('ai_model', 'gpt-5');

    Http::fake([
        '*' => Http::response([
            'choices' => [
                ['message' => ['content' => 'ok']],
            ],
            'usage' => [
                'prompt_tokens' => 123,
                'completion_tokens' => 45,
                'total_tokens' => 168,
                'completion_tokens_details' => [
                    'reasoning_tokens' => 12,
                ],
            ],
        ]),
    ]);

    $aiService = app(AiService::class);
    $result = $aiService->chat([
        ['role' => 'user', 'content' => 'Halo'],
    ]);

    expect($result)->toBe('ok');
    expect($aiService->tokenUsage())->toBe([
        'prompt_tokens' => 123,
        'completion_tokens' => 45,
        'reasoning_tokens' => 12,
        'total_tokens' => 168,
    ]);
});

test('ai service resets token usage when api key missing', function () {
    Setting::set('ai_api_key', '');

    $aiService = app(AiService::class);
    $result = $aiService->chat([
        ['role' => 'user', 'content' => 'Halo'],
    ]);

    expect($result)->toBeNull();
    expect($aiService->tokenUsage())->toBe([
        'prompt_tokens' => null,
        'completion_tokens' => null,
        'reasoning_tokens' => null,
        'total_tokens' => null,
    ]);
});

test('ai service captures token usage from chatJson response', function () {
    Setting::set('ai_api_key', 'test-key');
    Setting::set('ai_model', 'gpt-5');

    Http::fake([
        '*' => Http::response([
            'choices' => [
                ['message' => ['content' => json_encode(['answer' => 'ok'])]],
            ],
            'usage' => [
                'prompt_tokens' => 200,
                'completion_tokens' => 60,
                'total_tokens' => 260,
            ],
        ]),
    ]);

    $aiService = app(AiService::class);
    $result = $aiService->chatJson(
        [['role' => 'user', 'content' => 'Halo']],
        ['type' => 'object', 'properties' => ['answer' => ['type' => 'string']], 'required' => ['answer'], 'additionalProperties' => false],
        'demo_schema',
    );

    expect($result)->toBe(['answer' => 'ok']);
    expect($aiService->tokenUsage())->toMatchArray([
        'prompt_tokens' => 200,
        'completion_tokens' => 60,
        'reasoning_tokens' => null,
        'total_tokens' => 260,
    ]);
});
