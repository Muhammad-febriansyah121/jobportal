<?php

namespace App\Actions\Fortify;

use App\Actions\Candidate\EnsureCandidateReferralCode;
use App\Actions\Candidate\RedeemReferralVoucher;
use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\Setting;
use App\Models\User;
use App\Services\RecaptchaService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    public function __construct(
        private RecaptchaService $recaptchaService,
        private RedeemReferralVoucher $redeemReferralVoucher,
        private EnsureCandidateReferralCode $ensureCandidateReferralCode,
    ) {}

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
            'referral_code' => ['nullable', 'string', 'max:50'],
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

        return DB::transaction(function () use ($input): User {
            $user = User::create([
                'name' => $input['name'],
                'email' => $input['email'],
                'phone' => $input['phone'],
                'password' => $input['password'],
                'role' => $input['role'],
            ]);

            if ($user->role === 'candidate') {
                $candidate = $user->candidateProfile()->firstOrCreate(
                    ['user_id' => $user->id],
                    [
                        'full_name' => $user->name,
                        'work_mode_pref' => 'any',
                    ]
                );

                if (filled($input['referral_code'] ?? null)) {
                    try {
                        $this->redeemReferralVoucher->handle($candidate, (string) $input['referral_code']);
                    } catch (ValidationException $exception) {
                        throw ValidationException::withMessages([
                            'referral_code' => $exception->errors()['code'] ?? ['Kode referral tidak dapat digunakan.'],
                        ]);
                    }
                }

                $this->ensureCandidateReferralCode->handle($candidate);
            }

            return $user;
        });
    }
}
