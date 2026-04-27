<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\WhatsAppGatewayService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminWhatsAppController extends Controller
{
    public function edit(WhatsAppGatewayService $whatsApp): Response
    {
        $sessionId = trim((string) Setting::get('whatsapp_gateway_default_session_id', config('services.whatsapp.default_session_id')));
        $session = $sessionId === '' ? null : $whatsApp->getSession($sessionId);

        return Inertia::render('admin/whatsapp', [
            'gatewayConfigured' => $whatsApp->isConfigured(),
            'sessionId' => $sessionId,
            'session' => $this->normalizeSession($session),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'test_phone' => ['nullable', 'string', 'max:30'],
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Pengaturan WhatsApp admin berhasil disimpan.',
        ]);

        return back();
    }

    public function sendTest(Request $request, WhatsAppGatewayService $whatsApp): RedirectResponse
    {
        $validated = $request->validate([
            'phone_number' => ['required', 'string', 'max:30'],
        ]);

        $sessionId = trim((string) Setting::get('whatsapp_gateway_default_session_id', config('services.whatsapp.default_session_id')));

        if (! $whatsApp->isConfigured()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Gateway WhatsApp belum dikonfigurasi.']);

            return back();
        }

        if ($sessionId === '') {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Session ID default belum tersedia. Atur di Pengaturan Web.']);

            return back();
        }

        $session = $whatsApp->getSession($sessionId);
        $sessionState = strtoupper((string) data_get($session, 'state'));

        if (! in_array($sessionState, ['CONNECTED', 'READY'], true)) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Sesi WhatsApp default belum terhubung.']);

            return back();
        }

        $appName = config('app.name', 'Karivia');
        $text = implode("\n\n", [
            '*Tes koneksi WhatsApp berhasil*',
            "Session ID: {$sessionId}",
            'Waktu: '.now()->timezone(config('app.timezone'))->format('d M Y H:i:s'),
            "Pesan ini dikirim dari halaman admin {$appName}.",
        ]);

        $result = $whatsApp->sendText($sessionId, $validated['phone_number'], $text);

        if (! is_array($result)) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Pesan test gagal dikirim. Cek status session dan konfigurasi gateway.']);

            return back();
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => "Pesan test berhasil dikirim ke {$validated['phone_number']}."]);

        return back();
    }

    public function connect(Request $request, WhatsAppGatewayService $whatsApp): RedirectResponse
    {
        $validated = $request->validate([
            'label' => ['nullable', 'string', 'max:80'],
        ]);

        if (! $whatsApp->isConfigured()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Gateway WhatsApp belum dikonfigurasi.']);

            return back();
        }

        $label = trim((string) ($validated['label'] ?? ''));
        $label = $label === '' ? 'Admin Karivia' : $label;

        $session = $whatsApp->connectSession($label, true);
        $sessionId = trim((string) (data_get($session, 'id') ?: data_get($session, 'sessionId')));

        if ($sessionId === '') {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Gagal membuat sesi WhatsApp. Coba ulangi beberapa saat lagi.']);

            return back();
        }

        Setting::set('whatsapp_gateway_default_session_id', $sessionId);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Sesi WhatsApp berhasil dibuat. Silakan scan QR jika diminta.']);

        return back();
    }

    public function reconnect(WhatsAppGatewayService $whatsApp): RedirectResponse
    {
        $sessionId = trim((string) Setting::get('whatsapp_gateway_default_session_id', config('services.whatsapp.default_session_id')));

        if ($sessionId === '') {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Session ID belum tersedia.']);

            return back();
        }

        $session = $whatsApp->reconnectSession($sessionId) ?? $whatsApp->getSession($sessionId);

        if (! is_array($session)) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Gagal reconnect sesi WhatsApp.']);

            return back();
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Permintaan reconnect WhatsApp berhasil dikirim.']);

        return back();
    }

    public function disconnect(WhatsAppGatewayService $whatsApp): RedirectResponse
    {
        $sessionId = trim((string) Setting::get('whatsapp_gateway_default_session_id', config('services.whatsapp.default_session_id')));

        if ($sessionId !== '') {
            $whatsApp->deleteSession($sessionId);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Sesi WhatsApp berhasil diputus.']);

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
            'error_message' => data_get($session, 'errorMessage'),
        ];
    }
}
