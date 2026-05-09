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
        $candidate->loadMissing(['skills:id,name', 'experiences', 'preferredIndustry']);

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

            $skillScore = $requiredCount > 0
                ? (count($matchedIds) / $requiredCount) * 60
                : 30;

            $minYears = (int) ($required->max('pivot.min_years') ?? 0);
            $expScore = $minYears > 0
                ? min(20, ($totalYears / max(1, $minYears)) * 20)
                : 15;

            $locationScore = 0;
            if ($candidate->location_city && $job->location_city) {
                $locationScore = mb_strtolower($candidate->location_city) === mb_strtolower($job->location_city)
                    ? 10
                    : 4;
            }

            $industryScore = $candidate->preferredIndustry && $job->industry
                && $candidate->preferredIndustry->id === $job->industry->id
                ? 10
                : 0;

            $computed = (int) round($skillScore + $expScore + $locationScore + $industryScore);
            $computed = max(20, min(100, $computed));

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
