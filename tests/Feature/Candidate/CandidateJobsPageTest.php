<?php

use App\Models\ScrapedJob;
use App\Models\User;

test('candidate jobs page lists external jobs', function () {
    $candidate = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);

    $job = ScrapedJob::create([
        'source_platform' => 'dealls',
        'source_job_id' => 'external-1',
        'source_url' => 'https://example.com/jobs/external-1',
        'company_name' => 'External Company',
        'company_logo_url' => 'https://example.com/logo.png',
        'title' => 'React Engineer',
        'description' => 'Build frontend products.',
        'location' => 'Jakarta',
        'employment_type' => 'FULL_TIME',
        'workplace_type' => 'REMOTE',
        'salary_min' => 10000000,
        'salary_max' => 15000000,
        'salary_currency' => 'IDR',
        'skills' => ['React', 'TypeScript'],
        'hr_email' => 'hr@example.com',
        'imported_at' => now(),
    ]);

    $this->actingAs($candidate)
        ->get(route('candidate.jobs.index'))
        ->assertInertia(fn ($page) => $page
            ->component('candidate/jobs/index')
            ->where('source', 'external')
            ->has('jobs.data', 1)
            ->where('jobs.data.0.id', $job->id)
            ->where('jobs.data.0.is_scraped', true)
            ->where('jobs.data.0.title', 'React Engineer')
            ->where('jobs.data.0.company_logo', 'https://example.com/logo.png')
            ->where('jobs.data.0.has_internal_apply', true)
        );
});

test('candidate external jobs support source filters', function () {
    $candidate = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);

    ScrapedJob::create([
        'source_platform' => 'dealls',
        'source_job_id' => 'remote-job',
        'source_url' => 'https://example.com/jobs/remote-job',
        'company_name' => 'Remote Company',
        'title' => 'Data Analyst',
        'description' => 'Analyze product data.',
        'location' => 'Bandung',
        'employment_type' => 'FULL_TIME',
        'workplace_type' => 'REMOTE',
        'salary_min' => 12000000,
        'imported_at' => now(),
    ]);

    ScrapedJob::create([
        'source_platform' => 'dealls',
        'source_job_id' => 'onsite-job',
        'source_url' => 'https://example.com/jobs/onsite-job',
        'company_name' => 'Onsite Company',
        'title' => 'Data Engineer',
        'description' => 'Build data pipelines.',
        'location' => 'Jakarta',
        'employment_type' => 'FULL_TIME',
        'workplace_type' => 'ONSITE',
        'salary_min' => 9000000,
        'imported_at' => now(),
    ]);

    $this->actingAs($candidate)
        ->get(route('candidate.jobs.index', [
            'work_mode' => 'remote',
            'salary_min' => 10000000,
        ]))
        ->assertInertia(fn ($page) => $page
            ->has('jobs.data', 1)
            ->where('jobs.data.0.title', 'Data Analyst')
        );
});

test('rejected external jobs stay hidden from candidate job flows', function () {
    $candidate = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);

    ScrapedJob::create([
        'source_platform' => 'dealls',
        'source_job_id' => 'visible-external',
        'source_url' => 'https://example.com/jobs/visible-external',
        'company_name' => 'Visible Company',
        'title' => 'Visible Engineer',
        'description' => 'Visible external job.',
        'location' => 'Jakarta',
        'employment_type' => 'FULL_TIME',
        'workplace_type' => 'REMOTE',
        'status' => 'pending',
        'imported_at' => now(),
    ]);

    $rejectedJob = ScrapedJob::create([
        'source_platform' => 'dealls',
        'source_job_id' => 'rejected-external',
        'source_url' => 'https://example.com/jobs/rejected-external',
        'company_name' => 'Rejected Company',
        'title' => 'Rejected Engineer',
        'description' => 'Rejected external job.',
        'location' => 'Jakarta',
        'employment_type' => 'FULL_TIME',
        'workplace_type' => 'REMOTE',
        'status' => 'rejected',
        'hr_email' => 'hr@rejected.example',
        'imported_at' => now(),
    ]);

    $this->actingAs($candidate)
        ->get(route('candidate.jobs.index'))
        ->assertInertia(fn ($page) => $page
            ->has('jobs.data', 1)
            ->where('jobs.data.0.title', 'Visible Engineer')
        );

    $this->get(route('jobs.scraped.show', $rejectedJob))
        ->assertNotFound();

    $this->actingAs($candidate)
        ->get(route('candidate.scraped-jobs.apply', $rejectedJob))
        ->assertNotFound();
});
