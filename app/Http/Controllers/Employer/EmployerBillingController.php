<?php

namespace App\Http\Controllers\Employer;

use App\Actions\Employer\ResolveEmployerCompany;
use App\Http\Controllers\Controller;
use App\Models\JobListing;
use App\Models\Payment;
use App\Models\PricingPlan;
use App\Services\PakasirService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class EmployerBillingController extends Controller
{
    public function __invoke(Request $request, ResolveEmployerCompany $resolveEmployerCompany, PakasirService $pakasirService): Response
    {
        $company = $resolveEmployerCompany->handle($request->user());

        $activeSubscription = null;
        $pendingPayment = null;
        $payments = [];

        if ($company !== null) {
            $pendingRecord = Payment::where('company_id', $company->id)
                ->where('status', 'pending')
                ->with('subscription.plan')
                ->latest()
                ->first();

            if ($pendingRecord) {
                $pendingPayment = [
                    'id' => $pendingRecord->id,
                    'amount' => $pendingRecord->amount,
                    'plan_name' => $pendingRecord->subscription?->plan?->name ?? '-',
                    'provider_reference' => $pendingRecord->provider_reference,
                    'payment_url' => $pakasirService->paymentUrl($pendingRecord->amount, $pendingRecord->provider_reference),
                ];
            }

            $company->load(['activeSubscription.plan', 'activeSubscription.payments']);

            $sub = $company->activeSubscription;

            if ($sub !== null) {
                $plan = $sub->plan;

                $activeJobsCount = JobListing::query()
                    ->where('company_id', $company->id)
                    ->where('status', 'published')
                    ->count();

                $now = Carbon::now();
                $totalDays = $sub->starts_at && $sub->ends_at
                    ? max(1, (int) $sub->starts_at->diffInDays($sub->ends_at))
                    : null;
                $daysRemaining = $sub->ends_at
                    ? max(0, (int) $now->diffInDays($sub->ends_at, false))
                    : null;

                $activeSubscription = [
                    'id' => $sub->id,
                    'plan_id' => $plan?->id,
                    'plan_name' => $plan?->name ?? '-',
                    'status' => $sub->status,
                    'starts_at' => $sub->starts_at?->format('d M Y'),
                    'ends_at' => $sub->ends_at?->format('d M Y'),
                    'renews_at' => $sub->renews_at?->format('d M Y'),
                    'days_total' => $totalDays,
                    'days_remaining' => $daysRemaining,
                    'active_jobs_limit' => $plan?->active_jobs_limit,
                    'active_jobs_used' => $activeJobsCount,
                    'recruiter_seat_limit' => $plan?->recruiter_seat_limit,
                    'ai_screening_quota' => $plan?->ai_screening_quota,
                    'talent_search_quota' => $plan?->talent_search_quota,
                    'features' => $plan?->normalizedFeatures() ?? [],
                ];

                $payments = $sub->payments
                    ->sortByDesc('created_at')
                    ->values()
                    ->map(fn (Payment $payment): array => [
                        'id' => $payment->id,
                        'amount' => $payment->amount,
                        'status' => $payment->status,
                        'provider' => $payment->provider ?? '-',
                        'provider_reference' => $payment->provider_reference ?? '-',
                        'paid_at' => $payment->paid_at?->format('d M Y H:i') ?? '-',
                    ])
                    ->all();
            }
        }

        $hasClaimedTrial = $company !== null
            ? $company->subscriptions()
                ->whereHas('plan', fn ($query) => $query->where('is_trial', true))
                ->exists()
            : false;

        $plans = PricingPlan::query()
            ->where('is_active', true)
            ->orderBy('price')
            ->get()
            ->map(fn (PricingPlan $plan): array => [
                'id' => $plan->id,
                'name' => $plan->name,
                'slug' => $plan->slug,
                'price' => $plan->price,
                'duration_days' => $plan->duration_days,
                'active_jobs_limit' => $plan->active_jobs_limit,
                'recruiter_seat_limit' => $plan->recruiter_seat_limit,
                'ai_screening_quota' => $plan->ai_screening_quota,
                'talent_search_quota' => $plan->talent_search_quota,
                'features' => $plan->normalizedFeatures(),
                'is_trial' => (bool) $plan->is_trial,
                'trial_claimable' => (bool) $plan->is_trial && ! $hasClaimedTrial,
            ])
            ->all();

        return Inertia::render('employer/billing', [
            'activeSubscription' => $activeSubscription,
            'pendingPayment' => $pendingPayment,
            'payments' => $payments,
            'plans' => $plans,
            'hasCompany' => $company !== null,
            'hasClaimedTrial' => $hasClaimedTrial,
        ]);
    }
}
