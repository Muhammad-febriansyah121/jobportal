<?php

namespace App\Support;

class MessageBodyFormatter
{
    public static function toWhatsApp(string $body): string
    {
        if ($body === '') {
            return '';
        }

        $text = $body;

        $text = preg_replace('/<br\s*\/?>/i', "\n", $text) ?? $text;

        $text = preg_replace_callback(
            '/<li[^>]*>(.*?)<\/li>/is',
            fn (array $match): string => '- '.trim(strip_tags($match[1]))."\n",
            $text,
        ) ?? $text;
        $text = preg_replace('/<\/?(ul|ol)[^>]*>/i', "\n", $text) ?? $text;

        $text = preg_replace('/<\/p>\s*<p[^>]*>/i', "\n\n", $text) ?? $text;
        $text = preg_replace('/<\/?p[^>]*>/i', '', $text) ?? $text;

        $text = preg_replace('/<(strong|b)[^>]*>(.*?)<\/(?:strong|b)>/is', '*$2*', $text) ?? $text;
        $text = preg_replace('/<(em|i)[^>]*>(.*?)<\/(?:em|i)>/is', '_$2_', $text) ?? $text;
        $text = preg_replace('/<(s|del|strike)[^>]*>(.*?)<\/(?:s|del|strike)>/is', '~$2~', $text) ?? $text;
        $text = preg_replace('/<code[^>]*>(.*?)<\/code>/is', '`$1`', $text) ?? $text;

        $text = preg_replace_callback(
            '/<a\b[^>]*href=["\']([^"\']+)["\'][^>]*>(.*?)<\/a>/is',
            function (array $match): string {
                $url = trim($match[1]);
                $label = trim(strip_tags($match[2]));

                if ($label === '' || $label === $url) {
                    return $url;
                }

                return $label.' ('.$url.')';
            },
            $text,
        ) ?? $text;

        $text = strip_tags($text);

        $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');

        $text = preg_replace("/[ \t]+\n/", "\n", $text) ?? $text;
        $text = preg_replace("/\n{3,}/", "\n\n", $text) ?? $text;

        return trim($text);
    }
}
