<?php

namespace Database\Factories;

use App\Models\CompanySize;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CompanySize>
 */
class CompanySizeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        static $order = 1;

        return [
            'label' => fake()->unique()->randomElement(['1-10 karyawan', '11-50 karyawan', '51-200 karyawan', '201-500 karyawan', '501-1000 karyawan', '1001-5000 karyawan', '5000+ karyawan']),
            'sort_order' => $order++,
        ];
    }
}
