<?php

use App\Models\AiInterviewSession;
use App\Models\Application;
use App\Models\CandidateProfile;
use App\Models\Company;
use App\Models\Industry;
use App\Models\JobListing;
use App\Models\User;

use function Pest\Laravel\actingAs;

function bulkScheduleScenario(int $candidateCount = 3): array
{
    $employer = User::factory()->employer()->create();
    $industry = Industry::create([
        'name' => 'Bulk Industry',
        'slug' => 'bulk-industry-'.uniqid(),
    ]);
    $company = Company::create([
        'owner_id' => $employer->id,
        'industry_id' => $industry->id,
        'name' => 'Bulk Co',
        'slug' => 'bulk-co-'.uniqid(),
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);

    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'industry_id' => $industry->id,
        'title' => 'Bulk Engineer',
        'slug' => 'bulk-engineer-'.uniqid(),
        'description' => 'desc',
        'work_mode' => 'remote',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'salary_currency' => 'IDR',
        'is_salary_visible' => true,
        'status' => 'published',
    ]);

    $applications = collect(range(1, $candidateCount))->map(function (int $i) use ($job) {
        $user = User::factory()->candidate()->create([
            'onboarding_completed_at' => now(),
        ]);
        $profile = CandidateProfile::create([
            'user_id' => $user->id,
            'full_name' => "Candidate {$i}",
            'work_mode_pref' => 'any',
        ]);

        return Application::create([
            'job_listing_id' => $job->id,
            'candidate_id' => $profile->id,
            'status' => 'applied',
            'applied_at' => now(),
        ]);
    })->all();

    return [$employer, $job, $applications];
}

function bulkPayload(array $applicationIds): array
{
    return [
        'application_ids' => $applicationIds,
        'interview_mode' => 'voice',
        'scheduled_at' => now()->addDay()->toDateTimeString(),
        'duration_minutes' => 30,
        'voice' => 'marin',
        'questions' => [
            [
                'question' => 'Ceritakan pengalaman backend kamu.',
                'category' => 'technical',
                'rubric' => 'Kedalaman teknis',
                'weight' => 60,
                'allow_ai_followup' => true,
            ],
            [
                'question' => 'Bagaimana cara kamu kolaborasi dengan tim?',
                'category' => 'behavioral',
                'rubric' => 'Komunikasi',
                'weight' => 40,
                'allow_ai_followup' => false,
            ],
        ],
    ];
}

test('employer can bulk schedule AI interviews for multiple applications', function () {
    [$employer, $job, $applications] = bulkScheduleScenario(3);
    $applicationIds = collect($applications)->pluck('id')->all();

    actingAs($employer)
        ->post(route('employer.jobs.ai-interviews.store-bulk', $job), bulkPayload($applicationIds))
        ->assertRedirect();

    expect(AiInterviewSession::query()->whereIn('application_id', $applicationIds)->count())->toBe(3);

    foreach ($applications as $application) {
        $session = AiInterviewSession::query()->where('application_id', $application->id)->firstOrFail();
        expect($session->status)->toBe('scheduled');
        expect($session->interview_mode)->toBe('voice');
        expect($session->questions()->count())->toBe(2);
        expect($application->fresh()->status)->toBe('interview');
    }
});

test('bulk schedule skips applications that already have an active session', function () {
    [$employer, $job, $applications] = bulkScheduleScenario(2);
    $applicationIds = collect($applications)->pluck('id')->all();

    AiInterviewSession::create([
        'application_id' => $applications[0]->id,
        'candidate_id' => $applications[0]->candidate_id,
        'status' => 'scheduled',
        'interview_mode' => 'voice',
        'scheduled_at' => now()->addDay(),
        'duration_minutes' => 30,
    ]);

    actingAs($employer)
        ->post(route('employer.jobs.ai-interviews.store-bulk', $job), bulkPayload($applicationIds))
        ->assertRedirect();

    expect(AiInterviewSession::query()->where('application_id', $applications[0]->id)->count())->toBe(1);
    expect(AiInterviewSession::query()->where('application_id', $applications[1]->id)->count())->toBe(1);
});

test('employer from another company cannot bulk schedule for foreign job', function () {
    [, $job, $applications] = bulkScheduleScenario(1);
    $stranger = User::factory()->employer()->create();
    Company::create([
        'owner_id' => $stranger->id,
        'name' => 'Stranger Co',
        'slug' => 'stranger-co-'.uniqid(),
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);

    actingAs($stranger)
        ->post(route('employer.jobs.ai-interviews.store-bulk', $job), bulkPayload([$applications[0]->id]))
        ->assertNotFound();

    expect(AiInterviewSession::query()->where('application_id', $applications[0]->id)->count())->toBe(0);
});

test('bulk schedule validates required fields', function () {
    [$employer, $job] = bulkScheduleScenario(1);

    actingAs($employer)
        ->post(route('employer.jobs.ai-interviews.store-bulk', $job), [])
        ->assertSessionHasErrors(['application_ids', 'interview_mode', 'scheduled_at', 'duration_minutes', 'questions']);
});
