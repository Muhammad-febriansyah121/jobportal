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

        $hasClaimedTrial = CandidateWalletTransaction::query()
            ->where('candidate_id', $candidate->id)
            ->where('source', 'trial')
            ->exists();

        $menus = CandidatePricingMenu::query()
            ->where('is_active', true)
            ->orderByDesc('is_default_free')
            ->orderByDesc('is_trial')
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
                'ai_interview_quota' => (int) $menu->ai_interview_quota,
                'validity_days' => (int) $menu->validity_days,
                'features' => $menu->normalizedFeatures(),
                'is_default_free' => (bool) $menu->is_default_free,
                'is_trial' => (bool) $menu->is_trial,
                'trial_claimable' => (bool) $menu->is_trial && ! $hasClaimedTrial,
            ])
            ->values();

        $pendingTopup = CandidateWalletTransaction::query()
            ->where('candidate_id', $candidate->id)
            ->where('status', 'pending')
            ->latest('id')
            ->first();

        $latestPaidTopupExpiresAt = CandidateWalletTransaction::query()
            ->where('candidate_id', $candidate->id)
            ->where('status', 'paid')
            ->where('source', 'purchase')
            ->whereNotNull('expires_at')
            ->latest('id')
            ->value('expires_at');

        return Inertia::render('candidate/pricing', [
            'wallet' => [
                'ai_token_balance' => (int) $candidate->ai_token_balance,
                'cv_builder_quota_balance' => (int) $candidate->cv_builder_quota_balance,
                'ai_interview_quota_balance' => (int) $candidate->ai_interview_quota_balance,
                'ai_interview_quota_expires_at' => $candidate->ai_interview_quota_expires_at?->toIso8601String(),
                'cv_builder_quota_expires_at' => $latestPaidTopupExpiresAt?->toIso8601String(),
                'draft_token_cost' => CandidateWalletManager::CV_BUILDER_DRAFT_TOKEN_COST,
                'draft_quota_cost' => CandidateWalletManager::CV_BUILDER_DRAFT_QUOTA_COST,
            ],
            'menus' => $menus,
            'hasClaimedTrial' => $hasClaimedTrial,
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

    public function claimTrial(
        Request $request,
        CandidatePricingMenu $candidatePricingMenu,
        ResolveCandidateProfile $resolveCandidateProfile,
        CandidateWalletManager $walletManager
    ): RedirectResponse {
        $candidate = $walletManager->ensureFreeQuota(
            $resolveCandidateProfile->handle($request->user())
        );

        abort_unless($candidatePricingMenu->is_active, 404);
        abort_unless($candidatePricingMenu->is_trial, 422, 'Paket ini bukan paket trial.');

        $alreadyClaimed = CandidateWalletTransaction::query()
            ->where('candidate_id', $candidate->id)
            ->where('source', 'trial')
            ->exists();

        if ($alreadyClaimed) {
            Inertia::flash('toast', [
                'type' => 'warning',
                'message' => 'Trial sudah pernah diklaim untuk akun ini.',
            ]);

            return back();
        }

        $validityDays = (int) ($candidatePricingMenu->validity_days ?: 7);
        $aiInterviewDelta = (int) $candidatePricingMenu->ai_interview_quota;
        $cvBuilderDelta = (int) $candidatePricingMenu->cv_builder_quota;

        DB::transaction(function () use ($candidate, $candidatePricingMenu, $validityDays, $aiInterviewDelta, $cvBuilderDelta): void {
            CandidateWalletTransaction::create([
                'candidate_id' => $candidate->id,
                'candidate_pricing_menu_id' => $candidatePricingMenu->id,
                'order_id' => 'TRIAL-'.$candidate->id.'-'.$candidatePricingMenu->id.'-'.time(),
                'type' => 'credit',
                'source' => 'trial',
                'ai_token_delta' => 0,
                'cv_builder_quota_delta' => $cvBuilderDelta,
                'ai_interview_quota_delta' => $aiInterviewDelta,
                'amount' => 0,
                'status' => 'paid',
                'paid_at' => now(),
                'expires_at' => now()->addDays($validityDays),
                'meta_json' => [
                    'menu' => $candidatePricingMenu->name,
                    'validity_days' => $validityDays,
                    'is_trial' => true,
                ],
            ]);

            $candidate->forceFill([
                'cv_builder_quota_balance' => max(0, (int) $candidate->cv_builder_quota_balance + $cvBuilderDelta),
                'ai_interview_quota_balance' => max(0, (int) $candidate->ai_interview_quota_balance + $aiInterviewDelta),
                'ai_interview_quota_expires_at' => $aiInterviewDelta > 0
                    ? now()->addDays($validityDays)
                    : $candidate->ai_interview_quota_expires_at,
            ])->save();
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Trial '.$candidatePricingMenu->name.' aktif. Selamat mencoba!',
        ]);

        return back();
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
            'ai_interview_quota_delta' => (int) $candidatePricingMenu->ai_interview_quota,
            'amount' => (int) $candidatePricingMenu->price,
            'status' => 'pending',
            'meta_json' => [
                'menu' => $candidatePricingMenu->name,
                'validity_days' => (int) $candidatePricingMenu->validity_days,
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

                $validityDays = (int) ($fresh->pricingMenu?->validity_days ?? 0);
                $fresh->update([
                    'status' => 'paid',
                    'paid_at' => now(),
                    'expires_at' => $validityDays > 0 ? now()->addDays($validityDays) : null,
                ]);

                $aiInterviewDelta = (int) $fresh->ai_interview_quota_delta;

                $candidate->forceFill([
                    'ai_token_balance' => max(0, (int) $candidate->ai_token_balance + (int) $fresh->ai_token_delta),
                    'cv_builder_quota_balance' => max(0, (int) $candidate->cv_builder_quota_balance + (int) $fresh->cv_builder_quota_delta),
                    'ai_interview_quota_balance' => max(0, (int) $candidate->ai_interview_quota_balance + $aiInterviewDelta),
                    'ai_interview_quota_expires_at' => $aiInterviewDelta > 0 && $validityDays > 0
                        ? now()->addDays($validityDays)
                        : $candidate->ai_interview_quota_expires_at,
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
