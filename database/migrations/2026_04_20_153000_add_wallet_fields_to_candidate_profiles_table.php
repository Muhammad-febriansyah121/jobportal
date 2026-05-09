<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('candidate_profiles', function (Blueprint $table) {
            $table->unsignedBigInteger('ai_token_balance')->default(0)->after('cv_builder_updated_at');
            $table->unsignedInteger('cv_builder_quota_balance')->default(0)->after('ai_token_balance');
            $table->timestamp('free_cv_builder_granted_at')->nullable()->after('cv_builder_quota_balance');
        });
    }

    public function down(): void
    {
        Schema::table('candidate_profiles', function (Blueprint $table) {
            $table->dropColumn([
                'ai_token_balance',
                'cv_builder_quota_balance',
                'free_cv_builder_granted_at',
            ]);
        });
    }
};
