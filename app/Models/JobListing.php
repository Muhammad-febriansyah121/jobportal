<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'company_id', 'created_by', 'industry_id', 'title', 'slug', 'description',
    'responsibilities', 'required_qualifications', 'preferred_qualifications',
    'location_city', 'location_province', 'work_mode', 'job_type', 'experience_level',
    'salary_min', 'salary_max', 'salary_currency', 'is_salary_visible',
    'status', 'integrity_score', 'response_sla_hours', 'published_at', 'closes_at',
])]
class JobListing extends Model
{
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function industry(): BelongsTo
    {
        return $this->belongsTo(Industry::class);
    }

    public function skills(): BelongsToMany
    {
        return $this->belongsToMany(Skill::class, 'job_listing_skill')
            ->withPivot(['is_required', 'min_years'])
            ->withTimestamps();
    }

    public function screeningQuestions(): HasMany
    {
        return $this->hasMany(JobScreeningQuestion::class);
    }

    public function applications(): HasMany
    {
        return $this->hasMany(Application::class);
    }

    public function analytics(): HasMany
    {
        return $this->hasMany(JobListingAnalytic::class);
    }

    public function aiMatchScores(): HasMany
    {
        return $this->hasMany(AiMatchScore::class);
    }

    public function recommendations(): HasMany
    {
        return $this->hasMany(AiRecommendation::class);
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    protected function casts(): array
    {
        return [
            'is_salary_visible' => 'boolean',
            'published_at' => 'datetime',
            'closes_at' => 'datetime',
        ];
    }
}
