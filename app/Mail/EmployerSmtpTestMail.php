<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class EmployerSmtpTestMail extends Mailable
{
    public function __construct(public string $brandName, public string $companyName) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Tes Koneksi SMTP — {$this->companyName}",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.employer.smtp-test',
            with: [
                'brandName' => $this->brandName,
                'companyName' => $this->companyName,
            ],
        );
    }
}
