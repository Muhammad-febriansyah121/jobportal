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
            $table->string('interview_language', 5)->default('id')->after('interview_mode');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ai_interview_sessions', function (Blueprint $table) {
            $table->dropColumn('interview_language');
        });
    }
};
