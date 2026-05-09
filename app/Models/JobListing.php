<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'company_id', 'created_by', 'industry_id', 'title', 'slug', 'description',
    'responsibilities', 'required_qualifications', 'preferred_qualifications', 'benefits',
    'location_city', 'location_province', 'work_mode', 'job_type', 'experience_level',
    'qualification', 'experience_min_years', 'experience_max_years',
    'salary_min', 'salary_max', 'salary_currency', 'is_salary_visible', 'is_anonymous',
    'is_urgent',
    'status', 'integrity_score', 'response_sla_hours', 'published_at', 'closes_at',
])]
class JobListing extends Model
{
    public const FEW_APPLICANTS_THRESHOLD = 5;

    public const FEW_APPLICANTS_DAYS_WINDOW = 7;

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
            'company_id' => 'integer',
            'created_by' => 'integer',
            'industry_id' => 'integer',
            'is_salary_visible' => 'boolean',
            'is_anonymous' => 'boolean',
            'is_urgent' => 'boolean',
            'salary_min' => 'integer',
            'salary_max' => 'integer',
            'experience_min_years' => 'integer',
            'experience_max_years' => 'integer',
            'response_sla_hours' => 'integer',
            'published_at' => 'datetime',
            'closes_at' => 'datetime',
        ];
    }

    /**
     * Lowongan dianggap "Pelamar Masih Sedikit" kalau ditayangkan dalam
     * FEW_APPLICANTS_DAYS_WINDOW hari terakhir DAN total lamarannya masih
     * di bawah FEW_APPLICANTS_THRESHOLD.
     */
    protected function isFewApplicants(): Attribute
    {
        return Attribute::make(
            get: function (): bool {
                if ($this->status !== 'published') {
                    return false;
                }

                $publishedAt = $this->published_at ?? $this->created_at;
                if ($publishedAt === null) {
                    return false;
                }

                if ($publishedAt->diffInDays(now()) > self::FEW_APPLICANTS_DAYS_WINDOW) {
                    return false;
                }

                $count = (int) ($this->applications_count
                    ?? $this->applications()->count());

                return $count < self::FEW_APPLICANTS_THRESHOLD;
            },
        );
    }
}
