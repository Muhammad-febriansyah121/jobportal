<?php

namespace App\Jobs;

use App\Mail\ScrapedJobApplicationMail;
use App\Models\Application;
use App\Services\ScrapedJobApplicationEmailService;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SendScrapedJobApplicationEmail implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    /** @var array<int, int> */
    public array $backoff = [60, 300, 900];

    public int $timeout = 120;

    public int $uniqueFor = 3600;

    public function __construct(public int $applicationId) {}

    public function uniqueId(): string
    {
        return (string) $this->applicationId;
    }

    public function handle(ScrapedJobApplicationEmailService $emailService): void
    {
        $application = Application::query()
            ->with(['candidate.user', 'cv', 'scrapedJob'])
            ->findOrFail($this->applicationId);

        if ($application->email_status === 'sent') {
            return;
        }

        if (! $emailService->isConfigured()) {
            $application->update([
                'email_status' => 'pending_smtp',
                'email_failure_reason' => 'SMTP belum dikonfigurasi.',
            ]);

            return;
        }

        $application->update([
            'email_status' => 'sending',
            'email_failure_reason' => null,
            'email_failed_at' => null,
        ]);

        Mail::mailer('smtp')->send(new ScrapedJobApplicationMail($application));

        $application->update([
            'email_status' => 'sent',
            'email_sent_at' => now(),
            'email_failure_reason' => null,
        ]);
    }

    public function failed(Throwable $exception): void
    {
        Application::query()
            ->whereKey($this->applicationId)
            ->update([
                'email_status' => 'failed',
                'email_failed_at' => now(),
                'email_failure_reason' => mb_substr($exception->getMessage(), 0, 2000),
            ]);
    }
}
