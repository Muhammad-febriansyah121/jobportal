<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $features = [
            'Simulasi belajar interview AI 5x dalam sebulan & dijelaskan kelebihan dan kekurangan',
            'Pembuatan CV ATS',
            'Analisa CV',
            'Career Coach',
        ];

        DB::table('candidate_pricing_menus')
            ->where('slug', 'paket-jobseeker')
            ->update([
                'description' => 'Simulasi belajar interview AI 5x dalam sebulan & dijelaskan kelebihan dan kekurangan, Pembuatan CV ATS, Analisa CV, dan Career Coach.',
                'features_json' => json_encode($features),
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        // Tidak ada rollback otomatis untuk teks fitur paket.
    }
};
