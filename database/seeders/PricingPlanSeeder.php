<?php

namespace Database\Seeders;

use App\Models\PricingPlan;
use Illuminate\Database\Seeder;

class PricingPlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Gratis / Trial',
                'slug' => 'gratis-trial',
                'price' => 0,
                'duration_days' => 14,
                'active_jobs_limit' => 3,
                'recruiter_seat_limit' => 1,
                'ai_screening_quota' => 0,
                'talent_search_quota' => 1,
                'features_json' => [
                    ['label' => '14 Hari Masa Aktif', 'included' => true],
                    ['label' => '3 Job Posting Reguler', 'included' => true],
                    ['label' => 'Job Posting Premium', 'included' => false],
                    ['label' => '1 Job Invitation', 'included' => true],
                    ['label' => 'Talent Search', 'included' => true],
                    ['label' => 'Unlimited Job Applications', 'included' => true],
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Standart',
                'slug' => 'standart',
                'price' => 149000,
                'duration_days' => 30,
                'active_jobs_limit' => 5,
                'recruiter_seat_limit' => 1,
                'ai_screening_quota' => 0,
                'talent_search_quota' => 3,
                'features_json' => [
                    ['label' => '1 Bulan Masa Aktif', 'included' => true],
                    ['label' => '5 Job Posting Reguler', 'included' => true],
                    ['label' => 'Job Posting Premium', 'included' => false],
                    ['label' => '3 Job Invitation', 'included' => true],
                    ['label' => 'Talent Search', 'included' => true],
                    ['label' => 'Unlimited Job Applications', 'included' => true],
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Basic',
                'slug' => 'basic',
                'price' => 249000,
                'duration_days' => 90,
                'active_jobs_limit' => 10,
                'recruiter_seat_limit' => 1,
                'ai_screening_quota' => 1,
                'talent_search_quota' => 20,
                'features_json' => [
                    ['label' => '3 Bulan Masa Aktif', 'included' => true],
                    ['label' => '10 Job Posting Reguler', 'included' => true],
                    ['label' => '1 Job Posting Premium', 'included' => true],
                    ['label' => '20 Job Invitation', 'included' => true],
                    ['label' => 'Talent Search', 'included' => true],
                    ['label' => 'Unlimited Job Applications', 'included' => true],
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Medium',
                'slug' => 'medium',
                'price' => 499000,
                'duration_days' => 180,
                'active_jobs_limit' => 20,
                'recruiter_seat_limit' => 2,
                'ai_screening_quota' => 3,
                'talent_search_quota' => 50,
                'features_json' => [
                    ['label' => '6 Bulan Masa Aktif', 'included' => true],
                    ['label' => '20 Job Posting Reguler', 'included' => true],
                    ['label' => '3 Job Posting Premium', 'included' => true],
                    ['label' => '50 Job Invitation', 'included' => true],
                    ['label' => 'Talent Search', 'included' => true],
                    ['label' => 'Unlimited Job Applications', 'included' => true],
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Profesional',
                'slug' => 'profesional',
                'price' => 999000,
                'duration_days' => 365,
                'active_jobs_limit' => 50,
                'recruiter_seat_limit' => 5,
                'ai_screening_quota' => 7,
                'talent_search_quota' => 150,
                'features_json' => [
                    ['label' => '12 Bulan Masa Aktif', 'included' => true],
                    ['label' => '50 Job Posting Reguler', 'included' => true],
                    ['label' => '7 Job Posting Premium', 'included' => true],
                    ['label' => '150 Job Invitation', 'included' => true],
                    ['label' => 'Talent Search', 'included' => true],
                    ['label' => 'Unlimited Job Applications', 'included' => true],
                ],
                'is_active' => true,
            ],
        ];

        foreach ($plans as $plan) {
            PricingPlan::updateOrCreate(
                ['slug' => $plan['slug']],
                $plan,
            );
        }
    }
}
