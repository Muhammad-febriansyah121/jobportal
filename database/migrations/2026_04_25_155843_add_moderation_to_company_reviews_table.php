<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('company_reviews', function (Blueprint $table): void {
            $table->timestamp('reviewed_at')->nullable()->after('status');
            $table->foreignId('reviewed_by')->nullable()->after('reviewed_at')->constrained('users')->nullOnDelete();
            $table->text('rejection_reason')->nullable()->after('reviewed_by');

            $table->text('employer_reply')->nullable()->after('rejection_reason');
            $table->timestamp('employer_replied_at')->nullable()->after('employer_reply');
            $table->foreignId('employer_replied_by')->nullable()->after('employer_replied_at')->constrained('users')->nullOnDelete();

            $table->text('flag_reason')->nullable()->after('employer_replied_by');
            $table->timestamp('flagged_at')->nullable()->after('flag_reason');
            $table->foreignId('flagged_by')->nullable()->after('flagged_at')->constrained('users')->nullOnDelete();
            $table->timestamp('flag_resolved_at')->nullable()->after('flagged_by');

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::table('company_reviews', function (Blueprint $table): void {
            $table->dropForeign(['reviewed_by']);
            $table->dropForeign(['employer_replied_by']);
            $table->dropForeign(['flagged_by']);
            $table->dropIndex(['status']);
            $table->dropColumn([
                'reviewed_at', 'reviewed_by', 'rejection_reason',
                'employer_reply', 'employer_replied_at', 'employer_replied_by',
                'flag_reason', 'flagged_at', 'flagged_by', 'flag_resolved_at',
            ]);
        });
    }
};
