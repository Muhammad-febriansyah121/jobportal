<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ai_career_recommendations', function (Blueprint $table) {
            $table->boolean('is_primary')->default(false)->after('match_score');
            $table->string('target_role')->nullable()->after('title');
        });
    }

    public function down(): void
    {
        Schema::table('ai_career_recommendations', function (Blueprint $table) {
            $table->dropColumn(['is_primary', 'target_role']);
        });
    }
};
