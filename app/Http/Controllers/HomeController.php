<?php

namespace App\Http\Controllers;

use App\Models\CandidateProfile;
use App\Models\CareerResource;
use App\Models\Company;
use App\Models\Faq;
use App\Models\Industry;
use App\Models\JobListing;
use App\Models\ScrapedJob;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $jobsPerPage = 9;
        $jobsPage = max(1, (int) $request->input('jobs_page', 1));

        $fewApplicantsWindow = now()->subDays(JobListing::FEW_APPLICANTS_DAYS_WINDOW);
        $fewApplicantsThreshold = JobListing::FEW_APPLICANTS_THRESHOLD;

        $jobsPaginator = JobListing::query()
            ->published()
            ->select([
                'id',
                'company_id',
                'title',
                'slug',
                'location_city',
                'location_province',
                'work_mode',
                'job_type',
                'salary_min',
                'salary_max',
                'is_salary_visible',
                'is_anonymous',
                'is_urgent',
                'closes_at',
                'published_at',
                'created_at',
                'status',
            ])
            ->with('company:id,name,logo_url')
            ->withCount('applications')
            ->where(fn ($query) => $query->whereNull('closes_at')->orWhere('closes_at', '>=', now()))
            ->orderByDesc('is_urgent')
            ->orderByRaw(
                '(CASE WHEN published_at >= ? AND (SELECT COUNT(*) FROM applications WHERE applications.job_listing_id = job_listings.id) < ? THEN 1 ELSE 0 END) DESC',
                [$fewApplicantsWindow, $fewApplicantsThreshold]
            )
            ->latest('published_at')
            ->paginate($jobsPerPage, ['*'], 'jobs_page', $jobsPage);

        $jobs = collect($jobsPaginator->items());

        $candidate = $this->resolveCandidate($request);
        $savedJobIds = $candidate === null
            ? collect()
            : $candidate->savedJobs()
                ->whereIn('job_listing_id', $jobs->pluck('id'))
                ->pluck('job_listing_id');

        $jobsArray = $jobs->map(fn (JobListing $job): array => [
            'id' => $job->id,
            'slug' => $job->slug,
            'title' => $job->title,
            'is_anonymous' => (bool) $job->is_anonymous,
            'is_urgent' => (bool) $job->is_urgent,
            'is_few_applicants' => $job->is_few_applicants,
            'company' => $job->is_anonymous ? null : $job->company?->name,
            'company_logo' => $job->is_anonymous ? null : $job->company?->logo_url,
            'type' => str($job->job_type)->headline()->toString(),
            'work_mode' => str($job->work_mode)->headline()->toString(),
            'location' => collect([$job->location_city, $job->location_province])->filter()->implode(', '),
            'salary' => $this->salaryRange($job),
            'published_at' => $job->published_at?->diffForHumans(),
            'is_saved' => $savedJobIds->contains($job->id),
        ])->values()->all();

        $scrapedJobs = ScrapedJob::query()
            ->select([
                'id',
                'source_platform',
                'source_url',
                'company_name',
                'company_logo_url',
                'title',
                'location',
                'employment_type',
                'workplace_type',
                'salary_min',
                'salary_max',
                'salary_currency',
                'scraped_at',
                'imported_at',
            ])
            ->latest('scraped_at')
            ->latest('imported_at')
            ->limit(16)
            ->get()
            ->map(fn (ScrapedJob $job): array => [
                'id' => $job->id,
                'slug' => 'scraped-'.$job->id,
                'title' => $job->title,
                'is_anonymous' => false,
                'is_urgent' => false,
                'company' => $job->company_name,
                'company_logo' => $job->company_logo_url,
                'type' => str($job->employment_type)->headline()->toString(),
                'work_mode' => str($job->workplace_type)->headline()->toString(),
                'location' => $job->location ?? '',
                'salary' => $this->scrapedSalaryRange($job),
                'published_at' => ($job->scraped_at ?? $job->imported_at)?->diffForHumans(),
                'is_saved' => false,
                'is_scraped' => true,
                'source_url' => $job->source_url,
                'source_platform' => $job->source_platform,
            ])
            ->values()
            ->all();

        $stats = [
            'active_jobs' => JobListing::query()
                ->published()
                ->where(fn ($q) => $q->whereNull('closes_at')->orWhere('closes_at', '>=', now()))
                ->count(),
            'active_companies' => Company::where('is_active', true)->whereNull('suspended_at')->count(),
            'total_candidates' => User::where('role', 'candidate')->count(),
        ];

        $industries = Industry::query()
            ->withCount(['jobListings as active_jobs_count' => fn ($q) => $q
                ->published()
                ->where(fn ($q2) => $q2->whereNull('closes_at')->orWhere('closes_at', '>=', now())),
            ])
            ->orderByDesc('active_jobs_count')
            ->get(['id', 'name'])
            ->filter(fn (Industry $i) => $i->active_jobs_count > 0)
            ->take(8)
            ->values();

        $registeredCompanies = Company::query()
            ->where('is_active', true)
            ->whereNull('suspended_at')
            ->select(['id', 'name', 'slug', 'logo_url', 'hq_city', 'is_verified'])
            ->orderByDesc('is_verified')
            ->orderBy('name')
            ->get();

        $latestCareerResources = CareerResource::query()
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now())
            ->select(['id', 'title', 'slug', 'type', 'category', 'thumbnail_path', 'published_at'])
            ->latest('published_at')
            ->limit(6)
            ->get();

        $faqs = Faq::query()
            ->select(['id', 'title', 'description'])
            ->orderBy('id')
            ->get();

        return Inertia::render('front/home/index', [
            'jobs' => $jobsArray,
            'scrapedJobs' => $scrapedJobs,
            'jobs_pagination' => [
                'current_page' => $jobsPaginator->currentPage(),
                'last_page' => $jobsPaginator->lastPage(),
                'has_more' => $jobsPaginator->hasMorePages(),
            ],
            'stats' => $stats,
            'industries' => $industries->map(fn (Industry $i): array => [
                'id' => $i->id,
                'name' => $i->name,
                'jobs_count' => (int) $i->active_jobs_count,
            ]),
            'registeredCompanies' => $registeredCompanies->map(fn (Company $c): array => [
                'id' => $c->id,
                'name' => $c->name,
                'slug' => $c->slug,
                'logo_url' => $c->logo_url,
                'hq_city' => $c->hq_city,
                'is_verified' => (bool) $c->is_verified,
            ]),
            'latestCareerResources' => $latestCareerResources->map(fn (CareerResource $r): array => [
                'id' => $r->id,
                'title' => $r->title,
                'slug' => $r->slug,
                'type' => $r->type,
                'category' => $r->category,
                'thumbnail_path' => $r->thumbnail_path,
                'published_at' => $r->published_at?->toDateString(),
            ]),
            'faqs' => $faqs->map(fn (Faq $f): array => [
                'id' => $f->id,
                'title' => $f->title,
                'description' => $f->description,
            ]),
        ]);
    }

    public function jobs(Request $request): Response
    {
        $perPage = 16;

        $fewApplicantsWindow = now()->subDays(JobListing::FEW_APPLICANTS_DAYS_WINDOW);
        $fewApplicantsThreshold = JobListing::FEW_APPLICANTS_THRESHOLD;

        $jobs = JobListing::query()
            ->published()
            ->select([
                'id',
                'company_id',
                'title',
                'slug',
                'location_city',
                'location_province',
                'work_mode',
                'job_type',
                'experience_level',
                'salary_min',
                'salary_max',
                'is_salary_visible',
                'is_anonymous',
                'is_urgent',
                'published_at',
                'closes_at',
                'created_at',
                'status',
            ])
            ->with('company:id,name,slug,logo_url,is_verified')
            ->withCount('applications')
            ->when($request->filled('search'), function ($query) use ($request) {
                $keyword = $request->string('search')->toString();

                $query->where(function ($query) use ($keyword) {
                    $query->where('title', 'like', '%'.$keyword.'%')
                        ->orWhereHas('company', fn ($companyQuery) => $companyQuery->where('name', 'like', '%'.$keyword.'%'));
                });
            })
            ->when($request->filled('location'), fn ($query) => $query->where(function ($query) use ($request) {
                $location = $request->string('location')->toString();

                $query->where('location_city', 'like', '%'.$location.'%')
                    ->orWhere('location_province', 'like', '%'.$location.'%');
            }))
            ->when($request->filled('work_mode'), fn ($query) => $query->where('work_mode', $request->string('work_mode')->toString()))
            ->when($request->filled('job_type'), fn ($query) => $query->where('job_type', $request->string('job_type')->toString()))
            ->when($request->filled('experience_level'), fn ($query) => $query->where('experience_level', $request->string('experience_level')->toString()))
            ->when($request->filled('industry_id'), fn ($query) => $query->where('industry_id', $request->integer('industry_id')))
            ->when($request->integer('salary_min') > 0, fn ($query) => $query->where('salary_min', '>=', $request->integer('salary_min')))
            ->where(fn ($query) => $query->whereNull('closes_at')->orWhere('closes_at', '>=', now()))
            ->when(
                $request->string('sort')->toString() === 'salary_high',
                fn ($query) => $query->orderByDesc('salary_max')->orderByDesc('published_at'),
                fn ($query) => $query
                    ->orderByDesc('is_urgent')
                    ->orderByRaw(
                        '(CASE WHEN published_at >= ? AND (SELECT COUNT(*) FROM applications WHERE applications.job_listing_id = job_listings.id) < ? THEN 1 ELSE 0 END) DESC',
                        [$fewApplicantsWindow, $fewApplicantsThreshold]
                    )
                    ->latest('published_at'),
            )
            ->get();

        $candidate = $this->resolveCandidate($request);
        $savedJobIds = $candidate === null
            ? collect()
            : $candidate->savedJobs()
                ->whereIn('job_listing_id', $jobs->pluck('id'))
                ->pluck('job_listing_id');

        $scrapedJobs = ScrapedJob::query()
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
                'scraped_at',
                'imported_at',
            ])
            ->when($request->filled('search'), function ($query) use ($request) {
                $keyword = $request->string('search')->toString();

                $query->where(function ($query) use ($keyword) {
                    $query->where('title', 'like', '%'.$keyword.'%')
                        ->orWhere('company_name', 'like', '%'.$keyword.'%')
                        ->orWhere('location', 'like', '%'.$keyword.'%');
                });
            })
            ->when($request->filled('location'), fn ($query) => $query
                ->where('location', 'like', '%'.$request->string('location')->toString().'%'))
            ->when($request->filled('work_mode'), fn ($query) => $query
                ->where('workplace_type', $request->string('work_mode')->toString()))
            ->when($request->filled('job_type'), fn ($query) => $query
                ->where('employment_type', $request->string('job_type')->toString()))
            ->when($request->integer('salary_min') > 0, fn ($query) => $query
                ->where('salary_min', '>=', $request->integer('salary_min')))
            ->get();

        $publicJobs = $jobs->map(fn (JobListing $job): array => [
            'id' => $job->id,
            'slug' => $job->slug,
            'title' => $job->title,
            'is_anonymous' => (bool) $job->is_anonymous,
            'is_urgent' => (bool) $job->is_urgent,
            'is_few_applicants' => $job->is_few_applicants,
            'company' => $job->is_anonymous ? null : $job->company?->name,
            'company_slug' => $job->is_anonymous ? null : $job->company?->slug,
            'company_logo' => $job->is_anonymous ? null : $job->company?->logo_url,
            'company_verified' => $job->is_anonymous ? false : (bool) $job->company?->is_verified,
            'location' => collect([$job->location_city, $job->location_province])->filter()->implode(', '),
            'work_mode' => str($job->work_mode)->headline()->toString(),
            'job_type' => str($job->job_type)->headline()->toString(),
            'experience_level' => str($job->experience_level)->headline()->toString(),
            'salary_range' => $this->salaryRange($job),
            'published_at' => $job->published_at?->diffForHumans(),
            'is_saved' => $savedJobIds->contains($job->id),
            'is_scraped' => false,
            'sort_priority' => $job->is_urgent ? 2 : ($job->is_few_applicants ? 1 : 0),
            'sort_salary' => (int) ($job->salary_max ?? 0),
            'sort_at' => ($job->published_at ?? $job->created_at)?->timestamp ?? 0,
        ])->concat($scrapedJobs->map(fn (ScrapedJob $job): array => [
            'id' => $job->id,
            'slug' => 'scraped-'.$job->id,
            'title' => $job->title,
            'is_anonymous' => false,
            'is_urgent' => false,
            'is_few_applicants' => false,
            'company' => $job->company_name,
            'company_slug' => null,
            'company_logo' => $job->company_logo_url,
            'company_verified' => false,
            'location' => $job->location ?? '',
            'work_mode' => str($job->workplace_type ?: 'onsite')->headline()->toString(),
            'job_type' => str($job->employment_type ?: 'full_time')->headline()->toString(),
            'experience_level' => 'Tidak dicantumkan',
            'salary_range' => $this->scrapedSalaryRange($job),
            'published_at' => ($job->scraped_at ?? $job->imported_at)?->diffForHumans(),
            'is_saved' => false,
            'is_scraped' => true,
            'sort_priority' => 0,
            'sort_salary' => (int) ($job->salary_max ?? 0),
            'sort_at' => ($job->scraped_at ?? $job->imported_at)?->timestamp ?? 0,
        ]));

        $publicJobs = $request->string('sort')->toString() === 'salary_high'
            ? $publicJobs->sortByDesc('sort_at')->sortByDesc('sort_salary')->values()
            : $publicJobs->sortByDesc('sort_at')->sortByDesc('sort_priority')->values();

        $total = $publicJobs->count();
        $lastPage = max(1, (int) ceil($total / $perPage));
        $currentPage = min(
            max(1, LengthAwarePaginator::resolveCurrentPage()),
            $lastPage,
        );
        $pageItems = $publicJobs
            ->forPage($currentPage, $perPage)
            ->map(fn (array $job): array => collect($job)
                ->except(['sort_priority', 'sort_salary', 'sort_at'])
                ->all())
            ->values()
            ->all();
        $jobsPaginator = new LengthAwarePaginator(
            $pageItems,
            $total,
            $perPage,
            $currentPage,
            ['path' => $request->url(), 'query' => $request->query()],
        );

        return Inertia::render('front/jobs/index', [
            'filters' => [
                'search' => $request->string('search')->toString(),
                'location' => $request->string('location')->toString(),
                'work_mode' => $request->string('work_mode')->toString(),
                'job_type' => $request->string('job_type')->toString(),
                'experience_level' => $request->string('experience_level')->toString(),
                'industry_id' => $request->integer('industry_id') ?: null,
                'salary_min' => $request->integer('salary_min'),
                'sort' => $request->string('sort')->toString() ?: 'relevance',
            ],
            'jobs' => $jobsPaginator,
        ]);
    }

    public function companies(Request $request): Response
    {
        $perPage = 9;

        $companies = Company::query()
            ->where('is_active', true)
            ->whereNull('suspended_at')
            ->select([
                'id',
                'industry_id',
                'name',
                'slug',
                'logo_url',
                'hq_city',
                'hq_province',
                'company_size',
                'is_verified',
                'trust_score',
            ])
            ->with('industry:id,name')
            ->withCount([
                'jobListings as open_jobs_count' => fn ($query) => $query
                    ->published()
                    ->where(fn ($query) => $query
                        ->whereNull('closes_at')
                        ->orWhere('closes_at', '>=', now())),
            ])
            ->when($request->filled('search'), function ($query) use ($request) {
                $keyword = $request->string('search')->toString();
                $query->where('name', 'like', '%'.$keyword.'%');
            })
            ->when($request->filled('industry_id'), fn ($query) => $query
                ->where('industry_id', $request->integer('industry_id')))
            ->when($request->filled('location'), fn ($query) => $query
                ->where(fn ($query) => $query
                    ->where('hq_city', 'like', '%'.$request->string('location')->toString().'%')
                    ->orWhere('hq_province', 'like', '%'.$request->string('location')->toString().'%')))
            ->when(
                $request->string('sort')->toString() === 'most_jobs',
                fn ($query) => $query->orderByDesc('open_jobs_count')->orderByDesc('is_verified')->orderBy('name'),
                fn ($query) => $query->orderByDesc('is_verified')->orderByDesc('open_jobs_count')->orderBy('name'),
            )
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('front/companies/index', [
            'filters' => [
                'search' => $request->string('search')->toString(),
                'industry_id' => $request->string('industry_id')->toString(),
                'location' => $request->string('location')->toString(),
                'sort' => $request->string('sort')->toString() ?: 'recommended',
            ],
            'industries' => Industry::query()
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn (Industry $industry): array => [
                    'id' => $industry->id,
                    'name' => $industry->name,
                ]),
            'companies' => $companies->through(fn (Company $company): array => [
                'id' => $company->id,
                'slug' => $company->slug,
                'name' => $company->name,
                'logo_url' => $company->logo_url,
                'industry' => $company->industry?->name,
                'location' => collect([$company->hq_city, $company->hq_province])->filter()->implode(', '),
                'company_size' => $company->company_size,
                'is_verified' => (bool) $company->is_verified,
                'trust_score' => $company->trust_score,
                'open_jobs_count' => (int) $company->open_jobs_count,
            ]),
        ]);
    }

    private function resolveCandidate(Request $request): ?CandidateProfile
    {
        $user = $request->user();

        if ($user === null || $user->role !== 'candidate') {
            return null;
        }

        return $user->candidateProfile;
    }

    private function salaryRange(JobListing $job): string
    {
        if (! $job->is_salary_visible || ($job->salary_min === null && $job->salary_max === null)) {
            return 'Salary tidak ditampilkan';
        }

        return collect([$job->salary_min, $job->salary_max])
            ->filter(fn (?int $amount): bool => $amount !== null)
            ->map(fn (int $amount): string => 'Rp '.number_format($amount, 0, ',', '.'))
            ->implode(' - ');
    }

    private function scrapedSalaryRange(ScrapedJob $job): string
    {
        $amounts = collect([$job->salary_min, $job->salary_max])
            ->filter(fn (?int $amount): bool => $amount !== null)
            ->map(fn (int $amount): string => number_format($amount, 0, ',', '.'))
            ->values();

        if ($amounts->isEmpty()) {
            return 'Gaji tidak dicantumkan';
        }

        return ($job->salary_currency ?? 'IDR').' '.$amounts->implode(' - ');
    }
}
