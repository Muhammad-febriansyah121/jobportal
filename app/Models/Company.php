<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'owner_id', 'industry_id', 'name', 'slug', 'logo_url', 'cover_url', 'description',
    'company_size', 'website', 'hq_city', 'hq_province', 'address',
    'is_verified', 'verification_status', 'is_active', 'suspended_at', 'suspension_reason',
    'response_rate', 'median_response_hours', 'trust_score',
])]
class Company extends Model
{
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function industry(): BelongsTo
    {
        return $this->belongsTo(Industry::class);
    }

    public function members(): HasMany
    {
        return $this->hasMany(CompanyMember::class);
    }

    public function verifications(): HasMany
    {
        return $this->hasMany(CompanyVerification::class);
    }

    public function latestVerification(): HasOne
    {
        return $this->hasOne(CompanyVerification::class)->latestOfMany();
    }

    public function badges(): HasMany
    {
        return $this->hasMany(CompanyBadge::class);
    }

    public function offices(): HasMany
    {
        return $this->hasMany(CompanyOffice::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(CompanyReview::class);
    }

    public function jobListings(): HasMany
    {
        return $this->hasMany(JobListing::class);
    }

    public function salaryInsights(): HasMany
    {
        return $this->hasMany(SalaryInsight::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function activeSubscription(): HasOne
    {
        return $this->hasOne(Subscription::class)->where('status', 'active')->latestOfMany();
    }

    protected function casts(): array
    {
        return [
            'is_verified' => 'boolean',
            'is_active' => 'boolean',
            'suspended_at' => 'datetime',
        ];
    }
}
