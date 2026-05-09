<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AiAuditLog;
use App\Models\Application;
use App\Models\Company;
use App\Models\CompanyVerification;
use App\Models\JobListing;
use App\Models\JobListingAnalytic;
use App\Models\Payment;
use App\Models\PricingPlan;
use App\Models\Report;
use App\Models\Subscription;
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
            'totals' => [
                'users' => User::count(),
                'companies' => Company::count(),
                'verified_companies' => Company::where('is_verified', true)->count(),
                'jobs_live' => JobListing::where('status', 'published')->count(),
                'applications_month' => Application::where('created_at', '>=', now()->startOfMonth())->count(),
                'active_subscriptions' => Subscription::where('status', 'active')->count(),
                'verification_queue' => CompanyVerification::where('status', 'pending')->count(),
                'pending_payments' => Payment::where('status', 'pending')->count(),
            ],
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
            'applicationFunnel' => Application::query()
                ->selectRaw('status, count(*) as total')
                ->groupBy('status')
                ->pluck('total', 'status'),
            'userRoles' => User::query()
                ->selectRaw('role, count(*) as total')
                ->groupBy('role')
                ->pluck('total', 'role'),
            'jobsByStatus' => JobListing::query()
                ->selectRaw('status, count(*) as total')
                ->groupBy('status')
                ->pluck('total', 'status'),
            'jobsByWorkMode' => JobListing::query()
                ->selectRaw('work_mode, count(*) as total')
                ->groupBy('work_mode')
                ->pluck('total', 'work_mode'),
            'topIndustries' => JobListing::query()
                ->where('status', 'published')
                ->join('industries', 'job_listings.industry_id', '=', 'industries.id')
                ->selectRaw('industries.name, count(*) as total')
                ->groupBy('industries.id', 'industries.name')
                ->orderByDesc('total')
                ->limit(10)
                ->get(),
            'subscriptionsByPlan' => PricingPlan::query()
                ->withCount(['subscriptions as active_count' => fn (Builder $q) => $q->where('subscriptions.status', 'active')])
                ->withSum(['payments as revenue' => fn (Builder $q) => $q->where('payments.status', 'paid')], 'amount')
                ->orderByDesc('active_count')
                ->get(['id', 'name', 'price']),
            'aiByFeature' => $this->aiFeatureStats(),
        ]);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function aiFeatureStats(): array
    {
        $rows = AiAuditLog::query()
            ->selectRaw('feature, status, count(*) as total')
            ->groupBy('feature', 'status')
            ->get();

        $features = $rows->groupBy('feature');

        return $features->map(function ($entries, string $feature): array {
            $success = (int) ($entries->firstWhere('status', 'success')?->total ?? 0);
            $failed = (int) ($entries->firstWhere('status', 'failed')?->total ?? 0);
            $total = $success + $failed;

            return [
                'feature' => $feature,
                'total' => $total,
                'success' => $success,
                'failed' => $failed,
                'success_rate' => $total > 0 ? round(($success / $total) * 100, 1) : 0.0,
            ];
        })->values()->all();
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
