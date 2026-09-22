<?php

use App\Models\Company;
use App\Models\JobListing;
use App\Models\ScrapedJob;
use App\Models\User;

test('guest can open public jobs page in home layout', function () {
    $employer = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Karivia Labs',
        'slug' => 'karivia-labs',
    ]);

    JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'title' => 'Backend Engineer',
        'slug' => 'backend-engineer-public',
        'description' => 'Build scalable API services.',
        'work_mode' => 'remote',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'status' => 'published',
        'published_at' => now(),
    ]);

    $response = $this->get(route('jobs.index'));

    $response->assertInertia(fn ($page) => $page
        ->component('front/jobs/index')
        ->has('jobs.data', 1)
        ->where('jobs.data.0.slug', 'backend-engineer-public')
    );
});

test('jobs page supports search filter', function () {
    $employer = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Nusantara Fintech',
        'slug' => 'nusantara-fintech',
    ]);

    JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'title' => 'Frontend Engineer',
        'slug' => 'frontend-engineer-public',
        'description' => 'Build delightful user interfaces.',
        'work_mode' => 'hybrid',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'status' => 'published',
        'published_at' => now(),
    ]);

    JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'title' => 'Data Engineer',
        'slug' => 'data-engineer-public',
        'description' => 'Build resilient data pipelines.',
        'work_mode' => 'remote',
        'job_type' => 'contract',
        'experience_level' => 'senior',
        'status' => 'published',
        'published_at' => now(),
    ]);

    $response = $this->get(route('jobs.index', ['search' => 'frontend']));

    $response->assertInertia(fn ($page) => $page
        ->component('front/jobs/index')
        ->has('jobs.data', 1)
        ->where('jobs.data.0.slug', 'frontend-engineer-public')
    );
});

test('jobs page combines public and scraped jobs in sixteen item pages', function () {
    $employer = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Karivia Labs',
        'slug' => 'karivia-labs',
    ]);

    foreach (range(1, 16) as $index) {
        JobListing::create([
            'company_id' => $company->id,
            'created_by' => $employer->id,
            'title' => "Backend Engineer {$index}",
            'slug' => "backend-engineer-{$index}",
            'description' => 'Build scalable API services.',
            'work_mode' => 'remote',
            'job_type' => 'full_time',
            'experience_level' => 'mid',
            'status' => 'published',
            'published_at' => now(),
        ]);
    }

    ScrapedJob::create([
        'source_platform' => 'test-source',
        'source_job_id' => 'scraped-1',
        'source_url' => 'https://example.com/jobs/scraped-1',
        'company_name' => 'Scraped Company',
        'title' => 'Mobile Engineer',
        'description' => 'Build mobile products.',
        'location' => 'Jakarta',
        'employment_type' => 'full_time',
        'workplace_type' => 'onsite',
        'imported_at' => now()->subDay(),
    ]);

    $response = $this->get(route('jobs.index'));

    $response->assertInertia(fn ($page) => $page
        ->component('front/jobs/index')
        ->where('jobs.per_page', 16)
        ->where('jobs.total', 17)
        ->where('jobs.last_page', 2)
        ->has('jobs.data', 16)
    );

    $this->get(route('jobs.index', ['page' => 2]))
        ->assertInertia(fn ($page) => $page
            ->has('jobs.data', 1)
            ->where('jobs.data.0.is_scraped', true)
        );
});
