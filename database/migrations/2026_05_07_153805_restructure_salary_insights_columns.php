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
        Schema::table('salary_insights', function (Blueprint $table) {
            if (Schema::hasColumn('salary_insights', 'company_id')) {
                $table->dropConstrainedForeignId('company_id');
            }
            if (Schema::hasColumn('salary_insights', 'salary_median')) {
                $table->dropColumn('salary_median');
            }
        });

        Schema::table('salary_insights', function (Blueprint $table) {
            $table->enum('qualification', ['sma', 'd3', 's1', 's2', 's3'])
                ->nullable()
                ->after('salary_min');
            $table->unsignedTinyInteger('experience_min_years')
                ->nullable()
                ->after('qualification');
            $table->unsignedTinyInteger('experience_max_years')
                ->nullable()
                ->after('experience_min_years');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('salary_insights', function (Blueprint $table) {
            $table->dropColumn(['qualification', 'experience_min_years', 'experience_max_years']);
        });

        Schema::table('salary_insights', function (Blueprint $table) {
            $table->foreignId('company_id')
                ->nullable()
                ->after('id')
                ->constrained()
                ->nullOnDelete();
            $table->unsignedBigInteger('salary_median')
                ->nullable()
                ->after('salary_min');
        });
    }
};
