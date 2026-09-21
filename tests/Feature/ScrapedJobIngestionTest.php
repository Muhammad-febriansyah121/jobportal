<?php

use App\Models\JobListing;
use App\Models\ScrapedJob;

function scrapedJobPayload(): array
{
    return [
        'source' => [
            'platform' => 'dealls',
            'job_id' => 'dealls-6aabaa1bd4c8310011bd25c8',
            'url' => 'https://dealls.com/loker/relationship-manager-funding-retail-7~cicilcoid',
        ],
        'company' => [
            'name' => 'PT Cicil Solusi Mitra Teknologi (CICIL)',
            'logo_url' => 'https://cdn.sejutacita.id/logo.png',
            'website' => 'https://www.cicil.co.id/',
            'profile' => 'CICIL is a licensed P2P Lending Fintech company.',
        ],
        'job' => [
            'title' => 'Relationship Manager Funding (Retail)',
            'description' => 'Acquire new potential lender.',
            'salary' => [
                'min' => 6000000,
                'max' => 9000000,
                'currency' => 'IDR',
            ],
            'location' => 'Jakarta Selatan',
            'employment_type' => 'FULL_TIME',
            'workplace_type' => 'ONSITE',
            'requirements' => ['Bachelor degree', '1-2 years experience'],
            'skills' => ['Funding', 'Communication'],
        ],
        'contact' => [
            'hr_email' => 'elma.pratiwi@cicil.co.id',
            'email_source' => 'https://dealls.com/loker/relationship-manager-funding-retail-7~cicilcoid',
            'email_verified' => true,
        ],
        'metadata' => [
            'scraped_at' => '2026-09-17T08:51:39.764Z',
        ],
    ];
}

function scraperHeaders(): array
{
    return ['Authorization' => 'Bearer secret-token'];
}

test('scraped jobs require the bearer ingestion token', function () {
    config(['scraper.ingest_token' => 'secret-token']);

    $this->postJson(route('api.jobs.import'), scrapedJobPayload())
        ->assertUnauthorized();
});

test('scraped jobs are stored in the raw table and remain out of public jobs', function () {
    config(['scraper.ingest_token' => 'secret-token']);

    $payload = scrapedJobPayload();

    $this->withHeaders(scraperHeaders())
        ->postJson(route('api.jobs.import'), $payload)
        ->assertCreated()
        ->assertJsonPath('success', true)
        ->assertJsonPath('status', 'created')
        ->assertJsonPath('source', 'dealls')
        ->assertJsonPath('source_job_id', $payload['source']['job_id']);

    $this->withHeaders(scraperHeaders())
        ->postJson(route('api.jobs.import'), $payload)
        ->assertOk()
        ->assertJsonPath('status', 'updated');

    $scrapedJob = ScrapedJob::query()->firstOrFail();

    expect(ScrapedJob::query()->count())->toBe(1)
        ->and(JobListing::query()->count())->toBe(0)
        ->and($scrapedJob->status)->toBe('pending')
        ->and($scrapedJob->requirements)->toBe($payload['job']['requirements'])
        ->and($scrapedJob->skills)->toBe($payload['job']['skills'])
        ->and($scrapedJob->raw_payload)->toBe($payload)
        ->and($scrapedJob->hr_email)->toBe($payload['contact']['hr_email']);
});

test('scraped jobs validate nested fields', function () {
    config(['scraper.ingest_token' => 'secret-token']);

    $payload = scrapedJobPayload();
    unset($payload['job']['title'], $payload['contact']['email_source']);
    $payload['job']['skills'] = ['valid skill', 123];

    $this->withHeaders(scraperHeaders())
        ->postJson(route('api.jobs.import'), $payload)
        ->assertUnprocessable()
        ->assertJsonValidationErrors([
            'job.title',
            'job.skills.1',
        ]);
});
