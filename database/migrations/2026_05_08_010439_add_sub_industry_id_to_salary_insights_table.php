<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('salary_insights', function (Blueprint $table) {
            if (! Schema::hasColumn('salary_insights', 'sub_industry_id')) {
                $table->foreignId('sub_industry_id')
                    ->nullable()
                    ->after('industry_id')
                    ->constrained('sub_industries')
                    ->nullOnDelete();

                return;
            }

            $table->foreign('sub_industry_id')
                ->references('id')
                ->on('sub_industries')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('salary_insights', function (Blueprint $table) {
            $table->dropForeign(['sub_industry_id']);
            $table->dropColumn('sub_industry_id');
        });
    }
};
