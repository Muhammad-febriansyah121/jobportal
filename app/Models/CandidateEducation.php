<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['candidate_id', 'institution', 'degree', 'field_of_study', 'start_year', 'end_year', 'gpa'])]
class CandidateEducation extends Model
{
    protected $table = 'candidate_educations';

    public function candidate(): BelongsTo
    {
        return $this->belongsTo(CandidateProfile::class, 'candidate_id');
    }
}
