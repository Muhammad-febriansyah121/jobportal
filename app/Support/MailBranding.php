<?php

namespace App\Support;

/**
 * Per-send branding context for outgoing emails.
 *
 * When set, header/footer templates use these values instead of the default
 * Karivia branding from the Setting table. Used by EmployerSmtpMailer so each
 * employer's outgoing mail shows their own logo and company info.
 */
class MailBranding
{
    /**
     * @var array{logo_url: ?string, brand_name: string, support_email: ?string, support_phone: ?string, address: ?string, tagline: ?string, site_url: ?string}|null
     */
    private static ?array $current = null;

    /**
     * @param  array{logo_url?: ?string, brand_name?: string, support_email?: ?string, support_phone?: ?string, address?: ?string, tagline?: ?string, site_url?: ?string}  $branding
     */
    public static function set(array $branding): void
    {
        self::$current = [
            'logo_url' => $branding['logo_url'] ?? null,
            'brand_name' => (string) ($branding['brand_name'] ?? ''),
            'support_email' => $branding['support_email'] ?? null,
            'support_phone' => $branding['support_phone'] ?? null,
            'address' => $branding['address'] ?? null,
            'tagline' => $branding['tagline'] ?? null,
            'site_url' => $branding['site_url'] ?? null,
        ];
    }

    public static function clear(): void
    {
        self::$current = null;
    }

    /**
     * @return array{logo_url: ?string, brand_name: string, support_email: ?string, support_phone: ?string, address: ?string, tagline: ?string, site_url: ?string}|null
     */
    public static function current(): ?array
    {
        return self::$current;
    }

    /**
     * Run a callback with the given branding applied, then restore the previous state.
     */
    public static function within(array $branding, callable $callback): mixed
    {
        $previous = self::$current;
        self::set($branding);

        try {
            return $callback();
        } finally {
            self::$current = $previous;
        }
    }
}
