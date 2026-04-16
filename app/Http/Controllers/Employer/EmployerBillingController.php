<?php

namespace App\Http\Controllers\Employer;

use App\Actions\Employer\ResolveEmployerCompany;
use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\PricingPlan;
use App\Services\PakasirService;
use Illuminate\Http\Request;
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

                $activeSubscription = [
                    'id' => $sub->id,
                    'plan_name' => $plan?->name ?? '-',
                    'status' => $sub->status,
                    'starts_at' => $sub->starts_at?->format('d M Y'),
                    'ends_at' => $sub->ends_at?->format('d M Y'),
                    'renews_at' => $sub->renews_at?->format('d M Y'),
                    'active_jobs_limit' => $plan?->active_jobs_limit,
                    'recruiter_seat_limit' => $plan?->recruiter_seat_limit,
                    'ai_screening_quota' => $plan?->ai_screening_quota,
                    'talent_search_quota' => $plan?->talent_search_quota,
                    'features' => $plan?->features_json ?? [],
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
                'features' => $plan->features_json ?? [],
            ])
            ->all();

        return Inertia::render('employer/billing', [
            'activeSubscription' => $activeSubscription,
            'pendingPayment' => $pendingPayment,
            'payments' => $payments,
            'plans' => $plans,
            'hasCompany' => $company !== null,
        ]);
    }
}
