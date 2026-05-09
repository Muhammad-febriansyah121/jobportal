<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'skill_id',
    'question',
    'options_json',
    'correct_option_index',
    'difficulty',
    'source',
    'is_active',
    'created_by',
])]
class AssessmentQuestion extends Model
{
    public function skill(): BelongsTo
    {
        return $this->belongsTo(Skill::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    protected function casts(): array
    {
        return [
            'options_json' => 'array',
            'is_active' => 'boolean',
        ];
    }
}
