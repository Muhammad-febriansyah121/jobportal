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
        Schema::table('candidate_profiles', function (Blueprint $table) {
            if (! Schema::hasColumn('candidate_profiles', 'preferred_industry_id')) {
                $table->foreignId('preferred_industry_id')
                    ->nullable()
                    ->after('work_mode_pref')
                    ->constrained('industries')
                    ->nullOnDelete();
            }

            if (! Schema::hasColumn('candidate_profiles', 'preferred_role')) {
                $table->string('preferred_role')->nullable()->after('preferred_industry_id');
            }
        });

        Schema::table('applications', function (Blueprint $table) {
            if (! Schema::hasColumn('applications', 'screening_answers_json')) {
                $table->json('screening_answers_json')->nullable()->after('cover_letter');
            }
        });

        Schema::table('reports', function (Blueprint $table) {
            if (! Schema::hasColumn('reports', 'reporter_note')) {
                $table->text('reporter_note')->nullable()->after('reason');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            if (Schema::hasColumn('reports', 'reporter_note')) {
                $table->dropColumn('reporter_note');
            }
        });

        Schema::table('applications', function (Blueprint $table) {
            if (Schema::hasColumn('applications', 'screening_answers_json')) {
                $table->dropColumn('screening_answers_json');
            }
        });

        Schema::table('candidate_profiles', function (Blueprint $table) {
            if (Schema::hasColumn('candidate_profiles', 'preferred_industry_id')) {
                $table->dropConstrainedForeignId('preferred_industry_id');
            }

            if (Schema::hasColumn('candidate_profiles', 'preferred_role')) {
                $table->dropColumn('preferred_role');
            }
        });
    }
};
