<?php

namespace Database\Factories;

use App\Models\ReferralCampaign;
use App\Models\ReferralCode;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ReferralCode>
 */
class ReferralCodeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'referral_campaign_id' => ReferralCampaign::factory(),
            'code' => strtoupper(fake()->unique()->bothify('REF-####??')),
            'max_redemptions' => null,
            'redeemed_count' => 0,
            'is_active' => true,
        ];
    }
}
