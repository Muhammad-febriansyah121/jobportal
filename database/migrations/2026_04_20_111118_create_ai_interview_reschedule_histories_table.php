<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_interview_reschedule_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')
                ->constrained('ai_interview_sessions')
                ->cascadeOnDelete();
            $table->foreignId('actor_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->string('action', 30);
            $table->timestamp('scheduled_at')->nullable();
            $table->text('reason')->nullable();
            $table->timestamps();

            $table->index(['session_id', 'created_at']);
            $table->index(['session_id', 'action']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_interview_reschedule_histories');
    }
};
