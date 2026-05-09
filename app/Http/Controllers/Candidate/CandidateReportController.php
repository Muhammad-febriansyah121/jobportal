<?php

namespace App\Http\Controllers\Candidate;

use App\Http\Controllers\Controller;
use App\Http\Requests\Candidate\ReportJobRequest;
use App\Models\JobListing;
use App\Models\Report;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class CandidateReportController extends Controller
{
    public function store(ReportJobRequest $request, JobListing $jobListing): RedirectResponse
    {
        abort_unless($jobListing->status === 'published', 404);

        Report::create([
            'reporter_id' => $request->user()->id,
            'reportable_type' => $jobListing->getMorphClass(),
            'reportable_id' => $jobListing->id,
            'reason' => $request->validated('reason'),
            'reporter_note' => $request->validated('reporter_note'),
            'status' => 'open',
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Report lowongan berhasil dikirim.']);

        return back();
    }
}
