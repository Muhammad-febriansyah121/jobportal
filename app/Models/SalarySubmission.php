<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'user_id',
    'industry_id',
    'job_title',
    'company_name',
    'location_city',
    'employment_type',
    'years_experience',
    'monthly_salary',
    'is_anonymous',
    'contributor_name',
    'contributor_email',
    'status',
])]
class SalarySubmission extends Model
{
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function industry(): BelongsTo
    {
        return $this->belongsTo(Industry::class);
    }

    protected function casts(): array
    {
        return [
            'is_anonymous' => 'boolean',
            'years_experience' => 'integer',
            'monthly_salary' => 'integer',
        ];
    }
}
