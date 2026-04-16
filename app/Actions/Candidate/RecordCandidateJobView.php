<?php

namespace App\Actions\Candidate;

use App\Jobs\ComputeCandidateIntentJob;
use App\Models\CandidateJobView;
use App\Models\CandidateProfile;
use App\Models\JobListing;

class RecordCandidateJobView
{
    public function handle(CandidateProfile $candidate, JobListing $jobListing): void
    {
        $existing = CandidateJobView::query()
            ->where('candidate_id', $candidate->id)
            ->where('job_listing_id', $jobListing->id)
            ->first();

        if ($existing !== null) {
            $existing->increment('view_count');
            $existing->update(['last_viewed_at' => now()]);
        } else {
            CandidateJobView::create([
                'candidate_id' => $candidate->id,
                'job_listing_id' => $jobListing->id,
                'view_count' => 1,
                'first_viewed_at' => now(),
                'last_viewed_at' => now(),
            ]);
        }

        ComputeCandidateIntentJob::dispatch($candidate)->delay(now()->addMinutes(2));
    }
}
