<?php

namespace App\Actions\Candidate;

use App\Models\CandidateProfile;
use App\Models\JobListing;

class ComputeRuleBasedFitScore
{
    /**
     * @return array{fit_score: int, matched_skills: string[], missing_skills: string[], skill_score: int, experience_score: int, position_score: int, seniority_score: int, industry_score: int, work_preference_score: int}
     */
    public function handle(JobListing $jobListing, CandidateProfile $candidate): array
    {
        $jobListing->loadMissing(['skills:id,name', 'industry:id,name']);
        $candidate->loadMissing([
            'skills:id,name',
            'experiences:id,candidate_id,start_date,end_date,is_current,job_title',
            'preferredIndustry:id,name',
        ]);

        $requiredSkillIds = $jobListing->skills->pluck('id')->all();
        $candidateSkillIds = $candidate->skills->pluck('id')->all();
        $matchedIds = array_values(array_intersect($requiredSkillIds, $candidateSkillIds));
        $missingIds = array_values(array_diff($requiredSkillIds, $candidateSkillIds));
        $matchedSkills = $jobListing->skills->whereIn('id', $matchedIds)->pluck('name')->values()->all();
        $missingSkills = $jobListing->skills->whereIn('id', $missingIds)->pluck('name')->values()->all();

        $requiredCount = count($requiredSkillIds);

        // 35% — keterampilan
        $skillScore = $requiredCount > 0
            ? (count($matchedIds) / $requiredCount) * 35
            : 17.5;

        // 25% — pengalaman kerja
        $totalYears = $this->totalYearsExperience($candidate);
        $minYears = (int) ($jobListing->skills->max('pivot.min_years') ?? 0);
        $expScore = $minYears > 0
            ? min(25.0, ($totalYears / max(1, $minYears)) * 25)
            : 12.5;

        // 15% — kesesuaian posisi (keyword overlap)
        $positionScore = 7.5;
        $headlineLower = $candidate->headline ? mb_strtolower($candidate->headline) : null;
        if ($headlineLower && $jobListing->title) {
            $jobWords = array_filter(explode(' ', mb_strtolower($jobListing->title)), fn (string $w): bool => mb_strlen($w) > 2);
            $matches = array_filter($jobWords, fn (string $w): bool => str_contains($headlineLower, $w));
            $positionScore = $jobWords !== [] ? min(15.0, (count($matches) / count($jobWords)) * 15) : 7.5;
        }

        // 10% — level senioritas
        $seniorityScore = match ($jobListing->experience_level) {
            'entry' => $totalYears <= 2 ? 10.0 : ($totalYears <= 4 ? 6.0 : 3.0),
            'mid' => $totalYears >= 2 && $totalYears <= 6 ? 10.0 : ($totalYears < 2 ? 5.0 : 7.0),
            'senior' => $totalYears >= 5 ? 10.0 : ($totalYears >= 3 ? 6.0 : 2.0),
            'lead', 'manager' => $totalYears >= 7 ? 10.0 : ($totalYears >= 5 ? 6.0 : 2.0),
            default => 5.0,
        };

        // 5% — kesesuaian industri
        $industryScore = ($candidate->preferredIndustry && $jobListing->industry_id === $candidate->preferredIndustry->id)
            ? 5.0
            : 0.0;

        // 10% — preferensi kerja (work mode 5% + salary fit 5%)
        $workModePref = $candidate->work_mode_pref ?? 'any';
        $workModeScore = ($workModePref === 'any' || $workModePref === $jobListing->work_mode) ? 5.0 : 0.0;
        $salaryScore = 0.0;
        if ($candidate->expected_salary_min === null) {
            $salaryScore = 2.5;
        } elseif ($jobListing->salary_max !== null && $jobListing->salary_max >= $candidate->expected_salary_min) {
            $salaryScore = 5.0;
        } elseif ($jobListing->salary_min !== null && $jobListing->salary_min >= $candidate->expected_salary_min * 0.8) {
            $salaryScore = 2.5;
        }

        $total = $skillScore + $expScore + $positionScore + $seniorityScore + $industryScore + $workModeScore + $salaryScore;
        $fitScore = max(15, min(100, (int) round($total)));

        return [
            'fit_score' => $fitScore,
            'matched_skills' => $matchedSkills,
            'missing_skills' => $missingSkills,
            'skill_score' => $this->percentage($skillScore, 35.0),
            'experience_score' => $this->percentage($expScore, 25.0),
            'position_score' => $this->percentage($positionScore, 15.0),
            'seniority_score' => $this->percentage($seniorityScore, 10.0),
            'industry_score' => $this->percentage($industryScore, 5.0),
            'work_preference_score' => $this->percentage($workModeScore + $salaryScore, 10.0),
        ];
    }

    private function percentage(float $score, float $weight): int
    {
        return max(0, min(100, (int) round(($score / $weight) * 100)));
    }

    private function totalYearsExperience(CandidateProfile $candidate): float
    {
        $totalMonths = $candidate->experiences
            ->filter(fn ($exp): bool => $exp->start_date !== null)
            ->sum(function ($exp): int {
                $endDate = $exp->is_current ? now() : ($exp->end_date ?? now());

                return (int) max(0, $exp->start_date->diffInMonths($endDate));
            });

        return $totalMonths / 12;
    }
}
