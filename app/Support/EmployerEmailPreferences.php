<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Support\Facades\Crypt;

class EmployerEmailPreferences
{
    /**
     * @return array{enabled: bool, host: string, port: ?int, username: string, password: string, encryption: string, from_address: string, from_name: string}
     */
    public static function defaults(): array
    {
        return [
            'enabled' => false,
            'host' => '',
            'port' => null,
            'username' => '',
            'password' => '',
            'encryption' => 'tls',
            'from_address' => '',
            'from_name' => '',
        ];
    }

    /**
     * @return array{enabled: bool, host: string, port: ?int, username: string, password: string, encryption: string, from_address: string, from_name: string, password_set: bool, last_tested_at: ?string}
     */
    public static function resolve(?User $user): array
    {
        $defaults = self::defaults();

        if ($user === null) {
            return $defaults + ['password_set' => false, 'last_tested_at' => null];
        }

        $settings = is_array($user->notification_settings) ? $user->notification_settings : [];
        $smtp = is_array($settings['email_smtp'] ?? null) ? $settings['email_smtp'] : [];

        $port = $smtp['port'] ?? null;

        return [
            'enabled' => (bool) ($smtp['enabled'] ?? false),
            'host' => (string) ($smtp['host'] ?? ''),
            'port' => $port === null || $port === '' ? null : (int) $port,
            'username' => (string) ($smtp['username'] ?? ''),
            'password' => '',
            'encryption' => (string) ($smtp['encryption'] ?? 'tls'),
            'from_address' => (string) ($smtp['from_address'] ?? ''),
            'from_name' => (string) ($smtp['from_name'] ?? ''),
            'password_set' => isset($smtp['password']) && $smtp['password'] !== '' && $smtp['password'] !== null,
            'last_tested_at' => $smtp['last_tested_at'] ?? null,
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public static function update(User $user, array $payload): void
    {
        $settings = is_array($user->notification_settings) ? $user->notification_settings : [];
        $existing = is_array($settings['email_smtp'] ?? null) ? $settings['email_smtp'] : [];

        $port = $payload['port'] ?? null;
        $encryption = (string) ($payload['encryption'] ?? 'tls');

        $smtp = [
            'enabled' => (bool) ($payload['enabled'] ?? false),
            'host' => trim((string) ($payload['host'] ?? '')),
            'port' => $port === null || $port === '' ? null : (int) $port,
            'username' => trim((string) ($payload['username'] ?? '')),
            'encryption' => in_array($encryption, ['tls', 'ssl', 'none'], true) ? $encryption : 'tls',
            'from_address' => trim((string) ($payload['from_address'] ?? '')),
            'from_name' => trim((string) ($payload['from_name'] ?? '')),
            'last_tested_at' => $existing['last_tested_at'] ?? null,
        ];

        $newPassword = (string) ($payload['password'] ?? '');

        if ($newPassword !== '') {
            $smtp['password'] = Crypt::encryptString($newPassword);
        } elseif (isset($existing['password'])) {
            $smtp['password'] = $existing['password'];
        }

        $settings['email_smtp'] = $smtp;

        $user->forceFill(['notification_settings' => $settings])->save();
    }

    public static function markTested(User $user, \DateTimeInterface $when): void
    {
        $settings = is_array($user->notification_settings) ? $user->notification_settings : [];
        $smtp = is_array($settings['email_smtp'] ?? null) ? $settings['email_smtp'] : [];
        $smtp['last_tested_at'] = $when->format('Y-m-d H:i:s');
        $settings['email_smtp'] = $smtp;

        $user->forceFill(['notification_settings' => $settings])->save();
    }

    public static function decryptPassword(?User $user): ?string
    {
        if ($user === null) {
            return null;
        }

        $settings = is_array($user->notification_settings) ? $user->notification_settings : [];
        $smtp = is_array($settings['email_smtp'] ?? null) ? $settings['email_smtp'] : [];
        $encrypted = $smtp['password'] ?? null;

        if (! is_string($encrypted) || $encrypted === '') {
            return null;
        }

        try {
            return Crypt::decryptString($encrypted);
        } catch (DecryptException) {
            return null;
        }
    }
}
