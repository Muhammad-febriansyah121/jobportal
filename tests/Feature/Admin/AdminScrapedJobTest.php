<?php

use App\Models\ScrapedJob;
use App\Models\User;
use Illuminate\Support\Collection;
use Inertia\Testing\AssertableInertia as Assert;

function scrapedJobAdminRecord(array $overrides = []): ScrapedJob
{
    return ScrapedJob::create(array_merge([
        'source_platform' => 'dealls',
        'source_job_id' => 'dealls-admin-001',
        'source_url' => 'https://dealls.com/loker/admin-001',
        'company_name' => 'PT Karivia Test',
        'title' => 'Senior Backend Engineer',
        'description' => 'Build reliable backend systems.',
        'location' => 'Jakarta Selatan',
        'employment_type' => 'FULL_TIME',
        'workplace_type' => 'HYBRID',
        'salary_currency' => 'IDR',
        'requirements' => ['Laravel'],
        'skills' => ['PHP', 'MySQL'],
        'raw_payload' => ['source' => ['platform' => 'dealls']],
        'status' => 'pending',
        'scraped_at' => now(),
        'imported_at' => now(),
    ], $overrides));
}

test('admin can view scraped jobs and filter the results', function () {
    $admin = User::factory()->admin()->create();
    scrapedJobAdminRecord();
    scrapedJobAdminRecord([
        'source_platform' => 'glints',
        'source_job_id' => 'glints-admin-002',
        'title' => 'Product Designer',
        'company_name' => 'Other Company',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.scraped-jobs.index', ['platform' => 'dealls', 'search' => 'Senior']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/resources/index')
            ->where('title', 'Hasil Scrape')
            ->where('indexAction', '/admin/scraped-jobs')
            ->where('headerActions.0', fn (Collection $action): bool => $action['label'] === 'Ambil Data Lagi'
                && str_contains($action['href'], 'platform=dealls')
                && str_contains($action['href'], 'search=Senior'))
            ->where('rows.data', fn (Collection $rows): bool => $rows->count() === 1 && $rows->first()['title'] === 'Senior Backend Engineer')
            ->etc()
        );
});

test('admin can inspect a scraped job detail and its raw payload', function () {
    $admin = User::factory()->admin()->create();
    $scrapedJob = scrapedJobAdminRecord();

    $this->actingAs($admin)
        ->get(route('admin.scraped-jobs.show', $scrapedJob))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/resources/show')
            ->where('title', 'Detail Hasil Scrape')
            ->where('description', $scrapedJob->title)
            ->where('sections.4.items.0.value', fn (string $payload): bool => str_contains($payload, 'dealls'))
            ->etc()
        );
});

test('scraped job navigation uses same-origin relative urls', function () {
    $admin = User::factory()->admin()->create();
    $scrapedJob = scrapedJobAdminRecord();

    $this->actingAs($admin)
        ->get(route('admin.scraped-jobs.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('indexAction', '/admin/scraped-jobs')
            ->where('headerActions.0.href', '/admin/scraped-jobs')
            ->where('rows.data.0.actions.0.href', '/admin/scraped-jobs/'.$scrapedJob->id)
            ->etc()
        );
});

test('non admins cannot access scraped job results', function () {
    $candidate = User::factory()->candidate()->create();

    $this->actingAs($candidate)
        ->get(route('admin.scraped-jobs.index'))
        ->assertForbidden();
});
