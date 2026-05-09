<?php

namespace App\Http\Controllers\Employer;

use App\Actions\Employer\ResolveEmployerCompany;
use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Subscription;
use App\Services\PakasirService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EmployerBillingCancelController extends Controller
{
    public function __invoke(
        Request $request,
        Payment $payment,
        ResolveEmployerCompany $resolveEmployerCompany,
        PakasirService $pakasirService
    ): RedirectResponse {
        $company = $resolveEmployerCompany->handle($request->user());

        abort_unless($company !== null, 403);
        abort_unless($payment->company_id === $company->id, 403);
        abort_unless($payment->status === 'pending', 422, 'Pembayaran tidak bisa dibatalkan.');

        // Best-effort cancel at Pakasir (ignore failures)
        rescue(fn () => $pakasirService->cancelTransaction($payment->provider_reference, $payment->amount));

        $payment->update(['status' => 'failed']);

        if ($payment->subscription_id) {
            Subscription::find($payment->subscription_id)?->update(['status' => 'cancelled']);
        }

        return redirect()->route('employer.billing.index');
    }
}
