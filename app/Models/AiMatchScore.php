<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'job_listing_id', 'candidate_id', 'overall_score', 'skill_score', 'experience_score',
    'location_score', 'salary_score', 'industry_score', 'matched_skills', 'missing_skills',
    'explanation', 'model_name', 'scoring_version', 'computed_at',
])]
class AiMatchScore extends Model
{
    public function jobListing(): BelongsTo
    {
        return $this->belongsTo(JobListing::class);
    }

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(CandidateProfile::class, 'candidate_id');
    }

    protected function casts(): array
    {
        return [
            'matched_skills' => 'array',
            'missing_skills' => 'array',
            'computed_at' => 'datetime',
        ];
    }
}
