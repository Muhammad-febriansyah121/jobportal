<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'application_id',
    'session_id',
    'question',
    'category',
    'rubric',
    'weight',
    'allow_ai_followup',
    'question_type',
    'options',
    'order_number',
])]
class AiInterviewQuestion extends Model
{
    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(AiInterviewSession::class, 'session_id');
    }

    public function responses(): HasMany
    {
        return $this->hasMany(AiInterviewResponse::class, 'question_id');
    }

    protected function casts(): array
    {
        return [
            'allow_ai_followup' => 'boolean',
            'options' => 'array',
        ];
    }
}
