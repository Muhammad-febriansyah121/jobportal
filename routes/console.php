<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

if (config('salary_insights.auto_import.enabled')) {
    Schedule::command('salary-insights:import', [
        'file' => (string) config('salary_insights.auto_import.file'),
        '--dataset-date' => config('salary_insights.auto_import.dataset_date'),
        '--publish' => (bool) config('salary_insights.auto_import.publish'),
        '--source' => config('salary_insights.auto_import.source'),
    ])
        ->dailyAt((string) config('salary_insights.auto_import.time', '02:00'))
        ->when(function (): bool {
            $file = trim((string) config('salary_insights.auto_import.file'));

            if ($file === '') {
                return false;
            }

            $resolvedPath = is_file($file) ? $file : base_path($file);

            return is_readable($resolvedPath);
        })
        ->withoutOverlapping();
}
