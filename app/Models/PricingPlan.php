<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

#[Fillable([
    'name', 'slug', 'price', 'duration_days', 'active_jobs_limit', 'recruiter_seat_limit',
    'ai_screening_quota', 'talent_search_quota', 'features_json', 'is_active',
])]
class PricingPlan extends Model
{
    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function payments(): HasManyThrough
    {
        return $this->hasManyThrough(Payment::class, Subscription::class);
    }

    protected function casts(): array
    {
        return [
            'features_json' => 'array',
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return array<int, array{label: string, included: bool}>
     */
    public function normalizedFeatures(): array
    {
        return collect($this->features_json ?? [])
            ->map(function ($feature): array {
                if (is_string($feature)) {
                    return ['label' => $feature, 'included' => true];
                }

                return [
                    'label' => (string) ($feature['label'] ?? ''),
                    'included' => (bool) ($feature['included'] ?? true),
                ];
            })
            ->filter(fn (array $feature): bool => $feature['label'] !== '')
            ->values()
            ->all();
    }
}
