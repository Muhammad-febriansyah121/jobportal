<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_listing_analytics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_listing_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('views_count')->default(0);
            $table->unsignedInteger('apply_clicks_count')->default(0);
            $table->unsignedInteger('saves_count')->default(0);
            $table->date('date');
            $table->timestamps();

            $table->unique(['job_listing_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_listing_analytics');
    }
};
