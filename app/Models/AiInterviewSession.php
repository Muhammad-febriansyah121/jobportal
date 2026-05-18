<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'application_id',
    'candidate_id',
    'practice_mode',
    'target_skill',
    'skill_level',
    'drill_format',
    'status',
    'interview_mode',
    'interview_language',
    'scheduled_at',
    'duration_minutes',
    'meeting_url',
    'voice',
    'started_at',
    'completed_at',
    'candidate_confirmed_at',
    'declined_at',
    'reschedule_requested_at',
    'reschedule_proposed_at',
    'reschedule_reason',
    'reschedule_status',
    'reschedule_reviewed_at',
    'reschedule_rejected_reason',
    'recording_url',
    'live_transcript',
    'questions_preparing',
])]
class AiInterviewSession extends Model
{
    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(CandidateProfile::class, 'candidate_id');
    }

    public function responses(): HasMany
    {
        return $this->hasMany(AiInterviewResponse::class, 'session_id');
    }

    public function questions(): HasMany
    {
        return $this->hasMany(AiInterviewQuestion::class, 'session_id');
    }

    public function analysis(): HasOne
    {
        return $this->hasOne(AiInterviewAnalysis::class, 'session_id');
    }

    public function rescheduleHistories(): HasMany
    {
        return $this->hasMany(AiInterviewRescheduleHistory::class, 'session_id');
    }

    public function manualReviews(): HasMany
    {
        return $this->hasMany(AiInterviewManualReview::class, 'ai_interview_session_id');
    }

    protected function casts(): array
    {
        return [
            'scheduled_at' => 'datetime',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'candidate_confirmed_at' => 'datetime',
            'declined_at' => 'datetime',
            'reschedule_requested_at' => 'datetime',
            'reschedule_proposed_at' => 'datetime',
            'reschedule_reviewed_at' => 'datetime',
            'questions_preparing' => 'boolean',
        ];
    }
}
