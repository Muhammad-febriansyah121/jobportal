<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class AdminSmtpTestMail extends Mailable
{
    public function __construct(public string $brandName) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Tes Koneksi SMTP — {$this->brandName}",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.admin.smtp-test',
            with: [
                'brandName' => $this->brandName,
            ],
        );
    }
}
