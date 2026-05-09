<?php

use App\Models\AiInterviewSession;
use App\Models\Application;
use App\Models\CandidateProfile;
use App\Models\Company;
use App\Models\Industry;
use App\Models\JobListing;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

use function Pest\Laravel\actingAs;

function recordingScenario(): array
{
    $candidate = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);
    $candidateProfile = CandidateProfile::create([
        'user_id' => $candidate->id,
        'full_name' => 'Rec Tester',
        'work_mode_pref' => 'any',
    ]);

    $employer = User::factory()->employer()->create();
    $industry = Industry::create([
        'name' => 'Tek Rec',
        'slug' => 'tek-rec-'.uniqid(),
    ]);
    $company = Company::create([
        'owner_id' => $employer->id,
        'industry_id' => $industry->id,
        'name' => 'Rec Co',
        'slug' => 'rec-co-'.uniqid(),
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'industry_id' => $industry->id,
        'title' => 'Backend Rec',
        'slug' => 'backend-rec-'.uniqid(),
        'description' => 'desc',
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
    $session = AiInterviewSession::create([
        'application_id' => $application->id,
        'candidate_id' => $candidateProfile->id,
        'status' => 'in_progress',
        'interview_mode' => 'voice',
        'scheduled_at' => now(),
        'duration_minutes' => 30,
    ]);

    return [$candidate, $session];
}

test('candidate can upload an interview recording and recording_url is saved', function () {
    Storage::fake('public');

    [$candidate, $session] = recordingScenario();

    $file = UploadedFile::fake()->create(
        'interview.webm',
        512,
        'video/webm',
    );

    actingAs($candidate)
        ->post(route('candidate.ai-interviews.upload-recording', $session), [
            'recording' => $file,
        ])
        ->assertOk()
        ->assertJsonStructure(['recording_url']);

    $session->refresh();

    expect($session->recording_url)->toStartWith('/storage/ai-interview-recordings/');
    Storage::disk('public')->assertExists(
        ltrim(str_replace('/storage/', '', $session->recording_url), '/'),
    );
});

test('uploading a new recording deletes the previous file', function () {
    Storage::fake('public');

    [$candidate, $session] = recordingScenario();

    actingAs($candidate)
        ->post(route('candidate.ai-interviews.upload-recording', $session), [
            'recording' => UploadedFile::fake()->create('first.webm', 256, 'video/webm'),
        ])
        ->assertOk();

    $session->refresh();
    $firstPath = ltrim(str_replace('/storage/', '', $session->recording_url), '/');

    actingAs($candidate)
        ->post(route('candidate.ai-interviews.upload-recording', $session), [
            'recording' => UploadedFile::fake()->create('second.webm', 256, 'video/webm'),
        ])
        ->assertOk();

    $session->refresh();
    $secondPath = ltrim(str_replace('/storage/', '', $session->recording_url), '/');

    expect($firstPath)->not->toBe($secondPath);
    Storage::disk('public')->assertMissing($firstPath);
    Storage::disk('public')->assertExists($secondPath);
});

test('candidate cannot upload recording for someone else session', function () {
    Storage::fake('public');

    [, $session] = recordingScenario();

    $stranger = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);
    CandidateProfile::create([
        'user_id' => $stranger->id,
        'full_name' => 'Stranger',
        'work_mode_pref' => 'any',
    ]);

    actingAs($stranger)
        ->post(route('candidate.ai-interviews.upload-recording', $session), [
            'recording' => UploadedFile::fake()->create('intruder.webm', 256, 'video/webm'),
        ])
        ->assertNotFound();
});
