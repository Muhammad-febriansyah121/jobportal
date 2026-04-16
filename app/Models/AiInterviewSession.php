<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable(['application_id', 'candidate_id', 'status', 'started_at', 'completed_at'])]
class AiInterviewSession extends Model
{
    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(CandidateProfile::class, 'candidate_id');
    }

    public function responses(): HasMany
    {
        return $this->hasMany(AiInterviewResponse::class, 'session_id');
    }

    public function analysis(): HasOne
    {
        return $this->hasOne(AiInterviewAnalysis::class, 'session_id');
    }

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }
}
