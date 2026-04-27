<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('candidate_profiles', function (Blueprint $table) {
            $table->json('cv_builder_json')->nullable()->after('ai_cv_summary');
            $table->timestamp('cv_builder_updated_at')->nullable()->after('cv_builder_json');
        });
    }

    public function down(): void
    {
        Schema::table('candidate_profiles', function (Blueprint $table) {
            $table->dropColumn(['cv_builder_json', 'cv_builder_updated_at']);
        });
    }
};
