<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_interview_analyses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('ai_interview_sessions')->cascadeOnDelete();
            $table->unsignedTinyInteger('fit_score')->nullable();
            $table->string('recommendation')->nullable();
            $table->text('summary')->nullable();
            $table->json('strengths')->nullable();
            $table->json('weaknesses')->nullable();
            $table->json('technical_scorecard')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_interview_analyses');
    }
};
