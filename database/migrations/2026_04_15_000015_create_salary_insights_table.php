<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('salary_insights', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('industry_id')->nullable()->constrained()->nullOnDelete();
            $table->string('job_title');
            $table->unsignedBigInteger('salary_min')->nullable();
            $table->unsignedBigInteger('salary_median')->nullable();
            $table->unsignedBigInteger('salary_max')->nullable();
            $table->unsignedInteger('source_count')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('salary_insights');
    }
};
