<?php

namespace App\Support;

use Illuminate\Support\Str;

class SimplePdfDocument
{
    // Primary #01296a
    private const float PR = 0.004;

    private const float PG = 0.161;

    private const float PB = 0.416;

    // Primary-500 #1e4d96
    private const float P5R = 0.118;

    private const float P5G = 0.302;

    private const float P5B = 0.588;

    // Primary-50 #eaf2ff
    private const float P50R = 0.918;

    private const float P50G = 0.949;

    private const float P50B = 1.0;

    // Primary-100 #d6e5ff
    private const float P100R = 0.839;

    private const float P100G = 0.898;

    private const float P100B = 1.0;

    /**
     * @var array<int, array<int, string>>
     */
    private array $pages = [[]];

    private float $cursorY = 800.0;

    private float $leftMargin = 48.0;

    private float $rightMargin = 547.0;

    public function __construct(
        private readonly string $title = 'CV Builder',
        private readonly float $fontSize = 10.5
    ) {}

    public function addTitle(string $text): void
    {
        $this->addLine(Str::upper($text), 18, true, 'center');
        $this->cursorY -= 2;
    }

    public function addMeta(string $text): void
    {
        if (trim($text) === '') {
            return;
        }

        $this->addLine($text, 10.5, false, 'center');
        $this->cursorY -= 2;
    }

    public function addStyledHeader(string $title, string $candidate, string $job): void
    {
        $bgHeight = 92.0;
        $rectY = $this->cursorY - $bgHeight + 24;

        $this->drawFilledRect(
            $this->leftMargin - 12,
            $rectY,
            ($this->rightMargin - $this->leftMargin) + 24,
            $bgHeight,
            self::PR, self::PG, self::PB,
        );

        // Thin accent strip at bottom of header
        $this->drawFilledRect(
            $this->leftMargin - 12,
            $rectY,
            ($this->rightMargin - $this->leftMargin) + 24,
            5.0,
            self::P5R, self::P5G, self::P5B,
        );

        $titleFontSize = 22.0;
        $titleWidth = $this->estimateTextWidth(Str::upper($title), $titleFontSize);
        $titleX = $this->leftMargin + ($this->contentWidth() - $titleWidth) / 2;
        $this->drawColoredText(Str::upper($title), $titleX, $this->cursorY, $titleFontSize, true, 1.0, 1.0, 1.0);
        $this->cursorY -= 34;

        $sub = $candidate.' | '.$job;
        $subFontSize = 11.0;
        $subWidth = $this->estimateTextWidth($sub, $subFontSize);
        $subX = $this->leftMargin + ($this->contentWidth() - $subWidth) / 2;
        $this->drawColoredText($sub, $subX, $this->cursorY, $subFontSize, false, self::P50R, self::P50G, self::P50B);
        $this->cursorY -= 40;
    }

    /**
     * @param  array<int, array{0: string, 1: string}>  $pairs
     */
    public function addInfoStrip(array $pairs): void
    {
        if ($pairs === []) {
            return;
        }

        $bgHeight = 32.0;
        $rectY = $this->cursorY - $bgHeight + 10;

        $this->drawFilledRect(
            $this->leftMargin - 12,
            $rectY,
            ($this->rightMargin - $this->leftMargin) + 24,
            $bgHeight,
            self::P50R, self::P50G, self::P50B,
        );

        $count = count($pairs);
        $slotWidth = $this->contentWidth() / $count;
        $textY = $this->cursorY - 6;

        foreach ($pairs as $i => [$label, $value]) {
            $x = $this->leftMargin + ($i * $slotWidth);
            $labelText = $label.': ';
            $labelWidth = $this->estimateTextWidth($labelText, 9.0);
            $this->drawColoredText($labelText, $x, $textY, 9.0, true, self::PR, self::PG, self::PB);
            $this->drawColoredText($value, $x + $labelWidth, $textY, 9.0, false, 0.25, 0.25, 0.25);
        }

        $this->cursorY -= $bgHeight;
    }

    public function addScoreBanner(int $score, string $recommendation): void
    {
        $this->cursorY -= 8;
        $bgHeight = 52.0;

        $this->drawFilledRect(
            $this->leftMargin,
            $this->cursorY - $bgHeight + 14,
            $this->contentWidth(),
            $bgHeight,
            self::P50R, self::P50G, self::P50B,
        );

        // Left accent bar
        $this->drawFilledRect(
            $this->leftMargin,
            $this->cursorY - $bgHeight + 14,
            4.0,
            $bgHeight,
            self::PR, self::PG, self::PB,
        );

        $scoreLabel = "Fit Score:  {$score}/100";
        $this->drawColoredText($scoreLabel, $this->leftMargin + 14, $this->cursorY - 10, 15, true, self::PR, self::PG, self::PB);

        $recWidth = $this->estimateTextWidth($recommendation, 10.0);
        $recX = $this->rightMargin - $recWidth - 10;
        $this->drawColoredText($recommendation, $recX, $this->cursorY - 12, 10.0, false, 0.4, 0.4, 0.4);

        $this->cursorY -= $bgHeight + 4;
    }

    public function addSection(string $text): void
    {
        $this->cursorY -= 12;

        $this->drawFilledRect(
            $this->leftMargin - 12,
            $this->cursorY - 3,
            5.0,
            17.0,
            self::PR, self::PG, self::PB,
        );

        $this->drawColoredText(Str::upper($text), $this->leftMargin + 2, $this->cursorY, 11, true, self::PR, self::PG, self::PB);
        $this->cursorY -= 14;
        $this->drawRule(4.0);
        $this->cursorY -= 8;
    }

    public function addEntry(string $left, string $right = '', bool $bold = true): void
    {
        if (trim($left) === '' && trim($right) === '') {
            return;
        }

        $this->ensurePageSpace(18);
        $y = $this->cursorY;
        $leftWidth = $this->estimateTextWidth($left, 11);
        $leftEnd = $this->leftMargin + $leftWidth;

        if (trim($left) !== '') {
            $this->drawText($left, $this->leftMargin, $y, 11, $bold);
        }

        if (trim($right) !== '') {
            $rightWidth = $this->estimateTextWidth($right, 10.5);
            $x = max(
                $this->leftMargin,
                $this->rightMargin - $rightWidth
            );

            if ($x <= $leftEnd + 12) {
                $this->cursorY -= 14;
                $this->drawText($right, $x, $this->cursorY, 10.5, true);
                $this->cursorY -= 14;

                return;
            }

            $this->drawText($right, $x, $y, 10.5, true);
        }

        $this->cursorY -= 16;
    }

    public function addParagraph(string $text): void
    {
        foreach ($this->wrapText($text, 108) as $line) {
            $this->addLine($line);
        }
        $this->cursorY -= 2;
    }

    /**
     * @param  array<int, string>  $items
     */
    public function addBulletList(array $items): void
    {
        foreach ($items as $item) {
            $wrapped = $this->wrapText($item, 100);
            $firstLine = array_shift($wrapped);

            if ($firstLine !== null) {
                $this->ensurePageSpace(14);
                $this->drawFilledRect(
                    $this->leftMargin + 3,
                    $this->cursorY - 2,
                    4.0, 4.0,
                    self::P5R, self::P5G, self::P5B,
                );
                $this->addLine($firstLine, $this->fontSize, false, 'left', 14);
            }

            foreach ($wrapped as $line) {
                $this->addLine('  '.$line, $this->fontSize, false, 'left', 14);
            }
        }

        $this->cursorY -= 2;
    }

    public function addResponseBlock(
        int $index,
        string $question,
        string $category,
        ?int $score,
        string $answer,
        ?string $analysis
    ): void {
        $qLines = $this->wrapText($question, 96);
        $aLines = $this->wrapText($answer, 92);
        $analysisLines = filled($analysis) ? $this->wrapText((string) $analysis, 92) : [];

        $headerH = 26.0;
        $qH = count($qLines) * 14 + 6;
        $aH = count($aLines) * 13 + 20;
        $aiH = $analysisLines !== [] ? count($analysisLines) * 13 + 20 : 0;

        $this->ensurePageSpace($headerH + $qH + 16);

        // ── Header row ──────────────────────────────────
        $hRectY = $this->cursorY - $headerH + 10;
        $this->drawFilledRect($this->leftMargin, $hRectY, $this->contentWidth(), $headerH, self::P100R, self::P100G, self::P100B);
        $this->drawFilledRect($this->leftMargin, $hRectY, 4.0, $headerH, self::PR, self::PG, self::PB);

        $qLabel = "Pertanyaan {$index}";
        $this->drawColoredText($qLabel, $this->leftMargin + 12, $this->cursorY - 5, 10.0, true, self::PR, self::PG, self::PB);

        if ($category !== '') {
            $catText = '[ '.Str::upper($category).' ]';
            $catWidth = $this->estimateTextWidth($catText, 8.5);
            $catX = $this->leftMargin + ($this->contentWidth() / 2) - ($catWidth / 2);
            $this->drawColoredText($catText, $catX, $this->cursorY - 6, 8.5, false, self::P5R, self::P5G, self::P5B);
        }

        if ($score !== null) {
            [$sr, $sg, $sb] = $this->scoreColor($score);
            $scoreText = "Skor: {$score}/100";
            $scoreWidth = $this->estimateTextWidth($scoreText, 9.0);
            $this->drawColoredText($scoreText, $this->rightMargin - $scoreWidth - 10, $this->cursorY - 6, 9.0, true, $sr, $sg, $sb);
        }

        $this->cursorY -= $headerH;

        // ── Question text ──────────────────────────────
        foreach ($qLines as $line) {
            $this->ensurePageSpace(14);
            $this->drawText($line, $this->leftMargin + 6, $this->cursorY, 10.5, false);
            $this->cursorY -= 14;
        }
        $this->cursorY -= 4;

        // ── Answer block ──────────────────────────────
        $this->ensurePageSpace($aH);
        $this->drawFilledRect($this->leftMargin + 6, $this->cursorY - $aH + 14, $this->contentWidth() - 6, $aH, 0.963, 0.965, 0.972);
        $this->drawColoredText('Jawaban', $this->leftMargin + 12, $this->cursorY - 5, 9.0, true, 0.3, 0.3, 0.35);
        $this->cursorY -= 16;

        foreach ($aLines as $line) {
            $this->ensurePageSpace(13);
            $this->drawText($line, $this->leftMargin + 12, $this->cursorY, 10.0, false);
            $this->cursorY -= 13;
        }
        $this->cursorY -= 6;

        // ── AI Analysis block ─────────────────────────
        if ($analysisLines !== []) {
            $this->ensurePageSpace($aiH);
            $this->drawFilledRect($this->leftMargin + 6, $this->cursorY - $aiH + 14, $this->contentWidth() - 6, $aiH, self::P50R, self::P50G, self::P50B);
            $this->drawColoredText('Analisis AI', $this->leftMargin + 12, $this->cursorY - 5, 9.0, true, self::PR, self::PG, self::PB);
            $this->cursorY -= 16;

            foreach ($analysisLines as $line) {
                $this->ensurePageSpace(13);
                $this->drawColoredText($line, $this->leftMargin + 12, $this->cursorY, 9.5, false, self::P5R, self::P5G, self::P5B);
                $this->cursorY -= 13;
            }
        }

        $this->cursorY -= 14;
    }

    public function binary(): string
    {
        $objects = [];
        $offsets = [];

        $addObject = static function (string $content) use (&$objects): int {
            $objects[] = $content;

            return count($objects);
        };

        $fontId = $addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>');
        $boldFontId = $addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold >>');
        $contentIds = [];

        foreach ($this->pages as $lines) {
            $stream = implode("\n", $lines);
            $contentIds[] = $addObject('<< /Length '.strlen($stream)." >>\nstream\n{$stream}\nendstream");
        }

        $pagesId = $addObject('');
        $catalogId = $addObject("<< /Type /Catalog /Pages {$pagesId} 0 R >>");

        $pageObjectIds = [];
        foreach ($contentIds as $contentId) {
            $pageObjectIds[] = $addObject(
                "<< /Type /Page /Parent {$pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 {$fontId} 0 R /F2 {$boldFontId} 0 R >> >> /Contents {$contentId} 0 R >>"
            );
        }

        $kids = implode(' ', array_map(static fn (int $id): string => "{$id} 0 R", $pageObjectIds));
        $objects[$pagesId - 1] = '<< /Type /Pages /Count '.count($pageObjectIds)." /Kids [ {$kids} ] >>";

        $pdf = "%PDF-1.4\n%CVBUILDER\n";

        foreach ($objects as $index => $object) {
            $objectNumber = $index + 1;
            $offsets[$objectNumber] = strlen($pdf);
            $pdf .= "{$objectNumber} 0 obj\n{$object}\nendobj\n";
        }

        $xrefOffset = strlen($pdf);
        $pdf .= "xref\n0 ".(count($objects) + 1)."\n";
        $pdf .= "0000000000 65535 f \n";

        foreach (range(1, count($objects)) as $objectNumber) {
            $pdf .= str_pad((string) $offsets[$objectNumber], 10, '0', STR_PAD_LEFT)." 00000 n \n";
        }

        $pdf .= "trailer\n<< /Size ".(count($objects) + 1)." /Root {$catalogId} 0 R /Info << /Title ({$this->escapeText($this->title)}) >> >>\n";
        $pdf .= "startxref\n{$xrefOffset}\n%%EOF";

        return $pdf;
    }

    private function addLine(
        string $text,
        ?float $size = null,
        bool $bold = false,
        string $align = 'left',
        float $indent = 0.0
    ): void {
        $this->ensurePageSpace(16);

        $fontSize = $size ?? $this->fontSize;
        $x = $this->leftMargin + $indent;

        if ($align === 'center') {
            $textWidth = $this->estimateTextWidth($text, $fontSize);
            $x = $this->leftMargin + (($this->contentWidth() - $textWidth) / 2);
        }

        if ($align === 'right') {
            $textWidth = $this->estimateTextWidth($text, $fontSize);
            $x = $this->rightMargin - $textWidth;
        }

        $this->drawText($text, $x, $this->cursorY, $fontSize, $bold);
        $this->cursorY -= max(13.5, $fontSize + 3);
    }

    private function drawText(string $text, float $x, float $y, float $size, bool $bold = false): void
    {
        $pageIndex = array_key_last($this->pages);
        $escaped = $this->escapeText($text);
        $this->pages[$pageIndex][] = sprintf(
            'BT /%s %.2F Tf %.2F %.2F Td (%s) Tj ET',
            $bold ? 'F2' : 'F1',
            $size,
            $x,
            $y,
            $escaped
        );
    }

    private function drawRule(float $offsetFromCursor = 5.0): void
    {
        $this->ensurePageSpace(6);
        $pageIndex = array_key_last($this->pages);
        $y = $this->cursorY + $offsetFromCursor;
        $this->pages[$pageIndex][] = sprintf(
            '0.75 w %.3F %.3F %.3F rg %.2F %.2F m %.2F %.2F l S',
            self::P5R, self::P5G, self::P5B,
            $this->leftMargin - 12,
            $y,
            $this->rightMargin + 12,
            $y
        );
    }

    private function drawFilledRect(float $x, float $y, float $width, float $height, float $r, float $g, float $b): void
    {
        $pageIndex = array_key_last($this->pages);
        $this->pages[$pageIndex][] = sprintf(
            'q %.3F %.3F %.3F rg %.2F %.2F %.2F %.2F re f Q',
            $r, $g, $b, $x, $y, $width, $height,
        );
    }

    private function drawColoredText(string $text, float $x, float $y, float $size, bool $bold, float $r, float $g, float $b): void
    {
        $pageIndex = array_key_last($this->pages);
        $escaped = $this->escapeText($text);
        $this->pages[$pageIndex][] = sprintf(
            'q %.3F %.3F %.3F rg BT /%s %.2F Tf %.2F %.2F Td (%s) Tj ET Q',
            $r, $g, $b,
            $bold ? 'F2' : 'F1',
            $size,
            $x,
            $y,
            $escaped,
        );
    }

    private function ensurePageSpace(float $requiredHeight): void
    {
        if ($this->cursorY - $requiredHeight > 48) {
            return;
        }

        $this->pages[] = [];
        $this->cursorY = 800.0;
    }

    private function contentWidth(): float
    {
        return $this->rightMargin - $this->leftMargin;
    }

    private function estimateTextWidth(string $text, float $fontSize): float
    {
        return mb_strlen($text) * ($fontSize * 0.52);
    }

    /**
     * @return array<int, string>
     */
    private function wrapText(string $text, int $maxChars): array
    {
        $text = preg_replace('/\s+/', ' ', trim($text)) ?? '';

        if ($text === '') {
            return [];
        }

        $words = explode(' ', $text);
        $lines = [];
        $current = '';

        foreach ($words as $word) {
            $candidate = $current === '' ? $word : "{$current} {$word}";

            if (mb_strlen($candidate) <= $maxChars) {
                $current = $candidate;
            } else {
                if ($current !== '') {
                    $lines[] = $current;
                }
                $current = $word;
            }
        }

        if ($current !== '') {
            $lines[] = $current;
        }

        return $lines;
    }

    private function escapeText(string $text): string
    {
        return str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $text);
    }

    /**
     * @return array{0: float, 1: float, 2: float}
     */
    private function scoreColor(int $score): array
    {
        if ($score >= 80) {
            return [0.059, 0.522, 0.325]; // emerald
        }
        if ($score >= 60) {
            return [0.757, 0.494, 0.055]; // amber
        }

        return [0.824, 0.157, 0.157]; // red
    }
}
