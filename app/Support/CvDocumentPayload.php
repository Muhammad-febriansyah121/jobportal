<?php

namespace App\Support;

use Laravel\Ai\Files\Document;

/**
 * Result of loading an uploaded CV for AI parsing.
 *
 * A CV is presented to the model in one of two modes:
 *  - "attachment": the original PDF is sent as a {@see Document} so the model
 *    reads it natively (most robust — survives fancy fonts, columns, headers).
 *  - "text": plain text extracted from the file (used for DOCX, or as a PDF
 *    fallback when the file cannot be attached).
 *
 * `text` is always populated when extraction succeeds — even in attachment
 * mode — so deterministic {@see $contactHints} can backfill anything the model
 * misses. "empty" mode signals that nothing usable could be loaded.
 */
class CvDocumentPayload
{
    /**
     * @param  'attachment'|'text'|'empty'  $mode
     * @param  list<Document>  $attachments
     * @param  array{phone: string, email: string, linkedin_url: string, github_url: string, portfolio_url: string}  $contactHints
     */
    public function __construct(
        public readonly string $mode,
        public readonly array $attachments,
        public readonly string $text,
        public readonly array $contactHints,
    ) {}

    /**
     * Whether there is enough material to attempt an AI parse.
     */
    public function isUsable(): bool
    {
        return $this->mode === 'attachment'
            || ($this->mode === 'text' && trim($this->text) !== '');
    }

    public function hasAttachments(): bool
    {
        return $this->attachments !== [];
    }
}
