<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\WhatsAppGatewayService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Fortify;

class PasswordResetLinkController extends Controller
{
    public function create(Request $request): Response
    {
        return Inertia::render('auth/forgot-password', [
            'status' => $request->session()->get('status'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
            'phone' => ['nullable', 'string', 'max:20', 'regex:/^[0-9+\-\s]+$/'],
        ]);

        if (config('fortify.lowercase_usernames')) {
            $request->merge([
                Fortify::email() => Str::lower($request->email),
            ]);
        }

        $phone = trim((string) $request->input('phone', ''));

        $status = Password::broker(config('fortify.passwords'))
            ->sendResetLink($request->only('email'));

        if ($status === Password::RESET_LINK_SENT) {
            if ($phone !== '') {
                $this->sendWhatsAppNotification($request->email, $phone);
            }

            return back()->with('status', __($status));
        }

        throw ValidationException::withMessages([
            'email' => [__($status)],
        ]);
    }

    private function sendWhatsAppNotification(string $email, string $phone): void
    {
        /** @var WhatsAppGatewayService $whatsApp */
        $whatsApp = app(WhatsAppGatewayService::class);

        if (! $whatsApp->isConfigured()) {
            return;
        }

        $configSessionId = trim((string) config('services.whatsapp.default_session_id'));
        $defaultSessionId = $configSessionId !== ''
            ? $configSessionId
            : trim((string) Setting::get('whatsapp_gateway_default_session_id', ''));

        if ($defaultSessionId === '') {
            return;
        }

        $appName = config('app.name', 'Karivia');
        $text = implode("\n\n", [
            "*Reset Password — {$appName}*",
            'Halo! Kami menerima permintaan reset password untuk akun:',
            "*{$email}*",
            'Link reset password telah dikirim ke email kamu. Buka email dan klik tautan tersebut untuk membuat password baru.',
            '_Jika kamu tidak meminta reset password, abaikan pesan ini. Password kamu tetap aman._',
            "─────────────────\n_{$appName} · Notifikasi Otomatis_",
        ]);

        $whatsApp->sendText($defaultSessionId, $phone, $text);
    }
}
