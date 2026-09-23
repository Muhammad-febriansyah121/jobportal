<?php

namespace App\Http\Controllers;

use App\Models\ScrapedJob;
use Inertia\Inertia;
use Inertia\Response;

class ScrapedCompanyProfileController extends Controller
{
    public function show(ScrapedJob $scrapedJob): Response
    {
        $companyName = trim($scrapedJob->company_name);
        $jobs = ScrapedJob::query()
            ->select([
                'id',
                'company_name',
                'company_logo_url',
                'company_website',
                'company_profile',
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
            ->whereRaw('LOWER(TRIM(company_name)) = ?', [mb_strtolower($companyName)])
            ->latest('scraped_at')
            ->latest('imported_at')
            ->limit(20)
            ->get();

        $profileJob = $jobs->first(fn (ScrapedJob $job): bool => filled($job->company_profile));
        $websiteJob = $jobs->first(fn (ScrapedJob $job): bool => filled($job->company_website));
        $logoJob = $jobs->first(fn (ScrapedJob $job): bool => filled($job->company_logo_url));
        $locationJob = $jobs->first(fn (ScrapedJob $job): bool => filled($job->location));

        return Inertia::render('front/companies/scraped-show', [
            'company' => [
                'id' => $scrapedJob->id,
                'name' => $companyName,
                'logo_url' => $logoJob?->company_logo_url,
                'website' => $websiteJob?->company_website,
                'profile' => $profileJob?->company_profile,
                'location' => $locationJob?->location ?? '',
                'open_jobs_count' => $jobs->count(),
            ],
            'jobs' => $jobs->map(fn (ScrapedJob $job): array => [
                'id' => $job->id,
                'title' => $job->title,
                'location' => $job->location ?? '',
                'work_mode' => str($job->workplace_type ?: 'onsite')->headline()->toString(),
                'job_type' => str($job->employment_type ?: 'full_time')->headline()->toString(),
                'salary' => $this->salaryRange($job),
                'published_at' => ($job->scraped_at ?? $job->imported_at)?->diffForHumans(),
                'detail_url' => route('jobs.scraped.show', $job, absolute: false),
            ])->values()->all(),
        ]);
    }

    private function salaryRange(ScrapedJob $job): string
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
