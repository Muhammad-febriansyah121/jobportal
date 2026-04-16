<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['job_listing_id', 'views_count', 'apply_clicks_count', 'saves_count', 'date'])]
class JobListingAnalytic extends Model
{
    public function jobListing(): BelongsTo
    {
        return $this->belongsTo(JobListing::class);
    }

    protected function casts(): array
    {
        return [
            'date' => 'date',
        ];
    }
}
