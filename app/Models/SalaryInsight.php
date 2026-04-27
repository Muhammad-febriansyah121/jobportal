<?php

namespace App\Models;

use Database\Factories\SalaryInsightFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['company_id', 'industry_id', 'job_title', 'location_city', 'source_name', 'dataset_date', 'salary_min', 'salary_median', 'salary_max', 'source_count', 'published_at'])]
class SalaryInsight extends Model
{
    /** @use HasFactory<SalaryInsightFactory> */
    use HasFactory;

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function industry(): BelongsTo
    {
        return $this->belongsTo(Industry::class);
    }

    protected function casts(): array
    {
        return [
            'dataset_date' => 'date',
            'published_at' => 'datetime',
        ];
    }
}
