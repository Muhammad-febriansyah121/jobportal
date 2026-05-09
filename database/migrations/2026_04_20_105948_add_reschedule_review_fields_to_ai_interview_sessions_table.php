<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('ai_interview_sessions', 'reschedule_status')) {
            Schema::table('ai_interview_sessions', function (Blueprint $table) {
                $table->string('reschedule_status', 20)->nullable()->after('reschedule_reason')->index();
            });
        }

        Schema::table('ai_interview_sessions', function (Blueprint $table) {
            $table->timestamp('reschedule_reviewed_at')->nullable()->after('reschedule_status');
            $table->text('reschedule_rejected_reason')->nullable()->after('reschedule_reviewed_at');
        });
    }

    public function down(): void
    {
        Schema::table('ai_interview_sessions', function (Blueprint $table) {
            $table->dropColumn([
                'reschedule_reviewed_at',
                'reschedule_rejected_reason',
            ]);
        });
    }
};
