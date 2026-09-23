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
        Schema::table('applications', function (Blueprint $table) {
            $table->dropForeign(['job_listing_id']);
        });

        Schema::table('applications', function (Blueprint $table) {
            $table->foreignId('job_listing_id')->nullable()->change();
            $table->foreignId('scraped_job_id')
                ->nullable()
                ->after('job_listing_id')
                ->constrained('tb_jobs_scrap')
                ->cascadeOnDelete();
            $table->text('recipient_email')->nullable()->after('candidate_cv_id');
            $table->string('email_status', 30)->nullable()->after('recipient_email')->index();
            $table->timestamp('email_sent_at')->nullable()->after('email_status');
            $table->timestamp('email_failed_at')->nullable()->after('email_sent_at');
            $table->text('email_failure_reason')->nullable()->after('email_failed_at');
            $table->foreign('job_listing_id')->references('id')->on('job_listings')->cascadeOnDelete();
            $table->unique(['scraped_job_id', 'candidate_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->dropUnique(['scraped_job_id', 'candidate_id']);
            $table->dropForeign(['scraped_job_id']);
            $table->dropForeign(['job_listing_id']);
            $table->dropColumn([
                'scraped_job_id',
                'recipient_email',
                'email_status',
                'email_sent_at',
                'email_failed_at',
                'email_failure_reason',
            ]);
            $table->foreignId('job_listing_id')->nullable(false)->change();
            $table->foreign('job_listing_id')->references('id')->on('job_listings')->cascadeOnDelete();
        });
    }
};
