<?php

use App\Models\ScrapedJob;

test('public home displays at most sixteen scraped jobs', function () {
    foreach (range(1, 17) as $index) {
        ScrapedJob::create([
            'source_platform' => 'dealls',
            'source_job_id' => 'scraped-'.$index,
            'source_url' => 'https://example.com/jobs/'.$index,
            'company_name' => 'Company '.$index,
            'title' => 'Scraped Job '.$index,
            'description' => 'A scraped public job.',
            'location' => 'Jakarta',
            'employment_type' => 'FULL_TIME',
            'workplace_type' => 'ONSITE',
            'scraped_at' => now()->subMinutes($index),
            'status' => 'pending',
        ]);
    }

    $this->get(route('home'))
        ->assertInertia(fn ($page) => $page
            ->component('front/home/index')
            ->has('scrapedJobs', 16)
            ->where('scrapedJobs.0.title', 'Scraped Job 1')
            ->where('scrapedJobs.0.source_platform', 'dealls')
            ->missing('scrapedJobs.0.raw_payload')
        );
});

test('scraped job opens on internal public detail page', function () {
    $scrapedJob = ScrapedJob::create([
        'source_platform' => 'dealls',
        'source_job_id' => 'scraped-detail-1',
        'source_url' => 'https://example.com/jobs/detail-1',
        'company_name' => 'Company Detail',
        'title' => 'Senior Product Designer',
        'description' => 'A public scraped job detail.',
        'location' => 'Jakarta',
        'employment_type' => 'FULL_TIME',
        'workplace_type' => 'HYBRID',
        'scraped_at' => now()->subHour(),
        'status' => 'pending',
    ]);

    $this->get(route('jobs.scraped.show', $scrapedJob))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('front/jobs/scraped-show')
            ->where('job.title', 'Senior Product Designer')
            ->where('job.apply_url', 'https://example.com/jobs/detail-1')
            ->missing('job.source_platform')
        );
});
