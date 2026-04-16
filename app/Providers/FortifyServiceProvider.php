<?php

namespace App\Providers;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Fortify\EnsureRecaptchaIsValid;
use App\Actions\Fortify\ResetUserPassword;
use App\Models\Setting;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Laravel\Fortify\Actions\AttemptToAuthenticate as FortifyAttemptToAuthenticate;
use Laravel\Fortify\Actions\PrepareAuthenticatedSession as FortifyPrepareAuthenticatedSession;
use Laravel\Fortify\Actions\RedirectIfTwoFactorAuthenticatable as FortifyRedirectIfTwoFactorAuthenticatable;
use Laravel\Fortify\Features;
use Laravel\Fortify\Fortify;

class FortifyServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureActions();
        $this->configureViews();
        $this->configureRateLimiting();
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
            $recaptchaEnabled = ! empty($recaptchaSiteKey) && ! empty($recaptchaSecretKey);

            return Inertia::render('auth/login', [
                'canResetPassword' => Features::enabled(Features::resetPasswords()),
                'canRegister' => Features::enabled(Features::registration()),
                'status' => $request->session()->get('status'),
                'recaptchaSiteKey' => $recaptchaEnabled ? $recaptchaSiteKey : '',
                'recaptchaEnabled' => $recaptchaEnabled,
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

        Fortify::registerView(function () {
            $recaptchaSiteKey = Setting::where('key', 'recaptcha_site_key')->value('value') ?? '';
            $recaptchaSecretKey = Setting::where('key', 'recaptcha_secret_key')->value('value') ?? '';
            $recaptchaEnabled = ! empty($recaptchaSiteKey) && ! empty($recaptchaSecretKey);

            return Inertia::render('auth/register', [
                'recaptchaSiteKey' => $recaptchaEnabled ? $recaptchaSiteKey : '',
                'recaptchaEnabled' => $recaptchaEnabled,
            ]);
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
