<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employer_talent_candidates', function (Blueprint $table) {
            $table->timestamp('unlocked_at')->nullable()->after('shortlisted_at');
            $table->foreignId('unlocked_by_user_id')->nullable()->after('unlocked_at')->constrained('users')->nullOnDelete();
            $table->index('unlocked_at');
        });
    }

    public function down(): void
    {
        Schema::table('employer_talent_candidates', function (Blueprint $table) {
            $table->dropIndex(['unlocked_at']);
            $table->dropConstrainedForeignId('unlocked_by_user_id');
            $table->dropColumn('unlocked_at');
        });
    }
};
