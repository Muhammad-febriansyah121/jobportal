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
        Schema::table('ai_interview_analyses', function (Blueprint $table) {
            $table->json('competency_scores')->nullable()->after('technical_scorecard');
            $table->json('improvement_tips')->nullable()->after('competency_scores');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ai_interview_analyses', function (Blueprint $table) {
            $table->dropColumn(['competency_scores', 'improvement_tips']);
        });
    }
};
