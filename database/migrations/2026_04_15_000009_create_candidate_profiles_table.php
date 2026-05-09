<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('candidate_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('full_name');
            $table->string('headline')->nullable();
            $table->text('bio')->nullable();
            $table->string('location_city')->nullable();
            $table->string('location_province')->nullable();
            $table->unsignedBigInteger('expected_salary_min')->nullable();
            $table->unsignedBigInteger('expected_salary_max')->nullable();
            $table->enum('work_mode_pref', ['remote', 'hybrid', 'onsite', 'any'])->default('any');
            $table->string('availability')->nullable();
            $table->unsignedTinyInteger('profile_completion')->default(0)->comment('percentage 0-100');
            $table->text('ai_cv_summary')->nullable();
            $table->string('linkedin_url')->nullable();
            $table->string('github_url')->nullable();
            $table->string('portfolio_url')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('candidate_profiles');
    }
};
