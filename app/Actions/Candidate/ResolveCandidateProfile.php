<?php

namespace App\Actions\Candidate;

use App\Models\CandidateProfile;
use App\Models\User;

class ResolveCandidateProfile
{
    public function handle(User $user): CandidateProfile
    {
        return $user->candidateProfile()->firstOrCreate(
            ['user_id' => $user->id],
            [
                'full_name' => $user->name,
                'work_mode_pref' => 'any',
            ]
        );
    }

    public function refreshCompletion(CandidateProfile $candidate): CandidateProfile
    {
        $candidate->loadMissing(['cvs', 'educations', 'experiences', 'skills']);

        $candidate->forceFill([
            'profile_completion' => $this->completionPercentage($candidate),
        ])->save();

        return $candidate->refresh();
    }

    public function completionPercentage(CandidateProfile $candidate): int
    {
        $candidate->loadMissing(['cvs', 'educations', 'experiences', 'skills']);

        $checks = [
            filled($candidate->full_name),
            filled($candidate->headline),
            filled($candidate->bio),
            filled($candidate->location_city),
            filled($candidate->location_province),
            filled($candidate->expected_salary_min),
            filled($candidate->work_mode_pref),
            filled($candidate->availability),
            $candidate->cvs->isNotEmpty(),
            $candidate->skills->isNotEmpty(),
            $candidate->experiences->isNotEmpty(),
            $candidate->educations->isNotEmpty(),
        ];

        return (int) round((collect($checks)->filter()->count() / count($checks)) * 100);
    }
}
