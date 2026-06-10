<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add indexes for the hottest filter/sort columns that were previously
     * unindexed. Backed by query patterns in the career-resources, AI audit-log
     * cache, and application-listing endpoints.
     */
    public function up(): void
    {
        Schema::table('career_resources', function (Blueprint $table) {
            // Public/candidate listings: whereNotNull(published_at) [+ optional
            // type/category] ORDER BY published_at DESC.
            $table->index(['type', 'published_at'], 'career_resources_type_published_idx');
            $table->index(['category', 'published_at'], 'career_resources_category_published_idx');
            $table->index('published_at', 'career_resources_published_at_idx');
        });

        Schema::table('ai_audit_logs', function (Blueprint $table) {
            // AI response cache lookup: where user_id + feature + input_hash.
            $table->index(['user_id', 'feature', 'input_hash'], 'ai_audit_user_feature_hash_idx');
        });

        Schema::table('applications', function (Blueprint $table) {
            // Listing pages filter by FK then ORDER BY applied_at DESC. The
            // existing (fk, status) indexes stay for status-filtered queries.
            $table->index(['candidate_id', 'applied_at'], 'applications_candidate_applied_idx');
            $table->index(['job_listing_id', 'applied_at'], 'applications_job_applied_idx');
        });
    }

    public function down(): void
    {
        Schema::table('career_resources', function (Blueprint $table) {
            $table->dropIndex('career_resources_type_published_idx');
            $table->dropIndex('career_resources_category_published_idx');
            $table->dropIndex('career_resources_published_at_idx');
        });

        Schema::table('ai_audit_logs', function (Blueprint $table) {
            $table->dropIndex('ai_audit_user_feature_hash_idx');
        });

        Schema::table('applications', function (Blueprint $table) {
            $table->dropIndex('applications_candidate_applied_idx');
            $table->dropIndex('applications_job_applied_idx');
        });
    }
};
