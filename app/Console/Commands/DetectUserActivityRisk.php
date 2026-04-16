<?php

namespace App\Console\Commands;

use App\Models\ActivityLog;
use App\Models\User;
use App\Services\ActivityRiskDetector;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;

#[Signature('activity:detect-risk {user? : User ID or email} {--days=7 : Activity window in days} {--all : Include users with low heuristic risk}')]
#[Description('Analyze user activity logs for suspicious patterns using AI risk detection')]
class DetectUserActivityRisk extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(ActivityRiskDetector $riskDetector): int
    {
        $days = max(1, (int) $this->option('days'));
        $users = $this->users($days);

        if ($users->isEmpty()) {
            $this->components->info('No users found for activity risk detection.');

            return self::SUCCESS;
        }

        $users->each(function (User $user) use ($riskDetector, $days): void {
            $log = $riskDetector->analyze($user, $days);
            $level = $log->output_json['risk_level'] ?? 'unknown';
            $score = $log->output_json['risk_score'] ?? '-';

            $this->components->info("Analyzed {$user->email}: {$level} ({$score})");
        });

        return self::SUCCESS;
    }

    /**
     * @return Collection<int, User>
     */
    private function users(int $days): Collection
    {
        $identifier = $this->argument('user');

        if (is_string($identifier) && $identifier !== '') {
            return User::query()
                ->where('id', $identifier)
                ->orWhere('email', $identifier)
                ->get();
        }

        $activityQuery = ActivityLog::query()
            ->select('actor_id')
            ->whereNotNull('actor_id')
            ->where('created_at', '>=', now()->subDays($days));

        if (! $this->option('all')) {
            $activityQuery->where(function ($query): void {
                $query->where('action', 'candidate_jobs_apply')
                    ->orWhere('action', 'failed_login')
                    ->orWhere('action', 'like', '%delete%')
                    ->orWhere('action', 'like', '%destroy%')
                    ->orWhere('action', 'like', '%deactivate%')
                    ->orWhere('action', 'like', '%suspend%')
                    ->orWhere('action', 'like', '%reject%')
                    ->orWhere('action', 'like', '%cancel%')
                    ->orWhere('action', 'like', '%withdraw%');
            });
        }

        return User::query()
            ->whereIn('id', $activityQuery->distinct())
            ->orderBy('id')
            ->get();
    }
}
