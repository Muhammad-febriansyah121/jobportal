<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RecaptchaService
{
    /**
     * Verify a reCAPTCHA v3 token.
     *
     * @param  string  $token  The token from the frontend
     * @param  string  $secretKey  The secret key from settings
     * @param  float  $minScore  Minimum score to accept (0.0 to 1.0)
     */
    public function verify(string $token, string $secretKey, float $minScore = 0.5): bool
    {
        if (empty($token) || empty($secretKey)) {
            return false;
        }

        try {
            $response = Http::asForm()->post('https://www.google.com/recaptcha/api/siteverify', [
                'secret' => $secretKey,
                'response' => $token,
                'remoteip' => request()->ip(),
            ]);

            if (! $response->successful()) {
                Log::warning('reCAPTCHA verification request failed', ['status' => $response->status()]);

                return false;
            }

            $result = $response->json();

            return isset($result['success']) && $result['success'] === true
                && isset($result['score']) && $result['score'] >= $minScore;
        } catch (\Throwable $e) {
            Log::error('reCAPTCHA verification error', ['error' => $e->getMessage()]);

            return false;
        }
    }
}
