<?php

namespace App\Http\Controllers\Employer;

use App\Actions\Employer\ResolveEmployerCompany;
use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\PricingPlan;
use App\Models\Subscription;
use App\Services\PakasirService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class EmployerBillingPurchaseController extends Controller
{
    public function __invoke(
        Request $request,
        PricingPlan $pricingPlan,
        ResolveEmployerCompany $resolveEmployerCompany,
        PakasirService $pakasirService
    ): Response {
        $company = $resolveEmployerCompany->handle($request->user());

        abort_unless($company !== null, 403, 'Perusahaan belum disiapkan.');
        abort_unless($pricingPlan->is_active, 404);
        abort_unless($pricingPlan->price > 0, 422, 'Paket gratis tidak memerlukan pembayaran.');

        // Cancel any existing pending subscriptions and their payments
        $company->subscriptions()
            ->where('status', 'pending')
            ->each(function (Subscription $subscription): void {
                $subscription->payments()->where('status', 'pending')->update(['status' => 'failed']);
                $subscription->update(['status' => 'cancelled']);
            });

        $subscription = $company->subscriptions()->create([
            'pricing_plan_id' => $pricingPlan->id,
            'status' => 'pending',
        ]);

        $orderId = 'INV-'.$company->id.'-'.$subscription->id.'-'.time();

        Payment::create([
            'company_id' => $company->id,
            'subscription_id' => $subscription->id,
            'amount' => $pricingPlan->price,
            'status' => 'pending',
            'provider' => 'pakasir',
            'provider_reference' => $orderId,
        ]);

        return Inertia::location($pakasirService->paymentUrl($pricingPlan->price, $orderId));
    }
}
