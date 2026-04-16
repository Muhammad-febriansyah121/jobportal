<?php

namespace Database\Factories;

use App\Models\Industry;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Industry>
 */
class IndustryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = $this->faker->unique()->randomElement([
            'Technology',
            'Healthcare',
            'Finance & Banking',
            'Education',
            'Manufacturing',
            'Retail & E-Commerce',
            'Media & Entertainment',
            'Logistics & Transportation',
            'Construction & Real Estate',
            'Telecommunications',
            'Energy & Mining',
            'Agriculture',
            'Hospitality & Tourism',
            'Government & Public Sector',
            'Non-Profit & NGO',
        ]);

        return [
            'name' => $name,
            'slug' => Str::slug($name),
        ];
    }
}
