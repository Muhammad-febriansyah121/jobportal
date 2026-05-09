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
            $table->timestamp('scheduled_at')->nullable()->after('status')->index();
            $table->unsignedSmallInteger('duration_minutes')->default(30)->after('scheduled_at');
            $table->string('meeting_url')->nullable()->after('duration_minutes');
            $table->string('voice', 32)->default('marin')->after('meeting_url');
            $table->timestamp('candidate_confirmed_at')->nullable()->after('completed_at');
            $table->timestamp('declined_at')->nullable()->after('candidate_confirmed_at');
        });

        Schema::table('ai_interview_questions', function (Blueprint $table) {
            $table->foreignId('session_id')
                ->nullable()
                ->after('application_id')
                ->constrained('ai_interview_sessions')
                ->cascadeOnDelete();
            $table->text('rubric')->nullable()->after('category');
            $table->unsignedTinyInteger('weight')->default(10)->after('rubric');
            $table->boolean('allow_ai_followup')->default(true)->after('weight');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ai_interview_questions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('session_id');
            $table->dropColumn(['rubric', 'weight', 'allow_ai_followup']);
        });

        Schema::table('ai_interview_sessions', function (Blueprint $table) {
            $table->dropColumn([
                'scheduled_at',
                'duration_minutes',
                'meeting_url',
                'voice',
                'candidate_confirmed_at',
                'declined_at',
            ]);
        });
    }
};
