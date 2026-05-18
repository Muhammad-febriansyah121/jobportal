<?php

namespace App\Services;

use App\Mail\EmployerSmtpTestMail;
use App\Models\Company;
use App\Models\User;
use App\Support\EmployerEmailPreferences;
use App\Support\MailBranding;
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
        $appName = config('app.name', 'Karivia');

        $company = $this->resolvePrimaryCompany($user);
        $companyName = $company?->name ?? ($prefs['from_name'] !== '' ? $prefs['from_name'] : ($user->name ?? $appName));
        $fromName = $prefs['from_name'] !== '' ? $prefs['from_name'] : $companyName;

        $html = MailBranding::within(
            $this->buildBranding($user, $company, $prefs, $companyName),
            fn (): string => (new EmployerSmtpTestMail($appName, $companyName))->render(),
        );

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
                ->subject("Tes Koneksi SMTP — {$companyName}")
                ->html($html)
                ->text(sprintf(
                    "Halo,\n\nEmail ini adalah tes koneksi SMTP perusahaan %s di %s. Jika Anda menerima pesan ini, konfigurasi server email sudah berjalan dengan benar.\n\nHormat kami,\nTim %s",
                    $companyName,
                    $appName,
                    $companyName,
                ));

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

    private function resolvePrimaryCompany(User $user): ?Company
    {
        $member = $user->companyMemberships()
            ->where('is_active', true)
            ->orderByDesc('joined_at')
            ->first();

        if ($member === null) {
            return null;
        }

        return Company::find($member->company_id);
    }

    /**
     * @param  array{from_address: string, from_name: string, ...}  $prefs
     * @return array{logo_url: ?string, brand_name: string, support_email: ?string, support_phone: ?string, address: ?string, tagline: ?string, site_url: ?string}
     */
    private function buildBranding(User $user, ?Company $company, array $prefs, string $companyName): array
    {
        $logoUrl = null;

        if ($company !== null && $company->logo_url) {
            $logoUrl = str_starts_with($company->logo_url, 'http')
                ? $company->logo_url
                : asset('storage/'.$company->logo_url);
        }

        return [
            'logo_url' => $logoUrl,
            'brand_name' => $companyName,
            'support_email' => $prefs['from_address'] ?: $user->email,
            'support_phone' => null,
            'address' => $company?->hq_city,
            'tagline' => null,
            'site_url' => $company?->website ?: null,
        ];
    }
}
