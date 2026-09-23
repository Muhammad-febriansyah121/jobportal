<?php

use App\Models\Company;
use App\Models\Industry;
use App\Models\ScrapedJob;
use App\Models\User;

test('guest can open public companies page in home layout', function () {
    $industry = Industry::factory()->create(['name' => 'Technology']);

    $owner = User::factory()->employer()->create();
    Company::create([
        'owner_id' => $owner->id,
        'industry_id' => $industry->id,
        'name' => 'Karivia Labs',
        'slug' => 'karivia-labs',
        'is_active' => true,
        'is_verified' => true,
    ]);

    $response = $this->get(route('companies.index'));

    $response->assertInertia(fn ($page) => $page
        ->component('front/companies/index')
        ->has('companies.data', 1)
        ->where('companies.data.0.slug', 'karivia-labs')
    );
});

test('companies page supports search filter', function () {
    $industry = Industry::factory()->create(['name' => 'Technology']);

    $owner = User::factory()->employer()->create();

    Company::create([
        'owner_id' => $owner->id,
        'industry_id' => $industry->id,
        'name' => 'Karivia Labs',
        'slug' => 'karivia-labs-filter',
        'is_active' => true,
    ]);

    Company::create([
        'owner_id' => $owner->id,
        'industry_id' => $industry->id,
        'name' => 'Nusantara Fintech',
        'slug' => 'nusantara-fintech-filter',
        'is_active' => true,
    ]);

    $response = $this->get(route('companies.index', ['search' => 'karivia']));

    $response->assertInertia(fn ($page) => $page
        ->component('front/companies/index')
        ->has('companies.data', 1)
        ->where('companies.data.0.slug', 'karivia-labs-filter')
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
