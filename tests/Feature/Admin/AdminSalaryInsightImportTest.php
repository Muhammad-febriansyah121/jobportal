<?php

use App\Models\ActivityLog;
use App\Models\Industry;
use App\Models\SalaryInsight;
use App\Models\User;
use Illuminate\Http\UploadedFile;

test('admin can import salary insights from csv via admin action', function () {
    $admin = User::factory()->admin()->create();
    Industry::factory()->create([
        'name' => 'Technology',
        'slug' => 'technology',
    ]);

    $file = UploadedFile::fake()->createWithContent(
        'salary-insights.csv',
        <<<'CSV'
job_name;lokasi;industri;gaji;median_gaji;sumber
Data Scientist;dki jakarta;technology;[20000000,25000000];22500000;jobstreet
Data Scientist;dki jakarta;technology;[21000000,26000000];23500000;linkedin
CSV,
    );

    $this->actingAs($admin)
        ->post(route('admin.salary-insights.import'), [
            'file' => $file,
            'source_name' => 'LinkedIn + JobStreet',
            'dataset_date' => '2026-04-23',
            'publish' => '1',
        ])
        ->assertRedirect();

    $insight = SalaryInsight::query()
        ->where('job_title', 'Data Scientist')
        ->where('location_city', 'Dki Jakarta')
        ->firstOrFail();

    expect($insight->salary_min)->toBe(20_000_000);
    expect($insight->salary_max)->toBe(26_000_000);
    expect($insight->source_count)->toBe(2);
    expect($insight->source_name)->toBe('LinkedIn + JobStreet');
    expect($insight->dataset_date?->format('Y-m-d'))->toBe('2026-04-23');
    expect($insight->published_at)->not->toBeNull();

    expect(
        ActivityLog::query()
            ->where('action', 'import_salary_insight_csv')
            ->where('actor_id', $admin->id)
            ->exists()
    )->toBeTrue();
});

test('admin salary insight import validates csv upload', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.salary-insights.import'), [
            'source_name' => 'LinkedIn + JobStreet',
            'dataset_date' => '2026/04/23',
            'publish' => '1',
        ])
        ->assertSessionHasErrors(['file', 'dataset_date']);
});
