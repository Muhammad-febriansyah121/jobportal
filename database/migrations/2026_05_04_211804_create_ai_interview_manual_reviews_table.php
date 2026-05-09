<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_interview_manual_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ai_interview_session_id')
                ->constrained('ai_interview_sessions')
                ->cascadeOnDelete();
            $table->foreignId('reviewer_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->unsignedTinyInteger('rating');
            $table->string('decision', 16);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['ai_interview_session_id', 'reviewer_id'], 'unique_session_reviewer');
            $table->index('decision');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_interview_manual_reviews');
    }
};
