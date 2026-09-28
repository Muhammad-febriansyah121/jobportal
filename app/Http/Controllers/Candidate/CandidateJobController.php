<?php

namespace App\Http\Controllers\Candidate;

use App\Actions\Candidate\GenerateJobAiInsight;
use App\Actions\Candidate\PredictItJobAcceptance;
use App\Actions\Candidate\RecordCandidateJobView;
use App\Actions\Candidate\ResolveCandidateProfile;
use App\Http\Controllers\Controller;
use App\Models\AiMatchScore;
use App\Models\CandidateProfile;
use App\Models\Industry;
use App\Models\JobListing;
use App\Models\ScrapedJob;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CandidateJobController extends Controller
{
    public function index(Request $request, ResolveCandidateProfile $resolveCandidateProfile): Response
    {
        $activeTab = $request->string('tab', 'all')->toString();
        if (! in_array($activeTab, ['all', 'remote', 'salary-transparent'], true)) {
            $activeTab = 'all';
        }
        $candidate = $resolveCandidateProfile->handle($request->user());
        $jobs = ScrapedJob::query()
            ->visible()
            ->select([
                'id',
                'company_name',
                'company_logo_url',
                'title',
                'location',
                'employment_type',
                'workplace_type',
                'salary_min',
                'salary_max',
                'salary_currency',
                'skills',
                'hr_email',
                'source_platform',
                'scraped_at',
                'imported_at',
            ])
            ->when($activeTab === 'remote', fn ($query) => $query->whereRaw('LOWER(workplace_type) = ?', ['remote']))
            ->when($activeTab === 'salary-transparent', fn ($query) => $query->where(function ($query): void {
                $query->whereNotNull('salary_min')->orWhereNotNull('salary_max');
            }))
            ->when($request->filled('search'), function ($query) use ($request): void {
                $search = $request->string('search')->toString();

                $query->where(function ($query) use ($search): void {
                    $query->where('title', 'like', '%'.$search.'%')
                        ->orWhere('company_name', 'like', '%'.$search.'%')
                        ->orWhere('location', 'like', '%'.$search.'%')
                        ->orWhere('description', 'like', '%'.$search.'%')
                        ->orWhere('skills', 'like', '%'.$search.'%');
                });
            })
            ->when($request->filled('location'), fn ($query) => $query->where('location', 'like', '%'.$request->string('location')->toString().'%'))
            ->when($request->filled('work_mode'), fn ($query) => $query->whereRaw('LOWER(workplace_type) = ?', [strtolower($request->string('work_mode')->toString())]))
            ->when($request->filled('job_type'), fn ($query) => $query->whereRaw('LOWER(employment_type) = ?', [strtolower($request->string('job_type')->toString())]))
            ->when($request->filled('salary_min'), fn ($query) => $query->where(function ($query) use ($request): void {
                $salaryMin = $request->integer('salary_min');

                $query->where('salary_max', '>=', $salaryMin)
                    ->orWhere('salary_min', '>=', $salaryMin);
            }))
            ->latest('scraped_at')
            ->latest('imported_at')
            ->paginate(12)
            ->withQueryString();

        $scrapedJobIds = collect($jobs->items())->pluck('id');
        $appliedScrapedJobIds = $candidate->applications()
            ->whereIn('scraped_job_id', $scrapedJobIds)
            ->pluck('scraped_job_id');

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
            'has_intent_data' => false,
            'source' => 'external',
            'industries' => $this->industries(),
            'jobs' => $jobs->through(fn (ScrapedJob $job): array => $this->scrapedJobCard(
                $job,
                $appliedScrapedJobIds->contains($job->id),
            )),
        ]);
    }

    public function show(
        Request $request,
        JobListing $jobListing,
        ResolveCandidateProfile $resolveCandidateProfile,
        RecordCandidateJobView $recordCandidateJobView,
        GenerateJobAiInsight $generateJobAiInsight,
        PredictItJobAcceptance $predictItJobAcceptance,
    ): Response {
        $user = $request->user();
        $isPublicRoute = $request->routeIs('jobs.show');

        $candidate = $user ? $resolveCandidateProfile->handle($user)->load(['skills:id,name']) : null;
        $candidateApplication = $candidate
            ? $candidate->applications()
                ->where('job_listing_id', $jobListing->id)
                ->latest('id')
                ->first()
            : null;
        $hasApplied = $candidateApplication !== null;

        abort_unless($jobListing->isOpen() || $hasApplied, 404);

        if ($candidate) {
            $recordCandidateJobView->handle($candidate, $jobListing);
        }

        $jobListing->load([
            'company:id,name,slug,description,culture,benefits,logo_url,company_size,industry_id,is_verified,trust_score,response_rate,median_response_hours',
            'company.industry:id,name',
            'industry:id,name',
            'skills:id,name',
            'screeningQuestions',
        ]);

        $matchScore = $candidate
            ? AiMatchScore::query()
                ->where('candidate_id', $candidate->id)
                ->where('job_listing_id', $jobListing->id)
                ->first()
            : null;

        $applicationChance = $candidate ? $predictItJobAcceptance->handle($jobListing, $candidate) : null;

        $shouldRenderApplyPage = ! $isPublicRoute
            && $request->boolean('apply')
            && ! $hasApplied;

        return Inertia::render(
            $isPublicRoute
                ? 'front/jobs/show'
                : ($shouldRenderApplyPage ? 'candidate/jobs/apply' : 'candidate/jobs/show'),
            [
                'job' => [
                    ...$this->jobCard(
                        $jobListing,
                        $candidate ? $candidate->savedJobs()->where('job_listing_id', $jobListing->id)->exists() : false,
                        $hasApplied,
                        $matchScore
                    ),
                    'description' => $jobListing->description,
                    'responsibilities' => $jobListing->responsibilities,
                    'required_qualifications' => $jobListing->required_qualifications,
                    'preferred_qualifications' => $jobListing->preferred_qualifications,
                    'benefits' => $jobListing->benefits,
                    'experience_level' => str($jobListing->experience_level)->headline()->toString(),
                    'integrity_score' => $jobListing->integrity_score,
                    'response_sla_hours' => $jobListing->response_sla_hours,
                    'company_logo' => $jobListing->is_anonymous ? null : $jobListing->company?->logo_url,
                    'company_slug' => $jobListing->is_anonymous ? null : $jobListing->company?->slug,
                    'company_size' => $jobListing->company?->company_size,
                    'company_industry' => $jobListing->company?->industry?->name,
                    'company_description' => $jobListing->is_anonymous ? null : $jobListing->company?->description,
                    'company_culture' => $jobListing->is_anonymous ? null : $jobListing->company?->culture,
                    'company_benefits' => $jobListing->is_anonymous ? null : $jobListing->company?->benefits,
                    'company_trust_score' => $jobListing->is_anonymous ? null : $jobListing->company?->trust_score,
                    'company_response_rate' => $jobListing->is_anonymous ? null : $jobListing->company?->response_rate,
                    'company_median_response_hours' => $jobListing->is_anonymous ? null : $jobListing->company?->median_response_hours,
                    'matched_skills' => $matchScore?->matched_skills ?? [],
                    'missing_skills' => $matchScore?->missing_skills ?? [],
                    'ai_insight' => $candidate
                        ? Inertia::defer(function () use ($generateJobAiInsight, $jobListing, $candidate) {
                            try {
                                return $generateJobAiInsight->handle($jobListing, $candidate);
                            } catch (\Throwable $e) {
                                report($e);

                                return null;
                            }
                        })
                        : null,
                    'ai_interview_application_id' => $candidateApplication?->id,
                    'screening_questions' => $jobListing->screeningQuestions
                        ->map(fn ($question): array => [
                            'id' => $question->id,
                            'question' => $question->question,
                            'type' => $question->type,
                            'options' => $question->options_json ?? [],
                            'is_required' => $question->is_required,
                        ]),
                ],
                'cvs' => $candidate
                    ? $candidate->cvs()
                        ->latest('is_primary')
                        ->latest('uploaded_at')
                        ->get()
                        ->map(fn ($cv): array => [
                            'id' => $cv->id,
                            'file_url' => $cv->file_url,
                            'is_primary' => $cv->is_primary,
                            'uploaded_at' => $cv->uploaded_at?->format('d M Y'),
                        ])
                    : [],
                'similarJobs' => JobListing::query()
                    ->published()
                    ->where(fn ($query) => $query->whereNull('closes_at')->orWhere('closes_at', '>=', now()))
                    ->select(['id', 'company_id', 'industry_id', 'title', 'slug', 'location_city', 'location_province', 'work_mode', 'job_type', 'salary_min', 'salary_max', 'is_salary_visible', 'published_at'])
                    ->with(['company:id,name,logo_url,is_verified', 'industry:id,name', 'skills:id,name'])
                    ->whereKeyNot($jobListing->id)
                    ->where('industry_id', $jobListing->industry_id)
                    ->latest('published_at')
                    ->limit(4)
                    ->get()
                    ->map(fn (JobListing $job): array => [
                        ...$this->jobCard($job, false, false, null),
                        'company_logo' => $job->is_anonymous ? null : $job->company?->logo_url,
                    ]),
                'application_chance' => $shouldRenderApplyPage ? $applicationChance : null,
                'candidate_phone' => $shouldRenderApplyPage ? $request->user()?->phone : null,
            ]
        );
    }

    private function scrapedJobCard(ScrapedJob $job, bool $hasApplied): array
    {
        return [
            'id' => $job->id,
            'slug' => 'scraped-'.$job->id,
            'title' => $job->title,
            'is_anonymous' => false,
            'is_scraped' => true,
            'company' => $job->company_name,
            'company_verified' => false,
            'industry' => null,
            'location' => $job->location ?? '',
            'work_mode' => strtolower($job->workplace_type ?: 'onsite'),
            'work_mode_label' => str($job->workplace_type ?: 'onsite')->headline()->toString(),
            'job_type' => strtolower($job->employment_type ?: 'full_time'),
            'job_type_label' => str($job->employment_type ?: 'full_time')->headline()->toString(),
            'salary_range' => $this->scrapedSalaryRange($job),
            'published_at' => ($job->scraped_at ?? $job->imported_at)?->toIso8601String(),
            'matched_skills_count' => null,
            'ai_match_score' => null,
            'is_saved' => false,
            'has_applied' => $hasApplied,
            'has_internal_apply' => filter_var($job->hr_email, FILTER_VALIDATE_EMAIL) !== false,
            'source_platform' => $job->source_platform,
            'skills' => collect($job->skills ?? [])
                ->filter(fn (mixed $skill): bool => is_string($skill) && trim($skill) !== '')
                ->values()
                ->map(fn (string $skill, int $index): array => [
                    'id' => $index + 1,
                    'name' => $skill,
                ])
                ->all(),
        ];
    }

    private function scrapedSalaryRange(ScrapedJob $job): string
    {
        $amounts = collect([$job->salary_min, $job->salary_max])
            ->filter(fn (?int $amount): bool => $amount !== null)
            ->map(fn (int $amount): string => number_format($amount, 0, ',', '.'))
            ->values();

        return $amounts->isEmpty()
            ? 'Gaji tidak dicantumkan'
            : ($job->salary_currency ?? 'IDR').' '.$amounts->implode(' - ');
    }

    /**
     * @param  array<int>  $candidateSkillIds
     */
    private function jobCard(
        JobListing $job,
        bool $isSaved,
        bool $hasApplied,
        ?AiMatchScore $matchScore,
        array $candidateSkillIds = [],
        float $candidateExperienceYears = 0,
        ?int $candidateIndustryId = null,
        ?string $candidateHeadlineLower = null,
        string $candidateWorkModePref = 'any',
        ?int $candidateExpectedSalaryMin = null,
    ): array {
        $isAnonymous = (bool) $job->is_anonymous;

        $aiMatchScore = $matchScore?->overall_score;
        $aiMatchExplanation = $matchScore?->explanation;

        if ($aiMatchScore === null) {
            // Skill match — 35%
            $jobSkills = $job->skills;
            $requiredCount = $jobSkills->count();
            $requiredIds = $jobSkills->pluck('id')->all();
            $matchedCount = count(array_intersect($requiredIds, $candidateSkillIds));
            $skillScore = $requiredCount > 0 ? ($matchedCount / $requiredCount) * 35 : 17.5;

            // Pengalaman kerja — 25%
            $minYears = (int) ($jobSkills->max('pivot.min_years') ?? 0);
            $expScore = $minYears > 0
                ? min(25.0, ($candidateExperienceYears / max(1, $minYears)) * 25)
                : 12.5;

            // Posisi/jabatan — 15% (keyword overlap: job title vs candidate headline)
            $positionScore = 7.5;
            if ($candidateHeadlineLower && $job->title) {
                $jobWords = array_filter(explode(' ', mb_strtolower($job->title)), fn (string $w): bool => mb_strlen($w) > 2);
                $matches = array_filter($jobWords, fn (string $w): bool => str_contains($candidateHeadlineLower, $w));
                $positionScore = $jobWords !== []
                    ? min(15.0, (count($matches) / count($jobWords)) * 15)
                    : 7.5;
            }

            // Level senioritas — 10%
            $seniorityScore = match ($job->experience_level) {
                'entry' => $candidateExperienceYears <= 2 ? 10.0 : ($candidateExperienceYears <= 4 ? 6.0 : 3.0),
                'mid' => $candidateExperienceYears >= 2 && $candidateExperienceYears <= 6 ? 10.0 : ($candidateExperienceYears < 2 ? 5.0 : 7.0),
                'senior' => $candidateExperienceYears >= 5 ? 10.0 : ($candidateExperienceYears >= 3 ? 6.0 : 2.0),
                'lead' => $candidateExperienceYears >= 7 ? 10.0 : ($candidateExperienceYears >= 5 ? 6.0 : 2.0),
                default => 5.0,
            };

            // Industri — 5%
            $industryScore = $candidateIndustryId && $job->industry_id === $candidateIndustryId ? 5.0 : 0.0;

            // Preferensi kerja — 10% (work_mode 5% + salary 5%)
            $workModeScore = ($candidateWorkModePref === 'any' || $candidateWorkModePref === $job->work_mode) ? 5.0 : 0.0;
            $salaryScore = 0.0;
            if ($candidateExpectedSalaryMin === null) {
                $salaryScore = 2.5;
            } elseif ($job->salary_max !== null && $job->salary_max >= $candidateExpectedSalaryMin) {
                $salaryScore = 5.0;
            } elseif ($job->salary_min !== null && $job->salary_min >= $candidateExpectedSalaryMin * 0.8) {
                $salaryScore = 2.5;
            }

            $total = $skillScore + $expScore + $positionScore + $seniorityScore + $industryScore + $workModeScore + $salaryScore;
            $aiMatchScore = max(15, min(100, (int) round($total)));
        }

        return [
            'id' => $job->id,
            'slug' => $job->slug,
            'title' => $job->title,
            'is_anonymous' => $isAnonymous,
            'company' => $isAnonymous ? null : $job->company?->name,
            'company_verified' => $isAnonymous ? false : (bool) $job->company?->is_verified,
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
            'ai_match_score' => $aiMatchScore,
            'ai_match_explanation' => $aiMatchExplanation,
            'is_saved' => $isSaved,
            'has_applied' => $hasApplied,
            'skills' => $job->skills->map(fn ($skill): array => [
                'id' => $skill->id,
                'name' => $skill->name,
            ]),
        ];
    }

    private function totalYearsExperience(CandidateProfile $candidate): float
    {
        $months = 0.0;

        foreach ($candidate->experiences as $experience) {
            $start = $experience->start_date;

            if (! $start) {
                continue;
            }

            $end = $experience->is_current ? now() : ($experience->end_date ?? now());
            $months += max(0.0, (float) $start->diffInMonths($end));
        }

        return round($months / 12, 1);
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
