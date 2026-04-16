<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['job_listing_id', 'question', 'type', 'options_json', 'is_required'])]
class JobScreeningQuestion extends Model
{
    public function jobListing(): BelongsTo
    {
        return $this->belongsTo(JobListing::class);
    }

    protected function casts(): array
    {
        return [
            'options_json' => 'array',
            'is_required' => 'boolean',
        ];
    }
}
