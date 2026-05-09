<?php

namespace App\Models;

use Database\Factories\SubIndustryFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['industry_id', 'name', 'slug'])]
class SubIndustry extends Model
{
    /** @use HasFactory<SubIndustryFactory> */
    use HasFactory;

    public function industry(): BelongsTo
    {
        return $this->belongsTo(Industry::class);
    }

    public function salaryInsights(): HasMany
    {
        return $this->hasMany(SalaryInsight::class);
    }
}
