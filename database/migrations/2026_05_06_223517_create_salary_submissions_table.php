<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('salary_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('industry_id')->nullable()->constrained()->nullOnDelete();
            $table->string('job_title');
            $table->string('company_name')->nullable();
            $table->string('location_city')->nullable();
            $table->string('employment_type')->nullable();
            $table->unsignedTinyInteger('years_experience')->nullable();
            $table->unsignedBigInteger('monthly_salary');
            $table->boolean('is_anonymous')->default(true);
            $table->string('contributor_name')->nullable();
            $table->string('contributor_email')->nullable();
            $table->string('status')->default('pending');
            $table->timestamps();

            $table->index(['job_title', 'location_city']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('salary_submissions');
    }
};
