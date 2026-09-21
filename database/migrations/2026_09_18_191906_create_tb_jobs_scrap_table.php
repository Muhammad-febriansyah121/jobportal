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
        Schema::create('tb_jobs_scrap', function (Blueprint $table) {
            $table->id();
            $table->string('source_platform', 100);
            $table->string('source_job_id', 255);
            $table->string('source_url', 2048);

            $table->string('company_name', 255);
            $table->string('company_logo_url', 2048)->nullable();
            $table->string('company_website', 2048)->nullable();
            $table->longText('company_profile')->nullable();

            $table->string('title', 500);
            $table->longText('description');
            $table->string('location', 255)->nullable();
            $table->string('employment_type', 50)->nullable();
            $table->string('workplace_type', 50)->nullable();
            $table->unsignedBigInteger('salary_min')->nullable();
            $table->unsignedBigInteger('salary_max')->nullable();
            $table->string('salary_currency', 3)->default('IDR');
            $table->json('requirements')->nullable();
            $table->json('skills')->nullable();

            $table->text('hr_email')->nullable();
            $table->text('email_source')->nullable();
            $table->boolean('email_verified')->default(false);

            $table->longText('raw_payload')->nullable();
            $table->timestamp('scraped_at')->nullable();
            $table->timestamp('imported_at')->useCurrent();
            $table->string('status', 30)->default('pending');
            $table->timestamp('reviewed_at')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['source_platform', 'source_job_id']);
            $table->index(['status', 'imported_at']);
            $table->index('scraped_at');
            $table->index('location');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tb_jobs_scrap');
    }
};
