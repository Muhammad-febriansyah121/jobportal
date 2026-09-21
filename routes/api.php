<?php

use App\Http\Controllers\PakasirWebhookController;
use App\Http\Controllers\ScrapedJobIngestionController;
use Illuminate\Support\Facades\Route;

Route::post('webhooks/pakasir', [PakasirWebhookController::class, 'handle'])
    ->name('api.webhooks.pakasir');

Route::post('jobs/import', [ScrapedJobIngestionController::class, 'store'])
    ->middleware(['scraper.token', 'throttle:60,1'])
    ->name('api.jobs.import');

Route::post('ingest/scraped-jobs', [ScrapedJobIngestionController::class, 'store'])
    ->middleware(['scraper.token', 'throttle:60,1'])
    ->name('api.ingest.scraped-jobs');
