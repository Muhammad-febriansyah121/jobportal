<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ai_interview_sessions', function (Blueprint $table): void {
            $table->string('practice_mode', 20)->default('interview')->after('candidate_id')->index();
            $table->string('target_skill', 80)->nullable()->after('practice_mode');
            $table->string('skill_level', 20)->nullable()->after('target_skill');
            $table->string('drill_format', 20)->nullable()->after('skill_level');
            $table->foreignId('application_id')->nullable()->change();
        });

        Schema::table('ai_interview_questions', function (Blueprint $table): void {
            $table->foreignId('application_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('ai_interview_questions', function (Blueprint $table): void {
            $table->foreignId('application_id')->nullable(false)->change();
        });

        Schema::table('ai_interview_sessions', function (Blueprint $table): void {
            $table->dropIndex(['practice_mode']);
            $table->dropColumn(['practice_mode', 'target_skill', 'skill_level', 'drill_format']);
        });
    }
};
