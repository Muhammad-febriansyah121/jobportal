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
                'name' => 'Gratis CV Builder',
                'slug' => 'gratis-cv-builder',
                'description' => 'Akses sekali pakai untuk membuat CV Builder sebelum topup.',
                'price' => 0,
                'ai_token_amount' => 0,
                'cv_builder_quota' => 1,
                'features_json' => [
                    '1x buat CV Builder gratis',
                    'Template CV ATS-friendly',
                    'Cocok untuk user baru',
                ],
                'is_default_free' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Topup AI 5.000 Token',
                'slug' => 'topup-ai-5000-token',
                'description' => 'Topup ekonomis untuk kandidat yang ingin membuat CV Builder lagi.',
                'price' => 5000,
                'ai_token_amount' => 5000,
                'cv_builder_quota' => 1,
                'features_json' => [
                    'Tambahan 5.000 token AI',
                    '1x kuota CV Builder tambahan',
                    'Bisa digunakan untuk regenerasi draft',
                ],
                'is_default_free' => false,
                'is_active' => true,
            ],
            [
                'name' => 'Topup AI 20.000 Token',
                'slug' => 'topup-ai-20000-token',
                'description' => 'Paket hemat untuk kandidat aktif update CV dan optimasi AI.',
                'price' => 15000,
                'ai_token_amount' => 20000,
                'cv_builder_quota' => 5,
                'features_json' => [
                    'Tambahan 20.000 token AI',
                    '5x kuota CV Builder',
                    'Cocok untuk optimasi CV berkala',
                ],
                'is_default_free' => false,
                'is_active' => true,
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
