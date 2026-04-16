<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\Setting;
use App\Models\User;
use App\Services\RecaptchaService;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    public function __construct(private RecaptchaService $recaptchaService) {}

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
        ])->validate();

        $siteKey = Setting::where('key', 'recaptcha_site_key')->value('value');
        $secretKey = Setting::where('key', 'recaptcha_secret_key')->value('value');

        if (! empty($siteKey) && ! empty($secretKey)) {
            $token = $input['recaptcha_token'] ?? '';

            if (! $token || ! $this->recaptchaService->verify($token, $secretKey)) {
                throw ValidationException::withMessages([
                    'email' => [__('Verifikasi reCAPTCHA gagal. Silakan coba lagi.')],
                ]);
            }
        }

        return User::create([
            'name' => $input['name'],
            'email' => $input['email'],
            'password' => $input['password'],
        ]);
    }
}
