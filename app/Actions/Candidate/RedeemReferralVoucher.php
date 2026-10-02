<?php

namespace App\Actions\Candidate;

use App\Models\CandidateProfile;
use App\Models\CandidateWalletTransaction;
use App\Models\ReferralCode;
use App\Models\ReferralRedemption;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RedeemReferralVoucher
{
    public function handle(CandidateProfile $candidate, string $code): ReferralRedemption
    {
        $normalizedCode = str($code)->trim()->upper()->toString();

        return DB::transaction(function () use ($candidate, $normalizedCode): ReferralRedemption {
            $freshCandidate = CandidateProfile::query()->whereKey($candidate->id)->lockForUpdate()->firstOrFail();
            $voucher = ReferralCode::query()->where('code', $normalizedCode)->lockForUpdate()->first();

            if (! $voucher) {
                throw ValidationException::withMessages(['code' => 'Kode referral tidak ditemukan.']);
            }

            $campaign = $voucher->campaign()->lockForUpdate()->firstOrFail();
            $now = now();

            if (! $voucher->is_active || ! $campaign->is_active || ($campaign->starts_at && $campaign->starts_at->isFuture()) || ($campaign->ends_at && $campaign->ends_at->isPast())) {
                throw ValidationException::withMessages(['code' => 'Kode referral sudah tidak aktif.']);
            }

            if (($campaign->max_redemptions !== null && $campaign->redemptions()->where('status', 'success')->count() >= $campaign->max_redemptions) || ($voucher->max_redemptions !== null && $voucher->redeemed_count >= $voucher->max_redemptions)) {
                throw ValidationException::withMessages(['code' => 'Kuota penggunaan kode referral sudah habis.']);
            }

            if ($voucher->owner_user_id !== null && $voucher->owner_user_id === $freshCandidate->user_id) {
                throw ValidationException::withMessages(['code' => 'Kode referral milik sendiri tidak dapat digunakan.']);
            }

            if ($campaign->redemptions()->where('candidate_id', $freshCandidate->id)->exists()) {
                throw ValidationException::withMessages(['code' => 'Kamu sudah menggunakan referral dari campaign ini.']);
            }

            $expiresAt = $campaign->validity_days > 0 ? $now->copy()->addDays($campaign->validity_days) : null;
            $transaction = CandidateWalletTransaction::create([
                'candidate_id' => $freshCandidate->id,
                'type' => 'credit',
                'source' => 'referral_voucher',
                'ai_token_delta' => $campaign->ai_token_amount,
                'cv_builder_quota_delta' => $campaign->cv_builder_quota,
                'ai_interview_quota_delta' => $campaign->ai_interview_quota,
                'amount' => 0,
                'status' => 'success',
                'order_id' => 'REF-'.$voucher->id.'-'.$freshCandidate->id,
                'meta_json' => ['campaign' => $campaign->name, 'code' => $voucher->code],
                'paid_at' => $now,
                'expires_at' => $expiresAt,
            ]);

            $redemption = ReferralRedemption::create([
                'referral_campaign_id' => $campaign->id,
                'referral_code_id' => $voucher->id,
                'candidate_id' => $freshCandidate->id,
                'wallet_transaction_id' => $transaction->id,
                'status' => 'success',
                'redeemed_at' => $now,
                'expires_at' => $expiresAt,
            ]);

            $voucher->increment('redeemed_count');
            $freshCandidate->forceFill([
                'ai_token_balance' => (int) $freshCandidate->ai_token_balance + $campaign->ai_token_amount,
                'cv_builder_quota_balance' => (int) $freshCandidate->cv_builder_quota_balance + $campaign->cv_builder_quota,
                'ai_interview_quota_balance' => (int) $freshCandidate->ai_interview_quota_balance + $campaign->ai_interview_quota,
                'ai_interview_quota_expires_at' => $campaign->ai_interview_quota > 0 && ($freshCandidate->ai_interview_quota_expires_at === null || $expiresAt?->isAfter($freshCandidate->ai_interview_quota_expires_at)) ? $expiresAt : $freshCandidate->ai_interview_quota_expires_at,
                'cv_builder_quota_expires_at' => $campaign->cv_builder_quota > 0 && ($freshCandidate->cv_builder_quota_expires_at === null || $expiresAt?->isAfter($freshCandidate->cv_builder_quota_expires_at)) ? $expiresAt : $freshCandidate->cv_builder_quota_expires_at,
            ])->save();

            return $redemption;
        }, attempts: 3);
    }
}
