<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('industry_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('logo_url')->nullable();
            $table->string('cover_url')->nullable();
            $table->text('description')->nullable();
            $table->string('company_size')->nullable();
            $table->string('website')->nullable();
            $table->string('hq_city')->nullable();
            $table->string('hq_province')->nullable();
            $table->string('address')->nullable();
            $table->boolean('is_verified')->default(false);
            $table->enum('verification_status', ['unverified', 'pending', 'approved', 'rejected', 'need_revision'])->default('unverified');
            $table->unsignedTinyInteger('response_rate')->nullable()->comment('percentage 0-100');
            $table->unsignedInteger('median_response_hours')->nullable();
            $table->unsignedTinyInteger('trust_score')->nullable()->comment('score 0-100');
            $table->timestamps();

            $table->index('slug');
            $table->index('verification_status');
            $table->index('is_verified');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('companies');
    }
};
