<?php

namespace App\Actions\Employer;

use App\Models\AiMatchScore;
use App\Models\CandidateProfile;
use App\Models\Company;
use App\Models\JobListing;
use Illuminate\Support\Collection;

class MatchCandidateToCompanyJobs
{
    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function handle(Company $company, CandidateProfile $candidate): Collection
    {
        $candidate->loadMissing(['skills:id,name', 'experiences', 'preferredIndustry:id']);

        $candidateSkillIds = $candidate->skills->pluck('id')->all();
        $totalYears = $this->totalYearsExperience($candidate);

        $jobs = JobListing::query()
            ->whereBelongsTo($company)
            ->where('status', 'published')
            ->where(fn ($query) => $query->whereNull('closes_at')->orWhere('closes_at', '>=', now()))
            ->with([
                'skills:id,name',
                'industry:id,name',
            ])
            ->orderByDesc('published_at')
            ->get();

        $aiScores = AiMatchScore::query()
            ->where('candidate_id', $candidate->id)
            ->whereIn('job_listing_id', $jobs->pluck('id'))
            ->get()
            ->keyBy('job_listing_id');

        return $jobs->map(function (JobListing $job) use ($candidate, $candidateSkillIds, $totalYears, $aiScores): array {
            $required = $job->skills;
            $requiredCount = $required->count();
            $requiredIds = $required->pluck('id')->all();

            $matchedIds = array_values(array_intersect($requiredIds, $candidateSkillIds));
            $missingIds = array_values(array_diff($requiredIds, $candidateSkillIds));
            $matchedSkills = $required->whereIn('id', $matchedIds)->pluck('name')->values()->all();
            $missingSkills = $required->whereIn('id', $missingIds)->pluck('name')->values()->all();

            // Skill match — 35%
            $skillScore = $requiredCount > 0
                ? (count($matchedIds) / $requiredCount) * 35
                : 17.5;

            // Pengalaman kerja — 25%
            $minYears = (int) ($required->max('pivot.min_years') ?? 0);
            $expScore = $minYears > 0
                ? min(25.0, ($totalYears / max(1, $minYears)) * 25)
                : 12.5;

            // Posisi/jabatan — 15% (headline vs job title keyword overlap)
            $positionScore = 7.5;
            $headlineLower = $candidate->headline ? mb_strtolower($candidate->headline) : null;
            if ($headlineLower && $job->title) {
                $jobWords = array_filter(explode(' ', mb_strtolower($job->title)), fn (string $w): bool => mb_strlen($w) > 2);
                $matches = array_filter($jobWords, fn (string $w): bool => str_contains($headlineLower, $w));
                $positionScore = $jobWords !== [] ? min(15.0, (count($matches) / count($jobWords)) * 15) : 7.5;
            }

            // Level senioritas — 10%
            $seniorityScore = match ($job->experience_level) {
                'entry' => $totalYears <= 2 ? 10.0 : ($totalYears <= 4 ? 6.0 : 3.0),
                'mid' => $totalYears >= 2 && $totalYears <= 6 ? 10.0 : ($totalYears < 2 ? 5.0 : 7.0),
                'senior' => $totalYears >= 5 ? 10.0 : ($totalYears >= 3 ? 6.0 : 2.0),
                'lead' => $totalYears >= 7 ? 10.0 : ($totalYears >= 5 ? 6.0 : 2.0),
                default => 5.0,
            };

            // Industri — 5%
            $industryScore = $candidate->preferredIndustry && $job->industry
                && $candidate->preferredIndustry->id === $job->industry->id
                ? 5.0
                : 0.0;

            // Preferensi kerja — 10% (work_mode 5% + salary fit 5%)
            $workModePref = $candidate->work_mode_pref ?? 'any';
            $workModeScore = ($workModePref === 'any' || $workModePref === $job->work_mode) ? 5.0 : 0.0;
            $salaryScore = 0.0;
            if ($candidate->expected_salary_min === null) {
                $salaryScore = 2.5;
            } elseif ($job->salary_max !== null && $job->salary_max >= $candidate->expected_salary_min) {
                $salaryScore = 5.0;
            } elseif ($job->salary_min !== null && $job->salary_min >= $candidate->expected_salary_min * 0.8) {
                $salaryScore = 2.5;
            }

            $computed = (int) round($skillScore + $expScore + $positionScore + $seniorityScore + $industryScore + $workModeScore + $salaryScore);
            $computed = max(15, min(100, $computed));

            $aiScore = $aiScores->get($job->id);
            $finalScore = $aiScore?->overall_score
                ? (int) round((float) $aiScore->overall_score)
                : $computed;

            return [
                'job_id' => $job->id,
                'slug' => $job->slug,
                'title' => $job->title,
                'job_type' => str($job->job_type)->headline()->toString(),
                'work_mode' => str($job->work_mode)->headline()->toString(),
                'experience_level' => str($job->experience_level ?? '')->headline()->toString(),
                'location' => collect([$job->location_city, $job->location_province])->filter()->join(', '),
                'min_years' => $minYears,
                'matched_skills' => $matchedSkills,
                'missing_skills' => $missingSkills,
                'required_skill_count' => $requiredCount,
                'matched_count' => count($matchedIds),
                'match_score' => $finalScore,
                'match_source' => $aiScore ? 'ai' : 'computed',
                'reason' => $aiScore?->explanation,
                'published_at' => $job->published_at?->diffForHumans(),
            ];
        })->sortByDesc('match_score')->values();
    }

    private function totalYearsExperience(CandidateProfile $candidate): float
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

            $months += max(0.0, (float) $start->diffInMonths($end));
        }

        return round($months / 12, 1);
    }
}
