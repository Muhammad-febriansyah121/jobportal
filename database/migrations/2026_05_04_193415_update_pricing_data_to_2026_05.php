<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $employerPlans = [
            [
                'slug' => 'gratis-trial',
                'name' => 'Gratis / Trial',
                'price' => 0,
                'duration_days' => 14,
                'active_jobs_limit' => 3,
                'recruiter_seat_limit' => 1,
                'talent_search_quota' => 1,
                'ai_screening_quota' => 0,
                'ai_interview_quota' => 1,
                'features_json' => [
                    ['label' => '14 Hari Masa Aktif', 'included' => true],
                    ['label' => '3 Job Posting Reguler', 'included' => true],
                    ['label' => '1 Job Invitation', 'included' => true],
                    ['label' => '1 Interview AI', 'included' => true],
                    ['label' => 'Job Matching', 'included' => true],
                    ['label' => 'Unlimited Job Applications', 'included' => true],
                ],
                'is_active' => true,
            ],
            [
                'slug' => 'standart',
                'name' => 'Standard',
                'price' => 125000,
                'duration_days' => 30,
                'active_jobs_limit' => 3,
                'recruiter_seat_limit' => 1,
                'talent_search_quota' => 2,
                'ai_screening_quota' => 0,
                'ai_interview_quota' => 3,
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
                'slug' => 'basic',
                'name' => 'Basic',
                'price' => 250000,
                'duration_days' => 90,
                'active_jobs_limit' => 9,
                'recruiter_seat_limit' => 1,
                'talent_search_quota' => 5,
                'ai_screening_quota' => 0,
                'ai_interview_quota' => 9,
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
                'slug' => 'medium',
                'name' => 'Medium',
                'price' => 450000,
                'duration_days' => 180,
                'active_jobs_limit' => 20,
                'recruiter_seat_limit' => 1,
                'talent_search_quota' => 20,
                'ai_screening_quota' => 0,
                'ai_interview_quota' => 25,
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
                'slug' => 'profesional',
                'name' => 'Profesional',
                'price' => 900000,
                'duration_days' => 180,
                'active_jobs_limit' => 20,
                'recruiter_seat_limit' => 1,
                'talent_search_quota' => 20,
                'ai_screening_quota' => 0,
                'ai_interview_quota' => 50,
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
        ];

        foreach ($employerPlans as $plan) {
            DB::table('pricing_plans')->updateOrInsert(
                ['slug' => $plan['slug']],
                array_merge($plan, [
                    'features_json' => json_encode($plan['features_json']),
                    'updated_at' => now(),
                    'created_at' => now(),
                ]),
            );
        }

        $candidateMenu = [
            'slug' => 'paket-jobseeker',
            'name' => 'Paket Jobseeker',
            'description' => 'Akses 5x simulasi AI interview per bulan, Pembuatan CV ATS, Analisa CV, dan Career Coach.',
            'price' => 45000,
            'ai_token_amount' => 0,
            'cv_builder_quota' => 1,
            'ai_interview_quota' => 5,
            'validity_days' => 30,
            'features_json' => [
                'Simulasi AI Interview 5x/bulan dengan analisa kelebihan & kekurangan',
                'Pembuatan CV ATS-friendly',
                'Analisa CV oleh AI',
                'Career Coach',
            ],
            'is_default_free' => false,
            'is_active' => true,
        ];

        DB::table('candidate_pricing_menus')->updateOrInsert(
            ['slug' => $candidateMenu['slug']],
            array_merge($candidateMenu, [
                'features_json' => json_encode($candidateMenu['features_json']),
                'updated_at' => now(),
                'created_at' => now(),
            ]),
        );
    }

    public function down(): void
    {
        DB::table('candidate_pricing_menus')->where('slug', 'paket-jobseeker')->delete();
    }
};
