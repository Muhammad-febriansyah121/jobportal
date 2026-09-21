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
        Schema::create('job_listing_sources', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_listing_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('platform', 100);
            $table->string('external_job_id');
            $table->string('source_url', 2048);
            $table->timestamp('scraped_at')->nullable();
            $table->text('contact_email')->nullable();
            $table->boolean('email_verified')->default(false);
            $table->longText('payload_json')->nullable();
            $table->timestamps();

            $table->unique(['platform', 'external_job_id']);
            $table->index('scraped_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('job_listing_sources');
    }
};
