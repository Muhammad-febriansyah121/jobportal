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
                'ai_interview_quota' => 1,
                'talent_search_quota' => 1,
                'features_json' => [
                    ['label' => '14 Hari Masa Aktif', 'included' => true],
                    ['label' => '3 Job Posting Reguler', 'included' => true],
                    ['label' => '1 Job Invitation', 'included' => true],
                    ['label' => '1 Interview AI', 'included' => true],
                    ['label' => 'Job Matching', 'included' => true],
                    ['label' => 'Unlimited Job Applications', 'included' => true],
                ],
                'is_active' => true,
                'is_trial' => false,
            ],
            [
                'name' => 'Trial',
                'slug' => 'trial',
                'price' => 0,
                'duration_days' => 14,
                'active_jobs_limit' => 2,
                'recruiter_seat_limit' => 1,
                'ai_screening_quota' => 0,
                'ai_interview_quota' => 5,
                'talent_search_quota' => 3,
                'features_json' => [
                    ['label' => '14 Hari Masa Aktif', 'included' => true],
                    ['label' => '2 Job Posting Reguler', 'included' => true],
                    ['label' => '3 Job Invitation', 'included' => true],
                    ['label' => '5 Interview AI', 'included' => true],
                    ['label' => 'Job Matching', 'included' => true],
                    ['label' => 'Unlimited Job Applications', 'included' => true],
                    ['label' => 'Hanya 1× per akun', 'included' => true],
                ],
                'is_active' => true,
                'is_trial' => true,
            ],
            [
                'name' => 'Standard',
                'slug' => 'standart',
                'price' => 125000,
                'duration_days' => 30,
                'active_jobs_limit' => 3,
                'recruiter_seat_limit' => 1,
                'ai_screening_quota' => 0,
                'ai_interview_quota' => 3,
                'talent_search_quota' => 2,
                'features_json' => [
                    ['label' => '1 Bulan Masa Aktif', 'included' => true],
                    ['label' => '3 Job Posting Reguler', 'included' => true],
                    ['label' => '2 Job Invitation', 'included' => true],
                    ['label' => '3 Interview AI', 'included' => true],
                    ['label' => 'Job Matching', 'included' => true],
                    ['label' => 'Unlimited Job Applications', 'included' => true],
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Basic',
                'slug' => 'basic',
                'price' => 250000,
                'duration_days' => 90,
                'active_jobs_limit' => 9,
                'recruiter_seat_limit' => 1,
                'ai_screening_quota' => 0,
                'ai_interview_quota' => 9,
                'talent_search_quota' => 5,
                'features_json' => [
                    ['label' => '3 Bulan Masa Aktif', 'included' => true],
                    ['label' => '9 Job Posting Reguler', 'included' => true],
                    ['label' => '5 Job Invitation', 'included' => true],
                    ['label' => '9 Interview AI', 'included' => true],
                    ['label' => 'Job Matching', 'included' => true],
                    ['label' => 'Unlimited Job Applications', 'included' => true],
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Medium',
                'slug' => 'medium',
                'price' => 450000,
                'duration_days' => 180,
                'active_jobs_limit' => 20,
                'recruiter_seat_limit' => 1,
                'ai_screening_quota' => 0,
                'ai_interview_quota' => 25,
                'talent_search_quota' => 20,
                'features_json' => [
                    ['label' => '6 Bulan Masa Aktif', 'included' => true],
                    ['label' => '20 Job Posting Reguler', 'included' => true],
                    ['label' => '20 Job Invitation', 'included' => true],
                    ['label' => '25 Interview AI', 'included' => true],
                    ['label' => 'Job Matching', 'included' => true],
                    ['label' => 'Unlimited Job Applications', 'included' => true],
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Profesional',
                'slug' => 'profesional',
                'price' => 900000,
                'duration_days' => 180,
                'active_jobs_limit' => 20,
                'recruiter_seat_limit' => 1,
                'ai_screening_quota' => 0,
                'ai_interview_quota' => 50,
                'talent_search_quota' => 20,
                'features_json' => [
                    ['label' => '6 Bulan Masa Aktif', 'included' => true],
                    ['label' => '20 Job Posting Reguler', 'included' => true],
                    ['label' => '20 Job Invitation', 'included' => true],
                    ['label' => '50 Interview AI', 'included' => true],
                    ['label' => 'Job Matching', 'included' => true],
                    ['label' => 'Unlimited Job Applications', 'included' => true],
                ],
                'is_active' => true,
            ],
            [
                'name' => 'Enterprise',
                'slug' => 'enterprise',
                'price' => 0,
                'duration_days' => 365,
                'active_jobs_limit' => 0,
                'recruiter_seat_limit' => 0,
                'ai_screening_quota' => 0,
                'ai_interview_quota' => 0,
                'talent_search_quota' => 0,
                'features_json' => [
                    ['label' => 'Costume Plan sesuai kebutuhan tim', 'included' => true],
                    ['label' => 'Negosiasi langsung dengan tim Karivia', 'included' => true],
                    ['label' => 'Job Matching', 'included' => true],
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
