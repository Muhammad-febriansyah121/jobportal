<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AiAuditLog;
use App\Models\Application;
use App\Models\Company;
use App\Models\JobListing;
use App\Models\JobListingAnalytic;
use App\Models\Payment;
use App\Models\Report;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminPlatformAnalyticsController extends Controller
{
    public function __invoke(Request $request): Response
    {
        return Inertia::render('admin/analytics', [
            'series' => [
                'users' => $this->monthlyCounts(User::query()),
                'companies' => $this->monthlyCounts(Company::query()),
                'candidates' => $this->monthlyCounts(User::query()->where('role', 'candidate')),
                'jobs' => $this->monthlyCounts(JobListing::query()),
                'applications' => $this->monthlyCounts(Application::query()),
                'reports' => $this->monthlyCounts(Report::query()),
                'aiUsage' => $this->monthlyCounts(AiAuditLog::query()),
            ],
            'summary' => [
                'conversion_apply' => $this->conversionRate(),
                'subscription_revenue' => Payment::where('status', 'paid')->sum('amount'),
                'report_pending' => Report::whereIn('status', ['open', 'under_review'])->count(),
                'ai_failed' => AiAuditLog::where('status', 'failed')->count(),
            ],
            'revenueSeries' => $this->monthlyRevenue(),
        ]);
    }

    /**
     * @param  Builder<Model>  $query
     * @return array<int, array<string, int|string>>
     */
    private function monthlyCounts(Builder $query): array
    {
        $start = CarbonImmutable::now()->startOfMonth()->subMonths(5);
        $months = collect(range(0, 5))
            ->map(fn (int $offset): string => $start->addMonths($offset)->format('Y-m'));

        $counts = $query
            ->where('created_at', '>=', $start)
            ->get(['created_at'])
            ->groupBy(fn (Model $model): string => $model->created_at->format('Y-m'))
            ->map->count();

        return $months
            ->map(fn (string $month): array => [
                'month' => $month,
                'total' => (int) ($counts[$month] ?? 0),
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<int, array<string, int|string>>
     */
    private function monthlyRevenue(): array
    {
        $start = CarbonImmutable::now()->startOfMonth()->subMonths(5);
        $months = collect(range(0, 5))
            ->map(fn (int $offset): string => $start->addMonths($offset)->format('Y-m'));

        $revenue = Payment::query()
            ->where('status', 'paid')
            ->where('created_at', '>=', $start)
            ->get(['amount', 'created_at'])
            ->groupBy(fn (Payment $payment): string => $payment->created_at->format('Y-m'))
            ->map(fn ($payments): int => (int) $payments->sum('amount'));

        return $months
            ->map(fn (string $month): array => [
                'month' => $month,
                'total' => (int) ($revenue[$month] ?? 0),
            ])
            ->values()
            ->all();
    }

    private function conversionRate(): float
    {
        $views = JobListingAnalytic::sum('views_count');
        $applications = Application::count();

        if ($views === 0) {
            return 0.0;
        }

        return round(($applications / $views) * 100, 2);
    }
}
