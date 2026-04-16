<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['interview_id', 'reviewer_id', 'overall_score', 'criteria_scores', 'notes'])]
class InterviewScorecard extends Model
{
    public function interview(): BelongsTo
    {
        return $this->belongsTo(Interview::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    protected function casts(): array
    {
        return [
            'criteria_scores' => 'array',
        ];
    }
}
