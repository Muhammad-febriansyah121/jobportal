<?php

namespace App\Services;

use App\Models\User;
use App\Support\EmployerEmailPreferences;
use Symfony\Component\Mailer\Mailer as SymfonyMailer;
use Symfony\Component\Mailer\Transport;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;

class EmployerSmtpMailer
{
    public function isConfigured(User $user): bool
    {
        $prefs = EmployerEmailPreferences::resolve($user);

        return $prefs['host'] !== ''
            && $prefs['port'] !== null
            && $prefs['username'] !== ''
            && $prefs['password_set'] === true
            && $prefs['from_address'] !== '';
    }

    /**
     * @return array{ok: bool, message: string}
     */
    public function sendTest(User $user, string $to): array
    {
        if (! $this->isConfigured($user)) {
            return [
                'ok' => false,
                'message' => 'Konfigurasi SMTP belum lengkap. Pastikan host, port, username, password, dan email pengirim sudah diisi.',
            ];
        }

        $prefs = EmployerEmailPreferences::resolve($user);
        $password = EmployerEmailPreferences::decryptPassword($user) ?? '';
        $fromName = $prefs['from_name'] !== '' ? $prefs['from_name'] : ($user->name ?? 'Karivia');
        $appName = config('app.name', 'Karivia');

        $scheme = $prefs['encryption'] === 'ssl' ? 'smtps' : 'smtp';
        $host = $prefs['host'];
        $port = $prefs['port'];
        $username = rawurlencode($prefs['username']);
        $passwordEncoded = rawurlencode($password);
        $tlsParam = $prefs['encryption'] === 'tls' ? '?encryption=tls' : '';

        $dsn = "{$scheme}://{$username}:{$passwordEncoded}@{$host}:{$port}{$tlsParam}";

        try {
            $transport = Transport::fromDsn($dsn);
            $mailer = new SymfonyMailer($transport);

            $email = (new Email)
                ->from(new Address($prefs['from_address'], $fromName))
                ->to($to)
                ->subject("Tes Koneksi SMTP — {$appName}")
                ->text("Halo,\n\nIni adalah email tes dari {$appName}. Jika kamu menerima email ini, berarti konfigurasi SMTP kamu sudah benar.\n\nTerima kasih.");

            $mailer->send($email);
        } catch (\Throwable $exception) {
            return [
                'ok' => false,
                'message' => 'Gagal kirim email tes: '.$exception->getMessage(),
            ];
        }

        return [
            'ok' => true,
            'message' => 'Email tes berhasil dikirim ke '.$to.'.',
        ];
    }
}
