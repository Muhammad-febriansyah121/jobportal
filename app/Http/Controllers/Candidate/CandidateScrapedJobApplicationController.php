<?php

namespace App\Http\Controllers\Candidate;

use App\Actions\Candidate\ResolveCandidateProfile;
use App\Actions\Candidate\SubmitScrapedJobApplication;
use App\Http\Controllers\Controller;
use App\Http\Requests\Candidate\ApplyScrapedJobRequest;
use App\Models\ScrapedJob;
use App\Services\ScrapedJobApplicationEmailService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CandidateScrapedJobApplicationController extends Controller
{
    public function create(
        Request $request,
        ScrapedJob $scrapedJob,
        ResolveCandidateProfile $resolveCandidateProfile,
        ScrapedJobApplicationEmailService $emailService,
    ): Response|RedirectResponse {
        $candidate = $resolveCandidateProfile->handle($request->user());
        $existing = $candidate->applications()->where('scraped_job_id', $scrapedJob->id)->first();

        if ($existing !== null) {
            return to_route('candidate.applications.show', $existing);
        }

        $this->ensureEmailAvailable($scrapedJob);

        return Inertia::render('candidate/jobs/scraped-apply', [
            'job' => [
                'id' => $scrapedJob->id,
                'title' => $scrapedJob->title,
                'company' => $scrapedJob->company_name,
                'location' => $scrapedJob->location,
                'work_mode' => str($scrapedJob->workplace_type)->headline()->toString(),
                'job_type' => str($scrapedJob->employment_type)->headline()->toString(),
                'salary_range' => $this->salaryRange($scrapedJob),
                'detail_url' => route('jobs.scraped.show', $scrapedJob, absolute: false),
                'recipient_email' => $this->maskEmail((string) $scrapedJob->hr_email),
            ],
            'cvs' => $candidate->cvs()
                ->latest('is_primary')
                ->latest('uploaded_at')
                ->get()
                ->map(fn ($cv): array => [
                    'id' => $cv->id,
                    'is_primary' => $cv->is_primary,
                    'uploaded_at' => $cv->uploaded_at?->format('d M Y'),
                ]),
            'candidate_phone' => $request->user()->phone,
            'email_delivery_ready' => $emailService->isConfigured(),
        ]);
    }

    public function store(
        ApplyScrapedJobRequest $request,
        ScrapedJob $scrapedJob,
        ResolveCandidateProfile $resolveCandidateProfile,
        SubmitScrapedJobApplication $submitScrapedJobApplication,
    ): RedirectResponse {
        $this->ensureEmailAvailable($scrapedJob);
        $candidate = $resolveCandidateProfile->handle($request->user());
        $request->user()->update(['phone' => $request->validated('phone')]);
        $application = $submitScrapedJobApplication->handle($scrapedJob, $candidate, $request->validated());

        $message = $application->email_status === 'queued'
            ? 'Lamaran disimpan dan email sedang dikirim ke perusahaan.'
            : 'Lamaran disimpan. Email akan dikirim setelah SMTP dikonfigurasi.';

        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return to_route('candidate.applications.show', $application);
    }

    private function ensureEmailAvailable(ScrapedJob $scrapedJob): void
    {
        if (filter_var($scrapedJob->hr_email, FILTER_VALIDATE_EMAIL) !== false) {
            return;
        }

        throw ValidationException::withMessages([
            'job' => 'Email perusahaan untuk lowongan ini belum tersedia atau tidak valid.',
        ]);
    }

    private function maskEmail(string $email): string
    {
        [$local, $domain] = explode('@', $email, 2);

        return mb_substr($local, 0, 2).'***@'.$domain;
    }

    private function salaryRange(ScrapedJob $scrapedJob): string
    {
        $amounts = collect([$scrapedJob->salary_min, $scrapedJob->salary_max])
            ->filter(fn (?int $amount): bool => $amount !== null)
            ->map(fn (int $amount): string => number_format($amount, 0, ',', '.'))
            ->values();

        return $amounts->isEmpty()
            ? 'Gaji tidak dicantumkan'
            : ($scrapedJob->salary_currency ?? 'IDR').' '.$amounts->implode(' - ');
    }
}
