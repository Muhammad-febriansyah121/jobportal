<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['session_id', 'question_id', 'answer_text', 'ai_score', 'ai_analysis'])]
class AiInterviewResponse extends Model
{
    public function session(): BelongsTo
    {
        return $this->belongsTo(AiInterviewSession::class, 'session_id');
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(AiInterviewQuestion::class, 'question_id');
    }
}
