<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_match_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_listing_id')->constrained()->cascadeOnDelete();
            $table->foreignId('candidate_id')->constrained('candidate_profiles')->cascadeOnDelete();
            $table->unsignedTinyInteger('overall_score')->default(0);
            $table->unsignedTinyInteger('skill_score')->default(0);
            $table->unsignedTinyInteger('experience_score')->default(0);
            $table->unsignedTinyInteger('location_score')->default(0);
            $table->unsignedTinyInteger('salary_score')->default(0);
            $table->unsignedTinyInteger('industry_score')->default(0);
            $table->json('matched_skills')->nullable();
            $table->json('missing_skills')->nullable();
            $table->text('explanation')->nullable();
            $table->string('model_name')->nullable();
            $table->string('scoring_version')->nullable();
            $table->timestamp('computed_at')->nullable();
            $table->timestamps();

            $table->unique(['job_listing_id', 'candidate_id']);
            $table->index(['candidate_id', 'overall_score']);
            $table->index(['job_listing_id', 'overall_score']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_match_scores');
    }
};
