<?php

namespace Database\Factories;

use App\Models\Industry;
use App\Models\SalaryInsight;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SalaryInsight>
 */
class SalaryInsightFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $salaryMin = $this->faker->numberBetween(5_000_000, 15_000_000);
        $salaryMax = $salaryMin + $this->faker->numberBetween(4_000_000, 18_000_000);
        $experienceMin = $this->faker->numberBetween(0, 5);
        $experienceMax = $experienceMin + $this->faker->numberBetween(0, 4);

        return [
            'industry_id' => Industry::inRandomOrder()->value('id'),
            'job_title' => $this->faker->randomElement([
                'Software Engineer',
                'Senior Software Engineer',
                'Frontend Developer',
                'Backend Developer',
                'Full Stack Developer',
                'Mobile Developer',
                'DevOps Engineer',
                'Data Analyst',
                'Data Scientist',
                'Product Manager',
                'Project Manager',
                'UX Designer',
                'UI Designer',
                'QA Engineer',
                'Business Analyst',
                'Marketing Manager',
                'HR Manager',
                'Finance Analyst',
                'Operations Manager',
                'Sales Executive',
            ]),
            'location_city' => $this->faker->randomElement([
                'Jakarta',
                'Surabaya',
                'Bandung',
                'Medan',
                'Bekasi',
                'Tangerang',
                'Depok',
                'Semarang',
                'Makassar',
                'Yogyakarta',
            ]),
            'salary_min' => $salaryMin,
            'salary_max' => $salaryMax,
            'qualification' => $this->faker->randomElement(['sma', 'd3', 's1', 's2', 's3']),
            'experience_min_years' => $experienceMin,
            'experience_max_years' => $experienceMax,
            'source_count' => $this->faker->numberBetween(5, 200),
        ];
    }
}
