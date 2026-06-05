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
     * @param  array<string, mixed>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            ...$this->profileRules(),
            'phone' => $this->phoneRules(),
            'role' => ['required', 'in:candidate,employer'],
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

        $user = User::create([
            'name' => $input['name'],
            'email' => $input['email'],
            'phone' => $input['phone'],
            'password' => $input['password'],
            'role' => $input['role'],
        ]);

        if ($user->role === 'candidate') {
            $user->candidateProfile()->firstOrCreate(
                ['user_id' => $user->id],
                [
                    'full_name' => $user->name,
                    'work_mode_pref' => 'any',
                ]
            );
        }

        return $user;
    }
}
