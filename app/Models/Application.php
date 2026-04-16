<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'job_listing_id', 'candidate_id', 'candidate_cv_id', 'status',
    'cover_letter', 'screening_answers_json', 'ai_fit_score', 'ai_skill_match',
    'applied_at', 'first_responded_at',
])]
class Application extends Model
{
    public function jobListing(): BelongsTo
    {
        return $this->belongsTo(JobListing::class);
    }

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(CandidateProfile::class, 'candidate_id');
    }

    public function cv(): BelongsTo
    {
        return $this->belongsTo(CandidateCv::class, 'candidate_cv_id');
    }

    public function statusHistories(): HasMany
    {
        return $this->hasMany(ApplicationStatusHistory::class);
    }

    public function latestStatusHistory(): HasOne
    {
        return $this->hasOne(ApplicationStatusHistory::class)->latestOfMany();
    }

    public function interviews(): HasMany
    {
        return $this->hasMany(Interview::class);
    }

    public function aiInterviewSessions(): HasMany
    {
        return $this->hasMany(AiInterviewSession::class);
    }

    protected function casts(): array
    {
        return [
            'ai_skill_match' => 'array',
            'screening_answers_json' => 'array',
            'applied_at' => 'datetime',
            'first_responded_at' => 'datetime',
        ];
    }
}
