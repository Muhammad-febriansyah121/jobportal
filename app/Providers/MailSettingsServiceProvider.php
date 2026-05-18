<?php

namespace App\Providers;

use App\Models\Setting;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;
use Throwable;

class MailSettingsServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        try {
            if (! Schema::hasTable('settings')) {
                return;
            }
        } catch (Throwable) {
            return;
        }

        $host = trim((string) Setting::get('smtp_host', ''));

        if ($host === '') {
            return;
        }

        $port = (int) Setting::get('smtp_port', 587);
        $encryption = (string) Setting::get('smtp_encryption', 'tls');
        $username = trim((string) Setting::get('smtp_username', ''));
        $encryptedPassword = (string) Setting::get('smtp_password', '');
        $fromAddress = trim((string) Setting::get('smtp_from_address', ''));
        $fromName = trim((string) Setting::get('smtp_from_name', ''));
        $authEnabled = (string) Setting::get('smtp_auth', '1') === '1';

        $password = null;

        if ($encryptedPassword !== '') {
            try {
                $password = Crypt::decryptString($encryptedPassword);
            } catch (DecryptException) {
                $password = null;
            }
        }

        Config::set('mail.mailers.smtp.transport', 'smtp');
        Config::set('mail.mailers.smtp.host', $host);
        Config::set('mail.mailers.smtp.port', $port);
        Config::set('mail.mailers.smtp.encryption', $encryption === 'none' ? null : $encryption);
        Config::set('mail.mailers.smtp.scheme', match ($encryption) {
            'ssl' => 'smtps',
            'tls', 'none' => 'smtp',
            default => null,
        });

        if ($authEnabled && $username !== '') {
            Config::set('mail.mailers.smtp.username', $username);
            Config::set('mail.mailers.smtp.password', $password);
        } else {
            Config::set('mail.mailers.smtp.username', null);
            Config::set('mail.mailers.smtp.password', null);
        }

        if ($fromAddress !== '') {
            Config::set('mail.from.address', $fromAddress);
            Config::set('mail.from.name', $fromName !== '' ? $fromName : config('mail.from.name'));
        }

        Config::set('mail.default', 'smtp');
    }
}
