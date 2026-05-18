<?php

namespace App\Actions\Admin;

use App\Ai\Agents\AdminUserSummarizer;
use App\Models\ActivityLog;
use App\Models\AiAuditLog;
use App\Models\User;
use App\Services\AiService;
use Throwable;

class GenerateUserAiSummary
{
    public function __construct(private readonly AiService $ai) {}

    public function handle(User $user): ?AiAuditLog
    {
        $activities = ActivityLog::query()
            ->where('actor_id', $user->id)
            ->latest()
            ->limit(50)
            ->get(['id', 'action', 'subject_type', 'subject_id', 'properties_json', 'created_at']);

        $activityLines = $activities->map(function (ActivityLog $log): string {
            $subject = $log->subject_type ? class_basename($log->subject_type) : '-';

            return "- {$log->action} on {$subject} at {$log->created_at?->format('Y-m-d H:i')}";
        })->implode("\n");

        $profile = [
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'status' => $user->is_active ? 'aktif' : 'nonaktif',
            'registered' => $user->created_at?->format('Y-m-d'),
        ];
        $input = [
            'user' => $profile,
            'activity_count' => $activities->count(),
            'recent_activities' => $activities
                ->map(fn (ActivityLog $log): array => [
                    'id' => $log->id,
                    'action' => $log->action,
                    'subject' => $log->subject_type ? class_basename($log->subject_type).' #'.$log->subject_id : null,
                    'route' => $log->properties_json['route'] ?? null,
                    'created_at' => $log->created_at?->toIso8601String(),
                ])
                ->values()
                ->all(),
        ];

        if ($activityLines === '') {
            $activityLines = 'Belum ada aktivitas tercatat.';
        }

        $userPrompt = <<<PROMPT
Data pengguna:
- Nama: {$profile['name']}
- Email: {$profile['email']}
- Role: {$profile['role']}
- Status: {$profile['status']}
- Tanggal daftar: {$profile['registered']}

Riwayat aktivitas terbaru (maks 50 terakhir):
{$activityLines}

Buat ringkasan singkat perilaku pengguna ini untuk keperluan admin.
PROMPT;

        @set_time_limit(0);
        $result = null;

        if ($this->ai->isConfigured()) {
            try {
                $response = (new AdminUserSummarizer)->prompt($userPrompt);
                $result = $response->text;
            } catch (Throwable) {
                $result = null;
            }
        }

        return AiAuditLog::create([
            'user_id' => $user->id,
            'feature' => 'admin_user_summary',
            'input_hash' => hash('sha256', json_encode($input, JSON_THROW_ON_ERROR)),
            'input_json' => $input,
            'output_json' => [
                'summary' => $result,
                'generated_at' => now()->toIso8601String(),
            ],
            'model_name' => (string) (config('services.openai.model') ?: 'gpt-5'),
            'status' => $result ? 'success' : 'failed',
        ]);
    }
}
