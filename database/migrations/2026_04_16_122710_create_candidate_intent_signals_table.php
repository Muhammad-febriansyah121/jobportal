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
        Schema::create('candidate_intent_signals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('candidate_id')->unique()->constrained('candidate_profiles')->cascadeOnDelete();
            $table->json('top_industries')->nullable();
            $table->json('top_work_modes')->nullable();
            $table->json('top_job_types')->nullable();
            $table->json('top_skills')->nullable();
            $table->unsignedBigInteger('inferred_salary_min')->nullable();
            $table->unsignedBigInteger('inferred_salary_max')->nullable();
            $table->unsignedTinyInteger('intent_strength')->default(0);
            $table->timestamp('last_computed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('candidate_intent_signals');
    }
};
