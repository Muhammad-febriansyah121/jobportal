<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pricing_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->unsignedBigInteger('price')->default(0);
            $table->unsignedInteger('active_jobs_limit')->default(0);
            $table->unsignedInteger('recruiter_seat_limit')->default(1);
            $table->unsignedInteger('ai_screening_quota')->default(0);
            $table->unsignedInteger('talent_search_quota')->default(0);
            $table->json('features_json')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pricing_plans');
    }
};
