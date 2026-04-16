<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\AiAuditLog;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class ActivityRiskDetector
{
    private const FEATURE = 'user_activity_risk_detection';

    public function __construct(private AiService $aiService) {}

    public function analyze(User $user, int $days = 7): AiAuditLog
    {
        $since = now()->subDays($days);
        $activities = $this->activitiesFor($user, $since);
        $signals = $this->signals($activities);
        $payload = $this->payload($user, $days, $since, $activities, $signals);
        $aiOutput = $this->askAi($payload);
        $output = $aiOutput ?? $this->fallbackOutput($payload);

        return AiAuditLog::create([
            'user_id' => $user->id,
            'feature' => self::FEATURE,
            'input_hash' => hash('sha256', json_encode($payload, JSON_THROW_ON_ERROR)),
            'input_json' => $payload,
            'output_json' => $output,
            'model_name' => $aiOutput === null ? 'heuristic-fallback' : $this->aiService->modelName(),
            'status' => $aiOutput === null ? 'ai_unavailable' : 'success',
        ]);
    }

    /**
     * @return Collection<int, ActivityLog>
     */
    private function activitiesFor(User $user, CarbonInterface $since): Collection
    {
        return ActivityLog::query()
            ->select(['id', 'actor_id', 'action', 'subject_type', 'subject_id', 'properties_json', 'created_at'])
            ->where('actor_id', $user->id)
            ->where('created_at', '>=', $since)
            ->latest()
            ->limit(100)
            ->get();
    }

    /**
     * @param  Collection<int, ActivityLog>  $activities
     * @return array<string, mixed>
     */
    private function signals(Collection $activities): array
    {
        $applyCount = $activities->where('action', 'candidate_jobs_apply')->count();
        $failedLoginCount = $activities->where('action', 'failed_login')->count();
        $destructiveCount = $activities->filter(fn (ActivityLog $activity): bool => $this->isDestructiveAction($activity->action))->count();
        $uniqueIpCount = $activities
            ->map(fn (ActivityLog $activity): ?string => $activity->properties_json['ip'] ?? null)
            ->filter()
            ->unique()
            ->count();

        return [
            'apply_count' => $applyCount,
            'failed_login_count' => $failedLoginCount,
            'destructive_action_count' => $destructiveCount,
            'unique_ip_count' => $uniqueIpCount,
            'heuristic_level' => $this->heuristicLevel($applyCount, $failedLoginCount, $destructiveCount),
        ];
    }

    private function isDestructiveAction(string $action): bool
    {
        return Str::contains($action, [
            'delete',
            'destroy',
            'deactivate',
            'suspend',
            'reject',
            'cancel',
            'withdraw',
            'reset_email_verification',
        ]);
    }

    private function heuristicLevel(int $applyCount, int $failedLoginCount, int $destructiveCount): string
    {
        return match (true) {
            $applyCount >= 20 || $failedLoginCount >= 5 || $destructiveCount >= 3 => 'high',
            $applyCount >= 10 || $failedLoginCount >= 3 || $destructiveCount >= 1 => 'medium',
            default => 'low',
        };
    }

    /**
     * @param  Collection<int, ActivityLog>  $activities
     * @param  array<string, mixed>  $signals
     * @return array<string, mixed>
     */
    private function payload(User $user, int $days, CarbonInterface $since, Collection $activities, array $signals): array
    {
        return [
            'user' => [
                'id' => $user->id,
                'role' => $user->role,
                'email_domain' => Str::after((string) $user->email, '@'),
            ],
            'window' => [
                'days' => $days,
                'since' => $since->toIso8601String(),
            ],
            'signals' => $signals,
            'recent_activities' => $activities
                ->take(30)
                ->map(fn (ActivityLog $activity): array => [
                    'id' => $activity->id,
                    'action' => $activity->action,
                    'subject' => $activity->subject_type === null ? null : class_basename((string) $activity->subject_type).' #'.$activity->subject_id,
                    'created_at' => $activity->created_at?->toIso8601String(),
                    'route' => $activity->properties_json['route'] ?? null,
                    'status' => $activity->properties_json['status'] ?? null,
                    'ip' => $activity->properties_json['ip'] ?? null,
                ])
                ->values()
                ->all(),
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>|null
     */
    private function askAi(array $payload): ?array
    {
        $content = $this->aiService->chat([
            [
                'role' => 'system',
                'content' => 'You are a security risk analyst for a job portal. Return only valid JSON with keys: risk_level, risk_score, reasons, recommended_actions, confidence. risk_level must be low, medium, or high. risk_score is 0-100. Keep reasons and recommended_actions concise.',
            ],
            [
                'role' => 'user',
                'content' => json_encode($payload, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES),
            ],
        ], 700, 0.2);

        if ($content === null) {
            return null;
        }

        $decoded = json_decode($this->normalizeJson($content), true);

        return is_array($decoded) ? $this->normalizeOutput($decoded, 'ai') : null;
    }

    private function normalizeJson(string $content): string
    {
        return Str::of($content)
            ->trim()
            ->replaceMatches('/^```(?:json)?\s*/', '')
            ->replaceMatches('/\s*```$/', '')
            ->toString();
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function fallbackOutput(array $payload): array
    {
        $signals = $payload['signals'];
        $riskLevel = (string) $signals['heuristic_level'];

        return $this->normalizeOutput([
            'risk_level' => $riskLevel,
            'risk_score' => match ($riskLevel) {
                'high' => 85,
                'medium' => 55,
                default => 15,
            },
            'reasons' => [
                "Apply count: {$signals['apply_count']}",
                "Failed login count: {$signals['failed_login_count']}",
                "Destructive action count: {$signals['destructive_action_count']}",
            ],
            'recommended_actions' => $riskLevel === 'low'
                ? ['Tidak perlu tindakan khusus.']
                : ['Review aktivitas user.', 'Validasi apakah pola aktivitas sesuai konteks.'],
            'confidence' => $riskLevel === 'low' ? 'medium' : 'low',
        ], 'heuristic');
    }

    /**
     * @param  array<string, mixed>  $output
     * @return array<string, mixed>
     */
    private function normalizeOutput(array $output, string $source): array
    {
        return [
            'risk_level' => in_array($output['risk_level'] ?? null, ['low', 'medium', 'high'], true) ? $output['risk_level'] : 'medium',
            'risk_score' => max(0, min(100, (int) ($output['risk_score'] ?? 50))),
            'reasons' => array_values(array_filter((array) ($output['reasons'] ?? []))),
            'recommended_actions' => array_values(array_filter((array) ($output['recommended_actions'] ?? []))),
            'confidence' => (string) ($output['confidence'] ?? 'medium'),
            'analysis_source' => $source,
            'generated_at' => now()->toIso8601String(),
        ];
    }
}
