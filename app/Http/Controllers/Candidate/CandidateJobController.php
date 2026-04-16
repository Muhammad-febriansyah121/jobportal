<?php

namespace App\Http\Controllers\Candidate;

use App\Actions\Candidate\RecordCandidateJobView;
use App\Actions\Candidate\ResolveCandidateProfile;
use App\Http\Controllers\Controller;
use App\Models\AiMatchScore;
use App\Models\CandidateIntentSignal;
use App\Models\Industry;
use App\Models\JobListing;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CandidateJobController extends Controller
{
    public function index(Request $request, ResolveCandidateProfile $resolveCandidateProfile): Response
    {
        $candidate = $resolveCandidateProfile->handle($request->user())->load(['skills:id', 'intentSignal']);
        $skillIds = $candidate->skills->pluck('id')->all();
        $activeTab = $request->string('tab', 'recommended')->toString();

        /** @var CandidateIntentSignal|null $intentSignal */
        $intentSignal = $candidate->intentSignal;
        $hasIntentData = $intentSignal !== null && $intentSignal->intent_strength > 0;

        $jobs = JobListing::query()
            ->published()
            ->select(['id', 'company_id', 'industry_id', 'title', 'slug', 'description', 'location_city', 'location_province', 'work_mode', 'job_type', 'experience_level', 'salary_min', 'salary_max', 'is_salary_visible', 'integrity_score', 'published_at', 'closes_at'])
            ->with(['company:id,name,is_verified,trust_score', 'industry:id,name', 'skills:id,name'])
            ->withCount(['skills as matched_skills_count' => fn (Builder $query) => $query->whereIn('skills.id', $skillIds)])
            ->where(fn (Builder $query) => $query->whereNull('closes_at')->orWhere('closes_at', '>=', now()))
            ->when($activeTab === 'remote', fn (Builder $query) => $query->where('work_mode', 'remote'))
            ->when($activeTab === 'salary-transparent', fn (Builder $query) => $query->where('is_salary_visible', true))
            ->when($request->filled('search'), function (Builder $query) use ($request): void {
                $search = $request->string('search')->toString();

                $query->where(function (Builder $query) use ($search): void {
                    $query->where('title', 'like', '%'.$search.'%')
                        ->orWhere('description', 'like', '%'.$search.'%')
                        ->orWhereHas('company', fn (Builder $query) => $query->where('name', 'like', '%'.$search.'%'))
                        ->orWhereHas('skills', fn (Builder $query) => $query->where('name', 'like', '%'.$search.'%'));
                });
            })
            ->when($request->filled('location'), function (Builder $query) use ($request): void {
                $location = $request->string('location')->toString();

                $query->where(function (Builder $query) use ($location): void {
                    $query->where('location_city', 'like', '%'.$location.'%')
                        ->orWhere('location_province', 'like', '%'.$location.'%');
                });
            })
            ->when($request->filled('work_mode'), fn (Builder $query) => $query->where('work_mode', $request->string('work_mode')->toString()))
            ->when($request->filled('job_type'), fn (Builder $query) => $query->where('job_type', $request->string('job_type')->toString()))
            ->when($request->filled('experience_level'), fn (Builder $query) => $query->where('experience_level', $request->string('experience_level')->toString()))
            ->when($request->filled('industry_id'), fn (Builder $query) => $query->where('industry_id', $request->integer('industry_id')))
            ->when($request->filled('salary_min'), fn (Builder $query) => $query->where('salary_max', '>=', $request->integer('salary_min')))
            ->when($request->boolean('verified_company'), fn (Builder $query) => $query->whereHas('company', fn (Builder $query) => $query->where('is_verified', true)))
            ->when($request->boolean('skill_match') && $skillIds !== [], fn (Builder $query) => $query->whereHas('skills', fn (Builder $query) => $query->whereIn('skills.id', $skillIds)))
            ->when(
                in_array($activeTab, ['recommended', 'skill-match'], true),
                function (Builder $query) use ($activeTab, $hasIntentData, $intentSignal): void {
                    if ($activeTab === 'recommended' && $hasIntentData) {
                        $industryIds = $intentSignal->topIndustryIds();
                        $workModes = $intentSignal->topWorkModes();

                        $industryPlaceholders = $industryIds !== [] ? implode(',', array_fill(0, count($industryIds), '?')) : 'NULL';
                        $workModePlaceholders = $workModes !== [] ? implode(',', array_fill(0, count($workModes), '?')) : "'__none__'";

                        $bindings = array_merge($industryIds, $workModes);

                        $query->orderByRaw(
                            "(matched_skills_count + CASE WHEN industry_id IN ({$industryPlaceholders}) THEN 3 ELSE 0 END + CASE WHEN work_mode IN ({$workModePlaceholders}) THEN 2 ELSE 0 END) DESC",
                            $bindings
                        );
                    } else {
                        $query->orderByDesc('matched_skills_count');
                    }
                },
                fn (Builder $query) => $query->latest('published_at')
            )
            ->paginate(12)
            ->withQueryString();

        $jobIds = collect($jobs->items())->pluck('id');
        $savedJobIds = $candidate->savedJobs()->whereIn('job_listing_id', $jobIds)->pluck('job_listing_id');
        $appliedJobIds = $candidate->applications()->whereIn('job_listing_id', $jobIds)->pluck('job_listing_id');
        $matchScores = AiMatchScore::query()
            ->where('candidate_id', $candidate->id)
            ->whereIn('job_listing_id', $jobIds)
            ->get()
            ->keyBy('job_listing_id');

        return Inertia::render('candidate/jobs/index', [
            'filters' => [
                'tab' => $activeTab,
                'search' => $request->string('search')->toString(),
                'location' => $request->string('location')->toString(),
                'work_mode' => $request->string('work_mode')->toString(),
                'job_type' => $request->string('job_type')->toString(),
                'experience_level' => $request->string('experience_level')->toString(),
                'industry_id' => $request->string('industry_id')->toString(),
                'salary_min' => $request->string('salary_min')->toString(),
                'verified_company' => $request->boolean('verified_company'),
                'skill_match' => $request->boolean('skill_match'),
            ],
            'has_intent_data' => $hasIntentData,
            'industries' => $this->industries(),
            'jobs' => $jobs->through(fn (JobListing $job): array => $this->jobCard(
                $job,
                $savedJobIds->contains($job->id),
                $appliedJobIds->contains($job->id),
                $matchScores->get($job->id)
            )),
        ]);
    }

    public function show(Request $request, JobListing $jobListing, ResolveCandidateProfile $resolveCandidateProfile, RecordCandidateJobView $recordCandidateJobView): Response
    {
        abort_unless($jobListing->status === 'published', 404);

        $candidate = $resolveCandidateProfile->handle($request->user());
        $recordCandidateJobView->handle($candidate, $jobListing);
        $jobListing->load(['company:id,name,description,is_verified,trust_score,response_rate,median_response_hours', 'industry:id,name', 'skills:id,name', 'screeningQuestions']);

        $matchScore = AiMatchScore::query()
            ->where('candidate_id', $candidate->id)
            ->where('job_listing_id', $jobListing->id)
            ->first();

        return Inertia::render('candidate/jobs/show', [
            'job' => [
                ...$this->jobCard(
                    $jobListing,
                    $candidate->savedJobs()->where('job_listing_id', $jobListing->id)->exists(),
                    $candidate->applications()->where('job_listing_id', $jobListing->id)->exists(),
                    $matchScore
                ),
                'description' => $jobListing->description,
                'responsibilities' => $jobListing->responsibilities,
                'required_qualifications' => $jobListing->required_qualifications,
                'preferred_qualifications' => $jobListing->preferred_qualifications,
                'experience_level' => str($jobListing->experience_level)->headline()->toString(),
                'integrity_score' => $jobListing->integrity_score,
                'company_description' => $jobListing->company?->description,
                'company_trust_score' => $jobListing->company?->trust_score,
                'company_response_rate' => $jobListing->company?->response_rate,
                'company_median_response_hours' => $jobListing->company?->median_response_hours,
                'matched_skills' => $matchScore?->matched_skills ?? [],
                'missing_skills' => $matchScore?->missing_skills ?? [],
                'screening_questions' => $jobListing->screeningQuestions
                    ->map(fn ($question): array => [
                        'id' => $question->id,
                        'question' => $question->question,
                        'type' => $question->type,
                        'options' => $question->options_json ?? [],
                        'is_required' => $question->is_required,
                    ]),
            ],
            'cvs' => $candidate->cvs()
                ->latest('is_primary')
                ->latest('uploaded_at')
                ->get()
                ->map(fn ($cv): array => [
                    'id' => $cv->id,
                    'file_url' => $cv->file_url,
                    'is_primary' => $cv->is_primary,
                    'uploaded_at' => $cv->uploaded_at?->format('d M Y'),
                ]),
            'similarJobs' => JobListing::query()
                ->published()
                ->select(['id', 'company_id', 'title', 'slug', 'location_city', 'location_province', 'work_mode', 'job_type', 'salary_min', 'salary_max', 'is_salary_visible', 'published_at'])
                ->with(['company:id,name,is_verified'])
                ->whereKeyNot($jobListing->id)
                ->where('industry_id', $jobListing->industry_id)
                ->latest('published_at')
                ->limit(4)
                ->get()
                ->map(fn (JobListing $job): array => $this->jobCard($job, false, false, null)),
        ]);
    }

    private function jobCard(JobListing $job, bool $isSaved, bool $hasApplied, ?AiMatchScore $matchScore): array
    {
        return [
            'id' => $job->id,
            'slug' => $job->slug,
            'title' => $job->title,
            'company' => $job->company?->name,
            'company_verified' => (bool) $job->company?->is_verified,
            'industry' => $job->industry?->name,
            'location' => collect([$job->location_city, $job->location_province])->filter()->implode(', '),
            'work_mode' => $job->work_mode,
            'work_mode_label' => str($job->work_mode)->headline()->toString(),
            'job_type' => $job->job_type,
            'job_type_label' => str($job->job_type)->headline()->toString(),
            'salary_range' => $this->salaryRange($job),
            'published_at' => $job->published_at?->format('d M Y'),
            'closes_at' => $job->closes_at?->format('d M Y'),
            'matched_skills_count' => $job->matched_skills_count ?? null,
            'ai_match_score' => $matchScore?->overall_score,
            'ai_match_explanation' => $matchScore?->explanation,
            'is_saved' => $isSaved,
            'has_applied' => $hasApplied,
            'skills' => $job->skills->map(fn ($skill): array => [
                'id' => $skill->id,
                'name' => $skill->name,
            ]),
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

    private function industries(): array
    {
        return Industry::query()
            ->select(['id', 'name'])
            ->orderBy('name')
            ->get()
            ->map(fn (Industry $industry): array => [
                'value' => (string) $industry->id,
                'label' => $industry->name,
            ])
            ->all();
    }
}
