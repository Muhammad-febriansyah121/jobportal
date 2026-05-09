<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_listing_id')->constrained()->cascadeOnDelete();
            $table->foreignId('candidate_id')->constrained('candidate_profiles')->cascadeOnDelete();
            $table->foreignId('candidate_cv_id')->nullable()->constrained('candidate_cvs')->nullOnDelete();
            $table->enum('status', ['applied', 'screened', 'shortlisted', 'interview', 'offer', 'hired', 'rejected', 'withdrawn'])->default('applied');
            $table->text('cover_letter')->nullable();
            $table->unsignedTinyInteger('ai_fit_score')->nullable()->comment('score 0-100');
            $table->json('ai_skill_match')->nullable();
            $table->timestamp('applied_at')->useCurrent();
            $table->timestamp('first_responded_at')->nullable();
            $table->timestamps();

            $table->unique(['job_listing_id', 'candidate_id']);
            $table->index(['job_listing_id', 'status']);
            $table->index(['candidate_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('applications');
    }
};
