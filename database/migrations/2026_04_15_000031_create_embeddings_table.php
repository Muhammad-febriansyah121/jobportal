<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('embeddings', function (Blueprint $table) {
            $table->id();
            $table->morphs('owner');
            $table->string('content_type');
            $table->json('embedding');
            $table->string('model_name')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->timestamp('created_at')->nullable();

            $table->index(['owner_type', 'owner_id', 'content_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('embeddings');
    }
};
