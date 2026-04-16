<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

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

    protected function casts(): array
    {
        return [
            'features_json' => 'array',
            'is_active' => 'boolean',
        ];
    }
}
