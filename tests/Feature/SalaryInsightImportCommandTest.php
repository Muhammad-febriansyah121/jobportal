<?php

use App\Models\Industry;
use App\Models\SalaryInsight;
use Illuminate\Support\Str;

test('salary insight csv import command aggregates rows and updates existing records', function () {
    $industry = Industry::factory()->create([
        'name' => 'Technology',
        'slug' => 'technology',
    ]);

    SalaryInsight::factory()->create([
        'industry_id' => $industry->id,
        'company_id' => null,
        'job_title' => 'Backend Developer',
        'location_city' => 'Jakarta',
        'salary_min' => 9_000_000,
        'salary_median' => 12_000_000,
        'salary_max' => 16_000_000,
        'source_count' => 1,
        'published_at' => null,
    ]);

    $csvPath = writeSalaryInsightCsv(<<<'CSV'
job_title;location_city;salary_min;salary_max;industry;source_count
Backend Developer;Jakarta;Rp 10.000.000;Rp 18.000.000;Technology;2
Backend Developer;Jakarta;12.000.000;22.000.000;Technology;1
Data Analyst;Bandung;7.000.000;11.000.000;Technology;1
;Bandung;7.000.000;11.000.000;Technology;1
CSV
    );

    $this->artisan('salary-insights:import', [
        'file' => $csvPath,
        '--dataset-date' => '2026-04-23',
        '--publish' => true,
        '--source' => 'LinkedIn + JobStreet',
    ])->assertSuccessful();

    $backend = SalaryInsight::query()
        ->where('job_title', 'Backend Developer')
        ->where('location_city', 'Jakarta')
        ->where('industry_id', $industry->id)
        ->whereNull('company_id')
        ->firstOrFail();

    expect($backend->salary_min)->toBe(10_000_000);
    expect($backend->salary_median)->toBe(15_500_000);
    expect($backend->salary_max)->toBe(22_000_000);
    expect($backend->source_count)->toBe(3);
    expect($backend->source_name)->toBe('LinkedIn + JobStreet');
    expect($backend->dataset_date?->format('Y-m-d'))->toBe('2026-04-23');
    expect($backend->published_at)->not->toBeNull();

    $analyst = SalaryInsight::query()
        ->where('job_title', 'Data Analyst')
        ->where('location_city', 'Bandung')
        ->where('industry_id', $industry->id)
        ->whereNull('company_id')
        ->firstOrFail();

    expect($analyst->salary_min)->toBe(7_000_000);
    expect($analyst->salary_median)->toBe(9_000_000);
    expect($analyst->salary_max)->toBe(11_000_000);
    expect($analyst->source_count)->toBe(1);
    expect($analyst->source_name)->toBe('LinkedIn + JobStreet');
    expect($analyst->dataset_date?->format('Y-m-d'))->toBe('2026-04-23');
    expect($analyst->published_at)->not->toBeNull();
});

test('salary insight csv import command supports dry run mode', function () {
    $csvPath = writeSalaryInsightCsv(<<<'CSV'
job_title,location_city,salary_min,salary_max,industry
Frontend Developer,Jakarta,8000000,14000000,Technology
CSV
    );

    $this->artisan('salary-insights:import', [
        'file' => $csvPath,
        '--dry-run' => true,
    ])->assertSuccessful();

    expect(SalaryInsight::query()->where('job_title', 'Frontend Developer')->exists())->toBeFalse();
});

test('salary insight csv import command fails for missing file', function () {
    $this->artisan('salary-insights:import', [
        'file' => 'storage/app/imports/not-found.csv',
    ])->assertFailed();
});

function writeSalaryInsightCsv(string $contents): string
{
    $directory = storage_path('framework/testing');

    if (! is_dir($directory)) {
        mkdir($directory, 0777, true);
    }

    $path = $directory.'/salary-insights-'.Str::uuid().'.csv';
    file_put_contents($path, trim($contents).PHP_EOL);

    return $path;
}
