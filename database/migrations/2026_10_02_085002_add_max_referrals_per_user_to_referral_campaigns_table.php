<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('referral_campaigns', function (Blueprint $table) {
            $table->unsignedInteger('max_referrals_per_user')->nullable()->after('max_redemptions');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('referral_campaigns', function (Blueprint $table) {
            $table->dropColumn('max_referrals_per_user');
        });
    }
};
