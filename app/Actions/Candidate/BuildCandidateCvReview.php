<?php

namespace App\Actions\Candidate;

use App\Models\CandidateCertification;
use App\Models\CandidateProfile;
use App\Models\Skill;
use Illuminate\Database\Eloquent\Collection;

class BuildCandidateCvReview
{
    /**
     * @return array<string, mixed>
     */
    public function handle(CandidateProfile $candidate): array
    {
        $candidate->loadMissing(['skills', 'experiences', 'educations', 'certifications', 'preferredIndustry', 'cvs']);

        $skills = $candidate->skills;
        $experiences = $candidate->experiences;
        $educations = $candidate->educations;
        $certifications = $candidate->certifications;

        $totalYears = $this->totalYearsOfExperience($candidate);
        $verifiedSkillCount = $skills->filter(fn ($skill): bool => filled($skill->pivot->verified_at ?? null))->count();
        $hasPrimaryCv = $candidate->cvs->contains(fn ($cv): bool => (bool) ($cv->is_primary ?? false));

        $profileCompletion = (int) ($candidate->profile_completion ?? 0);
        $atsScore = $this->computeAtsScore(
            profileCompletion: $profileCompletion,
            skillCount: $skills->count(),
            verifiedSkills: $verifiedSkillCount,
            experienceCount: $experiences->count(),
            totalYears: $totalYears,
            educationCount: $educations->count(),
            certificationCount: $certifications->count(),
            hasHeadline: filled($candidate->headline),
            hasPreferredRole: filled($candidate->preferred_role),
            hasBio: filled($candidate->bio ?? null),
            hasCv: $hasPrimaryCv,
        );

        $strengths = $this->buildStrengths(
            skills: $skills,
            verifiedSkillCount: $verifiedSkillCount,
            totalYears: $totalYears,
            certifications: $certifications,
            hasHeadline: filled($candidate->headline),
            preferredRole: $candidate->preferred_role,
            preferredIndustry: $candidate->preferredIndustry?->name,
        );

        $gaps = $this->buildGaps(
            skillCount: $skills->count(),
            verifiedSkillCount: $verifiedSkillCount,
            experienceCount: $experiences->count(),
            educationCount: $educations->count(),
            certificationCount: $certifications->count(),
            hasHeadline: filled($candidate->headline),
            hasPreferredRole: filled($candidate->preferred_role),
            hasBio: filled($candidate->bio ?? null),
            hasCv: $hasPrimaryCv,
            profileCompletion: $profileCompletion,
        );

        return [
            'ats_score' => $atsScore,
            'profile_completion' => $profileCompletion,
            'has_primary_cv' => $hasPrimaryCv,
            'stats' => [
                'skills_total' => $skills->count(),
                'skills_verified' => $verifiedSkillCount,
                'experiences_count' => $experiences->count(),
                'years_total_experience' => $totalYears,
                'educations_count' => $educations->count(),
                'certifications_count' => $certifications->count(),
            ],
            'top_skills' => $skills
                ->take(6)
                ->map(fn ($skill): array => [
                    'name' => $skill->name,
                    'years_exp' => $skill->pivot->years_exp ?? null,
                    'verified' => filled($skill->pivot->verified_at ?? null),
                ])
                ->values()
                ->all(),
            'strengths' => $strengths,
            'gaps' => $gaps,
            'preferred_role' => $candidate->preferred_role,
            'preferred_industry' => $candidate->preferredIndustry?->name,
        ];
    }

    private function totalYearsOfExperience(CandidateProfile $candidate): float
    {
        $months = 0.0;
        foreach ($candidate->experiences as $experience) {
            $start = $experience->start_date;
            if (! $start) {
                continue;
            }
            $end = $experience->is_current
                ? now()
                : ($experience->end_date ?? now());
            $diff = $start->diffInMonths($end);
            $months += max(0.0, (float) $diff);
        }

        return round($months / 12, 1);
    }

    private function computeAtsScore(
        int $profileCompletion,
        int $skillCount,
        int $verifiedSkills,
        int $experienceCount,
        float $totalYears,
        int $educationCount,
        int $certificationCount,
        bool $hasHeadline,
        bool $hasPreferredRole,
        bool $hasBio,
        bool $hasCv,
    ): int {
        $score = 30;
        $score += (int) round($profileCompletion * 0.25);
        $score += min(15, $skillCount * 2);
        $score += min(8, $verifiedSkills * 2);
        $score += min(12, $experienceCount * 4);
        $score += min(10, (int) round($totalYears * 1.5));
        $score += min(6, $educationCount * 3);
        $score += min(6, $certificationCount * 2);

        if ($hasHeadline) {
            $score += 3;
        }
        if ($hasPreferredRole) {
            $score += 3;
        }
        if ($hasBio) {
            $score += 3;
        }
        if ($hasCv) {
            $score += 4;
        }

        return max(15, min(100, $score));
    }

    /**
     * @param  Collection<int, Skill>  $skills
     * @param  Collection<int, CandidateCertification>  $certifications
     * @return list<string>
     */
    private function buildStrengths(
        $skills,
        int $verifiedSkillCount,
        float $totalYears,
        $certifications,
        bool $hasHeadline,
        ?string $preferredRole,
        ?string $preferredIndustry,
    ): array {
        $strengths = [];

        if ($skills->count() >= 5) {
            $top = $skills->take(3)->pluck('name')->filter()->implode(', ');
            $strengths[] = "Portofolio skill kuat: {$top}".($skills->count() > 3 ? ' (+'.($skills->count() - 3).' lainnya)' : '');
        }

        if ($verifiedSkillCount >= 1) {
            $strengths[] = "{$verifiedSkillCount} skill sudah terverifikasi — tingkatkan kepercayaan recruiter.";
        }

        if ($totalYears >= 3) {
            $strengths[] = "Pengalaman kerja {$totalYears} tahun memberi sinyal seniority yang relevan.";
        } elseif ($totalYears >= 1) {
            $strengths[] = "Sudah memiliki dasar pengalaman {$totalYears} tahun.";
        }

        if ($certifications->count() > 0) {
            $strengths[] = "{$certifications->count()} sertifikasi tercatat — tunjukkan komitmen belajar.";
        }

        if ($hasHeadline && $preferredRole) {
            $strengths[] = "Headline & preferred role sudah jelas (target: {$preferredRole}".($preferredIndustry ? " · {$preferredIndustry}" : '').').';
        }

        if ($strengths === []) {
            $strengths[] = 'Profil dasar sudah terisi. Lengkapi skill & pengalaman untuk meningkatkan kekuatan CV.';
        }

        return array_slice($strengths, 0, 4);
    }

    /**
     * @return list<string>
     */
    private function buildGaps(
        int $skillCount,
        int $verifiedSkillCount,
        int $experienceCount,
        int $educationCount,
        int $certificationCount,
        bool $hasHeadline,
        bool $hasPreferredRole,
        bool $hasBio,
        bool $hasCv,
        int $profileCompletion,
    ): array {
        $gaps = [];

        if (! $hasCv) {
            $gaps[] = 'Belum ada CV utama yang diunggah/dibuat — gunakan CV Builder agar siap dilamarkan.';
        }
        if (! $hasHeadline) {
            $gaps[] = 'Headline profil belum diisi — recruiter mengandalkan ini sebagai impresi pertama.';
        }
        if (! $hasPreferredRole) {
            $gaps[] = 'Preferred role belum ditentukan — bantu sistem rekomendasi mengarahkan jalur karier yang tepat.';
        }
        if (! $hasBio) {
            $gaps[] = 'Bio/ringkasan diri masih kosong — tambahkan paragraf singkat tentang nilai jual Anda.';
        }
        if ($skillCount < 5) {
            $gaps[] = "Skill baru tercatat {$skillCount} — idealnya minimal 5-8 skill relevan dengan target role.";
        } elseif ($verifiedSkillCount === 0) {
            $gaps[] = 'Belum ada skill yang terverifikasi — ikuti skill assessment untuk validasi level.';
        }
        if ($experienceCount === 0) {
            $gaps[] = 'Belum ada pengalaman kerja tercatat — tambahkan walaupun magang/proyek freelance.';
        }
        if ($educationCount === 0) {
            $gaps[] = 'Riwayat pendidikan belum diisi — tambahkan untuk filter pencarian recruiter.';
        }
        if ($certificationCount === 0) {
            $gaps[] = 'Belum ada sertifikasi tercatat — tambahkan kursus/sertifikat untuk tonjolkan komitmen belajar.';
        }
        if ($profileCompletion < 70) {
            $gaps[] = "Profil baru {$profileCompletion}% lengkap — selesaikan untuk muncul di lebih banyak pencarian.";
        }

        return array_slice($gaps, 0, 5);
    }
}
