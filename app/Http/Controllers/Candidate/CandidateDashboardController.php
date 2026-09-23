<?php

namespace App\Http\Controllers\Candidate;

use App\Actions\Candidate\CandidateWalletManager;
use App\Actions\Candidate\ResolveCandidateProfile;
use App\Http\Controllers\Controller;
use App\Models\AiRecommendation;
use App\Models\Application;
use App\Models\CareerResource;
use App\Models\Interview;
use App\Models\JobListing;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CandidateDashboardController extends Controller
{
    public function __invoke(
        Request $request,
        ResolveCandidateProfile $resolveCandidateProfile,
        CandidateWalletManager $walletManager
    ): Response {
        $candidateProfile = $resolveCandidateProfile->handle($request->user());

        $candidate = $resolveCandidateProfile
            ->refreshCompletion($walletManager->ensureFreeQuota($candidateProfile))
            ->load(['primaryCv', 'skills:id,name', 'preferredIndustry:id,name']);

        $skillIds = $candidate->skills->pluck('id')->all();
        $pipelineSummary = $candidate->applications()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');
        $activeApplications = Application::query()
            ->select(['id', 'job_listing_id', 'scraped_job_id', 'status', 'ai_fit_score', 'applied_at'])
            ->with(['jobListing:id,company_id,title,slug', 'jobListing.company:id,name', 'scrapedJob:id,title,company_name'])
            ->where('candidate_id', $candidate->id)
            ->latest('applied_at')
            ->limit(5)
            ->get()
            ->map(fn (Application $application): array => [
                'id' => $application->id,
                'job_title' => $application->jobListing?->title ?? $application->scrapedJob?->title,
                'company' => $application->jobListing?->company?->name ?? $application->scrapedJob?->company_name,
                'status' => $application->status,
                'status_label' => $this->statusLabel($application->status),
                'ai_fit_score' => $application->ai_fit_score,
                'applied_at' => $application->applied_at?->format('d M Y'),
            ]);
        $skills = $candidate->skills
            ->map(fn ($skill): array => [
                'id' => $skill->id,
                'name' => $skill->name,
                'proficiency' => $skill->pivot->proficiency,
                'years_exp' => $skill->pivot->years_exp,
                'verified' => filled($skill->pivot->verified_at),
            ]);
        $profileCompletionMissing = collect($resolveCandidateProfile->completionChecklist($candidate))
            ->filter(fn (array $item): bool => ! $item['completed'])
            ->values()
            ->map(fn (array $item): array => [
                'key' => $item['key'],
                'label' => $item['label'],
            ])
            ->all();
        $recommendedJobs = $this->recommendedJobs($candidate->id, $skillIds);

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
                'avatar_url' => $request->user()->avatar_url,
                'profile_completion_missing' => $profileCompletionMissing,
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
            'cvBuilder' => [
                'has_free_draft_available' => $walletManager->canUseFreeBuilderDraft($candidate),
                'can_generate_draft' => $walletManager->canUseFreeBuilderDraft($candidate) || $walletManager->canUseBuilderDraft($candidate),
                'ai_token_balance' => (int) $candidate->ai_token_balance,
                'cv_builder_quota_balance' => (int) $candidate->cv_builder_quota_balance,
                'draft_token_cost' => CandidateWalletManager::CV_BUILDER_DRAFT_TOKEN_COST,
                'draft_quota_cost' => CandidateWalletManager::CV_BUILDER_DRAFT_QUOTA_COST,
                'builder_href' => route('candidate.cvs.index'),
                'pricing_href' => route('candidate.pricing.index'),
            ],
            'recommendedJobs' => $recommendedJobs,
            'savedJobs' => $candidate->savedJobs()
                ->with(['jobListing:id,company_id,title,slug,location_city,location_province,work_mode,job_type,salary_min,salary_max,is_salary_visible,published_at', 'jobListing.company:id,name,is_verified'])
                ->latest()
                ->limit(4)
                ->get()
                ->map(fn ($savedJob): array => $this->jobSummary($savedJob->jobListing)),
            'activeApplications' => $activeApplications,
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
            'skills' => $skills,
            'careerTips' => CareerResource::query()
                ->select(['id', 'title', 'type', 'category', 'thumbnail_path', 'published_at'])
                ->whereNotNull('published_at')
                ->latest('published_at')
                ->limit(3)
                ->get()
                ->map(fn (CareerResource $resource): array => [
                    'id' => $resource->id,
                    'title' => $resource->title,
                    'type' => $resource->type,
                    'category' => $resource->category,
                    'thumbnail_url' => $resource->thumbnail_path ? Storage::disk('public')->url($resource->thumbnail_path) : null,
                    'published_at' => $resource->published_at?->format('d M Y'),
                ]),
        ]);
    }

    /**
     * @param  array<int, int>  $skillIds
     */
    private function recommendedJobs(int $candidateId, array $skillIds): Collection
    {
        $aiRecommendations = AiRecommendation::query()
            ->select(['id', 'candidate_id', 'job_listing_id', 'score', 'reason'])
            ->with(['jobListing:id,company_id,title,slug,location_city,location_province,work_mode,job_type,salary_min,salary_max,is_salary_visible,published_at,closes_at,status', 'jobListing.company:id,name,is_verified'])
            ->where('candidate_id', $candidateId)
            ->whereHas('jobListing', fn (Builder $query) => $query
                ->published()
                ->where(fn (Builder $query) => $query->whereNull('closes_at')->orWhere('closes_at', '>=', now())))
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (AiRecommendation $recommendation): array => $this->jobSummary(
                $recommendation->jobListing,
                $recommendation->score,
                $recommendation->reason
            ));

        if ($aiRecommendations->isNotEmpty()) {
            return $aiRecommendations;
        }

        return JobListing::query()
            ->published()
            ->select(['id', 'company_id', 'title', 'slug', 'location_city', 'location_province', 'work_mode', 'job_type', 'salary_min', 'salary_max', 'is_salary_visible', 'published_at'])
            ->with(['company:id,name,is_verified'])
            ->withCount(['skills as matched_skills_count' => fn (Builder $query) => $query->whereIn('skills.id', $skillIds)])
            ->with(['aiMatchScores' => fn ($query) => $query->where('candidate_id', $candidateId)->latest('computed_at')])
            ->where(fn (Builder $query) => $query->whereNull('closes_at')->orWhere('closes_at', '>=', now()))
            ->orderByDesc('matched_skills_count')
            ->latest('published_at')
            ->limit(5)
            ->get()
            ->map(fn (JobListing $job): array => $this->jobSummary(
                $job,
                $job->aiMatchScores->first()?->overall_score,
                $job->aiMatchScores->first()?->explanation
            ));
    }

    private function upcomingInterviewsQuery(int $candidateId): Builder
    {
        return Interview::query()
            ->whereHas('application', fn (Builder $query) => $query->where('candidate_id', $candidateId))
            ->where('scheduled_at', '>=', now())
            ->oldest('scheduled_at');
    }

    private function jobSummary(?JobListing $job, ?int $matchScore = null, ?string $matchReason = null): array
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
            'match_score' => $matchScore,
            'match_reason' => $matchReason,
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
            'screened' => 'Seleksi Awal',
            'shortlisted' => 'Terpilih',
            'interview' => 'Wawancara',
            'offer' => 'Penawaran',
            'hired' => 'Diterima',
            'rejected' => 'Ditolak',
            'withdrawn' => 'Ditarik',
        ][$status] ?? str($status)->headline()->toString();
    }
}
