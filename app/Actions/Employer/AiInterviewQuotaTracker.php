<?php

namespace App\Actions\Employer;

use App\Models\AiInterviewSession;
use App\Models\Company;
use Illuminate\Support\Carbon;

class AiInterviewQuotaTracker
{
    /**
     * @return array{limit: int|null, used: int, remaining: int|null, period_start: Carbon|null, period_end: Carbon|null}
     */
    public function summary(Company $company): array
    {
        $company->loadMissing('activeSubscription.plan');
        $subscription = $company->activeSubscription;
        $plan = $subscription?->plan;
        $limit = $plan?->ai_interview_quota;

        $periodStart = $subscription?->starts_at ? Carbon::parse($subscription->starts_at) : null;
        $periodEnd = $subscription?->ends_at ? Carbon::parse($subscription->ends_at) : null;

        $jobIds = $company->jobListings()->pluck('id');
        $usedQuery = AiInterviewSession::query()
            ->whereIn('application_id', function ($query) use ($jobIds): void {
                $query->select('id')->from('applications')->whereIn('job_listing_id', $jobIds);
            });

        if ($periodStart !== null) {
            $usedQuery->where('created_at', '>=', $periodStart);
        }

        $used = (int) $usedQuery->count();

        $remaining = $limit === null ? null : max(0, (int) $limit - $used);

        return [
            'limit' => $limit === null ? null : (int) $limit,
            'used' => $used,
            'remaining' => $remaining,
            'period_start' => $periodStart,
            'period_end' => $periodEnd,
        ];
    }

    public function canSchedule(Company $company, int $count = 1): bool
    {
        $summary = $this->summary($company);

        if ($summary['limit'] === null) {
            return true;
        }

        return $summary['remaining'] !== null && $summary['remaining'] >= $count;
    }
}
