<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('candidate_pricing_menus', function (Blueprint $table): void {
            if (! Schema::hasColumn('candidate_pricing_menus', 'ai_interview_quota')) {
                $table->unsignedInteger('ai_interview_quota')->default(0)->after('cv_builder_quota');
            }
            if (! Schema::hasColumn('candidate_pricing_menus', 'validity_days')) {
                $table->unsignedInteger('validity_days')->default(30)->after('ai_interview_quota');
            }
        });
    }

    public function down(): void
    {
        Schema::table('candidate_pricing_menus', function (Blueprint $table): void {
            if (Schema::hasColumn('candidate_pricing_menus', 'validity_days')) {
                $table->dropColumn('validity_days');
            }
            if (Schema::hasColumn('candidate_pricing_menus', 'ai_interview_quota')) {
                $table->dropColumn('ai_interview_quota');
            }
        });
    }
};
