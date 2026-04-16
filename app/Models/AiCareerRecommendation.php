<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['candidate_id', 'coaching_session_id', 'title', 'match_score', 'recommendation_json'])]
class AiCareerRecommendation extends Model
{
    public function candidate(): BelongsTo
    {
        return $this->belongsTo(CandidateProfile::class, 'candidate_id');
    }

    public function coachingSession(): BelongsTo
    {
        return $this->belongsTo(AiCareerCoachingSession::class, 'coaching_session_id');
    }

    public function learningPathSteps(): HasMany
    {
        return $this->hasMany(LearningPathStep::class, 'career_recommendation_id');
    }

    protected function casts(): array
    {
        return [
            'recommendation_json' => 'array',
        ];
    }
}
