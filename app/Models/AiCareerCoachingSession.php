<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['candidate_id', 'title', 'status'])]
class AiCareerCoachingSession extends Model
{
    public function candidate(): BelongsTo
    {
        return $this->belongsTo(CandidateProfile::class, 'candidate_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(AiCareerCoachingMessage::class, 'session_id');
    }

    public function recommendations(): HasMany
    {
        return $this->hasMany(AiCareerRecommendation::class, 'coaching_session_id');
    }
}
