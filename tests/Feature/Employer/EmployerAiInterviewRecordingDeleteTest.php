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

function recordingDeleteScenario(): array
{
    Storage::fake('public');

    $employer = User::factory()->employer()->create();
    $industry = Industry::create([
        'name' => 'Tek Del',
        'slug' => 'tek-del-'.uniqid(),
    ]);
    $company = Company::create([
        'owner_id' => $employer->id,
        'industry_id' => $industry->id,
        'name' => 'Del Co',
        'slug' => 'del-co-'.uniqid(),
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);

    $candidate = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);
    $candidateProfile = CandidateProfile::create([
        'user_id' => $candidate->id,
        'full_name' => 'Del Tester',
        'work_mode_pref' => 'any',
    ]);

    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'industry_id' => $industry->id,
        'title' => 'Backend Del',
        'slug' => 'backend-del-'.uniqid(),
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

    $path = UploadedFile::fake()
        ->create('rec.webm', 256, 'video/webm')
        ->storeAs('ai-interview-recordings', 'test-rec.webm', 'public');

    $session = AiInterviewSession::create([
        'application_id' => $application->id,
        'candidate_id' => $candidateProfile->id,
        'status' => 'completed',
        'interview_mode' => 'voice',
        'scheduled_at' => now()->subHour(),
        'duration_minutes' => 30,
        'recording_url' => '/storage/'.$path,
    ]);

    return [$employer, $session, $path];
}

test('employer can delete an interview recording and the file is removed', function () {
    [$employer, $session, $path] = recordingDeleteScenario();

    Storage::disk('public')->assertExists($path);

    actingAs($employer)
        ->delete(route('employer.ai-interviews.delete-recording', $session))
        ->assertRedirect();

    $session->refresh();

    expect($session->recording_url)->toBeNull();
    Storage::disk('public')->assertMissing($path);
});

test('employer from another company cannot delete the recording', function () {
    [, $session, $path] = recordingDeleteScenario();

    $stranger = User::factory()->employer()->create();
    Company::create([
        'owner_id' => $stranger->id,
        'name' => 'Other Co',
        'slug' => 'other-co-'.uniqid(),
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);

    actingAs($stranger)
        ->delete(route('employer.ai-interviews.delete-recording', $session))
        ->assertNotFound();

    $session->refresh();

    expect($session->recording_url)->not->toBeNull();
    Storage::disk('public')->assertExists($path);
});
