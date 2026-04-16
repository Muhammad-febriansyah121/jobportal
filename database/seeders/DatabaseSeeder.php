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
            ],
            [
                'name' => 'Employer Karivia',
                'email' => 'employer@karivia.id',
                'role' => 'employer',
            ],
            [
                'name' => 'Candidate Karivia',
                'email' => 'candidate@karivia.id',
                'role' => 'candidate',
            ],
            [
                'name' => 'Mentor Karivia',
                'email' => 'mentor@karivia.id',
                'role' => 'mentor',
            ],
        ];

        foreach ($users as $data) {
            User::factory()->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'role' => $data['role'],
                'is_active' => true,
                'onboarding_completed_at' => now(),
            ]);
        }

        $this->call(DummyDataSeeder::class);
    }
}
