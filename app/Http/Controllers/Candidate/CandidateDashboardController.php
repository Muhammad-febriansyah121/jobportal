<?php

namespace App\Http\Controllers\Candidate;

use App\Actions\Candidate\ResolveCandidateProfile;
use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\CareerResource;
use App\Models\Interview;
use App\Models\JobListing;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CandidateDashboardController extends Controller
{
    public function __invoke(Request $request, ResolveCandidateProfile $resolveCandidateProfile): Response
    {
        $candidate = $resolveCandidateProfile->refreshCompletion(
            $resolveCandidateProfile->handle($request->user())
        )->load(['primaryCv', 'skills:id,name', 'preferredIndustry:id,name']);

        $skillIds = $candidate->skills->pluck('id')->all();
        $pipelineSummary = $candidate->applications()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        return Inertia::render('candidate/dashboard', [
            'profile' => [
                'id' => $candidate->id,
                'full_name' => $candidate->full_name,
                'headline' => $candidate->headline,
                'location' => collect([$candidate->location_city, $candidate->location_province])->filter()->implode(', '),
                'profile_completion' => $candidate->profile_completion,
                'preferred_role' => $candidate->preferred_role,
                'preferred_industry' => $candidate->preferredIndustry?->name,
                'ai_cv_summary' => $candidate->ai_cv_summary,
            ],
            'metrics' => [
                'saved_jobs' => $candidate->savedJobs()->count(),
                'active_applications' => $candidate->applications()->whereNotIn('status', ['hired', 'rejected', 'withdrawn'])->count(),
                'upcoming_interviews' => $this->upcomingInterviewsQuery($candidate->id)->count(),
                'verified_skills' => $candidate->skills()->wherePivotNotNull('verified_at')->count(),
            ],
            'primaryCv' => $candidate->primaryCv ? [
                'id' => $candidate->primaryCv->id,
                'file_url' => $candidate->primaryCv->file_url,
                'uploaded_at' => $candidate->primaryCv->uploaded_at?->format('d M Y'),
            ] : null,
            'recommendedJobs' => JobListing::query()
                ->published()
                ->select(['id', 'company_id', 'title', 'slug', 'location_city', 'location_province', 'work_mode', 'job_type', 'salary_min', 'salary_max', 'is_salary_visible', 'published_at'])
                ->with(['company:id,name,is_verified'])
                ->withCount(['skills as matched_skills_count' => fn (Builder $query) => $query->whereIn('skills.id', $skillIds)])
                ->where(fn (Builder $query) => $query->whereNull('closes_at')->orWhere('closes_at', '>=', now()))
                ->orderByDesc('matched_skills_count')
                ->latest('published_at')
                ->limit(5)
                ->get()
                ->map(fn (JobListing $job): array => $this->jobSummary($job)),
            'savedJobs' => $candidate->savedJobs()
                ->with(['jobListing:id,company_id,title,slug,location_city,location_province,work_mode,job_type,salary_min,salary_max,is_salary_visible,published_at', 'jobListing.company:id,name,is_verified'])
                ->latest()
                ->limit(4)
                ->get()
                ->map(fn ($savedJob): array => $this->jobSummary($savedJob->jobListing)),
            'activeApplications' => Application::query()
                ->select(['id', 'job_listing_id', 'status', 'ai_fit_score', 'applied_at'])
                ->with(['jobListing:id,company_id,title,slug', 'jobListing.company:id,name'])
                ->where('candidate_id', $candidate->id)
                ->latest('applied_at')
                ->limit(5)
                ->get()
                ->map(fn (Application $application): array => [
                    'id' => $application->id,
                    'job_title' => $application->jobListing?->title,
                    'company' => $application->jobListing?->company?->name,
                    'status' => $application->status,
                    'status_label' => $this->statusLabel($application->status),
                    'ai_fit_score' => $application->ai_fit_score,
                    'applied_at' => $application->applied_at?->format('d M Y'),
                ]),
            'applicationTracker' => collect(['applied', 'screened', 'shortlisted', 'interview', 'offer', 'hired', 'rejected', 'withdrawn'])
                ->map(fn (string $status): array => [
                    'status' => $status,
                    'label' => $this->statusLabel($status),
                    'total' => (int) ($pipelineSummary[$status] ?? 0),
                ]),
            'interviews' => $this->upcomingInterviewsQuery($candidate->id)
                ->with(['application.jobListing:id,title,company_id', 'application.jobListing.company:id,name'])
                ->limit(4)
                ->get()
                ->map(fn (Interview $interview): array => [
                    'id' => $interview->id,
                    'job_title' => $interview->application?->jobListing?->title,
                    'company' => $interview->application?->jobListing?->company?->name,
                    'mode' => $interview->mode,
                    'location_url' => $interview->location_url,
                    'scheduled_at' => $interview->scheduled_at?->format('d M Y H:i'),
                    'status' => $interview->status,
                ]),
            'skills' => $candidate->skills
                ->map(fn ($skill): array => [
                    'id' => $skill->id,
                    'name' => $skill->name,
                    'proficiency' => $skill->pivot->proficiency,
                    'years_exp' => $skill->pivot->years_exp,
                    'verified' => filled($skill->pivot->verified_at),
                ]),
            'assessmentSuggestions' => $candidate->skills()
                ->limit(4)
                ->get(['skills.id', 'skills.name'])
                ->map(fn ($skill): array => [
                    'id' => $skill->id,
                    'name' => $skill->name,
                ]),
            'careerTips' => CareerResource::query()
                ->select(['id', 'title', 'type', 'category', 'published_at'])
                ->whereNotNull('published_at')
                ->latest('published_at')
                ->limit(3)
                ->get()
                ->map(fn (CareerResource $resource): array => [
                    'id' => $resource->id,
                    'title' => $resource->title,
                    'type' => $resource->type,
                    'category' => $resource->category,
                    'published_at' => $resource->published_at?->format('d M Y'),
                ]),
        ]);
    }

    private function upcomingInterviewsQuery(int $candidateId): Builder
    {
        return Interview::query()
            ->whereHas('application', fn (Builder $query) => $query->where('candidate_id', $candidateId))
            ->where('scheduled_at', '>=', now())
            ->oldest('scheduled_at');
    }

    private function jobSummary(?JobListing $job): array
    {
        if ($job === null) {
            return [];
        }

        return [
            'id' => $job->id,
            'slug' => $job->slug,
            'title' => $job->title,
            'company' => $job->company?->name,
            'company_verified' => (bool) $job->company?->is_verified,
            'location' => collect([$job->location_city, $job->location_province])->filter()->implode(', '),
            'work_mode' => str($job->work_mode)->headline()->toString(),
            'job_type' => str($job->job_type)->headline()->toString(),
            'salary_range' => $this->salaryRange($job),
            'published_at' => $job->published_at?->format('d M Y'),
        ];
    }

    private function salaryRange(JobListing $job): string
    {
        if (! $job->is_salary_visible || ($job->salary_min === null && $job->salary_max === null)) {
            return 'Salary tidak ditampilkan';
        }

        return collect([$job->salary_min, $job->salary_max])
            ->filter(fn (?int $amount): bool => $amount !== null)
            ->map(fn (int $amount): string => 'Rp'.number_format($amount, 0, ',', '.'))
            ->implode(' - ');
    }

    private function statusLabel(string $status): string
    {
        return [
            'applied' => 'Terkirim',
            'screened' => 'Screening',
            'shortlisted' => 'Shortlist',
            'interview' => 'Interview',
            'offer' => 'Offer',
            'hired' => 'Diterima',
            'rejected' => 'Ditolak',
            'withdrawn' => 'Ditarik',
        ][$status] ?? str($status)->headline()->toString();
    }
}
