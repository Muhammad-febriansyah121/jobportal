<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable(['name', 'slug', 'category'])]
class Skill extends Model
{
    public function candidates(): BelongsToMany
    {
        return $this->belongsToMany(CandidateProfile::class, 'candidate_skill', 'skill_id', 'candidate_id')
            ->withPivot(['years_exp', 'proficiency', 'verified_at'])
            ->withTimestamps();
    }

    public function jobListings(): BelongsToMany
    {
        return $this->belongsToMany(JobListing::class, 'job_listing_skill')
            ->withPivot(['is_required', 'min_years'])
            ->withTimestamps();
    }
}
