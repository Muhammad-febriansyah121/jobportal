<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_career_coaching_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('ai_career_coaching_sessions')->cascadeOnDelete();
            $table->enum('role', ['user', 'assistant'])->default('user');
            $table->text('content');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_career_coaching_messages');
    }
};
