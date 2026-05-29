<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ai_interview_questions', function (Blueprint $table) {
            $table->string('question_type')->default('open')->after('allow_ai_followup');
            $table->json('options')->nullable()->after('question_type');
        });
    }

    public function down(): void
    {
        Schema::table('ai_interview_questions', function (Blueprint $table) {
            $table->dropColumn(['question_type', 'options']);
        });
    }
};
