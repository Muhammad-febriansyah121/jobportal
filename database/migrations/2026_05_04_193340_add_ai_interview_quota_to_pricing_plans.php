<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pricing_plans', function (Blueprint $table): void {
            if (! Schema::hasColumn('pricing_plans', 'ai_interview_quota')) {
                $table->unsignedInteger('ai_interview_quota')->default(0)->after('ai_screening_quota');
            }
        });
    }

    public function down(): void
    {
        Schema::table('pricing_plans', function (Blueprint $table): void {
            if (Schema::hasColumn('pricing_plans', 'ai_interview_quota')) {
                $table->dropColumn('ai_interview_quota');
            }
        });
    }
};
