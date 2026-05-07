<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('candidate_profiles', function (Blueprint $table): void {
            if (! Schema::hasColumn('candidate_profiles', 'ai_interview_quota_balance')) {
                $table->unsignedInteger('ai_interview_quota_balance')->default(0)->after('cv_builder_quota_balance');
            }
            if (! Schema::hasColumn('candidate_profiles', 'free_ai_interview_granted_at')) {
                $table->timestamp('free_ai_interview_granted_at')->nullable()->after('free_cv_builder_granted_at');
            }
            if (! Schema::hasColumn('candidate_profiles', 'ai_interview_quota_expires_at')) {
                $table->timestamp('ai_interview_quota_expires_at')->nullable()->after('free_ai_interview_granted_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('candidate_profiles', function (Blueprint $table): void {
            foreach (['ai_interview_quota_expires_at', 'free_ai_interview_granted_at', 'ai_interview_quota_balance'] as $column) {
                if (Schema::hasColumn('candidate_profiles', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
