<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'job_listing_id', 'platform', 'external_job_id', 'source_url', 'scraped_at',
    'contact_email', 'email_verified', 'payload_json',
])]
class JobListingSource extends Model
{
    public function jobListing(): BelongsTo
    {
        return $this->belongsTo(JobListing::class);
    }

    protected function casts(): array
    {
        return [
            'scraped_at' => 'datetime',
            'contact_email' => 'encrypted',
            'email_verified' => 'boolean',
            'payload_json' => 'encrypted:array',
        ];
    }
}
