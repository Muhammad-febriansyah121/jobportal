<?php

namespace App\Http\Controllers;

use App\Models\ScrapedJob;
use Inertia\Inertia;
use Inertia\Response;

class ScrapedJobController extends Controller
{
    public function show(ScrapedJob $scrapedJob): Response
    {
        return Inertia::render('front/jobs/scraped-show', [
            'job' => [
                'id' => $scrapedJob->id,
                'title' => $scrapedJob->title,
                'company' => $scrapedJob->company_name,
                'company_logo' => $scrapedJob->company_logo_url,
                'location' => $scrapedJob->location,
                'work_mode' => str($scrapedJob->workplace_type)->headline()->toString(),
                'job_type' => str($scrapedJob->employment_type)->headline()->toString(),
                'salary_range' => $this->salaryRange($scrapedJob),
                'published_at' => ($scrapedJob->scraped_at ?? $scrapedJob->imported_at)?->diffForHumans(),
                'description' => $scrapedJob->description,
                'requirements' => collect($scrapedJob->requirements ?? [])->values()->all(),
                'skills' => collect($scrapedJob->skills ?? [])->values()->all(),
                'internal_apply_url' => filled($scrapedJob->hr_email)
                    ? route('candidate.scraped-jobs.apply', $scrapedJob, absolute: false)
                    : null,
                'has_internal_apply' => filter_var($scrapedJob->hr_email, FILTER_VALIDATE_EMAIL) !== false,
            ],
        ]);
    }

    private function salaryRange(ScrapedJob $scrapedJob): string
    {
        $amounts = collect([$scrapedJob->salary_min, $scrapedJob->salary_max])
            ->filter(fn (?int $amount): bool => $amount !== null)
            ->map(fn (int $amount): string => number_format($amount, 0, ',', '.'))
            ->values();

        if ($amounts->isEmpty()) {
            return 'Gaji tidak dicantumkan';
        }

        return ($scrapedJob->salary_currency ?? 'IDR').' '.$amounts->implode(' - ');
    }
}
