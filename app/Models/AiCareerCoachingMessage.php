<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['session_id', 'role', 'content'])]
class AiCareerCoachingMessage extends Model
{
    public function session(): BelongsTo
    {
        return $this->belongsTo(AiCareerCoachingSession::class, 'session_id');
    }
}
