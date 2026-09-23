<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'job_listing_id', 'scraped_job_id', 'candidate_id', 'candidate_cv_id', 'status',
    'cover_letter', 'screening_answers_json', 'ai_fit_score', 'ai_skill_match',
    'applied_at', 'first_responded_at', 'recipient_email', 'email_status',
    'email_sent_at', 'email_failed_at', 'email_failure_reason',
])]
class Application extends Model
{
    public function jobListing(): BelongsTo
    {
        return $this->belongsTo(JobListing::class);
    }

    public function scrapedJob(): BelongsTo
    {
        return $this->belongsTo(ScrapedJob::class);
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

    public function latestAiInterviewSession(): HasOne
    {
        return $this->hasOne(AiInterviewSession::class)->ofMany(
            ['id' => 'max'],
            fn ($q) => $q->whereNotNull('scheduled_at'),
        );
    }

    protected function casts(): array
    {
        return [
            'ai_skill_match' => 'array',
            'screening_answers_json' => 'array',
            'applied_at' => 'datetime',
            'first_responded_at' => 'datetime',
            'recipient_email' => 'encrypted',
            'email_sent_at' => 'datetime',
            'email_failed_at' => 'datetime',
        ];
    }
}
