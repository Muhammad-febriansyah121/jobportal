<?php

namespace App\Actions\Candidate;

use App\Models\CandidatePricingMenu;
use App\Models\CandidateProfile;
use App\Models\CandidateWalletTransaction;
use Illuminate\Support\Facades\DB;

class CandidateWalletManager
{
    public const FREE_FIRST_DRAFT_SOURCE = 'free_first_draft';

    public const CV_BUILDER_DRAFT_QUOTA_COST = 1;

    public const CV_BUILDER_DRAFT_TOKEN_COST = 500;

    public function ensureFreeQuota(CandidateProfile $candidate): CandidateProfile
    {
        if ($candidate->free_cv_builder_granted_at !== null) {
            return $candidate;
        }

        $defaultFreeMenu = CandidatePricingMenu::query()
            ->where('is_active', true)
            ->where('is_default_free', true)
            ->orderBy('id')
            ->first();

        DB::transaction(function () use ($candidate, $defaultFreeMenu): void {
            $fresh = CandidateProfile::query()
                ->whereKey($candidate->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($fresh->free_cv_builder_granted_at !== null) {
                return;
            }

            CandidateWalletTransaction::create([
                'candidate_id' => $fresh->id,
                'candidate_pricing_menu_id' => $defaultFreeMenu?->id,
                'type' => 'credit',
                'source' => 'free_grant',
                'ai_token_delta' => 0,
                'cv_builder_quota_delta' => 0,
                'amount' => 0,
                'status' => 'success',
                'meta_json' => [
                    'label' => $defaultFreeMenu?->name ?? 'Gratis 1x Generate Draft',
                ],
                'paid_at' => now(),
            ]);

            $fresh->forceFill([
                'free_cv_builder_granted_at' => now(),
            ])->save();
        });

        return $candidate->refresh();
    }

    public function canUseBuilderDraft(CandidateProfile $candidate): bool
    {
        return (int) $candidate->cv_builder_quota_balance >= self::CV_BUILDER_DRAFT_QUOTA_COST
            && (int) $candidate->ai_token_balance >= self::CV_BUILDER_DRAFT_TOKEN_COST;
    }

    public function hasUsedFreeBuilderDraft(CandidateProfile $candidate): bool
    {
        return CandidateWalletTransaction::query()
            ->where('candidate_id', $candidate->id)
            ->where('source', self::FREE_FIRST_DRAFT_SOURCE)
            ->where('status', 'success')
            ->exists();
    }

    public function canUseFreeBuilderDraft(CandidateProfile $candidate): bool
    {
        return ! $this->hasUsedFreeBuilderDraft($candidate);
    }

    public function consumeFreeBuilderDraft(CandidateProfile $candidate): CandidateProfile
    {
        DB::transaction(function () use ($candidate): void {
            $fresh = CandidateProfile::query()
                ->whereKey($candidate->id)
                ->lockForUpdate()
                ->firstOrFail();

            $alreadyUsed = CandidateWalletTransaction::query()
                ->where('candidate_id', $fresh->id)
                ->where('source', self::FREE_FIRST_DRAFT_SOURCE)
                ->where('status', 'success')
                ->exists();

            if ($alreadyUsed) {
                return;
            }

            CandidateWalletTransaction::create([
                'candidate_id' => $fresh->id,
                'type' => 'debit',
                'source' => self::FREE_FIRST_DRAFT_SOURCE,
                'ai_token_delta' => 0,
                'cv_builder_quota_delta' => 0,
                'amount' => 0,
                'status' => 'success',
                'meta_json' => [
                    'label' => 'Gratis 1x generate draft',
                ],
                'paid_at' => now(),
            ]);
        });

        return $candidate->refresh();
    }

    public function consumeBuilderDraftQuota(CandidateProfile $candidate): CandidateProfile
    {
        DB::transaction(function () use ($candidate): void {
            $fresh = CandidateProfile::query()
                ->whereKey($candidate->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (! $this->canUseBuilderDraft($fresh)) {
                return;
            }

            CandidateWalletTransaction::create([
                'candidate_id' => $fresh->id,
                'type' => 'debit',
                'source' => 'cv_builder_draft',
                'ai_token_delta' => -self::CV_BUILDER_DRAFT_TOKEN_COST,
                'cv_builder_quota_delta' => -self::CV_BUILDER_DRAFT_QUOTA_COST,
                'amount' => 0,
                'status' => 'success',
                'meta_json' => [
                    'token_cost' => self::CV_BUILDER_DRAFT_TOKEN_COST,
                    'quota_cost' => self::CV_BUILDER_DRAFT_QUOTA_COST,
                ],
                'paid_at' => now(),
            ]);

            $fresh->forceFill([
                'ai_token_balance' => max(0, (int) $fresh->ai_token_balance - self::CV_BUILDER_DRAFT_TOKEN_COST),
                'cv_builder_quota_balance' => max(0, (int) $fresh->cv_builder_quota_balance - self::CV_BUILDER_DRAFT_QUOTA_COST),
            ])->save();
        });

        return $candidate->refresh();
    }
}
