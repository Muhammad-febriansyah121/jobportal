<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_listings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('industry_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->string('slug')->unique();
            $table->longText('description');
            $table->text('responsibilities')->nullable();
            $table->text('required_qualifications')->nullable();
            $table->text('preferred_qualifications')->nullable();
            $table->string('location_city')->nullable();
            $table->string('location_province')->nullable();
            $table->enum('work_mode', ['remote', 'hybrid', 'onsite'])->default('onsite');
            $table->enum('job_type', ['full_time', 'part_time', 'contract', 'internship', 'freelance'])->default('full_time');
            $table->enum('experience_level', ['entry', 'mid', 'senior', 'lead', 'manager'])->default('mid');
            $table->unsignedBigInteger('salary_min')->nullable();
            $table->unsignedBigInteger('salary_max')->nullable();
            $table->string('salary_currency', 3)->default('IDR');
            $table->boolean('is_salary_visible')->default(true);
            $table->enum('status', ['draft', 'pending_review', 'published', 'closed', 'suspended', 'rejected'])->default('draft');
            $table->unsignedTinyInteger('integrity_score')->nullable()->comment('score 0-100');
            $table->unsignedInteger('response_sla_hours')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamp('closes_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'published_at']);
            $table->index(['company_id', 'status']);
            $table->index(['industry_id', 'work_mode', 'job_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_listings');
    }
};
