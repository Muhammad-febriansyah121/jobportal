<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\RecordActivity;
use App\Http\Controllers\Admin\Concerns\BuildsAdminPages;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateSubscriptionRequest;
use App\Models\Subscription;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminSubscriptionController extends Controller
{
    use BuildsAdminPages;

    public function index(Request $request): Response
    {
        $subscriptions = Subscription::query()
            ->select(['id', 'company_id', 'pricing_plan_id', 'status', 'starts_at', 'ends_at', 'renews_at', 'created_at'])
            ->with(['company:id,name,slug', 'plan:id,name,price'])
            ->withCount('payments')
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()))
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Subscription $subscription): array => [
                'id' => $subscription->id,
                'company' => $subscription->company?->name,
                'plan' => $subscription->plan?->name,
                'status' => [
                    'label' => str($subscription->status)->headline()->toString(),
                    'tone' => $this->statusTone($subscription->status),
                ],
                'starts_at' => $subscription->starts_at?->format('d M Y') ?? '-',
                'ends_at' => $subscription->ends_at?->format('d M Y') ?? '-',
                'renews_at' => $subscription->renews_at?->format('d M Y') ?? '-',
                'payments_count' => $subscription->payments_count,
                'actions' => $this->subscriptionActions($subscription),
            ]);

        return Inertia::render('admin/resources/index', [
            'title' => 'Kelola Subscription',
            'description' => 'Pantau subscription, extend manual, cancel manual, dan payment history.',
            'indexAction' => route('admin.subscriptions.index'),
            'filters' => [
                $this->field('status', 'Status', 'select', $request->string('status')->toString(), $this->options([
                    '' => 'Semua status',
                    'active' => 'Active',
                    'cancelled' => 'Cancelled',
                    'expired' => 'Expired',
                    'past_due' => 'Past Due',
                ])),
            ],
            'columns' => [
                ['key' => 'company', 'label' => 'Perusahaan'],
                ['key' => 'plan', 'label' => 'Plan'],
                ['key' => 'status', 'label' => 'Status'],
                ['key' => 'starts_at', 'label' => 'Mulai'],
                ['key' => 'ends_at', 'label' => 'Berakhir'],
                ['key' => 'renews_at', 'label' => 'Renew'],
                ['key' => 'payments_count', 'label' => 'Payment'],
            ],
            'rows' => $subscriptions,
            'emptyState' => 'Belum ada subscription.',
        ]);
    }

    public function show(Subscription $subscription): Response
    {
        $subscription->load(['company:id,name,slug', 'plan:id,name,price,active_jobs_limit,recruiter_seat_limit,ai_screening_quota,talent_search_quota', 'payments']);

        return Inertia::render('admin/resources/show', [
            'title' => 'Detail Subscription',
            'description' => $subscription->company?->name,
            'backHref' => route('admin.subscriptions.index'),
            'actions' => $this->subscriptionActions($subscription),
            'sections' => [
                [
                    'title' => 'Subscription',
                    'items' => [
                        ['label' => 'Perusahaan', 'value' => $subscription->company?->name],
                        ['label' => 'Plan', 'value' => $subscription->plan?->name],
                        ['label' => 'Status', 'value' => str($subscription->status)->headline()->toString()],
                        ['label' => 'Mulai', 'value' => $subscription->starts_at?->format('d M Y') ?? '-'],
                        ['label' => 'Berakhir', 'value' => $subscription->ends_at?->format('d M Y') ?? '-'],
                        ['label' => 'Renew', 'value' => $subscription->renews_at?->format('d M Y') ?? '-'],
                    ],
                ],
                [
                    'title' => 'Usage limit',
                    'items' => [
                        ['label' => 'Active jobs limit', 'value' => $subscription->plan?->active_jobs_limit ?? '-'],
                        ['label' => 'Recruiter seat limit', 'value' => $subscription->plan?->recruiter_seat_limit ?? '-'],
                        ['label' => 'AI screening quota', 'value' => $subscription->plan?->ai_screening_quota ?? '-'],
                        ['label' => 'Talent search quota', 'value' => $subscription->plan?->talent_search_quota ?? '-'],
                    ],
                ],
            ],
            'tables' => [
                [
                    'title' => 'Payment history',
                    'columns' => [
                        ['key' => 'amount', 'label' => 'Amount'],
                        ['key' => 'status', 'label' => 'Status'],
                        ['key' => 'provider', 'label' => 'Provider'],
                        ['key' => 'paid_at', 'label' => 'Paid at'],
                    ],
                    'rows' => $subscription->payments->map(fn ($payment): array => [
                        'id' => $payment->id,
                        'amount' => 'Rp '.number_format((int) $payment->amount, 0, ',', '.'),
                        'status' => str($payment->status)->headline()->toString(),
                        'provider' => $payment->provider,
                        'paid_at' => $payment->paid_at?->format('d M Y H:i') ?? '-',
                    ]),
                ],
            ],
        ]);
    }

    public function extend(UpdateSubscriptionRequest $request, Subscription $subscription, RecordActivity $activity): RedirectResponse
    {
        $subscription->update([
            'status' => 'active',
            'ends_at' => $request->date('ends_at') ?? $subscription->ends_at,
            'renews_at' => $request->date('renews_at') ?? $subscription->renews_at,
        ]);

        $activity->handle($request->user(), 'extend_subscription', $subscription, $request->validated());
        $this->flash('Subscription berhasil diperpanjang.');

        return back();
    }

    public function cancel(UpdateSubscriptionRequest $request, Subscription $subscription, RecordActivity $activity): RedirectResponse
    {
        $subscription->update([
            'status' => 'cancelled',
            'renews_at' => null,
        ]);

        $activity->handle($request->user(), 'cancel_subscription', $subscription, ['note' => $request->validated('note')]);
        $this->flash('Subscription berhasil dibatalkan.');

        return back();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function subscriptionActions(Subscription $subscription): array
    {
        return [
            $this->action('Lihat Detail', route('admin.subscriptions.show', $subscription), 'Eye'),
            $this->action('Perpanjang', route('admin.subscriptions.extend', $subscription), 'Check', 'patch', 'default', null, null, [
                $this->field('ends_at', 'Tanggal berakhir', 'date', $subscription->ends_at?->format('Y-m-d')),
                $this->field('renews_at', 'Tanggal perpanjangan', 'date', $subscription->renews_at?->format('Y-m-d')),
                $this->field('note', 'Catatan admin', 'textarea'),
            ]),
            $this->action('Batalkan', route('admin.subscriptions.cancel', $subscription), 'X', 'patch', 'destructive', 'Batalkan langganan?', 'Langganan akan dibatalkan secara manual.', [
                $this->field('note', 'Catatan admin', 'textarea'),
            ]),
        ];
    }
}
