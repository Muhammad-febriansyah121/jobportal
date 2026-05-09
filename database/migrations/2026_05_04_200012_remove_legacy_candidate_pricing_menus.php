<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('candidate_pricing_menus')
            ->whereIn('slug', [
                'gratis-cv-builder',
                'topup-ai-5000-token',
                'topup-ai-20000-token',
            ])
            ->delete();
    }

    public function down(): void
    {
        // Legacy menus tidak di-restore otomatis. Jalankan CandidatePricingMenuSeeder
        // jika butuh data lama untuk pengujian.
    }
};
