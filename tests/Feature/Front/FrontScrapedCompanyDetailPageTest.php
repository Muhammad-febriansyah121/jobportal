<?php

use App\Models\ScrapedJob;

test('guest can open scraped company profile with company data and jobs', function () {
    $company = ScrapedJob::create([
        'source_platform' => 'dealls',
        'source_job_id' => 'sirclo-profile-1',
        'source_url' => 'https://example.com/jobs/sirclo-profile-1',
        'company_name' => 'SIRCLO',
        'company_logo_url' => 'https://www.google.com/s2/favicons?domain=sirclo.com&sz=128',
        'company_website' => 'https://sirclo.com',
        'company_profile' => 'SIRCLO is a leading omnichannel commerce enabler in Indonesia.',
        'title' => 'Android Engineer',
        'description' => 'Build products.',
        'location' => 'Jakarta',
        'employment_type' => 'FULL_TIME',
        'workplace_type' => 'HYBRID',
        'scraped_at' => now()->subHour(),
        'status' => 'pending',
    ]);

    ScrapedJob::create([
        'source_platform' => 'dealls',
        'source_job_id' => 'sirclo-profile-2',
        'source_url' => 'https://example.com/jobs/sirclo-profile-2',
        'company_name' => 'SIRCLO',
        'company_website' => 'https://sirclo.com',
        'title' => 'Product Designer',
        'description' => 'Design products.',
        'location' => 'Jakarta',
        'employment_type' => 'FULL_TIME',
        'workplace_type' => 'ONSITE',
        'scraped_at' => now()->subHours(2),
        'status' => 'pending',
    ]);

    $this->get(route('companies.scraped.show', $company))
        ->assertInertia(fn ($page) => $page
            ->component('front/companies/scraped-show')
            ->where('company.name', 'SIRCLO')
            ->where('company.website', 'https://sirclo.com')
            ->where('company.profile', 'SIRCLO is a leading omnichannel commerce enabler in Indonesia.')
            ->where('company.open_jobs_count', 2)
            ->has('jobs', 2)
        );
});
