<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'name',
    'slug',
    'description',
    'price',
    'ai_token_amount',
    'cv_builder_quota',
    'features_json',
    'is_default_free',
    'is_active',
])]
class CandidatePricingMenu extends Model
{
    protected function casts(): array
    {
        return [
            'features_json' => 'array',
            'is_default_free' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return array<int, string>
     */
    public function normalizedFeatures(): array
    {
        return collect($this->features_json ?? [])
            ->map(fn (mixed $feature): string => trim((string) $feature))
            ->filter()
            ->values()
            ->all();
    }

    public function walletTransactions(): HasMany
    {
        return $this->hasMany(CandidateWalletTransaction::class);
    }
}
