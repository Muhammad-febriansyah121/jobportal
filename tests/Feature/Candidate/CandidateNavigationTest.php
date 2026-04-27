<?php

use App\Models\AiInterviewSession;
use App\Models\Application;
use App\Models\CandidateProfile;
use App\Models\Company;
use App\Models\Industry;
use App\Models\Interview;
use App\Models\JobListing;
use App\Models\User;
use App\Models\UserNotification;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\actingAs;

test('candidate messages page is available from candidate menu', function () {
    $candidate = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);

    actingAs($candidate)
        ->get(route('candidate.messages.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('candidate/messages')
            ->where('filters.search', '')
            ->has('conversations.data')
            ->where('unread_total', 0)
            ->has('header_notifications.unread_count')
            ->has('header_notifications.items')
        );
});

test('candidate header notifications include upcoming ai interview schedule', function () {
    $candidate = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);
    $candidateProfile = CandidateProfile::create([
        'user_id' => $candidate->id,
        'full_name' => 'Kandidat Terjadwal',
        'work_mode_pref' => 'any',
    ]);
    $employer = User::factory()->employer()->create();
    $industry = Industry::create([
        'name' => 'Teknologi Reminder',
        'slug' => 'teknologi-reminder',
    ]);
    $company = Company::create([
        'owner_id' => $employer->id,
        'industry_id' => $industry->id,
        'name' => 'Karivia Reminder',
        'slug' => 'karivia-reminder',
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'industry_id' => $industry->id,
        'title' => 'Backend Reminder',
        'slug' => 'backend-reminder',
        'description' => 'Role untuk test reminder.',
        'work_mode' => 'remote',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'salary_currency' => 'IDR',
        'is_salary_visible' => true,
        'status' => 'published',
    ]);
    $application = Application::create([
        'job_listing_id' => $job->id,
        'candidate_id' => $candidateProfile->id,
        'status' => 'interview',
        'applied_at' => now(),
    ]);
    AiInterviewSession::create([
        'application_id' => $application->id,
        'candidate_id' => $candidateProfile->id,
        'status' => 'scheduled',
        'interview_mode' => 'voice',
        'scheduled_at' => now()->addHour(),
        'duration_minutes' => 30,
    ]);

    actingAs($candidate)
        ->get(route('candidate.messages.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('header_notifications.unread_count', 1)
            ->has('header_notifications.items', 1)
            ->where('header_notifications.items.0.type', 'upcoming_interviews')
        );
});

test('candidate header notifications include in progress ai interview without schedule', function () {
    $candidate = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);
    $candidateProfile = CandidateProfile::create([
        'user_id' => $candidate->id,
        'full_name' => 'Kandidat Sedang Interview',
        'work_mode_pref' => 'any',
    ]);
    $employer = User::factory()->employer()->create();
    $industry = Industry::create([
        'name' => 'Teknologi In Progress',
        'slug' => 'teknologi-in-progress',
    ]);
    $company = Company::create([
        'owner_id' => $employer->id,
        'industry_id' => $industry->id,
        'name' => 'Karivia In Progress',
        'slug' => 'karivia-in-progress',
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'industry_id' => $industry->id,
        'title' => 'Frontend In Progress',
        'slug' => 'frontend-in-progress',
        'description' => 'Role untuk test interview berjalan.',
        'work_mode' => 'remote',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'salary_currency' => 'IDR',
        'is_salary_visible' => true,
        'status' => 'published',
    ]);
    $application = Application::create([
        'job_listing_id' => $job->id,
        'candidate_id' => $candidateProfile->id,
        'status' => 'interview',
        'applied_at' => now(),
    ]);
    AiInterviewSession::create([
        'application_id' => $application->id,
        'candidate_id' => $candidateProfile->id,
        'status' => 'in_progress',
        'interview_mode' => 'text',
        'scheduled_at' => null,
        'started_at' => now()->subMinutes(15),
        'duration_minutes' => 30,
    ]);

    actingAs($candidate)
        ->get(route('candidate.messages.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('header_notifications.unread_count', 1)
            ->has('header_notifications.items', 1)
            ->where('header_notifications.items.0.type', 'upcoming_interviews')
        );
});

test('sidebar interview badge ignores stale notifications and reflects upcoming interviews only', function () {
    $candidate = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);
    $candidateProfile = CandidateProfile::create([
        'user_id' => $candidate->id,
        'full_name' => 'Kandidat Stale',
        'work_mode_pref' => 'any',
    ]);
    $employer = User::factory()->employer()->create();
    $industry = Industry::create([
        'name' => 'Teknologi Stale',
        'slug' => 'teknologi-stale',
    ]);
    $company = Company::create([
        'owner_id' => $employer->id,
        'industry_id' => $industry->id,
        'name' => 'Karivia Stale',
        'slug' => 'karivia-stale',
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'industry_id' => $industry->id,
        'title' => 'Engineer Stale',
        'slug' => 'engineer-stale',
        'description' => 'Test stale notif.',
        'work_mode' => 'remote',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'salary_currency' => 'IDR',
        'is_salary_visible' => true,
        'status' => 'published',
    ]);
    $application = Application::create([
        'job_listing_id' => $job->id,
        'candidate_id' => $candidateProfile->id,
        'status' => 'interview',
        'applied_at' => now(),
    ]);
    Interview::create([
        'application_id' => $application->id,
        'scheduled_by' => $employer->id,
        'scheduled_at' => now()->subMonth(),
        'duration_minutes' => 60,
        'mode' => 'onsite',
        'status' => 'completed',
    ]);

    foreach (range(1, 7) as $i) {
        UserNotification::create([
            'user_id' => $candidate->id,
            'type' => 'interview_scheduled',
            'title' => "Interview lama #{$i}",
            'message' => 'Notifikasi lama yang belum terbaca.',
            'is_read' => false,
        ]);
    }

    actingAs($candidate)
        ->get(route('candidate.messages.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('nav_counts.upcoming_interviews', 0)
            ->where('nav_counts.pending_ai_interviews', 0)
        );
});

test('sidebar interview badge counts upcoming manual interview', function () {
    $candidate = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);
    $candidateProfile = CandidateProfile::create([
        'user_id' => $candidate->id,
        'full_name' => 'Kandidat Upcoming',
        'work_mode_pref' => 'any',
    ]);
    $employer = User::factory()->employer()->create();
    $industry = Industry::create([
        'name' => 'Teknologi Upcoming',
        'slug' => 'teknologi-upcoming',
    ]);
    $company = Company::create([
        'owner_id' => $employer->id,
        'industry_id' => $industry->id,
        'name' => 'Karivia Upcoming',
        'slug' => 'karivia-upcoming',
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'industry_id' => $industry->id,
        'title' => 'Engineer Upcoming',
        'slug' => 'engineer-upcoming',
        'description' => 'Test upcoming.',
        'work_mode' => 'remote',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'salary_currency' => 'IDR',
        'is_salary_visible' => true,
        'status' => 'published',
    ]);
    $application = Application::create([
        'job_listing_id' => $job->id,
        'candidate_id' => $candidateProfile->id,
        'status' => 'interview',
        'applied_at' => now(),
    ]);
    Interview::create([
        'application_id' => $application->id,
        'scheduled_by' => $employer->id,
        'scheduled_at' => now()->addDays(2),
        'duration_minutes' => 60,
        'mode' => 'online',
        'status' => 'scheduled',
    ]);

    actingAs($candidate)
        ->get(route('candidate.messages.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('nav_counts.upcoming_interviews', 1)
        );
});
