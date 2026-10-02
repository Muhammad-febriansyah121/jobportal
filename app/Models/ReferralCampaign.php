<?php

namespace App\Models;

use Database\Factories\ReferralCampaignFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'slug', 'description', 'ai_token_amount', 'cv_builder_quota', 'ai_interview_quota', 'validity_days', 'starts_at', 'ends_at', 'max_redemptions', 'is_active'])]
class ReferralCampaign extends Model
{
    /** @use HasFactory<ReferralCampaignFactory> */
    use HasFactory;

    public function codes(): HasMany
    {
        return $this->hasMany(ReferralCode::class);
    }

    public function redemptions(): HasMany
    {
        return $this->hasMany(ReferralRedemption::class);
    }

    protected function casts(): array
    {
        return ['starts_at' => 'datetime', 'ends_at' => 'datetime', 'is_active' => 'boolean'];
    }
}
