<?php

namespace App\Actions\Scraper;

use App\Models\ScrapedJob;

class ImportScrapedJob
{
    /**
     * @param  array<string, mixed>  $payload
     */
    public function handle(array $payload): ScrapedJob
    {
        $source = $payload['source'];
        $company = $payload['company'];
        $job = $payload['job'];
        $salary = $job['salary'] ?? [];
        $contact = $payload['contact'] ?? [];

        $scrapedJob = ScrapedJob::query()->firstOrNew([
            'source_platform' => $source['platform'],
            'source_job_id' => $source['job_id'],
        ]);

        $scrapedJob->fill([
            'source_url' => $source['url'],
            'company_name' => $company['name'],
            'company_logo_url' => $company['logo_url'] ?? null,
            'company_website' => $company['website'] ?? null,
            'company_profile' => $company['profile'] ?? null,
            'title' => $job['title'],
            'description' => $job['description'],
            'location' => $job['location'] ?? null,
            'employment_type' => $job['employment_type'] ?? null,
            'workplace_type' => $job['workplace_type'] ?? null,
            'salary_min' => $salary['min'] ?? null,
            'salary_max' => $salary['max'] ?? null,
            'salary_currency' => $salary['currency'] ?? 'IDR',
            'requirements' => $job['requirements'] ?? [],
            'skills' => $job['skills'] ?? [],
            'hr_email' => $contact['hr_email'] ?? null,
            'email_source' => $contact['email_source'] ?? null,
            'email_verified' => (bool) ($contact['email_verified'] ?? false),
            'raw_payload' => $payload,
            'scraped_at' => $payload['metadata']['scraped_at'] ?? null,
            'imported_at' => now(),
        ]);

        if (! $scrapedJob->exists) {
            $scrapedJob->status = 'pending';
        }

        $scrapedJob->save();

        return $scrapedJob;
    }
}
