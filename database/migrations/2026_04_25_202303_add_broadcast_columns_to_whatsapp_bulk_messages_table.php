<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('whatsapp_bulk_messages', function (Blueprint $table): void {
            $table->string('channel', 20)->default('whatsapp')->after('session_id');
            $table->string('subject', 191)->nullable()->after('channel');
            $table->string('reply_to_email', 191)->nullable()->after('subject');
            $table->string('session_id', 191)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('whatsapp_bulk_messages', function (Blueprint $table): void {
            $table->dropColumn(['channel', 'subject', 'reply_to_email']);
        });
    }
};
