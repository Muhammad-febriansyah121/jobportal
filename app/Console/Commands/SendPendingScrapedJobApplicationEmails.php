<?php

namespace App\Console\Commands;

use App\Jobs\SendScrapedJobApplicationEmail;
use App\Models\Application;
use App\Services\ScrapedJobApplicationEmailService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('applications:send-pending-external-emails')]
#[Description('Queue pending emails for external job applications')]
class SendPendingScrapedJobApplicationEmails extends Command
{
    public function handle(ScrapedJobApplicationEmailService $emailService): int
    {
        if (! $emailService->isConfigured()) {
            $this->error('SMTP belum dikonfigurasi.');

            return self::FAILURE;
        }

        $count = 0;

        Application::query()
            ->whereNotNull('scraped_job_id')
            ->where('email_status', 'pending_smtp')
            ->eachById(function (Application $application) use (&$count): void {
                $application->update([
                    'email_status' => 'queued',
                    'email_failure_reason' => null,
                ]);
                SendScrapedJobApplicationEmail::dispatch($application->id);
                $count++;
            });

        $this->info("{$count} email lamaran dimasukkan ke queue.");

        return self::SUCCESS;
    }
}
