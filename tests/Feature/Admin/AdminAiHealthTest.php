<?php

use App\Models\User;
use App\Services\AiService;
use Inertia\Testing\AssertableInertia as Assert;

test('ai health page renders snapshot for admin', function () {
    $admin = User::factory()->admin()->create();

    $mock = Mockery::mock(AiService::class);
    $mock->shouldReceive('isConfigured')->once()->andReturnTrue();
    $mock->shouldReceive('modelName')->once()->andReturn('gpt-5');
    app()->instance(AiService::class, $mock);

    $this->actingAs($admin)
        ->get(route('admin.ai-health.show'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/ai-health/index')
            ->where('snapshot.configured', true)
            ->where('snapshot.model', 'gpt-5')
        );
});

test('ai health page is forbidden for non-admin', function () {
    $candidate = User::factory()->candidate()->create();

    $this->actingAs($candidate)
        ->get(route('admin.ai-health.show'))
        ->assertForbidden();
});

test('ai health run returns ok when ai responds', function () {
    $admin = User::factory()->admin()->create();

    $mock = Mockery::mock(AiService::class);
    $mock->shouldReceive('isConfigured')->once()->andReturnTrue();
    $mock->shouldReceive('chat')->once()->andReturn('OK');
    $mock->shouldReceive('modelName')->andReturn('gpt-5');
    $mock->shouldReceive('tokenUsage')->andReturn([
        'prompt_tokens' => 10,
        'completion_tokens' => 1,
        'reasoning_tokens' => null,
        'total_tokens' => 11,
    ]);
    app()->instance(AiService::class, $mock);

    $this->actingAs($admin)
        ->postJson(route('admin.ai-health.run'))
        ->assertOk()
        ->assertJson([
            'ok' => true,
            'configured' => true,
            'model' => 'gpt-5',
            'reply_preview' => 'OK',
            'token_usage' => [
                'prompt_tokens' => 10,
                'completion_tokens' => 1,
                'reasoning_tokens' => null,
                'total_tokens' => 11,
            ],
        ])
        ->assertJsonPath('latency_ms', fn ($value) => is_int($value) && $value >= 0);
});

test('ai health run reports unconfigured when no api key', function () {
    $admin = User::factory()->admin()->create();

    $mock = Mockery::mock(AiService::class);
    $mock->shouldReceive('isConfigured')->once()->andReturnFalse();
    $mock->shouldReceive('modelName')->once()->andReturn('gpt-5');
    $mock->shouldNotReceive('chat');
    app()->instance(AiService::class, $mock);

    $this->actingAs($admin)
        ->postJson(route('admin.ai-health.run'))
        ->assertOk()
        ->assertJson([
            'ok' => false,
            'configured' => false,
            'model' => 'gpt-5',
            'latency_ms' => null,
        ])
        ->assertJsonPath('message', fn ($value) => str_contains((string) $value, 'OPENAI_API_KEY'));
});

test('ai health run reports failure when ai returns null', function () {
    $admin = User::factory()->admin()->create();

    $mock = Mockery::mock(AiService::class);
    $mock->shouldReceive('isConfigured')->once()->andReturnTrue();
    $mock->shouldReceive('chat')->once()->andReturnNull();
    $mock->shouldReceive('modelName')->andReturn('gpt-5');
    $mock->shouldReceive('tokenUsage')->andReturn([
        'prompt_tokens' => null,
        'completion_tokens' => null,
        'reasoning_tokens' => null,
        'total_tokens' => null,
    ]);
    app()->instance(AiService::class, $mock);

    $this->actingAs($admin)
        ->postJson(route('admin.ai-health.run'))
        ->assertOk()
        ->assertJson([
            'ok' => false,
            'configured' => true,
        ]);
});
