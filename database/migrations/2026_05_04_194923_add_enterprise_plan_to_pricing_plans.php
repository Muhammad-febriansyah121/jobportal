<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $plan = [
            'slug' => 'enterprise',
            'name' => 'Enterprise',
            'price' => 0,
            'duration_days' => 365,
            'active_jobs_limit' => 0,
            'recruiter_seat_limit' => 0,
            'talent_search_quota' => 0,
            'ai_screening_quota' => 0,
            'ai_interview_quota' => 0,
            'features_json' => [
                ['label' => 'Costume Plan sesuai kebutuhan tim', 'included' => true],
                ['label' => 'Negosiasi langsung dengan tim Karivia', 'included' => true],
                ['label' => 'Job Matching', 'included' => true],
                ['label' => 'Unlimited Job Applications', 'included' => true],
            ],
            'is_active' => true,
        ];

        DB::table('pricing_plans')->updateOrInsert(
            ['slug' => $plan['slug']],
            array_merge($plan, [
                'features_json' => json_encode($plan['features_json']),
                'created_at' => now(),
                'updated_at' => now(),
            ]),
        );
    }

    public function down(): void
    {
        DB::table('pricing_plans')->where('slug', 'enterprise')->delete();
    }
};
