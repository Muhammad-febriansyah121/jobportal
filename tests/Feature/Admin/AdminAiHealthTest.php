<?php

use App\Ai\Agents\AiHealthProbe;
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
    $mock->shouldReceive('modelName')->andReturn('gpt-5');
    app()->instance(AiService::class, $mock);

    AiHealthProbe::fake(['OK']);

    $this->actingAs($admin)
        ->postJson(route('admin.ai-health.run'))
        ->assertOk()
        ->assertJson([
            'ok' => true,
            'configured' => true,
            'model' => 'gpt-5',
            'reply_preview' => 'OK',
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

test('ai health run reports failure when ai returns empty', function () {
    $admin = User::factory()->admin()->create();

    $mock = Mockery::mock(AiService::class);
    $mock->shouldReceive('isConfigured')->once()->andReturnTrue();
    $mock->shouldReceive('modelName')->andReturn('gpt-5');
    app()->instance(AiService::class, $mock);

    AiHealthProbe::fake(['']);

    $this->actingAs($admin)
        ->postJson(route('admin.ai-health.run'))
        ->assertOk()
        ->assertJson([
            'ok' => false,
            'configured' => true,
        ]);
});
