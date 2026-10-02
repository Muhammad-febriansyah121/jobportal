<?php

namespace Database\Factories;

use App\Models\CandidateProfile;
use App\Models\ReferralCode;
use App\Models\ReferralRedemption;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ReferralRedemption>
 */
class ReferralRedemptionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'referral_code_id' => ReferralCode::factory(),
            'referral_campaign_id' => fn (array $attributes): int => (int) ReferralCode::query()->findOrFail($attributes['referral_code_id'])->referral_campaign_id,
            'candidate_id' => CandidateProfile::factory(),
            'status' => 'success',
            'redeemed_at' => now(),
            'expires_at' => now()->addDays(30),
        ];
    }
}
