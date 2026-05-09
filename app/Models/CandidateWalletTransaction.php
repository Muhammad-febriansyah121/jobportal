<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'candidate_id',
    'candidate_pricing_menu_id',
    'order_id',
    'type',
    'source',
    'ai_token_delta',
    'cv_builder_quota_delta',
    'ai_interview_quota_delta',
    'amount',
    'status',
    'meta_json',
    'paid_at',
    'expires_at',
])]
class CandidateWalletTransaction extends Model
{
    public function candidate(): BelongsTo
    {
        return $this->belongsTo(CandidateProfile::class, 'candidate_id');
    }

    public function pricingMenu(): BelongsTo
    {
        return $this->belongsTo(CandidatePricingMenu::class, 'candidate_pricing_menu_id');
    }

    protected function casts(): array
    {
        return [
            'meta_json' => 'array',
            'paid_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }
}
