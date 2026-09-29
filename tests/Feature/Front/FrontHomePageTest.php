<?php

use App\Models\ScrapedJob;
use App\Models\User;

test('public home displays at most thirty-two scraped jobs', function () {
    foreach (range(1, 33) as $index) {
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
            ->has('scrapedJobs', 32)
            ->where('scrapedJobs.0.title', 'Scraped Job 1')
            ->missing('scrapedJobs.0.source_url')
            ->missing('scrapedJobs.0.source_platform')
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
        'hr_email' => 'hr@example.com',
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
            ->where('job.internal_apply_url', '/candidate/external-jobs/'.$scrapedJob->id.'/apply')
            ->missing('job.apply_url')
            ->missing('job.source_platform')
        );
});

test('scraped job share metadata includes job title and company', function () {
    $scrapedJob = ScrapedJob::create([
        'source_platform' => 'dealls',
        'source_job_id' => 'scraped-share-metadata',
        'source_url' => 'https://example.com/jobs/share-metadata',
        'company_name' => 'Company Metadata',
        'title' => 'Senior Backend Engineer',
        'description' => 'Build reliable services for growing teams.',
        'scraped_at' => now()->subHour(),
        'status' => 'pending',
    ]);

    $this->get(route('jobs.scraped.show', $scrapedJob))
        ->assertSee('<meta property="og:title" content="Senior Backend Engineer — Company Metadata">', false)
        ->assertSee('<meta property="og:description" content="Build reliable services for growing teams.">', false);
});

test('non candidate users do not receive scraped application actions', function () {
    $employer = User::factory()->employer()->create();
    $scrapedJob = ScrapedJob::create([
        'source_platform' => 'dealls',
        'source_job_id' => 'scraped-employer-view',
        'source_url' => 'https://example.com/jobs/employer-view',
        'company_name' => 'Company Detail',
        'title' => 'Senior Product Designer',
        'description' => 'A public scraped job detail.',
        'hr_email' => 'hr@example.com',
        'location' => 'Jakarta',
        'employment_type' => 'FULL_TIME',
        'workplace_type' => 'HYBRID',
        'scraped_at' => now()->subHour(),
        'status' => 'pending',
    ]);

    $this->actingAs($employer)
        ->get(route('jobs.scraped.show', $scrapedJob))
        ->assertInertia(fn ($page) => $page
            ->where('job.internal_apply_url', null)
            ->where('job.has_internal_apply', false)
        );
});
