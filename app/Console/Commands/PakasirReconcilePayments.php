<?php

namespace App\Console\Commands;

use App\Models\Payment;
use App\Models\PricingPlan;
use App\Models\Subscription;
use App\Services\PakasirService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('pakasir:reconcile {--order_id= : Reconcile a single payment by provider_reference} {--minutes=10 : Only check pending payments older than this (default 10 min)} {--dry-run : Print what would change without saving}')]
#[Description('Query Pakasir for pending payments and update local status if completed')]
class PakasirReconcilePayments extends Command
{
    public function handle(PakasirService $pakasir): int
    {
        $query = Payment::query()->where('status', 'pending');

        if ($orderId = $this->option('order_id')) {
            $query->where('provider_reference', $orderId);
        } else {
            $query->where('created_at', '<=', now()->subMinutes((int) $this->option('minutes')));
        }

        $payments = $query->get();

        if ($payments->isEmpty()) {
            $this->info('No pending payments to reconcile.');

            return self::SUCCESS;
        }

        $this->info("Checking {$payments->count()} payment(s) against Pakasir...");

        $updated = 0;

        foreach ($payments as $payment) {
            $detail = $pakasir->checkTransaction(
                (string) $payment->provider_reference,
                (int) $payment->amount,
            );

            $status = strtolower(trim((string) ($detail['transaction']['status'] ?? $detail['status'] ?? '')));
            $completedAt = (string) ($detail['transaction']['completed_at'] ?? $detail['completed_at'] ?? '');

            $this->line("  {$payment->provider_reference} → Pakasir status: ".($status ?: '(empty)'));

            if (! in_array($status, ['completed', 'paid', 'success'], true)) {
                continue;
            }

            if ($this->option('dry-run')) {
                $this->warn("    [DRY-RUN] would mark payment {$payment->id} as paid");

                continue;
            }

            $payment->update([
                'status' => 'paid',
                'paid_at' => $completedAt !== '' ? $completedAt : now(),
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

            $updated++;
            $this->info("    → marked as paid (payment {$payment->id})");
        }

        $this->info("Done. Updated {$updated} payment(s).");

        return self::SUCCESS;
    }
}
