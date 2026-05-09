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
        Schema::table('job_listings', function (Blueprint $table) {
            $table->enum('qualification', ['sma', 'd3', 's1', 's2', 's3'])
                ->nullable()
                ->after('experience_level');
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
        Schema::table('job_listings', function (Blueprint $table) {
            $table->dropColumn(['qualification', 'experience_min_years', 'experience_max_years']);
        });
    }
};
