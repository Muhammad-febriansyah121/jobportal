<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AiAuditLog;
use App\Models\Application;
use App\Models\CandidateWalletTransaction;
use App\Models\Company;
use App\Models\Interview;
use App\Models\JobListing;
use App\Models\Payment;
use App\Models\Report;
use App\Models\Subscription;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        // Cache the aggregate-heavy metrics block briefly. It runs ~15 COUNT/SUM
        // queries on every load; a short TTL keeps the dashboard snappy at scale
        // while staying near-real-time. Tests forget this key to assert fresh data.
        $metrics = Cache::remember('admin.dashboard.metrics', now()->addSeconds(60), fn (): array => [
            'total_users' => User::count(),
            'total_candidates' => User::where('role', 'candidate')->count(),
            'total_companies' => Company::count(),
            'total_mentors' => User::where('role', 'mentor')->count(),
            'active_jobs' => JobListing::where('status', 'published')->count(),
            'total_applications' => Application::count(),
            'pending_company_verifications' => Company::where('verification_status', 'pending')->count(),
            'pending_reports' => Report::whereIn('status', ['open', 'pending'])->count(),
            'active_subscriptions' => Subscription::where('status', 'active')->count(),
            'subscription_revenue_total' => (int) Payment::where('status', 'paid')
                ->whereNotNull('subscription_id')
                ->sum('amount')
                + $this->jobseekerRevenue(),
            'subscription_revenue_month' => (int) Payment::query()
                ->where('status', 'paid')
                ->whereNotNull('subscription_id')
                ->where(function (Builder $query): void {
                    $startOfMonth = now()->startOfMonth();

                    $query
                        ->where('paid_at', '>=', $startOfMonth)
                        ->orWhere(fn (Builder $nested): Builder => $nested
                            ->whereNull('paid_at')
                            ->where('created_at', '>=', $startOfMonth));
                })
                ->sum('amount')
                + $this->jobseekerRevenue(now()->startOfMonth()),
            'subscription_revenue_prev_month' => (int) Payment::query()
                ->where('status', 'paid')
                ->whereNotNull('subscription_id')
                ->where(function (Builder $query): void {
                    $start = now()->subMonth()->startOfMonth();
                    $end = now()->subMonth()->endOfMonth();

                    $query
                        ->whereBetween('paid_at', [$start, $end])
                        ->orWhere(fn (Builder $nested): Builder => $nested
                            ->whereNull('paid_at')
                            ->whereBetween('created_at', [$start, $end]));
                })
                ->sum('amount')
                + $this->jobseekerRevenue(now()->subMonth()->startOfMonth(), now()->subMonth()->endOfMonth()),
            'new_subscriptions_month' => Subscription::query()
                ->where('created_at', '>=', now()->startOfMonth())
                ->count(),
            'pending_payments_count' => Payment::query()
                ->where('status', 'pending')
                ->whereNotNull('subscription_id')
                ->count(),
            'pending_payments_total' => Payment::query()
                ->where('status', 'pending')
                ->whereNotNull('subscription_id')
                ->sum('amount'),
            'ai_usage' => [
                'total' => AiAuditLog::count(),
                'failed' => AiAuditLog::where('status', 'failed')->count(),
                'success' => AiAuditLog::where('status', 'success')->count(),
            ],
        ]);

        $revenueByPlan = Payment::query()
            ->where('payments.status', 'paid')
            ->whereNotNull('payments.subscription_id')
            ->join('subscriptions', 'payments.subscription_id', '=', 'subscriptions.id')
            ->join('pricing_plans', 'subscriptions.pricing_plan_id', '=', 'pricing_plans.id')
            ->selectRaw('pricing_plans.name as plan_name, SUM(payments.amount) as total_revenue, COUNT(*) as payment_count')
            ->groupBy('pricing_plans.name')
            ->orderByDesc('total_revenue')
            ->get()
            ->map(fn (Payment $row): array => [
                'plan' => (string) $row->plan_name,
                'total' => (int) $row->total_revenue,
                'count' => (int) $row->payment_count,
            ])
            ->values()
            ->all();

        $jobseekerRevenue = $this->jobseekerRevenue();
        $jobseekerPaymentCount = CandidateWalletTransaction::query()
            ->where('status', 'paid')
            ->where('type', 'credit')
            ->where('amount', '>', 0)
            ->count();

        if ($jobseekerRevenue > 0) {
            $revenueByPlan[] = [
                'plan' => 'Jobseeker (Topup)',
                'total' => $jobseekerRevenue,
                'count' => $jobseekerPaymentCount,
            ];
        }

        return Inertia::render('admin/dashboard', [
            'metrics' => $metrics,
            'revenueSeries' => $this->monthlyRevenue(),
            'revenueByPlan' => $revenueByPlan,
            'registrationSeries' => [
                'users' => $this->monthlyCounts(User::query()),
                'companies' => $this->monthlyCounts(Company::query()),
                'jobs' => $this->monthlyCounts(JobListing::query()),
            ],
            'aiUsageByFeature' => AiAuditLog::query()
                ->selectRaw('feature, count(*) as total')
                ->groupBy('feature')
                ->orderByDesc('total')
                ->limit(6)
                ->get()
                ->map(fn (AiAuditLog $log): array => [
                    'feature' => str((string) $log->feature)->replace('_', ' ')->headline()->toString(),
                    'total' => (int) $log->total,
                ]),
            'conversionFunnel' => [
                'applications' => Application::count(),
                'interviews' => Interview::count(),
                'hired' => Application::where('status', 'hired')->count(),
            ],
            'topJobs' => JobListing::query()
                ->withCount('applications')
                ->with(['company:id,name'])
                ->orderByDesc('applications_count')
                ->limit(5)
                ->get(['id', 'title', 'company_id', 'status', 'work_mode'])
                ->map(fn (JobListing $job): array => [
                    'id' => $job->id,
                    'title' => $job->title,
                    'company' => $job->company?->name ?? '—',
                    'status' => $job->status,
                    'work_mode' => $job->work_mode,
                    'applications_count' => $job->applications_count,
                ])
                ->values()
                ->all(),
            'topCompanies' => Company::query()
                ->withCount(['jobListings', 'members'])
                ->orderByDesc('job_listings_count')
                ->limit(5)
                ->get(['id', 'name', 'verification_status', 'is_active', 'hq_city'])
                ->map(fn (Company $company): array => [
                    'id' => $company->id,
                    'name' => $company->name,
                    'verification_status' => $company->verification_status,
                    'is_active' => $company->is_active,
                    'hq_city' => $company->hq_city,
                    'job_listings_count' => $company->job_listings_count,
                    'members_count' => $company->members_count,
                ])
                ->values()
                ->all(),
            'recentRegistrations' => User::query()
                ->whereIn('role', ['candidate', 'employer'])
                ->latest()
                ->limit(8)
                ->get(['id', 'name', 'email', 'role', 'created_at'])
                ->map(fn (User $user): array => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'created_at' => $user->created_at?->diffForHumans(),
                ])
                ->values()
                ->all(),
            'recentPayments' => $this->recentPayments(),
        ]);
    }

    /**
     * Recent payments across BOTH revenue sources: company subscription payments
     * and jobseeker wallet top-ups, merged and ordered by most recent.
     *
     * @return array<int, array<string, mixed>>
     */
    private function recentPayments(): array
    {
        $companyPayments = Payment::query()
            ->with(['company:id,name', 'subscription.plan:id,name'])
            ->latest()
            ->limit(10)
            ->get(['id', 'company_id', 'subscription_id', 'amount', 'status', 'provider_reference', 'paid_at', 'created_at'])
            ->map(fn (Payment $payment): array => [
                'id' => 'sub-'.$payment->id,
                'company_name' => $payment->company?->name ?? '—',
                'plan_name' => $payment->subscription?->plan?->name ?? '—',
                'amount' => (int) $payment->amount,
                'status' => $payment->status,
                'provider_reference' => $payment->provider_reference,
                'paid_at' => $payment->paid_at?->diffForHumans(),
                'created_at' => $payment->created_at?->diffForHumans(),
                'sort_at' => $payment->paid_at ?? $payment->created_at,
            ]);

        $jobseekerPayments = CandidateWalletTransaction::query()
            ->where('type', 'credit')
            ->where('amount', '>', 0)
            ->with(['candidate:id,full_name', 'pricingMenu:id,name'])
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn (CandidateWalletTransaction $tx): array => [
                'id' => 'js-'.$tx->id,
                'company_name' => $tx->candidate?->full_name ?? 'Jobseeker',
                'plan_name' => $tx->pricingMenu?->name ?? 'Topup Jobseeker',
                'amount' => (int) $tx->amount,
                'status' => $tx->status,
                'provider_reference' => $tx->order_id,
                'paid_at' => $tx->paid_at?->diffForHumans(),
                'created_at' => $tx->created_at?->diffForHumans(),
                'sort_at' => $tx->paid_at ?? $tx->created_at,
            ]);

        return $companyPayments
            ->concat($jobseekerPayments)
            ->sortByDesc('sort_at')
            ->take(10)
            ->map(fn (array $row): array => Arr::except($row, 'sort_at'))
            ->values()
            ->all();
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

    /** @return array<int, array<string, int|string>> */
    private function monthlyRevenue(): array
    {
        $start = CarbonImmutable::now()->startOfMonth()->subMonths(5);
        $months = collect(range(0, 5))
            ->map(fn (int $offset): string => $start->addMonths($offset)->format('Y-m'));

        $totals = Payment::query()
            ->where('status', 'paid')
            ->whereNotNull('subscription_id')
            ->where(function (Builder $query) use ($start): void {
                $query
                    ->where('paid_at', '>=', $start)
                    ->orWhere(fn (Builder $nested): Builder => $nested
                        ->whereNull('paid_at')
                        ->where('created_at', '>=', $start));
            })
            ->get(['amount', 'paid_at', 'created_at'])
            ->groupBy(fn (Payment $payment): string => ($payment->paid_at ?? $payment->created_at)->format('Y-m'))
            ->map(fn ($group): int => (int) $group->sum('amount'));

        $jobseekerTotals = CandidateWalletTransaction::query()
            ->where('status', 'paid')
            ->where('type', 'credit')
            ->where('amount', '>', 0)
            ->where(function (Builder $query) use ($start): void {
                $query
                    ->where('paid_at', '>=', $start)
                    ->orWhere(fn (Builder $nested): Builder => $nested
                        ->whereNull('paid_at')
                        ->where('created_at', '>=', $start));
            })
            ->get(['amount', 'paid_at', 'created_at'])
            ->groupBy(fn (CandidateWalletTransaction $tx): string => ($tx->paid_at ?? $tx->created_at)->format('Y-m'))
            ->map(fn ($group): int => (int) $group->sum('amount'));

        return $months
            ->map(fn (string $month): array => [
                'month' => $month,
                'total' => (int) ($totals[$month] ?? 0) + (int) ($jobseekerTotals[$month] ?? 0),
            ])
            ->values()
            ->all();
    }

    /**
     * Sum jobseeker (candidate) payments that are real money — Pakasir-paid wallet
     * top-ups (status "paid", incoming credit). Optionally scoped to a date range
     * by paid_at, falling back to created_at when paid_at is null.
     */
    private function jobseekerRevenue(?CarbonImmutable $start = null, ?CarbonImmutable $end = null): int
    {
        return (int) CandidateWalletTransaction::query()
            ->where('status', 'paid')
            ->where('type', 'credit')
            ->where('amount', '>', 0)
            ->when($start !== null, function (Builder $query) use ($start, $end): void {
                $query->where(function (Builder $nested) use ($start, $end): void {
                    if ($end !== null) {
                        $nested
                            ->whereBetween('paid_at', [$start, $end])
                            ->orWhere(fn (Builder $inner): Builder => $inner
                                ->whereNull('paid_at')
                                ->whereBetween('created_at', [$start, $end]));
                    } else {
                        $nested
                            ->where('paid_at', '>=', $start)
                            ->orWhere(fn (Builder $inner): Builder => $inner
                                ->whereNull('paid_at')
                                ->where('created_at', '>=', $start));
                    }
                });
            })
            ->sum('amount');
    }
}
