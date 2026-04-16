<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['career_recommendation_id', 'title', 'description', 'order_number', 'status'])]
class LearningPathStep extends Model
{
    public function careerRecommendation(): BelongsTo
    {
        return $this->belongsTo(AiCareerRecommendation::class, 'career_recommendation_id');
    }
}
