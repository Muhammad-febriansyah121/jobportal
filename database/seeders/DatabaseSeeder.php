<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'name' => 'Admin Karivia',
                'email' => 'admin@karivia.id',
                'role' => 'admin',
                'phone' => '+6281200000001',
            ],
            [
                'name' => 'Employer Karivia',
                'email' => 'employer@karivia.id',
                'role' => 'employer',
                'phone' => '+6281200000002',
            ],
            [
                'name' => 'Candidate Karivia',
                'email' => 'candidate@karivia.id',
                'role' => 'candidate',
                'phone' => '+6281200000003',
            ],
            [
                'name' => 'Mentor Karivia',
                'email' => 'mentor@karivia.id',
                'role' => 'mentor',
                'phone' => '+6281200000004',
            ],
        ];

        foreach ($users as $data) {
            User::factory()->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'role' => $data['role'],
                'phone' => $data['phone'],
                'is_active' => true,
                'onboarding_completed_at' => now(),
            ]);
        }

        $this->call(DummyDataSeeder::class);
        $this->call(MessageTemplateSeeder::class);
    }
}
