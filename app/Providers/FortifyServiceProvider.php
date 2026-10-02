<?php

namespace App\Providers;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Fortify\EnsureRecaptchaIsValid;
use App\Actions\Fortify\ResetUserPassword;
use App\Http\Responses\LoginResponse;
use App\Http\Responses\RegisterResponse;
use App\Models\Setting;
use App\Models\Skill;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Laravel\Fortify\Actions\AttemptToAuthenticate as FortifyAttemptToAuthenticate;
use Laravel\Fortify\Actions\PrepareAuthenticatedSession as FortifyPrepareAuthenticatedSession;
use Laravel\Fortify\Actions\RedirectIfTwoFactorAuthenticatable as FortifyRedirectIfTwoFactorAuthenticatable;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Laravel\Fortify\Contracts\RegisterResponse as RegisterResponseContract;
use Laravel\Fortify\Features;
use Laravel\Fortify\Fortify;

class FortifyServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(LoginResponseContract::class, LoginResponse::class);
        $this->app->singleton(RegisterResponseContract::class, RegisterResponse::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureActions();
        $this->configureViews();
        $this->configureRateLimiting();
        $this->configureMail();
    }

    /**
     * Customize Fortify-related notification emails (reset password, verify email).
     */
    private function configureMail(): void
    {
        ResetPassword::toMailUsing(function (object $notifiable, string $token): MailMessage {
            $brand = trim((string) Setting::get('site_name', '')) ?: (string) config('app.name', 'Karivia');
            $url = url(route('password.reset', [
                'token' => $token,
                'email' => $notifiable->getEmailForPasswordReset(),
            ], false));
            $expireMinutes = (int) config('auth.passwords.users.expire', 60);

            return (new MailMessage)
                ->subject('Permintaan Reset Password — '.$brand)
                ->greeting('Halo,')
                ->line('Kami menerima permintaan untuk mereset password akun '.$brand.' Anda. Tekan tombol di bawah ini untuk membuat password baru.')
                ->action('Reset Password', $url)
                ->line('Tautan ini akan kedaluwarsa dalam '.$expireMinutes.' menit. Jika Anda tidak meminta reset password, abaikan email ini dan password Anda akan tetap sama.')
                ->line('Demi keamanan, jangan pernah membagikan tautan ini kepada siapa pun.')
                ->salutation('Hormat kami, Tim '.$brand);
        });

        VerifyEmail::toMailUsing(function (object $notifiable): MailMessage {
            $brand = trim((string) Setting::get('site_name', '')) ?: (string) config('app.name', 'Karivia');
            $url = URL::temporarySignedRoute(
                'verification.verify',
                Carbon::now()->addMinutes((int) config('auth.verification.expire', 60)),
                [
                    'id' => $notifiable->getKey(),
                    'hash' => sha1($notifiable->getEmailForVerification()),
                ],
                absolute: false,
            );

            return (new MailMessage)
                ->subject('Verifikasi Alamat Email Anda — '.$brand)
                ->greeting('Selamat datang di '.$brand.',')
                ->line('Terima kasih telah mendaftar. Untuk mengaktifkan akun dan mulai menggunakan layanan, mohon konfirmasi alamat email Anda dengan menekan tombol di bawah.')
                ->action('Verifikasi Email', $url)
                ->line('Apabila Anda tidak merasa membuat akun di '.$brand.', abaikan saja email ini. Akun tidak akan diaktifkan tanpa verifikasi.')
                ->salutation('Hormat kami, Tim '.$brand);
        });
    }

    /**
     * Configure Fortify actions.
     */
    private function configureActions(): void
    {
        Fortify::resetUserPasswordsUsing(ResetUserPassword::class);
        Fortify::createUsersUsing(CreateNewUser::class);

        Fortify::authenticateThrough(function () {
            return array_filter([
                EnsureRecaptchaIsValid::class,
                FortifyRedirectIfTwoFactorAuthenticatable::class,
                FortifyAttemptToAuthenticate::class,
                FortifyPrepareAuthenticatedSession::class,
            ]);
        });
    }

    /**
     * Configure Fortify views.
     */
    private function configureViews(): void
    {
        Fortify::loginView(function (Request $request) {
            $recaptchaSiteKey = Setting::where('key', 'recaptcha_site_key')->value('value') ?? '';
            $recaptchaSecretKey = Setting::where('key', 'recaptcha_secret_key')->value('value') ?? '';
            $configClientId = trim((string) config('services.google_login.client_id'));
            $googleLoginClientId = $configClientId !== ''
                ? $configClientId
                : trim((string) (Setting::where('key', 'google_login_client_id')->value('value') ?? ''));
            $recaptchaEnabled = ! empty($recaptchaSiteKey) && ! empty($recaptchaSecretKey);
            $redirect = $request->query('redirect');

            if (is_string($redirect)
                && Str::startsWith($redirect, '/')
                && ! Str::startsWith($redirect, '//')) {
                $request->session()->put('url.intended', $redirect);
            }

            return Inertia::render('auth/login', [
                'canResetPassword' => Features::enabled(Features::resetPasswords()),
                'canRegister' => Features::enabled(Features::registration()),
                'status' => $request->session()->get('status'),
                'recaptchaSiteKey' => $recaptchaEnabled ? $recaptchaSiteKey : '',
                'recaptchaEnabled' => $recaptchaEnabled,
                'googleLoginClientId' => $googleLoginClientId,
            ]);
        });

        Fortify::resetPasswordView(fn (Request $request) => Inertia::render('auth/reset-password', [
            'email' => $request->email,
            'token' => $request->route('token'),
        ]));

        Fortify::requestPasswordResetLinkView(fn (Request $request) => Inertia::render('auth/forgot-password', [
            'status' => $request->session()->get('status'),
        ]));

        Fortify::verifyEmailView(fn (Request $request) => Inertia::render('auth/verify-email', [
            'status' => $request->session()->get('status'),
        ]));

        Fortify::registerView(function (Request $request) {
            $recaptchaSiteKey = Setting::where('key', 'recaptcha_site_key')->value('value') ?? '';
            $recaptchaSecretKey = Setting::where('key', 'recaptcha_secret_key')->value('value') ?? '';
            $recaptchaEnabled = ! empty($recaptchaSiteKey) && ! empty($recaptchaSecretKey);
            $configClientId = trim((string) config('services.google_login.client_id'));
            $googleLoginClientId = $configClientId !== ''
                ? $configClientId
                : trim((string) (Setting::where('key', 'google_login_client_id')->value('value') ?? ''));

            $page = match ((string) $request->query('type')) {
                'candidate' => 'auth/register-candidate',
                'employer' => 'auth/register-employer',
                default => 'auth/register',
            };

            $props = [
                'recaptchaSiteKey' => $recaptchaEnabled ? $recaptchaSiteKey : '',
                'recaptchaEnabled' => $recaptchaEnabled,
            ];

            if ($page === 'auth/register-candidate') {
                $props['skills'] = Skill::orderBy('name')->pluck('name')->toArray();
                $props['googleLoginClientId'] = $googleLoginClientId;
                $props['referralCode'] = trim((string) $request->query('referral_code', $request->query('ref', '')));
            }

            return Inertia::render($page, $props);
        });

        Fortify::twoFactorChallengeView(fn () => Inertia::render('auth/two-factor-challenge'));

        Fortify::confirmPasswordView(fn () => Inertia::render('auth/confirm-password'));
    }

    /**
     * Configure rate limiting.
     */
    private function configureRateLimiting(): void
    {
        RateLimiter::for('two-factor', function (Request $request) {
            return Limit::perMinute(5)->by($request->session()->get('login.id'));
        });

        RateLimiter::for('login', function (Request $request) {
            $throttleKey = Str::transliterate(Str::lower($request->input(Fortify::username())).'|'.$request->ip());

            return Limit::perMinute(5)->by($throttleKey);
        });
    }
}
