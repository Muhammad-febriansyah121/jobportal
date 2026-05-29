<?php

namespace App\Jobs;

use App\Ai\Agents\AiFitScoreAnalyzer;
use App\Models\Application;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\Middleware\WithoutOverlapping;

class ComputeAiFitScoreJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 2;

    public int $timeout = 60;

    public function __construct(public readonly int $applicationId) {}

    public function middleware(): array
    {
        return [new WithoutOverlapping($this->applicationId)];
    }

    public function handle(): void
    {
        $application = Application::with([
            'jobListing:id,title,experience_level,work_mode',
            'jobListing.skills:id,name',
            'jobListing.industry:id,name',
            'candidate:id,headline,work_mode_pref',
            'candidate.skills:id,name',
            'candidate.experiences:id,candidate_id,job_title,company_name,start_date,end_date,is_current',
            'candidate.preferredIndustry:id,name',
        ])->find($this->applicationId);

        if (! $application) {
            return;
        }

        $job = $application->jobListing;
        $candidate = $application->candidate;

        if (! $job || ! $candidate) {
            return;
        }

        $jobSkills = $job->skills->pluck('name')->join(', ') ?: 'tidak disebutkan';
        $candidateSkills = $candidate->skills->pluck('name')->join(', ') ?: 'tidak ada';

        $experienceSummary = $candidate->experiences
            ->map(fn ($exp): string => "{$exp->job_title} di {$exp->company_name}")
            ->join('; ') ?: 'tidak ada pengalaman';

        $prompt = <<<PROMPT
            LOWONGAN:
            - Judul posisi  : {$job->title}
            - Industri      : {$job->industry?->name}
            - Skills dibutuhkan: {$jobSkills}
            - Experience level : {$job->experience_level}
            - Mode kerja       : {$job->work_mode}

            KANDIDAT:
            - Headline          : {$candidate->headline}
            - Skills            : {$candidateSkills}
            - Pengalaman kerja  : {$experienceSummary}
            - Industri preferensi: {$candidate->preferredIndustry?->name}
            - Preferensi mode kerja: {$candidate->work_mode_pref}
        PROMPT;

        try {
            $response = (new AiFitScoreAnalyzer)->prompt($prompt);

            $application->update([
                'ai_fit_score' => $response['fit_score'],
                'ai_skill_match' => [
                    'matched_skills' => $response['matched_skills'],
                    'missing_skills' => $response['missing_skills'],
                    'skill_score' => $response['skill_score'],
                    'experience_score' => $response['experience_score'],
                    'position_score' => $response['position_score'],
                    'seniority_score' => $response['seniority_score'],
                    'industry_score' => $response['industry_score'],
                    'work_preference_score' => $response['work_preference_score'],
                ],
            ]);
        } catch (\Throwable) {
            // Gagal silent — tidak block lamaran
        }
    }
}
