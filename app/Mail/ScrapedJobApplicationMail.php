<?php

namespace App\Mail;

use App\Models\Application;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class ScrapedJobApplicationMail extends Mailable
{
    public function __construct(public Application $application) {}

    public function envelope(): Envelope
    {
        $this->application->loadMissing(['candidate.user', 'scrapedJob']);
        $candidateName = $this->application->candidate?->full_name
            ?: $this->application->candidate?->user?->name
            ?: 'Kandidat';
        $candidateEmail = $this->application->candidate?->user?->email;
        $jobTitle = $this->application->scrapedJob?->title ?? 'Lowongan pekerjaan';

        return new Envelope(
            to: [new Address($this->application->recipient_email)],
            replyTo: $candidateEmail !== null
                ? [new Address($candidateEmail, $candidateName)]
                : [],
            subject: "Lamaran {$jobTitle} — {$candidateName}",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.scraped-job-application',
            with: [
                'application' => $this->application,
                'candidate' => $this->application->candidate,
                'candidateUser' => $this->application->candidate?->user,
                'job' => $this->application->scrapedJob,
            ],
        );
    }

    public function attachments(): array
    {
        $fileUrl = (string) $this->application->cv?->file_url;
        $path = $this->storagePath($fileUrl);

        if ($path === null || ! Storage::disk('public')->exists($path)) {
            throw new RuntimeException('File CV kandidat tidak ditemukan.');
        }

        return [
            Attachment::fromStorageDisk('public', $path)
                ->as($this->cvFilename($path))
                ->withMime(Storage::disk('public')->mimeType($path) ?: 'application/octet-stream'),
        ];
    }

    private function storagePath(string $fileUrl): ?string
    {
        $path = parse_url($fileUrl, PHP_URL_PATH);

        if (! is_string($path) || $path === '') {
            return null;
        }

        return str_starts_with($path, '/storage/')
            ? Str::after($path, '/storage/')
            : ltrim($path, '/');
    }

    private function cvFilename(string $path): string
    {
        return basename($path) ?: 'CV-kandidat';
    }
}
