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
                'active_jobs_limit' => 3,
                'recruiter_seat_limit' => 1,
                'ai_screening_quota' => 0,
                'talent_search_quota' => 1,
                'features_json' => [
                    '14 Hari Masa Aktif',
                    '3 Job Posting Reguler',
                    '1 Job Invitation',
                    'Talent Search',
                    'Unlimited Job Applications',
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Standart',
                'slug' => 'standart',
                'price' => 149000,
                'active_jobs_limit' => 5,
                'recruiter_seat_limit' => 1,
                'ai_screening_quota' => 1,
                'talent_search_quota' => 3,
                'features_json' => [
                    '1 Bulan Masa Aktif',
                    '5 Job Posting Reguler',
                    '1 Job Posting Premium',
                    '3 Job Invitation',
                    'Talent Search',
                    'Unlimited Job Applications',
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Basic',
                'slug' => 'basic',
                'price' => 249000,
                'active_jobs_limit' => 10,
                'recruiter_seat_limit' => 1,
                'ai_screening_quota' => 1,
                'talent_search_quota' => 20,
                'features_json' => [
                    '3 Bulan Masa Aktif',
                    '10 Job Posting Reguler',
                    '1 Job Posting Premium',
                    '20 Job Invitation',
                    'Talent Search',
                    'Unlimited Job Applications',
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Medium',
                'slug' => 'medium',
                'price' => 499000,
                'active_jobs_limit' => 20,
                'recruiter_seat_limit' => 2,
                'ai_screening_quota' => 3,
                'talent_search_quota' => 50,
                'features_json' => [
                    '6 Bulan Masa Aktif',
                    '20 Job Posting Reguler',
                    '3 Job Posting Premium',
                    '50 Job Invitation',
                    'Talent Search',
                    'Unlimited Job Applications',
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Profesional',
                'slug' => 'profesional',
                'price' => 999000,
                'active_jobs_limit' => 50,
                'recruiter_seat_limit' => 5,
                'ai_screening_quota' => 7,
                'talent_search_quota' => 150,
                'features_json' => [
                    '12 Bulan Masa Aktif',
                    '50 Job Posting Reguler',
                    '7 Job Posting Premium',
                    '150 Job Invitation',
                    'Talent Search',
                    'Unlimited Job Applications',
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
