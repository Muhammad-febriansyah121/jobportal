<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['user_id', 'headline', 'bio', 'expertise_json', 'rate', 'availability_json', 'is_verified'])]
class MentorProfile extends Model
{
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function mentees(): HasMany
    {
        return $this->hasMany(MentorMentee::class, 'mentor_id');
    }

    protected function casts(): array
    {
        return [
            'expertise_json' => 'array',
            'availability_json' => 'array',
            'is_verified' => 'boolean',
        ];
    }
}
