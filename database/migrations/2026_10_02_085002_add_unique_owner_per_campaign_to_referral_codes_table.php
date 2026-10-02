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
        Schema::table('referral_codes', function (Blueprint $table) {
            $table->unique(['referral_campaign_id', 'owner_user_id'], 'referral_codes_campaign_owner_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('referral_codes', function (Blueprint $table) {
            $table->dropUnique('referral_codes_campaign_owner_unique');
        });
    }
};
