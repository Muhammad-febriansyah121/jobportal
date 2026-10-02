<?php

namespace App\Actions\Candidate;

use App\Models\CandidateProfile;
use App\Models\ReferralCampaign;
use App\Models\ReferralCode;
use Illuminate\Support\Str;

class EnsureCandidateReferralCode
{
    public function handle(CandidateProfile $candidate): ?ReferralCode
    {
        $campaign = ReferralCampaign::query()
            ->where('is_active', true)
            ->where(function ($query): void {
                $query->whereNull('starts_at')->orWhere('starts_at', '<=', now());
            })
            ->where(function ($query): void {
                $query->whereNull('ends_at')->orWhere('ends_at', '>=', now());
            })
            ->latest('id')
            ->first();

        if (! $campaign) {
            return null;
        }

        $existing = ReferralCode::query()
            ->where('referral_campaign_id', $campaign->id)
            ->where('owner_user_id', $candidate->user_id)
            ->first();

        if ($existing) {
            return $existing;
        }

        do {
            $code = 'KARIVIA-'.Str::upper(Str::random(8));
        } while (ReferralCode::query()->where('code', $code)->exists());

        return ReferralCode::create([
            'referral_campaign_id' => $campaign->id,
            'owner_user_id' => $candidate->user_id,
            'code' => $code,
            'max_redemptions' => $campaign->max_referrals_per_user,
            'is_active' => true,
        ]);
    }
}
