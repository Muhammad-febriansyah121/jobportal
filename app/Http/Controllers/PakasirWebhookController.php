<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\PricingPlan;
use App\Models\Subscription;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class PakasirWebhookController extends Controller
{
    /**
     * Handle Pakasir payment webhook.
     *
     * Payload:
     * {
     *   "amount": 99000,
     *   "order_id": "INV-1",
     *   "project": "jobportal",
     *   "status": "completed",
     *   "payment_method": "qris",
     *   "completed_at": "2024-09-10T08:07:02.819+07:00"
     * }
     */
    public function handle(Request $request): Response
    {
        $orderId = $request->string('order_id')->toString();
        $status = $request->string('status')->toString();

        if (! $orderId || ! $status) {
            return response()->noContent(422);
        }

        $payment = Payment::where('provider_reference', $orderId)->first();

        if (! $payment) {
            Log::warning('Pakasir webhook: payment not found', ['order_id' => $orderId]);

            return response()->noContent(404);
        }

        if ($status === 'completed' && $payment->status !== 'paid') {
            $payment->update([
                'status' => 'paid',
                'paid_at' => $request->string('completed_at')->toString() ?: now(),
            ]);

            if ($payment->subscription_id) {
                $subscription = Subscription::with('plan')->find($payment->subscription_id);

                if ($subscription) {
                    $startsAt = now();
                    $endsAt = $subscription->plan instanceof PricingPlan && $subscription->plan->duration_days
                        ? $startsAt->copy()->addDays($subscription->plan->duration_days)
                        : null;

                    $subscription->update([
                        'status' => 'active',
                        'starts_at' => $startsAt,
                        'ends_at' => $endsAt,
                    ]);
                }
            }
        }

        return response()->noContent();
    }
}
