<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['candidate_id', 'job_listing_id', 'score', 'reason', 'was_clicked', 'was_applied'])]
class AiRecommendation extends Model
{
    public function candidate(): BelongsTo
    {
        return $this->belongsTo(CandidateProfile::class, 'candidate_id');
    }

    public function jobListing(): BelongsTo
    {
        return $this->belongsTo(JobListing::class);
    }

    protected function casts(): array
    {
        return [
            'was_clicked' => 'boolean',
            'was_applied' => 'boolean',
        ];
    }
}
