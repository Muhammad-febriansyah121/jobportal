<?php

namespace App\Actions\Fortify;

use App\Models\Setting;
use App\Services\RecaptchaService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class EnsureRecaptchaIsValid
{
    public function __construct(private RecaptchaService $recaptchaService) {}

    /**
     * Handle the incoming request within the Fortify login pipeline.
     */
    public function handle(Request $request, \Closure $next): mixed
    {
        $siteKey = Setting::where('key', 'recaptcha_site_key')->value('value');
        $secretKey = Setting::where('key', 'recaptcha_secret_key')->value('value');

        if (! empty($siteKey) && ! empty($secretKey)) {
            $token = $request->input('recaptcha_token');

            if (! $token || ! $this->recaptchaService->verify($token, $secretKey)) {
                throw ValidationException::withMessages([
                    'email' => [__('Verifikasi reCAPTCHA gagal. Silakan coba lagi.')],
                ]);
            }
        }

        return $next($request);
    }
}
