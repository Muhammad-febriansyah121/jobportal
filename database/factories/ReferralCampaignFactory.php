<?php

namespace Database\Factories;

use App\Models\ReferralCampaign;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ReferralCampaign>
 */
class ReferralCampaignFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->words(3, true),
            'slug' => fake()->unique()->slug(),
            'description' => fake()->sentence(),
            'ai_token_amount' => 1000,
            'cv_builder_quota' => 1,
            'ai_interview_quota' => 2,
            'validity_days' => 30,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addMonth(),
            'max_redemptions' => null,
            'is_active' => true,
        ];
    }
}
