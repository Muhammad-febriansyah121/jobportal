<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('interviews', function (Blueprint $table): void {
            $table->unsignedSmallInteger('duration_minutes')->default(60)->after('scheduled_at');
            $table->text('notes')->nullable()->after('location_url');
        });
    }

    public function down(): void
    {
        Schema::table('interviews', function (Blueprint $table): void {
            $table->dropColumn(['duration_minutes', 'notes']);
        });
    }
};
