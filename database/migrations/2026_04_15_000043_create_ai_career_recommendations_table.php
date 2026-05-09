<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_career_recommendations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('candidate_id')->constrained('candidate_profiles')->cascadeOnDelete();
            $table->foreignId('coaching_session_id')->nullable()->constrained('ai_career_coaching_sessions')->nullOnDelete();
            $table->string('title');
            $table->unsignedTinyInteger('match_score')->nullable();
            $table->json('recommendation_json')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_career_recommendations');
    }
};
