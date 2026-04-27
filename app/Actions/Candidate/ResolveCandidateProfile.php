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

        $completion = $this->completionPercentage($candidate);

        $candidate->forceFill([
            'profile_completion' => $completion,
        ])->save();

        if ($completion >= 100) {
            $candidate->loadMissing('user');
            $user = $candidate->user;
            if ($user && $user->onboarding_completed_at === null) {
                $user->forceFill(['onboarding_completed_at' => now()])->save();
            }
        }

        return $candidate->refresh();
    }

    public function completionPercentage(CandidateProfile $candidate): int
    {
        $checks = collect($this->completionChecklist($candidate))
            ->pluck('completed')
            ->all();

        return (int) round((collect($checks)->filter()->count() / count($checks)) * 100);
    }

    /**
     * @return array<int, array{key: string, label: string, completed: bool}>
     */
    public function completionChecklist(CandidateProfile $candidate): array
    {
        $candidate->loadMissing(['cvs', 'educations', 'experiences', 'skills', 'user:id,avatar_url']);

        return [
            ['key' => 'full_name', 'label' => 'Nama lengkap', 'completed' => filled($candidate->full_name)],
            ['key' => 'headline', 'label' => 'Headline profil', 'completed' => filled($candidate->headline)],
            ['key' => 'bio', 'label' => 'Ringkasan profil (bio)', 'completed' => filled($candidate->bio)],
            ['key' => 'location_city', 'label' => 'Kota domisili', 'completed' => filled($candidate->location_city)],
            ['key' => 'location_province', 'label' => 'Provinsi domisili', 'completed' => filled($candidate->location_province)],
            ['key' => 'expected_salary_min', 'label' => 'Ekspektasi gaji minimum', 'completed' => filled($candidate->expected_salary_min)],
            ['key' => 'work_mode_pref', 'label' => 'Preferensi mode kerja', 'completed' => filled($candidate->work_mode_pref)],
            ['key' => 'availability', 'label' => 'Ketersediaan kerja', 'completed' => filled($candidate->availability)],
            ['key' => 'profile_photo', 'label' => 'Foto profil', 'completed' => filled($candidate->user?->avatar_url)],
            ['key' => 'cv', 'label' => 'CV utama', 'completed' => $candidate->cvs->isNotEmpty()],
            ['key' => 'skills', 'label' => 'Minimal 1 skill', 'completed' => $candidate->skills->isNotEmpty()],
            ['key' => 'experiences', 'label' => 'Minimal 1 pengalaman kerja', 'completed' => $candidate->experiences->isNotEmpty()],
            ['key' => 'educations', 'label' => 'Minimal 1 riwayat pendidikan', 'completed' => $candidate->educations->isNotEmpty()],
        ];
    }
}
