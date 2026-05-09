<?php

use App\Models\Application;
use App\Models\CandidateProfile;
use App\Models\Company;
use App\Models\Industry;
use App\Models\Interview;
use App\Models\JobListing;
use App\Models\User;
use App\Models\UserNotification;

use function Pest\Laravel\actingAs;

function interviewScheduleScenario(): array
{
    $employer = User::factory()->employer()->create();
    $industry = Industry::create([
        'name' => 'Iv Industry',
        'slug' => 'iv-industry-'.uniqid(),
    ]);
    $company = Company::create([
        'owner_id' => $employer->id,
        'industry_id' => $industry->id,
        'name' => 'Iv Co',
        'slug' => 'iv-co-'.uniqid(),
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);

    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'industry_id' => $industry->id,
        'title' => 'Iv Engineer',
        'slug' => 'iv-engineer-'.uniqid(),
        'description' => 'desc',
        'work_mode' => 'remote',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'salary_currency' => 'IDR',
        'is_salary_visible' => true,
        'status' => 'published',
    ]);

    $candidateUser = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);
    $profile = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Iv Kandidat',
        'work_mode_pref' => 'any',
    ]);
    $application = Application::create([
        'job_listing_id' => $job->id,
        'candidate_id' => $profile->id,
        'status' => 'shortlisted',
        'applied_at' => now(),
    ]);

    return [$employer, $application];
}

test('employer can schedule online interview', function () {
    [$employer, $application] = interviewScheduleScenario();

    actingAs($employer)
        ->post(route('employer.applications.interviews.store', $application), [
            'mode' => 'online',
            'scheduled_at' => now()->addDay()->toDateTimeString(),
            'duration_minutes' => 60,
            'meeting_url' => 'https://meet.google.com/abc-defg-hij',
            'notes' => 'Bawa portfolio.',
        ])
        ->assertRedirect();

    $interview = Interview::query()->where('application_id', $application->id)->first();
    expect($interview)->not->toBeNull();
    expect($interview->mode)->toBe('online');
    expect($interview->location_url)->toBe('https://meet.google.com/abc-defg-hij');
    expect($interview->duration_minutes)->toBe(60);
    expect($interview->notes)->toBe('Bawa portfolio.');
    expect($interview->status)->toBe('scheduled');

    expect($application->fresh()->status)->toBe('interview');
});

test('employer can schedule onsite interview', function () {
    [$employer, $application] = interviewScheduleScenario();

    actingAs($employer)
        ->post(route('employer.applications.interviews.store', $application), [
            'mode' => 'onsite',
            'scheduled_at' => now()->addDay()->toDateTimeString(),
            'duration_minutes' => 90,
            'address' => 'Jl. Sudirman No.1, Jakarta - Ruang Meeting Lt. 5',
        ])
        ->assertRedirect();

    $interview = Interview::query()->where('application_id', $application->id)->first();
    expect($interview->mode)->toBe('onsite');
    expect($interview->location_url)->toBe('Jl. Sudirman No.1, Jakarta - Ruang Meeting Lt. 5');
    expect($interview->duration_minutes)->toBe(90);
});

test('online interview requires meeting URL', function () {
    [$employer, $application] = interviewScheduleScenario();

    actingAs($employer)
        ->post(route('employer.applications.interviews.store', $application), [
            'mode' => 'online',
            'scheduled_at' => now()->addDay()->toDateTimeString(),
            'duration_minutes' => 60,
        ])
        ->assertSessionHasErrors(['meeting_url']);
});

test('onsite interview requires address', function () {
    [$employer, $application] = interviewScheduleScenario();

    actingAs($employer)
        ->post(route('employer.applications.interviews.store', $application), [
            'mode' => 'onsite',
            'scheduled_at' => now()->addDay()->toDateTimeString(),
            'duration_minutes' => 60,
        ])
        ->assertSessionHasErrors(['address']);
});

test('cannot schedule second interview while existing is still scheduled', function () {
    [$employer, $application] = interviewScheduleScenario();

    Interview::create([
        'application_id' => $application->id,
        'scheduled_by' => $employer->id,
        'scheduled_at' => now()->addDay(),
        'duration_minutes' => 60,
        'mode' => 'online',
        'location_url' => 'https://meet.google.com/old',
        'status' => 'scheduled',
    ]);

    actingAs($employer)
        ->post(route('employer.applications.interviews.store', $application), [
            'mode' => 'online',
            'scheduled_at' => now()->addDays(2)->toDateTimeString(),
            'duration_minutes' => 60,
            'meeting_url' => 'https://meet.google.com/new',
        ])
        ->assertRedirect();

    expect(Interview::query()->where('application_id', $application->id)->count())->toBe(1);
});

test('can schedule new interview after previous one cancelled', function () {
    [$employer, $application] = interviewScheduleScenario();

    Interview::create([
        'application_id' => $application->id,
        'scheduled_by' => $employer->id,
        'scheduled_at' => now()->subDay(),
        'duration_minutes' => 60,
        'mode' => 'online',
        'location_url' => 'https://meet.google.com/old',
        'status' => 'cancelled',
    ]);

    actingAs($employer)
        ->post(route('employer.applications.interviews.store', $application), [
            'mode' => 'online',
            'scheduled_at' => now()->addDay()->toDateTimeString(),
            'duration_minutes' => 60,
            'meeting_url' => 'https://meet.google.com/new',
        ])
        ->assertRedirect();

    expect(Interview::query()->where('application_id', $application->id)->count())->toBe(2);
    expect(Interview::query()->where('application_id', $application->id)->where('status', 'scheduled')->count())->toBe(1);
});

test('candidate receives in-app notification when interview is scheduled', function () {
    [$employer, $application] = interviewScheduleScenario();
    $candidateUserId = $application->candidate->user_id;

    actingAs($employer)
        ->post(route('employer.applications.interviews.store', $application), [
            'mode' => 'online',
            'scheduled_at' => now()->addDay()->toDateTimeString(),
            'duration_minutes' => 60,
            'meeting_url' => 'https://meet.google.com/abc',
            'notes' => 'Bawa portfolio.',
        ])
        ->assertRedirect();

    $notification = UserNotification::query()
        ->where('user_id', $candidateUserId)
        ->where('type', 'interview_scheduled')
        ->latest('id')
        ->first();

    expect($notification)->not->toBeNull();
    expect($notification->title)->toBe('Undangan wawancara');
    expect($notification->is_read)->toBeFalse();

    $data = $notification->data_json ?? [];
    expect($data['mode'] ?? null)->toBe('online');
    expect($data['location_url'] ?? null)->toBe('https://meet.google.com/abc');
    expect($data['notes'] ?? null)->toBe('Bawa portfolio.');
    expect($data['interview_id'] ?? null)->not->toBeNull();
});

test('candidate receives onsite notification with address detail', function () {
    [$employer, $application] = interviewScheduleScenario();
    $candidateUserId = $application->candidate->user_id;

    actingAs($employer)
        ->post(route('employer.applications.interviews.store', $application), [
            'mode' => 'onsite',
            'scheduled_at' => now()->addDay()->toDateTimeString(),
            'duration_minutes' => 90,
            'address' => 'Jl. Contoh No. 1, Jakarta',
        ])
        ->assertRedirect();

    $notification = UserNotification::query()
        ->where('user_id', $candidateUserId)
        ->where('type', 'interview_scheduled')
        ->latest('id')
        ->first();

    expect($notification)->not->toBeNull();
    $data = $notification->data_json ?? [];
    expect($data['mode'] ?? null)->toBe('onsite');
    expect($data['location_url'] ?? null)->toBe('Jl. Contoh No. 1, Jakarta');
});

test('application status changes to interview after scheduling', function () {
    [$employer, $application] = interviewScheduleScenario();

    expect($application->status)->toBe('shortlisted');

    actingAs($employer)
        ->post(route('employer.applications.interviews.store', $application), [
            'mode' => 'online',
            'scheduled_at' => now()->addDay()->toDateTimeString(),
            'duration_minutes' => 60,
            'meeting_url' => 'https://meet.google.com/abc',
        ])
        ->assertRedirect();

    expect($application->fresh()->status)->toBe('interview');
});

test('employer cannot schedule for application from another company', function () {
    [, $application] = interviewScheduleScenario();
    $stranger = User::factory()->employer()->create();
    Company::create([
        'owner_id' => $stranger->id,
        'name' => 'Stranger Co',
        'slug' => 'stranger-co-'.uniqid(),
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);

    actingAs($stranger)
        ->post(route('employer.applications.interviews.store', $application), [
            'mode' => 'online',
            'scheduled_at' => now()->addDay()->toDateTimeString(),
            'duration_minutes' => 60,
            'meeting_url' => 'https://meet.google.com/abc',
        ])
        ->assertNotFound();

    expect(Interview::query()->where('application_id', $application->id)->count())->toBe(0);
});
