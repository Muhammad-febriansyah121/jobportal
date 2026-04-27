<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'session_id',
    'actor_user_id',
    'action',
    'scheduled_at',
    'reason',
])]
class AiInterviewRescheduleHistory extends Model
{
    public function session(): BelongsTo
    {
        return $this->belongsTo(AiInterviewSession::class, 'session_id');
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_user_id');
    }

    protected function casts(): array
    {
        return [
            'scheduled_at' => 'datetime',
        ];
    }
}
