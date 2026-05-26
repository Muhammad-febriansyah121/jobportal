<?php

namespace App\Support;

/**
 * Deterministic, regex-based extraction of contact details from raw CV text.
 *
 * This acts as a safety net behind the AI parser: when the model misses a
 * phone number, email, or social link that is plainly present in the extracted
 * text, these hints are merged back into the parsed result. All matching is
 * intentionally conservative to avoid false positives (e.g. year ranges like
 * "2020-2024" must never be mistaken for a phone number).
 */
class CvContactExtractor
{
    /**
     * @return array{phone: string, email: string, linkedin_url: string, github_url: string, portfolio_url: string}
     */
    public static function fromText(string $text): array
    {
        $links = self::links($text);

        return [
            'phone' => self::phone($text),
            'email' => self::email($text),
            'linkedin_url' => $links['linkedin_url'],
            'github_url' => $links['github_url'],
            'portfolio_url' => $links['portfolio_url'],
        ];
    }

    /**
     * Find the first plausible Indonesian phone number and return it normalized
     * to international digits (e.g. "628123456789"). Returns an empty string
     * when no valid candidate is found.
     */
    public static function phone(string $text): string
    {
        // Anchored on Indonesian dialing conventions (+62 / 62 / leading 0)
        // so date ranges and plain number sequences are not matched.
        $patterns = [
            // Mobile: 08xx, +628xx, 628xx — allows spaces, dots, dashes, parens.
            '/(?:\+?62|\b0)[\s.\-]?8[\d\s().\-]{6,13}\d/',
            // Landline: e.g. (021) 123-4567, +6221 1234567.
            '/(?:\+?62|\b0)\d{1,3}[\s().\-]{0,2}\d{3}[\s().\-]?\d{3,6}/',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match_all($pattern, $text, $matches) === false) {
                continue;
            }

            foreach ($matches[0] as $candidate) {
                $normalized = self::normalizePhone($candidate);

                if ($normalized !== '') {
                    return $normalized;
                }
            }
        }

        return '';
    }

    /**
     * Normalize a raw phone string to international digits without the leading
     * plus. Indonesian leading "0" is rewritten to "62". Returns an empty
     * string when the digit count falls outside a plausible phone range.
     */
    public static function normalizePhone(string $phone): string
    {
        $digits = preg_replace('/\D+/', '', $phone) ?? '';

        if ($digits === '') {
            return '';
        }

        if (str_starts_with($digits, '0')) {
            $digits = '62'.substr($digits, 1);
        }

        if (strlen($digits) < 8 || strlen($digits) > 16) {
            return '';
        }

        return $digits;
    }

    /**
     * Find the first email address in the text, lowercased.
     */
    public static function email(string $text): string
    {
        if (preg_match('/[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}/i', $text, $match) === 1) {
            return strtolower($match[0]);
        }

        return '';
    }

    /**
     * Find LinkedIn, GitHub, and a generic portfolio URL in the text.
     *
     * @return array{linkedin_url: string, github_url: string, portfolio_url: string}
     */
    public static function links(string $text): array
    {
        return [
            'linkedin_url' => self::firstUrl($text, '#(?:https?://)?(?:www\.)?linkedin\.com/[^\s)>\],]+#i'),
            'github_url' => self::firstUrl($text, '#(?:https?://)?(?:www\.)?github\.com/[^\s)>\],]+#i'),
            'portfolio_url' => self::portfolioUrl($text),
        ];
    }

    private static function portfolioUrl(string $text): string
    {
        if (! preg_match_all('#https?://[^\s)>\],]+#i', $text, $matches) || $matches[0] === []) {
            return '';
        }

        foreach ($matches[0] as $url) {
            $lower = strtolower($url);

            if (str_contains($lower, 'linkedin.com') || str_contains($lower, 'github.com')) {
                continue;
            }

            return self::normalizeUrl($url);
        }

        return '';
    }

    private static function firstUrl(string $text, string $pattern): string
    {
        if (preg_match($pattern, $text, $match) === 1) {
            return self::normalizeUrl($match[0]);
        }

        return '';
    }

    private static function normalizeUrl(string $url): string
    {
        $url = rtrim(trim($url), '.,;');

        if (! str_starts_with(strtolower($url), 'http')) {
            $url = 'https://'.$url;
        }

        return $url;
    }
}
