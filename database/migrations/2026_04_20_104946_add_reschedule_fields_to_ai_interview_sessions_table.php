<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ai_interview_sessions', function (Blueprint $table) {
            $table->timestamp('reschedule_requested_at')->nullable()->after('declined_at');
            $table->timestamp('reschedule_proposed_at')->nullable()->after('reschedule_requested_at');
            $table->text('reschedule_reason')->nullable()->after('reschedule_proposed_at');
            $table->string('reschedule_status', 20)->nullable()->after('reschedule_reason')->index();
        });
    }

    public function down(): void
    {
        Schema::table('ai_interview_sessions', function (Blueprint $table) {
            $table->dropColumn([
                'reschedule_requested_at',
                'reschedule_proposed_at',
                'reschedule_reason',
                'reschedule_status',
            ]);
        });
    }
};
