<?php

namespace App\Jobs;

use App\Models\CandidateIntentSignal;
use App\Models\CandidateJobView;
use App\Models\CandidateProfile;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Collection;

class ComputeCandidateIntentJob implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public function __construct(public readonly CandidateProfile $candidate) {}

    public function uniqueId(): int
    {
        return $this->candidate->id;
    }

    public function handle(): void
    {
        $signals = $this->collectSignals();

        if ($signals->isEmpty()) {
            return;
        }

        $industries = [];
        $workModes = [];
        $jobTypes = [];
        $skills = [];
        $salaryMins = [];
        $salaryMaxes = [];

        foreach ($signals as $signal) {
            $job = $signal['job'];
            $weight = $signal['weight'];

            if ($job->industry_id !== null) {
                $key = (string) $job->industry_id;
                $industries[$key] = ($industries[$key] ?? 0) + $weight;
            }

            if ($job->work_mode !== null) {
                $workModes[$job->work_mode] = ($workModes[$job->work_mode] ?? 0) + $weight;
            }

            if ($job->job_type !== null) {
                $jobTypes[$job->job_type] = ($jobTypes[$job->job_type] ?? 0) + $weight;
            }

            foreach ($job->skills as $skill) {
                $key = (string) $skill->id;
                $skills[$key] = ($skills[$key] ?? 0) + $weight;
            }

            if ($job->salary_min !== null) {
                $salaryMins[] = $job->salary_min;
            }

            if ($job->salary_max !== null) {
                $salaryMaxes[] = $job->salary_max;
            }
        }

        $totalInteractions = $signals->count();
        $intentStrength = min(100, $totalInteractions * 10);

        CandidateIntentSignal::updateOrCreate(
            ['candidate_id' => $this->candidate->id],
            [
                'top_industries' => $industries,
                'top_work_modes' => $workModes,
                'top_job_types' => $jobTypes,
                'top_skills' => $skills,
                'inferred_salary_min' => $salaryMins !== [] ? (int) (array_sum($salaryMins) / count($salaryMins)) : null,
                'inferred_salary_max' => $salaryMaxes !== [] ? (int) (array_sum($salaryMaxes) / count($salaryMaxes)) : null,
                'intent_strength' => $intentStrength,
                'last_computed_at' => now(),
            ]
        );
    }

    private function collectSignals(): Collection
    {
        $jobRelations = ['skills:id', 'industry:id'];
        $signals = collect();

        $applications = $this->candidate->applications()
            ->with(['jobListing' => fn ($q) => $q->with($jobRelations)->select(['id', 'industry_id', 'work_mode', 'job_type', 'salary_min', 'salary_max'])])
            ->select(['id', 'job_listing_id'])
            ->latest('applied_at')
            ->limit(50)
            ->get();

        foreach ($applications as $application) {
            if ($application->jobListing !== null) {
                $signals->push(['job' => $application->jobListing, 'weight' => 5]);
            }
        }

        $savedJobs = $this->candidate->savedJobs()
            ->with(['jobListing' => fn ($q) => $q->with($jobRelations)->select(['id', 'industry_id', 'work_mode', 'job_type', 'salary_min', 'salary_max'])])
            ->select(['id', 'job_listing_id'])
            ->latest()
            ->limit(50)
            ->get();

        foreach ($savedJobs as $saved) {
            if ($saved->jobListing !== null) {
                $signals->push(['job' => $saved->jobListing, 'weight' => 3]);
            }
        }

        $views = CandidateJobView::query()
            ->with(['jobListing' => fn ($q) => $q->with($jobRelations)->select(['id', 'industry_id', 'work_mode', 'job_type', 'salary_min', 'salary_max'])])
            ->where('candidate_id', $this->candidate->id)
            ->orderByDesc('last_viewed_at')
            ->limit(100)
            ->get();

        foreach ($views as $view) {
            if ($view->jobListing !== null) {
                $weight = $view->view_count >= 3 ? 2 : 1;
                $signals->push(['job' => $view->jobListing, 'weight' => $weight]);
            }
        }

        return $signals;
    }
}
