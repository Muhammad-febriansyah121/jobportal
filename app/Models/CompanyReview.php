<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'company_id', 'candidate_id', 'rating', 'title', 'review', 'status',
    'reviewed_at', 'reviewed_by', 'rejection_reason',
    'employer_reply', 'employer_replied_at', 'employer_replied_by',
    'flag_reason', 'flagged_at', 'flagged_by', 'flag_resolved_at',
])]
class CompanyReview extends Model
{
    protected function casts(): array
    {
        return [
            'reviewed_at' => 'datetime',
            'employer_replied_at' => 'datetime',
            'flagged_at' => 'datetime',
            'flag_resolved_at' => 'datetime',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(CandidateProfile::class, 'candidate_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function employerReplier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'employer_replied_by');
    }

    public function flagger(): BelongsTo
    {
        return $this->belongsTo(User::class, 'flagged_by');
    }
}
