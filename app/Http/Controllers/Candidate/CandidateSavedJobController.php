<?php

namespace App\Http\Controllers\Candidate;

use App\Actions\Candidate\ResolveCandidateProfile;
use App\Http\Controllers\Controller;
use App\Jobs\ComputeCandidateIntentJob;
use App\Models\JobListing;
use App\Models\JobListingAnalytic;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CandidateSavedJobController extends Controller
{
    public function index(Request $request, ResolveCandidateProfile $resolveCandidateProfile): Response
    {
        $candidate = $resolveCandidateProfile->handle($request->user());

        return Inertia::render('candidate/saved-jobs', [
            'savedJobs' => $candidate->savedJobs()
                ->with(['jobListing:id,company_id,title,slug,location_city,location_province,work_mode,job_type,salary_min,salary_max,is_salary_visible,published_at', 'jobListing.company:id,name,is_verified'])
                ->latest()
                ->paginate(12)
                ->withQueryString()
                ->through(fn ($savedJob): array => [
                    'id' => $savedJob->id,
                    'job_id' => $savedJob->jobListing?->id,
                    'slug' => $savedJob->jobListing?->slug,
                    'title' => $savedJob->jobListing?->title,
                    'company' => $savedJob->jobListing?->company?->name,
                    'company_verified' => (bool) $savedJob->jobListing?->company?->is_verified,
                    'location' => collect([$savedJob->jobListing?->location_city, $savedJob->jobListing?->location_province])->filter()->implode(', '),
                    'work_mode' => str($savedJob->jobListing?->work_mode)->headline()->toString(),
                    'job_type' => str($savedJob->jobListing?->job_type)->headline()->toString(),
                    'salary_range' => $this->salaryRange($savedJob->jobListing),
                    'saved_at' => $savedJob->created_at?->format('d M Y'),
                ]),
        ]);
    }

    public function store(Request $request, JobListing $jobListing, ResolveCandidateProfile $resolveCandidateProfile): RedirectResponse
    {
        abort_unless($jobListing->status === 'published', 404);

        $candidate = $resolveCandidateProfile->handle($request->user());
        $candidate->savedJobs()->firstOrCreate(['job_listing_id' => $jobListing->id]);

        JobListingAnalytic::query()
            ->firstOrCreate(['job_listing_id' => $jobListing->id, 'date' => today()])
            ->increment('saves_count');

        ComputeCandidateIntentJob::dispatch($candidate);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Lowongan berhasil disimpan.']);

        return back();
    }

    public function destroy(Request $request, JobListing $jobListing, ResolveCandidateProfile $resolveCandidateProfile): RedirectResponse
    {
        $candidate = $resolveCandidateProfile->handle($request->user());
        $candidate->savedJobs()->where('job_listing_id', $jobListing->id)->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Lowongan dihapus dari simpanan.']);

        return back();
    }

    private function salaryRange(?JobListing $job): string
    {
        if ($job === null || ! $job->is_salary_visible || ($job->salary_min === null && $job->salary_max === null)) {
            return 'Salary tidak ditampilkan';
        }

        return collect([$job->salary_min, $job->salary_max])
            ->filter(fn (?int $amount): bool => $amount !== null)
            ->map(fn (int $amount): string => 'Rp'.number_format($amount, 0, ',', '.'))
            ->implode(' - ');
    }
}
