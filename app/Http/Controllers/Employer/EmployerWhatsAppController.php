<?php

namespace App\Http\Controllers\Employer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Employer\SaveEmployerWhatsAppSettingsRequest;
use App\Http\Requests\Employer\SendEmployerWhatsAppTestRequest;
use App\Services\WhatsAppGatewayService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmployerWhatsAppController extends Controller
{
    public function edit(Request $request, WhatsAppGatewayService $whatsApp): Response
    {
        $user = $request->user();
        $settings = is_array($user?->notification_settings) ? $user->notification_settings : [];
        $sessionId = trim((string) data_get($settings, 'whatsapp.session_id'));
        $session = $sessionId === '' ? null : $whatsApp->getSession($sessionId);

        return Inertia::render('employer/whatsapp', [
            'phone' => $user?->phone,
            'gatewayConfigured' => $whatsApp->isConfigured(),
            'settings' => [
                'enabled' => (bool) data_get($settings, 'whatsapp.enabled', false),
                'session_id' => $sessionId,
            ],
            'session' => $this->normalizeSession($session),
        ]);
    }

    public function update(SaveEmployerWhatsAppSettingsRequest $request): RedirectResponse
    {
        $settings = is_array($request->user()?->notification_settings) ? $request->user()->notification_settings : [];
        $sessionId = trim((string) $request->validated('session_id'));

        data_set($settings, 'whatsapp.enabled', (bool) $request->validated('enabled'));
        data_set($settings, 'whatsapp.session_id', $sessionId === '' ? null : $sessionId);

        $request->user()?->forceFill([
            'notification_settings' => $settings,
        ])->save();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Pengaturan WhatsApp berhasil disimpan.',
        ]);

        return back();
    }

    public function sendTest(
        SendEmployerWhatsAppTestRequest $request,
        WhatsAppGatewayService $whatsApp,
    ): RedirectResponse {
        $settings = is_array($request->user()?->notification_settings) ? $request->user()->notification_settings : [];
        $sessionId = trim((string) data_get($settings, 'whatsapp.session_id'));
        $targetPhoneNumber = trim((string) $request->validated('phone_number'));

        if (! $whatsApp->isConfigured()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Gateway WhatsApp belum dikonfigurasi.',
            ]);

            return back();
        }

        if ($sessionId === '') {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Session ID belum tersedia. Hubungkan sesi WhatsApp dulu.',
            ]);

            return back();
        }

        $session = $whatsApp->getSession($sessionId);
        $sessionState = strtoupper((string) data_get($session, 'state'));

        if ($sessionState !== 'CONNECTED' && $sessionState !== 'READY') {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Sesi WhatsApp belum terhubung. Pastikan status sudah Terhubung sebelum test koneksi.',
            ]);

            return back();
        }

        $text = implode("\n\n", [
            '*Tes koneksi WhatsApp berhasil*',
            'Session ID: '.$sessionId,
            'Waktu: '.now()->timezone(config('app.timezone'))->format('d M Y H:i:s'),
            'Pesan ini dikirim dari halaman employer Karivia.',
        ]);

        $result = $whatsApp->sendText($sessionId, $targetPhoneNumber, $text);

        if (! is_array($result)) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Pesan test gagal dikirim. Cek status session dan konfigurasi gateway.',
            ]);

            return back();
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Pesan test berhasil dikirim ke {$targetPhoneNumber}.",
        ]);

        return back();
    }

    public function connect(Request $request, WhatsAppGatewayService $whatsApp): RedirectResponse
    {
        $validated = $request->validate([
            'label' => ['nullable', 'string', 'max:80'],
            'is_new_number' => ['sometimes', 'boolean'],
        ]);

        $label = trim((string) ($validated['label'] ?? ''));
        $label = $label === '' ? "Employer {$request->user()?->id}" : $label;

        $session = $whatsApp->connectSession($label, (bool) ($validated['is_new_number'] ?? true));
        $sessionId = trim((string) (data_get($session, 'id') ?: data_get($session, 'sessionId')));

        if ($sessionId === '') {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Gagal membuat sesi WhatsApp. Coba ulangi beberapa saat lagi.',
            ]);

            return back();
        }

        $settings = is_array($request->user()?->notification_settings) ? $request->user()->notification_settings : [];
        data_set($settings, 'whatsapp.enabled', true);
        data_set($settings, 'whatsapp.session_id', $sessionId);

        $request->user()?->forceFill([
            'notification_settings' => $settings,
        ])->save();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Sesi WhatsApp berhasil dibuat. Silakan scan QR jika diminta.',
        ]);

        return back();
    }

    public function reconnect(Request $request, WhatsAppGatewayService $whatsApp): RedirectResponse
    {
        $settings = is_array($request->user()?->notification_settings) ? $request->user()->notification_settings : [];
        $sessionId = trim((string) data_get($settings, 'whatsapp.session_id'));

        if ($sessionId === '') {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Session ID belum tersedia. Hubungkan sesi baru dulu.',
            ]);

            return back();
        }

        $session = $whatsApp->reconnectSession($sessionId) ?? $whatsApp->getSession($sessionId);

        if (! is_array($session)) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Gagal reconnect sesi WhatsApp.',
            ]);

            return back();
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Permintaan reconnect WhatsApp berhasil dikirim.',
        ]);

        return back();
    }

    public function disconnect(Request $request, WhatsAppGatewayService $whatsApp): RedirectResponse
    {
        $settings = is_array($request->user()?->notification_settings) ? $request->user()->notification_settings : [];
        $sessionId = trim((string) data_get($settings, 'whatsapp.session_id'));

        if ($sessionId !== '') {
            $whatsApp->deleteSession($sessionId);
        }

        data_set($settings, 'whatsapp.enabled', false);
        data_set($settings, 'whatsapp.session_id', null);

        $request->user()?->forceFill([
            'notification_settings' => $settings,
        ])->save();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Sesi WhatsApp berhasil diputus.',
        ]);

        return back();
    }

    /**
     * @param  array<string, mixed>|null  $session
     * @return array<string, mixed>|null
     */
    private function normalizeSession(?array $session): ?array
    {
        if (! is_array($session)) {
            return null;
        }

        $state = strtoupper((string) data_get($session, 'state'));
        $qrCode = data_get($session, 'qrCode');

        if ($qrCode && in_array($state, ['QR_READY', 'CONNECTING', ''], true)) {
            $state = 'WAITING_QR';
        }

        return [
            'id' => data_get($session, 'id'),
            'label' => data_get($session, 'label'),
            'state' => $state === '' ? null : $state,
            'phone_number' => data_get($session, 'phoneNumber'),
            'qr_code' => $qrCode,
            'last_seen_at' => data_get($session, 'lastSeenAt'),
            'last_connected_at' => data_get($session, 'lastConnectedAt'),
            'message_count' => data_get($session, 'messageCount'),
            'error_message' => data_get($session, 'errorMessage'),
        ];
    }
}
