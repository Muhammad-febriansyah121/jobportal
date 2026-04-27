<?php

namespace Database\Seeders;

use App\Models\CareerResource;
use App\Models\Industry;
use App\Models\SalaryInsight;
use App\Models\Skill;
use Illuminate\Database\Seeder;

class DummyDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->call([
            CandidatePricingMenuSeeder::class,
            PricingPlanSeeder::class,
        ]);

        Industry::factory()->count(15)->create();
        Skill::factory()->count(30)->create();
        SalaryInsight::factory()->count(50)->create();
        CareerResource::factory()->count(20)->create();
    }
}
