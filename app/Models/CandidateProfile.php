<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'user_id', 'full_name', 'headline', 'bio', 'location_city', 'location_province',
    'expected_salary_min', 'expected_salary_max', 'work_mode_pref', 'availability',
    'preferred_industry_id', 'preferred_role', 'profile_completion', 'ai_cv_summary',
    'linkedin_url', 'github_url', 'portfolio_url',
])]
class CandidateProfile extends Model
{
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function preferredIndustry(): BelongsTo
    {
        return $this->belongsTo(Industry::class, 'preferred_industry_id');
    }

    public function cvs(): HasMany
    {
        return $this->hasMany(CandidateCv::class, 'candidate_id');
    }

    public function primaryCv(): HasOne
    {
        return $this->hasOne(CandidateCv::class, 'candidate_id')->where('is_primary', true);
    }

    public function experiences(): HasMany
    {
        return $this->hasMany(CandidateExperience::class, 'candidate_id');
    }

    public function educations(): HasMany
    {
        return $this->hasMany(CandidateEducation::class, 'candidate_id');
    }

    public function certifications(): HasMany
    {
        return $this->hasMany(CandidateCertification::class, 'candidate_id');
    }

    public function skills(): BelongsToMany
    {
        return $this->belongsToMany(Skill::class, 'candidate_skill', 'candidate_id', 'skill_id')
            ->withPivot(['years_exp', 'proficiency', 'verified_at'])
            ->withTimestamps();
    }

    public function skillAssessments(): HasMany
    {
        return $this->hasMany(SkillAssessment::class, 'candidate_id');
    }

    public function applications(): HasMany
    {
        return $this->hasMany(Application::class, 'candidate_id');
    }

    public function savedJobs(): HasMany
    {
        return $this->hasMany(SavedJob::class, 'candidate_id');
    }

    public function aiMatchScores(): HasMany
    {
        return $this->hasMany(AiMatchScore::class, 'candidate_id');
    }

    public function recommendations(): HasMany
    {
        return $this->hasMany(AiRecommendation::class, 'candidate_id');
    }

    public function aiInterviewSessions(): HasMany
    {
        return $this->hasMany(AiInterviewSession::class, 'candidate_id');
    }

    public function careerCoachingSessions(): HasMany
    {
        return $this->hasMany(AiCareerCoachingSession::class, 'candidate_id');
    }

    public function mentorships(): HasMany
    {
        return $this->hasMany(MentorMentee::class, 'candidate_id');
    }
}
