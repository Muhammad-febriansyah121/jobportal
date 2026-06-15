<?php

namespace App\Support;

class RichText
{
    /**
     * Convert rich-text (Draft.js export) HTML into readable plain text.
     *
     * Block-level tags become newlines; remaining tags are stripped and HTML
     * entities decoded. Safe to call on plain strings (idempotent).
     */
    public static function toPlainText(?string $html, string $default = '-'): string
    {
        if (blank($html)) {
            return $default;
        }

        $withBreaks = preg_replace('/<\/(p|div|li|h[1-6])>|<br\s*\/?>/i', "\n", $html);
        $text = html_entity_decode(strip_tags($withBreaks), ENT_QUOTES | ENT_HTML5);
        $text = trim(preg_replace("/\n{3,}/", "\n\n", $text));

        return $text === '' ? $default : $text;
    }
}
