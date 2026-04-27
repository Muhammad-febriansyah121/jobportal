<?php

namespace App\Http\Controllers\Admin;

use App\Exports\LamaranExport;
use App\Exports\PenggunaExport;
use App\Exports\RevenueExport;
use App\Exports\SubscriptionExport;
use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Company;
use App\Models\Payment;
use App\Models\Subscription;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AdminLaporanController extends Controller
{
    public function index(): Response
    {
        $since30 = now()->subDays(30);
        $start12 = CarbonImmutable::now()->startOfMonth()->subMonths(11);

        return Inertia::render('admin/laporan', [
            'summary' => [
                'revenue_total' => (int) Payment::where('status', 'paid')->sum('amount'),
                'revenue_30d' => (int) Payment::where('status', 'paid')->where('created_at', '>=', $since30)->sum('amount'),
                'revenue_count_30d' => Payment::where('status', 'paid')->where('created_at', '>=', $since30)->count(),
                'applications_30d' => Application::where('created_at', '>=', $since30)->count(),
                'users_30d' => User::where('created_at', '>=', $since30)->count(),
                'companies_30d' => Company::where('created_at', '>=', $since30)->count(),
                'active_subscriptions' => Subscription::where('status', 'active')->count(),
                'pending_payments' => Payment::where('status', 'pending')->count(),
            ],
            'revenueSeries' => $this->monthlyRevenue($start12),
            'companySeries' => $this->monthlyCounts(Company::query(), $start12),
            'userSeries' => $this->monthlyCounts(
                User::query()->whereIn('role', ['candidate', 'employer']),
                $start12,
            ),
            'applicationSeries' => $this->monthlyCounts(Application::query(), $start12),
            'revenueByPlan' => Payment::query()
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
                ->all(),
            'paymentStatusDist' => Payment::query()
                ->selectRaw('status, COUNT(*) as total, SUM(amount) as amount_total')
                ->groupBy('status')
                ->get()
                ->map(fn (Payment $row): array => [
                    'status' => ucfirst((string) $row->status),
                    'count' => (int) $row->total,
                    'amount' => (int) $row->amount_total,
                ])
                ->values()
                ->all(),
            'topCompaniesByRevenue' => Payment::query()
                ->where('payments.status', 'paid')
                ->whereNotNull('payments.company_id')
                ->join('companies', 'payments.company_id', '=', 'companies.id')
                ->selectRaw('companies.id, companies.name, companies.hq_city, SUM(payments.amount) as total_revenue, COUNT(payments.id) as payment_count')
                ->groupBy('companies.id', 'companies.name', 'companies.hq_city')
                ->orderByDesc('total_revenue')
                ->limit(10)
                ->get()
                ->map(fn (Payment $row): array => [
                    'id' => $row->id,
                    'name' => (string) $row->name,
                    'city' => $row->hq_city ?? '—',
                    'total_revenue' => (int) $row->total_revenue,
                    'payment_count' => (int) $row->payment_count,
                ])
                ->values()
                ->all(),
            'subscriptionStats' => [
                'active' => Subscription::where('status', 'active')->count(),
                'expired' => Subscription::where('status', 'expired')->count(),
                'cancelled' => Subscription::where('status', 'cancelled')->count(),
            ],
        ]);
    }

    public function exportRevenue(Request $request): BinaryFileResponse
    {
        $validated = $request->validate([
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'status' => ['nullable', 'in:pending,paid,failed,refunded'],
        ]);

        return Excel::download(
            new RevenueExport($validated['start_date'] ?? null, $validated['end_date'] ?? null, $validated['status'] ?? null),
            'laporan-revenue-'.now()->format('Ymd-His').'.xlsx',
        );
    }

    public function exportLamaran(Request $request): BinaryFileResponse
    {
        $validated = $request->validate([
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'status' => ['nullable', 'in:applied,screened,shortlisted,interview,offer,hired,rejected,withdrawn'],
        ]);

        return Excel::download(
            new LamaranExport($validated['start_date'] ?? null, $validated['end_date'] ?? null, $validated['status'] ?? null),
            'laporan-lamaran-'.now()->format('Ymd-His').'.xlsx',
        );
    }

    public function exportPengguna(Request $request): BinaryFileResponse
    {
        $validated = $request->validate([
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'role' => ['nullable', 'in:candidate,employer,mentor'],
        ]);

        return Excel::download(
            new PenggunaExport($validated['start_date'] ?? null, $validated['end_date'] ?? null, $validated['role'] ?? null),
            'laporan-pengguna-'.now()->format('Ymd-His').'.xlsx',
        );
    }

    public function exportSubscription(Request $request): BinaryFileResponse
    {
        $validated = $request->validate([
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'status' => ['nullable', 'in:active,expired,cancelled'],
        ]);

        return Excel::download(
            new SubscriptionExport($validated['start_date'] ?? null, $validated['end_date'] ?? null, $validated['status'] ?? null),
            'laporan-subscription-'.now()->format('Ymd-His').'.xlsx',
        );
    }

    /** @return array<int, array<string, int|string>> */
    private function monthlyRevenue(CarbonImmutable $start): array
    {
        $months = collect(range(0, 11))
            ->map(fn (int $i): string => $start->addMonths($i)->format('Y-m'));

        $totals = Payment::query()
            ->where('status', 'paid')
            ->where(function (Builder $query) use ($start): void {
                $query
                    ->where('paid_at', '>=', $start)
                    ->orWhere(fn (Builder $nested): Builder => $nested
                        ->whereNull('paid_at')
                        ->where('created_at', '>=', $start));
            })
            ->get(['amount', 'paid_at', 'created_at'])
            ->groupBy(fn (Payment $p): string => ($p->paid_at ?? $p->created_at)->format('Y-m'))
            ->map(fn ($group): int => (int) $group->sum('amount'));

        return $months
            ->map(fn (string $month): array => [
                'month' => $month,
                'total' => (int) ($totals[$month] ?? 0),
            ])
            ->values()
            ->all();
    }

    /**
     * @param  Builder<Model>  $query
     * @return array<int, array<string, int|string>>
     */
    private function monthlyCounts(Builder $query, CarbonImmutable $start): array
    {
        $months = collect(range(0, 11))
            ->map(fn (int $i): string => $start->addMonths($i)->format('Y-m'));

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
}
