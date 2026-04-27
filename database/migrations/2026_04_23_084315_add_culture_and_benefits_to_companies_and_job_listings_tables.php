<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('companies', function (Blueprint $table): void {
            $table->text('culture')->nullable()->after('description');
            $table->text('benefits')->nullable()->after('culture');
        });

        Schema::table('job_listings', function (Blueprint $table): void {
            $table->text('benefits')->nullable()->after('preferred_qualifications');
        });
    }

    public function down(): void
    {
        Schema::table('job_listings', function (Blueprint $table): void {
            $table->dropColumn('benefits');
        });

        Schema::table('companies', function (Blueprint $table): void {
            $table->dropColumn(['culture', 'benefits']);
        });
    }
};
