<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_interview_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('ai_interview_sessions')->cascadeOnDelete();
            $table->foreignId('question_id')->constrained('ai_interview_questions')->cascadeOnDelete();
            $table->text('answer_text')->nullable();
            $table->unsignedTinyInteger('ai_score')->nullable();
            $table->text('ai_analysis')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_interview_responses');
    }
};
