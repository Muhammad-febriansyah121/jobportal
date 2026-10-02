<?php

namespace App\Models;

use Database\Factories\ReferralRedemptionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['referral_campaign_id', 'referral_code_id', 'candidate_id', 'wallet_transaction_id', 'status', 'redeemed_at', 'expires_at'])]
class ReferralRedemption extends Model
{
    /** @use HasFactory<ReferralRedemptionFactory> */
    use HasFactory;

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(ReferralCampaign::class, 'referral_campaign_id');
    }

    public function code(): BelongsTo
    {
        return $this->belongsTo(ReferralCode::class, 'referral_code_id');
    }

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(CandidateProfile::class, 'candidate_id');
    }

    public function walletTransaction(): BelongsTo
    {
        return $this->belongsTo(CandidateWalletTransaction::class, 'wallet_transaction_id');
    }

    protected function casts(): array
    {
        return ['redeemed_at' => 'datetime', 'expires_at' => 'datetime'];
    }
}
