<?php

namespace App\Models;

use Database\Factories\SalaryInsightFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['industry_id', 'sub_industry_id', 'job_title', 'location_city', 'source_name', 'dataset_date', 'salary_min', 'salary_max', 'qualification', 'experience_min_years', 'experience_max_years', 'source_count', 'published_at'])]
class SalaryInsight extends Model
{
    /** @use HasFactory<SalaryInsightFactory> */
    use HasFactory;

    public function industry(): BelongsTo
    {
        return $this->belongsTo(Industry::class);
    }

    public function subIndustry(): BelongsTo
    {
        return $this->belongsTo(SubIndustry::class);
    }

    protected function casts(): array
    {
        return [
            'dataset_date' => 'date',
            'published_at' => 'datetime',
            'experience_min_years' => 'integer',
            'experience_max_years' => 'integer',
        ];
    }
}
