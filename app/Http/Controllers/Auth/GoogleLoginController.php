<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class GoogleLoginController extends Controller
{
    private function googleClientId(): string
    {
        $fromConfig = trim((string) config('services.google_login.client_id'));

        return $fromConfig !== ''
            ? $fromConfig
            : trim((string) Setting::get('google_login_client_id', ''));
    }

    private function googleClientSecret(): string
    {
        $fromConfig = trim((string) config('services.google_login.client_secret'));

        return $fromConfig !== ''
            ? $fromConfig
            : trim((string) Setting::get('google_login_client_secret', ''));
    }

    public function redirect(Request $request): RedirectResponse
    {
        $clientId = $this->googleClientId();
        $clientSecret = $this->googleClientSecret();

        if ($clientId === '' || $clientSecret === '') {
            return to_route('login')->withErrors([
                'google' => 'Google Login belum lengkap. Pastikan Client ID dan Client Secret sudah diatur.',
            ]);
        }

        $intent = $request->query('intent', 'login');
        $state = Str::random(40);
        $request->session()->put('google_oauth_state', $state);
        $request->session()->put('google_oauth_intent', $intent);

        $query = http_build_query([
            'client_id' => $clientId,
            'redirect_uri' => route('auth.google.callback'),
            'response_type' => 'code',
            'scope' => 'openid email profile',
            'state' => $state,
            'prompt' => 'select_account',
            'access_type' => 'online',
        ]);

        return redirect()->away("https://accounts.google.com/o/oauth2/v2/auth?{$query}");
    }

    public function callback(Request $request): RedirectResponse
    {
        $state = (string) $request->query('state', '');
        $code = (string) $request->query('code', '');
        $storedState = (string) $request->session()->pull('google_oauth_state', '');

        if ($code === '' || $state === '' || $storedState === '' || ! hash_equals($storedState, $state)) {
            return to_route('login')->withErrors([
                'google' => 'Permintaan login Google tidak valid. Silakan coba lagi.',
            ]);
        }

        $clientId = $this->googleClientId();
        $clientSecret = $this->googleClientSecret();

        if ($clientId === '' || $clientSecret === '') {
            return to_route('login')->withErrors([
                'google' => 'Google Login belum lengkap. Pastikan Client ID dan Client Secret sudah diatur.',
            ]);
        }

        $tokenResponse = Http::asForm()->timeout(10)->post('https://oauth2.googleapis.com/token', [
            'code' => $code,
            'client_id' => $clientId,
            'client_secret' => $clientSecret,
            'redirect_uri' => route('auth.google.callback'),
            'grant_type' => 'authorization_code',
        ]);

        if (! $tokenResponse->successful()) {
            return to_route('login')->withErrors([
                'google' => 'Gagal memverifikasi login Google. Silakan coba lagi.',
            ]);
        }

        $idToken = (string) ($tokenResponse->json('id_token') ?? '');

        if ($idToken === '') {
            return to_route('login')->withErrors([
                'google' => 'ID token Google tidak ditemukan.',
            ]);
        }

        try {
            $intent = (string) $request->session()->get('google_oauth_intent', 'login');

            return $this->authenticateFromIdToken($request, $idToken, false, $intent);
        } catch (ValidationException $exception) {
            return to_route('login')->withErrors([
                'google' => $this->validationMessage($exception),
            ]);
        }
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'credential' => ['required', 'string'],
            'remember' => ['sometimes', 'boolean'],
        ]);

        return $this->authenticateFromIdToken(
            $request,
            (string) $validated['credential'],
            (bool) ($validated['remember'] ?? false),
        );
    }

    private function authenticateFromIdToken(Request $request, string $idToken, bool $remember, string $intent = 'login'): RedirectResponse
    {
        $configuredClientId = $this->googleClientId();
        if ($configuredClientId === '') {
            throw ValidationException::withMessages([
                'google' => 'Login Google belum dikonfigurasi oleh admin.',
            ]);
        }

        $response = Http::timeout(10)
            ->get('https://oauth2.googleapis.com/tokeninfo', [
                'id_token' => $idToken,
            ]);

        if (! $response->successful()) {
            throw ValidationException::withMessages([
                'google' => 'Token Google tidak valid atau sudah kedaluwarsa.',
            ]);
        }

        $tokenData = $response->json();
        $audience = (string) ($tokenData['aud'] ?? '');
        $email = strtolower(trim((string) ($tokenData['email'] ?? '')));
        $emailVerified = filter_var(
            $tokenData['email_verified'] ?? false,
            FILTER_VALIDATE_BOOLEAN,
        );

        if ($audience !== $configuredClientId) {
            throw ValidationException::withMessages([
                'google' => 'Client ID Google tidak cocok dengan konfigurasi sistem.',
            ]);
        }

        if ($email === '' || ! $emailVerified) {
            throw ValidationException::withMessages([
                'google' => 'Email Google harus terverifikasi untuk melanjutkan.',
            ]);
        }

        $user = User::query()->where('email', $email)->first();

        if (! $user instanceof User) {
            if ($intent !== 'register') {
                throw ValidationException::withMessages([
                    'google' => 'Akun belum terdaftar. Silakan daftar dulu dengan email yang sama.',
                ]);
            }

            throw ValidationException::withMessages([
                'google' => 'Registrasi Google membutuhkan nomor telepon. Gunakan formulir registrasi biasa.',
            ]);
        }

        if ($user->is_active === false) {
            throw ValidationException::withMessages([
                'google' => 'Akun Anda sedang nonaktif. Hubungi admin untuk bantuan.',
            ]);
        }

        if ($user->email_verified_at === null) {
            $user->forceFill([
                'email_verified_at' => now(),
            ])->save();
        }

        Auth::login($user, $remember);
        $request->session()->regenerate();

        $target = match ($user->role) {
            'candidate' => route('candidate.dashboard'),
            'employer' => route('employer.dashboard'),
            'admin' => route('admin.dashboard'),
            default => route('dashboard'),
        };

        return redirect()->intended($target);
    }

    private function validationMessage(ValidationException $exception): string
    {
        $errors = $exception->errors();
        $first = data_get($errors, 'google.0');

        return is_string($first) && $first !== '' ? $first : 'Login Google gagal.';
    }
}
