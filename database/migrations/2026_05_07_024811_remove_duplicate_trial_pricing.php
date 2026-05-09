<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('pricing_plans')->where('is_trial', true)->delete();
        DB::table('candidate_pricing_menus')->where('is_trial', true)->delete();
    }

    public function down(): void
    {
        // Restore not supported — re-run seeder if you need trial pricing back.
    }
};
