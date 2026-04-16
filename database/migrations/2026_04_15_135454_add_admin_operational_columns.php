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
        Schema::table('companies', function (Blueprint $table) {
            if (! Schema::hasColumn('companies', 'is_active')) {
                $table->boolean('is_active')->default(true)->index();
            }

            if (! Schema::hasColumn('companies', 'suspended_at')) {
                $table->timestamp('suspended_at')->nullable();
            }

            if (! Schema::hasColumn('companies', 'suspension_reason')) {
                $table->text('suspension_reason')->nullable();
            }
        });

        Schema::table('reports', function (Blueprint $table) {
            if (! Schema::hasColumn('reports', 'admin_note')) {
                $table->text('admin_note')->nullable();
            }
        });

        Schema::table('salary_insights', function (Blueprint $table) {
            if (! Schema::hasColumn('salary_insights', 'published_at')) {
                $table->timestamp('published_at')->nullable()->index();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('salary_insights', function (Blueprint $table) {
            if (Schema::hasColumn('salary_insights', 'published_at')) {
                $table->dropColumn('published_at');
            }
        });

        Schema::table('reports', function (Blueprint $table) {
            if (Schema::hasColumn('reports', 'admin_note')) {
                $table->dropColumn('admin_note');
            }
        });

        Schema::table('companies', function (Blueprint $table) {
            $columns = array_values(array_filter([
                Schema::hasColumn('companies', 'is_active') ? 'is_active' : null,
                Schema::hasColumn('companies', 'suspended_at') ? 'suspended_at' : null,
                Schema::hasColumn('companies', 'suspension_reason') ? 'suspension_reason' : null,
            ]));

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
