<?php

namespace App\Services;

use App\Support\CvContactExtractor;
use App\Support\CvDocumentPayload;
use Illuminate\Support\Facades\Log;
use Laravel\Ai\Files\Document;
use Throwable;

/**
 * Prepares an uploaded CV for AI parsing.
 *
 * PDFs are attached to the prompt verbatim so the model reads them natively
 * (the previous regex-only text extraction silently dropped contact details
 * on PDFs with subset/CID fonts or multi-column layouts). DOCX and any PDF we
 * cannot attach fall back to extracted text. In every case we also compute
 * deterministic contact hints from whatever text we can pull, to backfill
 * fields the model misses.
 */
class CvDocumentLoaderService
{
    public function __construct(private readonly CvTextExtractorService $extractor) {}

    public function load(string $absolutePath, string $mimeType): CvDocumentPayload
    {
        $text = $this->extractor->extractFromPath($absolutePath, $mimeType);
        $contactHints = CvContactExtractor::fromText($text);

        if ($this->isPdf($mimeType, $absolutePath)) {
            try {
                return new CvDocumentPayload(
                    mode: 'attachment',
                    attachments: [Document::fromPath($absolutePath)],
                    text: $text,
                    contactHints: $contactHints,
                );
            } catch (Throwable $exception) {
                Log::warning('CvDocumentLoader: failed to attach PDF, falling back to text', [
                    'path' => $absolutePath,
                    'message' => $exception->getMessage(),
                ]);
            }
        }

        return new CvDocumentPayload(
            mode: trim($text) === '' ? 'empty' : 'text',
            attachments: [],
            text: $text,
            contactHints: $contactHints,
        );
    }

    private function isPdf(string $mimeType, string $path): bool
    {
        return str_contains($mimeType, 'pdf')
            || str_ends_with(strtolower($path), '.pdf');
    }
}
