<?php

use App\Models\AiAuditLog;
use App\Models\User;
use App\Services\AiService;
use Inertia\Testing\AssertableInertia as Assert;

test('admin user detail page shows ai summary section', function () {
    $admin = User::factory()->admin()->create();
    $user = User::factory()->candidate()->create();

    AiAuditLog::create([
        'user_id' => $user->id,
        'feature' => 'admin_user_summary',
        'input_hash' => md5('test'),
        'output_json' => ['summary' => 'User aktif melamar lowongan backend.', 'generated_at' => now()->toIso8601String()],
        'model_name' => 'gpt-4o-mini',
        'status' => 'success',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.users.show', $user))
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/resources/show')
            ->has('aiSummary')
            ->where('aiSummary.summary', 'User aktif melamar lowongan backend.')
        );
});

test('admin user detail page shows null ai summary when none exists', function () {
    $admin = User::factory()->admin()->create();
    $user = User::factory()->candidate()->create();

    $this->actingAs($admin)
        ->get(route('admin.users.show', $user))
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/resources/show')
            ->where('aiSummary', null)
        );
});

test('admin can generate ai summary for a user', function () {
    $admin = User::factory()->admin()->create();
    $user = User::factory()->candidate()->create();

    $mock = Mockery::mock(AiService::class);
    $mock->shouldReceive('chat')->once()->andReturn('User aktif melamar lowongan.');
    $mock->shouldReceive('modelName')->once()->andReturn('gpt-4o-mini');
    $mock->shouldReceive('tokenUsage')->andReturn([
        'prompt_tokens' => 95,
        'completion_tokens' => 40,
        'reasoning_tokens' => null,
        'total_tokens' => 135,
    ]);
    app()->instance(AiService::class, $mock);

    $this->actingAs($admin)
        ->post(route('admin.users.generate-ai-summary', $user))
        ->assertRedirect();

    $log = AiAuditLog::where('user_id', $user->id)
        ->where('feature', 'admin_user_summary')
        ->where('status', 'success')
        ->firstOrFail();

    expect($log->input_json['user']['email'])->toBe($user->email);
    expect($log->input_json)->toHaveKey('recent_activities');
});

test('generate ai summary handles api failure gracefully', function () {
    $admin = User::factory()->admin()->create();
    $user = User::factory()->candidate()->create();

    $mock = Mockery::mock(AiService::class);
    $mock->shouldReceive('chat')->once()->andReturn(null);
    $mock->shouldReceive('modelName')->once()->andReturn('gpt-4o-mini');
    $mock->shouldReceive('tokenUsage')->andReturn([
        'prompt_tokens' => null,
        'completion_tokens' => null,
        'reasoning_tokens' => null,
        'total_tokens' => null,
    ]);
    app()->instance(AiService::class, $mock);

    $this->actingAs($admin)
        ->post(route('admin.users.generate-ai-summary', $user))
        ->assertRedirect();

    expect(AiAuditLog::where('user_id', $user->id)
        ->where('feature', 'admin_user_summary')
        ->where('status', 'failed')
        ->exists()
    )->toBeTrue();
});
