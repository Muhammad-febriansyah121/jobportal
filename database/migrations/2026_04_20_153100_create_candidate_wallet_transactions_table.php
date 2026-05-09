<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('candidate_wallet_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('candidate_id')->constrained('candidate_profiles')->cascadeOnDelete();
            $table->foreignId('candidate_pricing_menu_id')->nullable()->constrained()->nullOnDelete();
            $table->string('order_id')->nullable()->unique();
            $table->string('type')->default('credit')->comment('credit,debit');
            $table->string('source')->comment('free_grant,purchase,cv_builder_draft');
            $table->integer('ai_token_delta')->default(0);
            $table->integer('cv_builder_quota_delta')->default(0);
            $table->unsignedBigInteger('amount')->default(0);
            $table->string('status')->default('success')->comment('pending,paid,failed,success');
            $table->json('meta_json')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('candidate_wallet_transactions');
    }
};
