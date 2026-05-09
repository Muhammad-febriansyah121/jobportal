<?php

namespace App\Actions\Candidate;

use App\Models\CandidateProfile;
use App\Models\JobListing;

class PredictItJobAcceptance
{
    /**
     * @return array{percentage: int, total_years_experience: float, summary: string}|null
     */
    public function handle(JobListing $jobListing, CandidateProfile $candidate): ?array
    {
        $jobListing->loadMissing(['industry:id,name', 'skills:id,name']);
        $candidate->loadMissing('experiences:id,candidate_id,job_title,start_date,end_date,is_current');

        $totalYearsExperience = $this->totalYearsExperience($candidate);

        if (! $this->isItJob($jobListing) || $totalYearsExperience >= 3 || ! $this->hasAdminBackground($candidate)) {
            return null;
        }

        $percentage = 52;

        if ($totalYearsExperience < 1) {
            $percentage -= 14;
        } elseif ($totalYearsExperience < 2) {
            $percentage -= 10;
        } else {
            $percentage -= 6;
        }

        $percentage -= 10;
        $percentage += min($jobListing->skills->count(), 3) * 2;
        $percentage = max(18, min($percentage, 65));

        return [
            'percentage' => $percentage,
            'total_years_experience' => round($totalYearsExperience, 1),
            'summary' => 'Peluang diterima masih terbuka, tetapi profilmu saat ini lebih dekat ke background administrasi sementara lowongan ini termasuk IT dan pengalamanmu belum mencapai 3 tahun.',
        ];
    }

    private function isItJob(JobListing $jobListing): bool
    {
        $haystacks = [
            mb_strtolower((string) $jobListing->title),
            mb_strtolower((string) $jobListing->description),
            mb_strtolower((string) $jobListing->industry?->name),
            mb_strtolower($jobListing->skills->pluck('name')->implode(' ')),
        ];

        $keywords = [
            'it',
            'teknologi',
            'software',
            'developer',
            'engineer',
            'programmer',
            'frontend',
            'backend',
            'full stack',
            'fullstack',
            'devops',
            'data',
            'cloud',
            'qa',
            'ui/ux',
            'ui ux',
            'security',
            'mobile app',
        ];

        foreach ($haystacks as $haystack) {
            foreach ($keywords as $keyword) {
                if ($keyword === 'it') {
                    if (preg_match('/\bit\b/u', $haystack) === 1) {
                        return true;
                    }

                    continue;
                }

                if (str_contains($haystack, $keyword)) {
                    return true;
                }
            }
        }

        return false;
    }

    private function hasAdminBackground(CandidateProfile $candidate): bool
    {
        $titles = $candidate->experiences
            ->pluck('job_title')
            ->prepend($candidate->headline)
            ->filter()
            ->map(fn ($title) => mb_strtolower((string) $title));

        return $titles->contains(fn (string $title): bool => str_contains($title, 'admin') || str_contains($title, 'administrasi'));
    }

    private function totalYearsExperience(CandidateProfile $candidate): float
    {
        $totalMonths = $candidate->experiences
            ->filter(fn ($experience): bool => $experience->start_date !== null)
            ->sum(function ($experience): int {
                $endDate = $experience->is_current ? now() : ($experience->end_date ?? now());

                return max(0, $experience->start_date->diffInMonths($endDate));
            });

        return $totalMonths / 12;
    }
}
