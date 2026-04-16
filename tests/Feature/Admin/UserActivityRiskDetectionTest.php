<?php

use App\Models\ActivityLog;
use App\Models\AiAuditLog;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;

test('admin can run user activity risk detection with ai', function () {
    Http::fake([
        '*' => Http::response([
            'choices' => [
                [
                    'message' => [
                        'content' => json_encode([
                            'risk_level' => 'high',
                            'risk_score' => 91,
                            'reasons' => ['Terlalu banyak apply dalam waktu singkat.', 'Login gagal berulang.'],
                            'recommended_actions' => ['Review akun kandidat.', 'Minta verifikasi tambahan.'],
                            'confidence' => 'high',
                        ]),
                    ],
                ],
            ],
        ]),
    ]);
    Setting::set('ai_api_key', 'test-key');

    $admin = User::factory()->admin()->create();
    $candidate = User::factory()->candidate()->create();

    foreach (range(1, 20) as $index) {
        ActivityLog::create([
            'actor_id' => $candidate->id,
            'action' => 'candidate_jobs_apply',
            'properties_json' => ['ip' => '127.0.0.'.$index],
        ]);
    }

    foreach (range(1, 5) as $index) {
        ActivityLog::create([
            'actor_id' => $candidate->id,
            'action' => 'failed_login',
            'properties_json' => ['ip' => '10.0.0.'.$index],
        ]);
    }

    $this->actingAs($admin)
        ->post(route('admin.users.detect-risk', $candidate))
        ->assertRedirect();

    $log = AiAuditLog::where('feature', 'user_activity_risk_detection')->where('user_id', $candidate->id)->firstOrFail();

    expect($log->status)->toBe('success');
    expect($log->model_name)->toBe('gpt-4o-mini');
    expect($log->input_json['signals']['apply_count'])->toBe(20);
    expect($log->input_json['signals']['failed_login_count'])->toBe(5);
    expect($log->input_json['recent_activities'][0])->toHaveKeys(['id', 'action', 'created_at', 'ip']);
    expect($log->output_json['risk_level'])->toBe('high');
    expect($log->output_json['risk_score'])->toBe(91);
    expect($log->output_json['analysis_source'])->toBe('ai');

    Http::assertSent(fn (Request $request): bool => $request->hasHeader('Authorization', 'Bearer test-key')
        && $request['model'] === 'gpt-4o-mini'
        && str_contains($request['messages'][1]['content'], 'failed_login'));
});

test('activity risk detection command stores fallback when ai is unavailable', function () {
    $candidate = User::factory()->candidate()->create();

    foreach (range(1, 3) as $index) {
        ActivityLog::create([
            'actor_id' => $candidate->id,
            'action' => 'failed_login',
            'properties_json' => ['ip' => '10.10.0.'.$index],
        ]);
    }

    $this->artisan('activity:detect-risk', ['user' => $candidate->email])
        ->assertSuccessful();

    $log = AiAuditLog::where('feature', 'user_activity_risk_detection')->where('user_id', $candidate->id)->firstOrFail();

    expect($log->status)->toBe('ai_unavailable');
    expect($log->model_name)->toBe('heuristic-fallback');
    expect($log->input_json['signals']['failed_login_count'])->toBe(3);
    expect($log->output_json['risk_level'])->toBe('medium');
    expect($log->output_json['analysis_source'])->toBe('heuristic');
});

test('user detail displays latest activity risk detection', function () {
    $admin = User::factory()->admin()->create();
    $candidate = User::factory()->candidate()->create();

    AiAuditLog::create([
        'user_id' => $candidate->id,
        'feature' => 'user_activity_risk_detection',
        'input_hash' => 'risk-hash',
        'model_name' => 'gpt-4o-mini',
        'status' => 'success',
        'output_json' => [
            'risk_level' => 'medium',
            'risk_score' => 64,
            'confidence' => 'medium',
            'reasons' => ['Apply meningkat tajam.'],
            'recommended_actions' => ['Pantau aktivitas 24 jam ke depan.'],
        ],
    ]);

    $this->actingAs($admin)
        ->get(route('admin.users.show', $candidate))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/resources/show')
            ->has('sections', 2)
            ->where('sections.1.title', 'AI Risk Detection')
            ->where('sections.1.items.0.value', 'Medium')
            ->where('sections.1.items.1.value', 64)
        );
});

test('ai audit detail exposes activity analysis input and output json', function () {
    $admin = User::factory()->admin()->create();
    $candidate = User::factory()->candidate()->create();

    $log = AiAuditLog::create([
        'user_id' => $candidate->id,
        'feature' => 'user_activity_risk_detection',
        'input_hash' => 'risk-hash',
        'input_json' => [
            'signals' => [
                'apply_count' => 22,
                'failed_login_count' => 6,
            ],
            'recent_activities' => [
                ['id' => 10, 'action' => 'candidate_jobs_apply'],
            ],
        ],
        'output_json' => [
            'risk_level' => 'high',
            'risk_score' => 92,
        ],
        'model_name' => 'gpt-4o-mini',
        'status' => 'success',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.ai-audit-logs.show', $log))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/ai-audit-logs/show')
            ->where('log.input_json.signals.apply_count', 22)
            ->where('log.input_json.recent_activities.0.action', 'candidate_jobs_apply')
            ->where('log.output_json.risk_score', 92)
        );
});
