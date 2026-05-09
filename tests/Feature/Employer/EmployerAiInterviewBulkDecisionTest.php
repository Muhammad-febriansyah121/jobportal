<?php

use App\Models\AiInterviewSession;
use App\Models\Application;
use App\Models\CandidateProfile;
use App\Models\Company;
use App\Models\Industry;
use App\Models\JobListing;
use App\Models\User;
use App\Models\UserNotification;

use function Pest\Laravel\actingAs;

function bulkDecisionScenario(int $count = 3): array
{
    $employer = User::factory()->employer()->create();
    $industry = Industry::create([
        'name' => 'Bd Industry',
        'slug' => 'bd-industry-'.uniqid(),
    ]);
    $company = Company::create([
        'owner_id' => $employer->id,
        'industry_id' => $industry->id,
        'name' => 'Bd Co',
        'slug' => 'bd-co-'.uniqid(),
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);

    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'industry_id' => $industry->id,
        'title' => 'Bd Engineer',
        'slug' => 'bd-engineer-'.uniqid(),
        'description' => 'desc',
        'work_mode' => 'remote',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'salary_currency' => 'IDR',
        'is_salary_visible' => true,
        'status' => 'published',
    ]);

    $sessions = [];

    for ($i = 0; $i < $count; $i++) {
        $candidateUser = User::factory()->candidate()->create([
            'onboarding_completed_at' => now(),
        ]);
        $profile = CandidateProfile::create([
            'user_id' => $candidateUser->id,
            'full_name' => "Bd Cand {$i}",
            'work_mode_pref' => 'any',
        ]);
        $application = Application::create([
            'job_listing_id' => $job->id,
            'candidate_id' => $profile->id,
            'status' => 'interview',
            'applied_at' => now(),
        ]);
        $session = AiInterviewSession::create([
            'application_id' => $application->id,
            'candidate_id' => $profile->id,
            'status' => 'completed',
            'interview_mode' => 'voice',
            'scheduled_at' => now()->subDay(),
            'duration_minutes' => 30,
            'completed_at' => now()->subHour(),
        ]);
        $sessions[] = $session;
    }

    return [$employer, $sessions];
}

test('employer can bulk advance candidates after AI interview', function () {
    [$employer, $sessions] = bulkDecisionScenario(3);
    $sessionIds = collect($sessions)->pluck('id')->all();

    actingAs($employer)
        ->post(route('employer.ai-interviews.bulk-advance'), [
            'session_ids' => $sessionIds,
        ])
        ->assertRedirect();

    foreach ($sessions as $session) {
        expect($session->application->fresh()->status)->toBe('offer');
    }
});

test('employer can bulk reject candidates after AI interview', function () {
    [$employer, $sessions] = bulkDecisionScenario(3);
    $sessionIds = collect($sessions)->pluck('id')->all();

    actingAs($employer)
        ->post(route('employer.ai-interviews.bulk-reject'), [
            'session_ids' => $sessionIds,
        ])
        ->assertRedirect();

    foreach ($sessions as $session) {
        expect($session->application->fresh()->status)->toBe('rejected');
    }
});

test('bulk decision validates session_ids', function () {
    [$employer] = bulkDecisionScenario(0);

    actingAs($employer)
        ->post(route('employer.ai-interviews.bulk-advance'), [])
        ->assertSessionHasErrors(['session_ids']);
});

test('bulk advance sends notification to each candidate', function () {
    [$employer, $sessions] = bulkDecisionScenario(3);
    $sessionIds = collect($sessions)->pluck('id')->all();

    actingAs($employer)
        ->post(route('employer.ai-interviews.bulk-advance'), [
            'session_ids' => $sessionIds,
        ])
        ->assertRedirect();

    foreach ($sessions as $session) {
        $candidateUserId = $session->application->candidate->user_id;
        $notif = UserNotification::query()
            ->where('user_id', $candidateUserId)
            ->where('type', 'application_advanced_after_ai_interview')
            ->latest('id')
            ->first();

        expect($notif)->not->toBeNull();
    }
});

test('bulk reject sends notification to each candidate', function () {
    [$employer, $sessions] = bulkDecisionScenario(3);
    $sessionIds = collect($sessions)->pluck('id')->all();

    actingAs($employer)
        ->post(route('employer.ai-interviews.bulk-reject'), [
            'session_ids' => $sessionIds,
        ])
        ->assertRedirect();

    foreach ($sessions as $session) {
        $candidateUserId = $session->application->candidate->user_id;
        $notif = UserNotification::query()
            ->where('user_id', $candidateUserId)
            ->where('type', 'application_rejected_after_ai_interview')
            ->latest('id')
            ->first();

        expect($notif)->not->toBeNull();
    }
});

test('employer cannot bulk decide for sessions from another company', function () {
    [, $sessions] = bulkDecisionScenario(2);
    $sessionIds = collect($sessions)->pluck('id')->all();

    $stranger = User::factory()->employer()->create();
    Company::create([
        'owner_id' => $stranger->id,
        'name' => 'Stranger',
        'slug' => 'stranger-'.uniqid(),
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);

    actingAs($stranger)
        ->post(route('employer.ai-interviews.bulk-advance'), [
            'session_ids' => $sessionIds,
        ])
        ->assertRedirect();

    foreach ($sessions as $session) {
        expect($session->application->fresh()->status)->not->toBe('offer');
    }
});
