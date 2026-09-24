<?php

use App\Models\ScrapedJob;

test('guest can open public companies page in home layout', function () {
    $job = ScrapedJob::create([
        'source_platform' => 'dealls',
        'source_job_id' => 'public-company-1',
        'source_url' => 'https://example.com/jobs/public-company-1',
        'company_name' => 'Scraped Karivia Labs',
        'title' => 'Product Engineer',
        'description' => 'A public scraped job.',
        'location' => 'Jakarta',
        'scraped_at' => now()->subHour(),
        'status' => 'pending',
    ]);

    $response = $this->get(route('companies.index'));

    $response->assertInertia(fn ($page) => $page
        ->component('front/companies/index')
        ->has('companies.data', 1)
        ->where('companies.data.0.name', 'Scraped Karivia Labs')
        ->where('companies.data.0.source', 'scraped')
        ->where('companies.data.0.detail_url', route('companies.scraped.show', $job, absolute: false))
    );
});

test('companies page supports search filter', function () {
    ScrapedJob::create([
        'source_platform' => 'dealls',
        'source_job_id' => 'scraped-search-1',
        'source_url' => 'https://example.com/jobs/scraped-search-1',
        'company_name' => 'Scraped Karivia Labs',
        'title' => 'Product Engineer',
        'description' => 'A public scraped job.',
        'location' => 'Jakarta',
        'scraped_at' => now()->subHour(),
        'status' => 'pending',
    ]);

    ScrapedJob::create([
        'source_platform' => 'dealls',
        'source_job_id' => 'scraped-search-2',
        'source_url' => 'https://example.com/jobs/scraped-search-2',
        'company_name' => 'Nusantara Fintech',
        'title' => 'Finance Lead',
        'description' => 'Another public scraped job.',
        'location' => 'Surabaya',
        'scraped_at' => now()->subHours(2),
        'status' => 'pending',
    ]);

    $response = $this->get(route('companies.index', ['search' => 'karivia']));

    $response->assertInertia(fn ($page) => $page
        ->component('front/companies/index')
        ->has('companies.data', 1)
        ->where('companies.data.0.name', 'Scraped Karivia Labs')
    );
});

test('companies page includes unique companies from scraped jobs', function () {
    ScrapedJob::create([
        'source_platform' => 'dealls',
        'source_job_id' => 'scraped-company-1',
        'source_url' => 'https://example.com/jobs/1',
        'company_name' => 'Scraped Company',
        'company_logo_url' => 'https://example.com/logo.png',
        'title' => 'Senior Engineer',
        'description' => 'A public scraped job.',
        'location' => 'Jakarta',
        'scraped_at' => now()->subHour(),
        'status' => 'pending',
    ]);

    ScrapedJob::create([
        'source_platform' => 'dealls',
        'source_job_id' => 'scraped-company-2',
        'source_url' => 'https://example.com/jobs/2',
        'company_name' => 'Scraped Company',
        'title' => 'Android Engineer',
        'description' => 'Another public scraped job.',
        'location' => 'Jakarta',
        'scraped_at' => now()->subHours(2),
        'status' => 'pending',
    ]);

    $this->get(route('companies.index'))
        ->assertInertia(fn ($page) => $page
            ->where('companies.total', 1)
            ->where('companies.data.0.name', 'Scraped Company')
            ->where('companies.data.0.source', 'scraped')
            ->where('companies.data.0.open_jobs_count', 2)
            ->where('companies.data.0.slug', null)
        );
});

test('companies pagination links are relative URLs', function () {
    foreach (range(1, 10) as $index) {
        ScrapedJob::create([
            'source_platform' => 'dealls',
            'source_job_id' => 'pagination-company-'.$index,
            'source_url' => 'https://example.com/jobs/pagination-'.$index,
            'company_name' => 'Pagination Company '.$index,
            'title' => 'Engineer '.$index,
            'description' => 'A public scraped job.',
            'location' => 'Jakarta',
            'scraped_at' => now()->subMinutes($index),
            'status' => 'pending',
        ]);
    }

    $this->get(route('companies.index'))
        ->assertInertia(fn ($page) => $page
            ->where('companies.links.2.url', '/companies?page=2')
            ->where('companies.links.3.url', '/companies?page=2')
        );
});
