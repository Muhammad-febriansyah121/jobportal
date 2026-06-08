<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['session_id', 'fit_score', 'recommendation', 'summary', 'strengths', 'weaknesses', 'technical_scorecard', 'competency_scores', 'improvement_tips'])]
class AiInterviewAnalysis extends Model
{
    public function session(): BelongsTo
    {
        return $this->belongsTo(AiInterviewSession::class, 'session_id');
    }

    protected function casts(): array
    {
        return [
            'strengths' => 'array',
            'weaknesses' => 'array',
            'technical_scorecard' => 'array',
            'competency_scores' => 'array',
            'improvement_tips' => 'array',
        ];
    }
}
