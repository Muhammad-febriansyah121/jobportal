<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('job_listings', function (Blueprint $table): void {
            if (! Schema::hasColumn('job_listings', 'is_urgent')) {
                $table->boolean('is_urgent')->default(false)->after('is_anonymous');
            }
        });
    }

    public function down(): void
    {
        Schema::table('job_listings', function (Blueprint $table): void {
            if (Schema::hasColumn('job_listings', 'is_urgent')) {
                $table->dropColumn('is_urgent');
            }
        });
    }
};
