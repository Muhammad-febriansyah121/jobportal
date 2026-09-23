<?php

namespace App\Actions\Candidate;

use App\Jobs\SendScrapedJobApplicationEmail;
use App\Models\Application;
use App\Models\CandidateProfile;
use App\Models\ScrapedJob;
use App\Services\ScrapedJobApplicationEmailService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SubmitScrapedJobApplication
{
    public function __construct(private readonly ScrapedJobApplicationEmailService $emailService) {}

    /**
     * @param  array{phone: string, candidate_cv_id?: int|null, cover_letter?: string|null, consent_to_email: bool}  $data
     */
    public function handle(ScrapedJob $scrapedJob, CandidateProfile $candidate, array $data): Application
    {
        $recipientEmail = trim((string) $scrapedJob->hr_email);

        if (filter_var($recipientEmail, FILTER_VALIDATE_EMAIL) === false) {
            throw ValidationException::withMessages([
                'job' => 'Email perusahaan untuk lowongan ini belum tersedia atau tidak valid.',
            ]);
        }

        $cv = filled($data['candidate_cv_id'] ?? null)
            ? $candidate->cvs()->whereKey($data['candidate_cv_id'])->first()
            : $candidate->primaryCv;

        if ($cv === null) {
            throw ValidationException::withMessages([
                'candidate_cv_id' => 'Pilih CV sebelum mengirim lamaran.',
            ]);
        }

        if ($candidate->applications()->where('scraped_job_id', $scrapedJob->id)->exists()) {
            throw ValidationException::withMessages([
                'job' => 'Kamu sudah melamar lowongan ini.',
            ]);
        }

        $emailStatus = $this->emailService->isConfigured() ? 'queued' : 'pending_smtp';

        return DB::transaction(function () use ($candidate, $cv, $data, $emailStatus, $recipientEmail, $scrapedJob): Application {
            $application = $candidate->applications()->create([
                'scraped_job_id' => $scrapedJob->id,
                'candidate_cv_id' => $cv->id,
                'status' => 'applied',
                'cover_letter' => $data['cover_letter'] ?? null,
                'recipient_email' => $recipientEmail,
                'email_status' => $emailStatus,
                'applied_at' => now(),
            ]);

            $application->statusHistories()->create([
                'from_status' => null,
                'to_status' => 'applied',
                'changed_by' => $candidate->user_id,
                'note' => 'Lamaran lowongan dibuat oleh kandidat.',
            ]);

            if ($emailStatus === 'queued') {
                SendScrapedJobApplicationEmail::dispatch($application->id)->afterCommit();
            }

            return $application;
        });
    }
}
