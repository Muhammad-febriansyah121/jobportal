<?php

namespace App\Http\Controllers\Candidate;

use App\Actions\Candidate\CandidateWalletManager;
use App\Actions\Candidate\ResolveCandidateProfile;
use App\Http\Controllers\Controller;
use App\Models\CandidatePricingMenu;
use App\Models\CandidateWalletTransaction;
use App\Services\PakasirService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class CandidatePricingController extends Controller
{
    public function index(
        Request $request,
        ResolveCandidateProfile $resolveCandidateProfile,
        CandidateWalletManager $walletManager,
        PakasirService $pakasirService
    ): Response {
        $candidate = $walletManager->ensureFreeQuota(
            $resolveCandidateProfile->handle($request->user())
        );

        $menus = CandidatePricingMenu::query()
            ->where('is_active', true)
            ->orderByDesc('is_default_free')
            ->orderBy('price')
            ->get()
            ->map(fn (CandidatePricingMenu $menu): array => [
                'id' => $menu->id,
                'name' => $menu->name,
                'description' => $menu->description,
                'price' => (int) $menu->price,
                'price_label' => 'Rp '.number_format((int) $menu->price, 0, ',', '.'),
                'ai_token_amount' => (int) $menu->ai_token_amount,
                'cv_builder_quota' => (int) $menu->cv_builder_quota,
                'features' => $menu->normalizedFeatures(),
                'is_default_free' => (bool) $menu->is_default_free,
            ])
            ->values();

        $pendingTopup = CandidateWalletTransaction::query()
            ->where('candidate_id', $candidate->id)
            ->where('status', 'pending')
            ->latest('id')
            ->first();

        return Inertia::render('candidate/pricing', [
            'wallet' => [
                'ai_token_balance' => (int) $candidate->ai_token_balance,
                'cv_builder_quota_balance' => (int) $candidate->cv_builder_quota_balance,
                'draft_token_cost' => CandidateWalletManager::CV_BUILDER_DRAFT_TOKEN_COST,
                'draft_quota_cost' => CandidateWalletManager::CV_BUILDER_DRAFT_QUOTA_COST,
            ],
            'menus' => $menus,
            'pendingTopup' => $pendingTopup ? [
                'id' => $pendingTopup->id,
                'order_id' => $pendingTopup->order_id,
                'amount' => (int) $pendingTopup->amount,
                'check_action' => route('candidate.pricing.check', $pendingTopup),
                'payment_url' => $pendingTopup->order_id
                    ? $pakasirService->paymentUrl((int) $pendingTopup->amount, $pendingTopup->order_id)
                    : null,
                'created_at' => $pendingTopup->created_at?->format('d M Y H:i'),
            ] : null,
            'recentTransactions' => CandidateWalletTransaction::query()
                ->where('candidate_id', $candidate->id)
                ->latest('id')
                ->limit(8)
                ->get()
                ->map(fn (CandidateWalletTransaction $transaction): array => [
                    'id' => $transaction->id,
                    'source' => str($transaction->source)->replace('_', ' ')->headline()->toString(),
                    'type' => $transaction->type,
                    'ai_token_delta' => (int) $transaction->ai_token_delta,
                    'cv_builder_quota_delta' => (int) $transaction->cv_builder_quota_delta,
                    'amount' => (int) $transaction->amount,
                    'status' => $transaction->status,
                    'created_at' => $transaction->created_at?->format('d M Y H:i'),
                ])
                ->values(),
        ]);
    }

    public function purchase(
        Request $request,
        CandidatePricingMenu $candidatePricingMenu,
        ResolveCandidateProfile $resolveCandidateProfile,
        CandidateWalletManager $walletManager,
        PakasirService $pakasirService
    ): HttpResponse {
        $candidate = $walletManager->ensureFreeQuota(
            $resolveCandidateProfile->handle($request->user())
        );

        abort_unless($candidatePricingMenu->is_active, 404);
        abort_unless(! $candidatePricingMenu->is_default_free, 422, 'Paket gratis tidak perlu dibeli.');
        abort_unless((int) $candidatePricingMenu->price > 0, 422, 'Harga paket harus lebih dari 0.');

        CandidateWalletTransaction::query()
            ->where('candidate_id', $candidate->id)
            ->where('status', 'pending')
            ->update(['status' => 'failed']);

        $orderId = 'CND-'.$candidate->id.'-'.$candidatePricingMenu->id.'-'.time();

        CandidateWalletTransaction::create([
            'candidate_id' => $candidate->id,
            'candidate_pricing_menu_id' => $candidatePricingMenu->id,
            'order_id' => $orderId,
            'type' => 'credit',
            'source' => 'purchase',
            'ai_token_delta' => (int) $candidatePricingMenu->ai_token_amount,
            'cv_builder_quota_delta' => (int) $candidatePricingMenu->cv_builder_quota,
            'amount' => (int) $candidatePricingMenu->price,
            'status' => 'pending',
            'meta_json' => [
                'menu' => $candidatePricingMenu->name,
            ],
        ]);

        return Inertia::location(
            $pakasirService->paymentUrl((int) $candidatePricingMenu->price, $orderId)
        );
    }

    public function check(
        Request $request,
        CandidateWalletTransaction $candidateWalletTransaction,
        ResolveCandidateProfile $resolveCandidateProfile,
        CandidateWalletManager $walletManager,
        PakasirService $pakasirService
    ): RedirectResponse {
        $candidate = $walletManager->ensureFreeQuota(
            $resolveCandidateProfile->handle($request->user())
        );

        abort_unless($candidateWalletTransaction->candidate_id === $candidate->id, 403);

        if ($candidateWalletTransaction->status !== 'pending') {
            Inertia::flash('toast', [
                'type' => 'warning',
                'message' => 'Transaksi ini tidak lagi pending.',
            ]);

            return back();
        }

        if (! $candidateWalletTransaction->order_id || (int) $candidateWalletTransaction->amount <= 0) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Data transaksi tidak valid untuk pengecekan status.',
            ]);

            return back();
        }

        $payload = rescue(
            fn (): array => $pakasirService->checkTransaction(
                (string) $candidateWalletTransaction->order_id,
                (int) $candidateWalletTransaction->amount
            ),
            null,
            false
        );

        if (! is_array($payload)) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Gagal cek status ke gateway pembayaran. Coba lagi sebentar.',
            ]);

            return back();
        }

        $status = str((string) (
            $payload['status']
            ?? $payload['payment_status']
            ?? $payload['transaction_status']
            ?? ''
        ))->lower()->toString();

        if (in_array($status, ['completed', 'paid', 'success', 'settlement'], true)) {
            DB::transaction(function () use ($candidateWalletTransaction): void {
                $fresh = CandidateWalletTransaction::query()
                    ->whereKey($candidateWalletTransaction->id)
                    ->lockForUpdate()
                    ->first();

                if (! $fresh || $fresh->status !== 'pending') {
                    return;
                }

                $candidate = $fresh->candidate()->lockForUpdate()->first();

                if (! $candidate) {
                    return;
                }

                $fresh->update([
                    'status' => 'paid',
                    'paid_at' => now(),
                ]);

                $candidate->forceFill([
                    'ai_token_balance' => max(0, (int) $candidate->ai_token_balance + (int) $fresh->ai_token_delta),
                    'cv_builder_quota_balance' => max(0, (int) $candidate->cv_builder_quota_balance + (int) $fresh->cv_builder_quota_delta),
                ])->save();
            });

            Inertia::flash('toast', [
                'type' => 'success',
                'message' => 'Pembayaran berhasil. Saldo token dan kuota sudah ditambahkan.',
            ]);

            return back();
        }

        if (in_array($status, ['failed', 'cancelled', 'canceled', 'expired'], true)) {
            $candidateWalletTransaction->update(['status' => 'failed']);

            Inertia::flash('toast', [
                'type' => 'warning',
                'message' => 'Pembayaran belum berhasil. Silakan buat transaksi topup baru.',
            ]);

            return back();
        }

        Inertia::flash('toast', [
            'type' => 'info',
            'message' => 'Pembayaran masih pending. Silakan cek lagi beberapa saat.',
        ]);

        return back();
    }
}
