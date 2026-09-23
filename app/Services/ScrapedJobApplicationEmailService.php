<?php

namespace App\Services;

use App\Models\Setting;

class ScrapedJobApplicationEmailService
{
    public function isConfigured(): bool
    {
        $host = trim((string) Setting::get('smtp_host', ''));
        $port = (int) Setting::get('smtp_port', 0);
        $fromAddress = trim((string) Setting::get('smtp_from_address', ''));
        $authEnabled = (string) Setting::get('smtp_auth', '1') === '1';
        $lastTestedAt = trim((string) Setting::get('smtp_last_tested_at', ''));

        if ($host === '' || $port < 1 || filter_var($fromAddress, FILTER_VALIDATE_EMAIL) === false || $lastTestedAt === '') {
            return false;
        }

        if (! $authEnabled) {
            return true;
        }

        return trim((string) Setting::get('smtp_username', '')) !== ''
            && trim((string) Setting::get('smtp_password', '')) !== '';
    }
}
