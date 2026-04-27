<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('whatsapp_bulk_recipients', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('whatsapp_bulk_message_id')->constrained()->cascadeOnDelete();
            $table->foreignId('application_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('candidate_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('candidate_name', 191)->nullable();
            $table->string('phone_number', 32);
            $table->text('rendered_message');
            $table->string('status', 16)->default('pending');
            $table->text('error_message')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();

            $table->index(['whatsapp_bulk_message_id', 'status'], 'wa_bulk_recipients_msg_status_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('whatsapp_bulk_recipients');
    }
};
