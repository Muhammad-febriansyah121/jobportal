<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('candidate_wallet_transactions', function (Blueprint $table): void {
            if (! Schema::hasColumn('candidate_wallet_transactions', 'ai_interview_quota_delta')) {
                $table->integer('ai_interview_quota_delta')->default(0)->after('cv_builder_quota_delta');
            }
            if (! Schema::hasColumn('candidate_wallet_transactions', 'expires_at')) {
                $table->timestamp('expires_at')->nullable()->after('paid_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('candidate_wallet_transactions', function (Blueprint $table): void {
            if (Schema::hasColumn('candidate_wallet_transactions', 'expires_at')) {
                $table->dropColumn('expires_at');
            }
            if (Schema::hasColumn('candidate_wallet_transactions', 'ai_interview_quota_delta')) {
                $table->dropColumn('ai_interview_quota_delta');
            }
        });
    }
};
