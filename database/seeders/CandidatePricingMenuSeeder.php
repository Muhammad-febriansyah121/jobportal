<?php

namespace Database\Seeders;

use App\Models\CandidatePricingMenu;
use Illuminate\Database\Seeder;

class CandidatePricingMenuSeeder extends Seeder
{
    public function run(): void
    {
        $menus = [
            [
                'name' => 'Paket Jobseeker',
                'slug' => 'paket-jobseeker',
                'description' => 'Simulasi belajar interview AI 5x dalam sebulan & dijelaskan kelebihan dan kekurangan, Pembuatan CV ATS, Analisa CV, dan Career Coach.',
                'price' => 45000,
                'ai_token_amount' => 0,
                'cv_builder_quota' => 1,
                'ai_interview_quota' => 5,
                'validity_days' => 30,
                'features_json' => [
                    'Simulasi belajar interview AI 5x dalam sebulan & dijelaskan kelebihan dan kekurangan',
                    'Pembuatan CV ATS',
                    'Analisa CV',
                    'Career Coach',
                ],
                'is_default_free' => false,
                'is_active' => true,
                'is_trial' => false,
            ],
            [
                'name' => 'Trial Jobseeker',
                'slug' => 'trial-jobseeker',
                'description' => 'Coba premium gratis selama 7 hari: 2x Simulasi Interview AI, 1 Kuota CV ATS. Hanya bisa diklaim 1x per akun.',
                'price' => 0,
                'ai_token_amount' => 0,
                'cv_builder_quota' => 1,
                'ai_interview_quota' => 2,
                'validity_days' => 7,
                'features_json' => [
                    '2x Simulasi Interview AI',
                    '1 Kuota CV Builder ATS',
                    'Analisa CV',
                    'Career Coach',
                    'Hanya 1x per akun',
                ],
                'is_default_free' => false,
                'is_active' => true,
                'is_trial' => true,
            ],
        ];

        foreach ($menus as $menu) {
            CandidatePricingMenu::updateOrCreate(
                ['slug' => $menu['slug']],
                $menu,
            );
        }
    }
}
