<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('whatsapp_bulk_recipients', function (Blueprint $table): void {
            $table->string('email_address', 191)->nullable()->after('phone_number');
            $table->string('phone_number', 32)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('whatsapp_bulk_recipients', function (Blueprint $table): void {
            $table->dropColumn('email_address');
        });
    }
};
