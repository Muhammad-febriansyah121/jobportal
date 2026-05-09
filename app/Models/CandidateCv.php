<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['candidate_id', 'file_url', 'parsed_json', 'source', 'is_primary', 'uploaded_at'])]
class CandidateCv extends Model
{
    protected $table = 'candidate_cvs';

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(CandidateProfile::class, 'candidate_id');
    }

    protected function casts(): array
    {
        return [
            'parsed_json' => 'array',
            'is_primary' => 'boolean',
            'uploaded_at' => 'datetime',
        ];
    }
}
