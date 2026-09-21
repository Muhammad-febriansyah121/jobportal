<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'source_platform', 'source_job_id', 'source_url',
    'company_name', 'company_logo_url', 'company_website', 'company_profile',
    'title', 'description', 'location', 'employment_type', 'workplace_type',
    'salary_min', 'salary_max', 'salary_currency', 'requirements', 'skills',
    'hr_email', 'email_source', 'email_verified', 'raw_payload', 'scraped_at',
    'imported_at', 'status', 'reviewed_at', 'reviewed_by',
])]
class ScrapedJob extends Model
{
    protected $table = 'tb_jobs_scrap';

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    protected function casts(): array
    {
        return [
            'requirements' => 'array',
            'skills' => 'array',
            'hr_email' => 'encrypted',
            'email_verified' => 'boolean',
            'raw_payload' => 'encrypted:array',
            'scraped_at' => 'datetime',
            'imported_at' => 'datetime',
            'reviewed_at' => 'datetime',
            'salary_min' => 'integer',
            'salary_max' => 'integer',
            'reviewed_by' => 'integer',
        ];
    }
}
