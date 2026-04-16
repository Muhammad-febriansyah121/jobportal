<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['application_id', 'question', 'category', 'order_number'])]
class AiInterviewQuestion extends Model
{
    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }

    public function responses(): HasMany
    {
        return $this->hasMany(AiInterviewResponse::class, 'question_id');
    }
}
