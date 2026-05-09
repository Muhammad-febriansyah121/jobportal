<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'candidate_id',
    'top_industries',
    'top_work_modes',
    'top_job_types',
    'top_skills',
    'inferred_salary_min',
    'inferred_salary_max',
    'intent_strength',
    'last_computed_at',
])]
class CandidateIntentSignal extends Model
{
    protected function casts(): array
    {
        return [
            'top_industries' => 'array',
            'top_work_modes' => 'array',
            'top_job_types' => 'array',
            'top_skills' => 'array',
            'last_computed_at' => 'datetime',
        ];
    }

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(CandidateProfile::class, 'candidate_id');
    }

    /** @return list<int> */
    public function topIndustryIds(int $limit = 3): array
    {
        return collect($this->top_industries ?? [])
            ->sortDesc()
            ->take($limit)
            ->keys()
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    /** @return list<string> */
    public function topWorkModes(int $limit = 2): array
    {
        return collect($this->top_work_modes ?? [])
            ->sortDesc()
            ->take($limit)
            ->keys()
            ->all();
    }
}
