<?php

namespace App\Http\Controllers;

use App\Actions\Scraper\ImportScrapedJob;
use App\Http\Requests\StoreScrapedJobRequest;
use Illuminate\Http\JsonResponse;

class ScrapedJobIngestionController extends Controller
{
    public function store(StoreScrapedJobRequest $request, ImportScrapedJob $importScrapedJob): JsonResponse
    {
        $scrapedJob = $importScrapedJob->handle($request->validated());
        $created = $scrapedJob->wasRecentlyCreated;

        return response()->json([
            'success' => true,
            'status' => $created ? 'created' : 'updated',
            'id' => $scrapedJob->id,
            'source' => $scrapedJob->source_platform,
            'source_job_id' => $scrapedJob->source_job_id,
        ], $created ? 201 : 200);
    }
}
