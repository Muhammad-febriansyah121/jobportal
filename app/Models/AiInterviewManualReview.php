<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'ai_interview_session_id',
    'reviewer_id',
    'rating',
    'decision',
    'notes',
])]
class AiInterviewManualReview extends Model
{
    public const DECISIONS = ['hire', 'maybe', 'reject'];

    public function session(): BelongsTo
    {
        return $this->belongsTo(AiInterviewSession::class, 'ai_interview_session_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    protected function casts(): array
    {
        return [
            'rating' => 'integer',
        ];
    }
}
