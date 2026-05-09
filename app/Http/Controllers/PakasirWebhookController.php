<?php

namespace App\Http\Controllers;

use App\Models\CandidateProfile;
use App\Models\CandidateWalletTransaction;
use App\Models\Payment;
use App\Models\PricingPlan;
use App\Models\Subscription;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PakasirWebhookController extends Controller
{
    public function handle(Request $request): Response
    {
        $orderId = $request->string('order_id')->toString();
        $status = $request->string('status')->toString();

        if (! $orderId || ! $status) {
            return response()->noContent(422);
        }

        $payment = Payment::where('provider_reference', $orderId)->first();
        if ($payment) {
            $this->handleEmployerPayment($payment, $status, $request->string('completed_at')->toString());

            return response()->noContent();
        }

        $candidateTransaction = CandidateWalletTransaction::query()
            ->where('order_id', $orderId)
            ->first();

        if ($candidateTransaction) {
            $this->handleCandidateTransaction(
                $candidateTransaction,
                $status,
                $request->string('completed_at')->toString()
            );

            return response()->noContent();
        }

        Log::warning('Pakasir webhook: transaction not found', ['order_id' => $orderId]);

        return response()->noContent(404);
    }

    private function handleEmployerPayment(Payment $payment, string $status, string $completedAt): void
    {
        if ($status !== 'completed' || $payment->status === 'paid') {
            return;
        }

        $payment->update([
            'status' => 'paid',
            'paid_at' => $completedAt ?: now(),
        ]);

        if (! $payment->subscription_id) {
            return;
        }

        $subscription = Subscription::with('plan')->find($payment->subscription_id);

        if (! $subscription) {
            return;
        }

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

    private function handleCandidateTransaction(
        CandidateWalletTransaction $transaction,
        string $status,
        string $completedAt
    ): void {
        if ($status === 'completed' && $transaction->status !== 'paid') {
            DB::transaction(function () use ($transaction, $completedAt): void {
                $freshTransaction = CandidateWalletTransaction::query()
                    ->whereKey($transaction->id)
                    ->lockForUpdate()
                    ->first();

                if (! $freshTransaction || $freshTransaction->status === 'paid') {
                    return;
                }

                $candidate = CandidateProfile::query()
                    ->whereKey($freshTransaction->candidate_id)
                    ->lockForUpdate()
                    ->first();

                if (! $candidate) {
                    return;
                }

                $validityDays = (int) ($freshTransaction->pricingMenu?->validity_days ?? 0);
                $freshTransaction->update([
                    'status' => 'paid',
                    'paid_at' => $completedAt ?: now(),
                    'expires_at' => $validityDays > 0 ? now()->addDays($validityDays) : null,
                ]);

                $aiInterviewDelta = (int) $freshTransaction->ai_interview_quota_delta;

                $candidate->forceFill([
                    'ai_token_balance' => max(0, (int) $candidate->ai_token_balance + (int) $freshTransaction->ai_token_delta),
                    'cv_builder_quota_balance' => max(0, (int) $candidate->cv_builder_quota_balance + (int) $freshTransaction->cv_builder_quota_delta),
                    'ai_interview_quota_balance' => max(0, (int) $candidate->ai_interview_quota_balance + $aiInterviewDelta),
                    'ai_interview_quota_expires_at' => $aiInterviewDelta > 0 && $validityDays > 0
                        ? now()->addDays($validityDays)
                        : $candidate->ai_interview_quota_expires_at,
                ])->save();
            });

            return;
        }

        if (in_array($status, ['cancelled', 'expired', 'failed'], true) && $transaction->status === 'pending') {
            $transaction->update(['status' => 'failed']);
        }
    }
}
