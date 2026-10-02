<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('referral_redemptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('referral_campaign_id')->constrained()->cascadeOnDelete();
            $table->foreignId('referral_code_id')->constrained()->cascadeOnDelete();
            $table->foreignId('candidate_id')->constrained('candidate_profiles')->cascadeOnDelete();
            $table->foreignId('wallet_transaction_id')->nullable()->unique()->constrained('candidate_wallet_transactions')->nullOnDelete();
            $table->string('status')->default('success');
            $table->timestamp('redeemed_at');
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            $table->unique(['referral_campaign_id', 'candidate_id']);
            $table->index(['referral_code_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('referral_redemptions');
    }
};
