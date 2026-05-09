<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('salary_insights', function (Blueprint $table) {
            $table->string('source_name')->nullable()->after('location_city');
            $table->date('dataset_date')->nullable()->after('source_name');
            $table->index('dataset_date');
        });
    }

    public function down(): void
    {
        Schema::table('salary_insights', function (Blueprint $table) {
            $table->dropIndex(['dataset_date']);
            $table->dropColumn(['source_name', 'dataset_date']);
        });
    }
};
