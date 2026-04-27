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
        Schema::table('ai_interview_sessions', function (Blueprint $table) {
            $table->longText('live_transcript')->nullable()->after('recording_url');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ai_interview_sessions', function (Blueprint $table) {
            $table->dropColumn('live_transcript');
        });
    }
};
