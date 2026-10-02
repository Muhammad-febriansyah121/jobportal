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
        Log::info('Pakasir webhook received', [
            'payload' => $request->all(),
            'headers' => $request->headers->all(),
        ]);

        $orderId = $request->string('order_id')->toString();
        $status = $request->string('status')->toString();

        if (! $orderId || ! $status) {
            Log::warning('Pakasir webhook: missing order_id or status', [
                'order_id' => $orderId,
                'status' => $status,
            ]);

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

    private function isCompletedStatus(string $status): bool
    {
        return in_array(strtolower(trim($status)), ['completed', 'paid', 'success'], true);
    }

    private function handleEmployerPayment(Payment $payment, string $status, string $completedAt): void
    {
        if (! $this->isCompletedStatus($status) || $payment->status === 'paid') {
            Log::info('Pakasir webhook: employer payment skipped', [
                'payment_id' => $payment->id,
                'incoming_status' => $status,
                'current_status' => $payment->status,
            ]);

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
        if ($this->isCompletedStatus($status) && $transaction->status !== 'paid') {
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
                $expiresAt = $validityDays > 0 ? now()->addDays($validityDays) : null;
                $freshTransaction->update([
                    'status' => 'paid',
                    'paid_at' => $completedAt ?: now(),
                    'expires_at' => $expiresAt,
                ]);

                $aiInterviewDelta = (int) $freshTransaction->ai_interview_quota_delta;

                $candidate->forceFill([
                    'ai_token_balance' => max(0, (int) $candidate->ai_token_balance + (int) $freshTransaction->ai_token_delta),
                    'cv_builder_quota_balance' => max(0, (int) $candidate->cv_builder_quota_balance + (int) $freshTransaction->cv_builder_quota_delta),
                    'ai_interview_quota_balance' => max(0, (int) $candidate->ai_interview_quota_balance + $aiInterviewDelta),
                    'ai_interview_quota_expires_at' => $aiInterviewDelta > 0 && $expiresAt !== null && ($candidate->ai_interview_quota_expires_at === null || $expiresAt->isAfter($candidate->ai_interview_quota_expires_at))
                        ? $expiresAt
                        : $candidate->ai_interview_quota_expires_at,
                    'cv_builder_quota_expires_at' => (int) $freshTransaction->cv_builder_quota_delta > 0 && $expiresAt !== null && ($candidate->cv_builder_quota_expires_at === null || $expiresAt->isAfter($candidate->cv_builder_quota_expires_at))
                        ? $expiresAt
                        : $candidate->cv_builder_quota_expires_at,
                ])->save();
            });

            return;
        }

        if (in_array($status, ['cancelled', 'expired', 'failed'], true) && $transaction->status === 'pending') {
            $transaction->update(['status' => 'failed']);
        }
    }
}
