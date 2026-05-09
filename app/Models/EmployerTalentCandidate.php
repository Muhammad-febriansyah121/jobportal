<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'company_id',
    'candidate_id',
    'saved_at',
    'shortlisted_at',
    'unlocked_at',
    'unlocked_by_user_id',
])]
class EmployerTalentCandidate extends Model
{
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(CandidateProfile::class, 'candidate_id');
    }

    public function unlockedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'unlocked_by_user_id');
    }

    protected function casts(): array
    {
        return [
            'saved_at' => 'datetime',
            'shortlisted_at' => 'datetime',
            'unlocked_at' => 'datetime',
        ];
    }
}
