<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('learning_path_steps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('career_recommendation_id')->constrained('ai_career_recommendations')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->unsignedTinyInteger('order_number')->default(1);
            $table->string('status')->default('not_started')->comment('not_started, in_progress, completed');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('learning_path_steps');
    }
};
