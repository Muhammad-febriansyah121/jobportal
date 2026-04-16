<?php

use App\Jobs\ComputeCandidateIntentJob;
use App\Models\CandidateCv;
use App\Models\CandidateIntentSignal;
use App\Models\CandidateJobView;
use App\Models\CandidateProfile;
use App\Models\Company;
use App\Models\Industry;
use App\Models\JobListing;
use App\Models\User;
use Illuminate\Support\Facades\Queue;

function makeJobWithIndustry(CandidateProfile $candidate, string $workMode = 'remote', ?int $industryId = null): JobListing
{
    $employer = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Company '.uniqid(),
        'slug' => 'company-'.uniqid(),
        'is_verified' => true,
    ]);

    return JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'industry_id' => $industryId,
        'title' => 'Backend Engineer',
        'slug' => 'backend-engineer-'.uniqid(),
        'description' => 'Build APIs.',
        'work_mode' => $workMode,
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'salary_min' => 12000000,
        'salary_max' => 18000000,
        'status' => 'published',
        'published_at' => now(),
    ]);
}

test('viewing a job detail records a candidate job view', function () {
    $candidateUser = User::factory()->candidate()->create();
    $candidate = CandidateProfile::create(['user_id' => $candidateUser->id, 'full_name' => 'Test', 'work_mode_pref' => 'any']);
    $job = makeJobWithIndustry($candidate);

    $this->actingAs($candidateUser)->get(route('candidate.jobs.show', $job->slug));

    expect(CandidateJobView::query()
        ->where('candidate_id', $candidate->id)
        ->where('job_listing_id', $job->id)
        ->exists()
    )->toBeTrue();
});

test('viewing the same job multiple times increments view_count', function () {
    $candidateUser = User::factory()->candidate()->create();
    $candidate = CandidateProfile::create(['user_id' => $candidateUser->id, 'full_name' => 'Test', 'work_mode_pref' => 'any']);
    $job = makeJobWithIndustry($candidate);

    $this->actingAs($candidateUser)->get(route('candidate.jobs.show', $job->slug));
    $this->actingAs($candidateUser)->get(route('candidate.jobs.show', $job->slug));
    $this->actingAs($candidateUser)->get(route('candidate.jobs.show', $job->slug));

    $view = CandidateJobView::query()
        ->where('candidate_id', $candidate->id)
        ->where('job_listing_id', $job->id)
        ->first();

    expect($view->view_count)->toBe(3);
});

test('saving a job dispatches ComputeCandidateIntentJob', function () {
    Queue::fake();

    $candidateUser = User::factory()->candidate()->create();
    $candidate = CandidateProfile::create(['user_id' => $candidateUser->id, 'full_name' => 'Test', 'work_mode_pref' => 'any']);
    $job = makeJobWithIndustry($candidate);

    $this->actingAs($candidateUser)->post(route('candidate.jobs.save', $job->id));

    Queue::assertPushed(ComputeCandidateIntentJob::class, fn ($j) => $j->candidate->id === $candidate->id);
});

test('ComputeCandidateIntentJob computes intent signals from saved jobs', function () {
    $industry = Industry::create(['name' => 'Teknologi-'.uniqid(), 'slug' => 'teknologi-'.uniqid()]);
    $candidateUser = User::factory()->candidate()->create();
    $candidate = CandidateProfile::create(['user_id' => $candidateUser->id, 'full_name' => 'Test', 'work_mode_pref' => 'any']);
    $job = makeJobWithIndustry($candidate, 'remote', $industry->id);

    $candidate->savedJobs()->create(['job_listing_id' => $job->id]);

    (new ComputeCandidateIntentJob($candidate))->handle();

    $signal = CandidateIntentSignal::query()->where('candidate_id', $candidate->id)->first();

    expect($signal)->not->toBeNull()
        ->and($signal->intent_strength)->toBeGreaterThan(0)
        ->and(array_key_exists((string) $industry->id, $signal->top_industries ?? []))->toBeTrue()
        ->and(array_key_exists('remote', $signal->top_work_modes ?? []))->toBeTrue();
});

test('ComputeCandidateIntentJob weights applications higher than saves', function () {
    $industry1 = Industry::create(['name' => 'Keuangan-'.uniqid(), 'slug' => 'keuangan-'.uniqid()]);
    $industry2 = Industry::create(['name' => 'Kesehatan-'.uniqid(), 'slug' => 'kesehatan-'.uniqid()]);

    $candidateUser = User::factory()->candidate()->create();
    $candidate = CandidateProfile::create(['user_id' => $candidateUser->id, 'full_name' => 'Test', 'work_mode_pref' => 'any']);

    $savedJob = makeJobWithIndustry($candidate, 'hybrid', $industry1->id);
    $appliedJob = makeJobWithIndustry($candidate, 'remote', $industry2->id);

    $candidate->savedJobs()->create(['job_listing_id' => $savedJob->id]);

    $cv = CandidateCv::create([
        'candidate_id' => $candidate->id,
        'file_url' => '/storage/cv.pdf',
        'source' => 'upload',
        'is_primary' => true,
        'uploaded_at' => now(),
    ]);
    $candidate->applications()->create([
        'job_listing_id' => $appliedJob->id,
        'candidate_cv_id' => $cv->id,
        'status' => 'applied',
        'applied_at' => now(),
    ]);

    (new ComputeCandidateIntentJob($candidate))->handle();

    $signal = CandidateIntentSignal::query()->where('candidate_id', $candidate->id)->first();

    $appliedScore = $signal->top_industries[(string) $industry2->id] ?? 0;
    $savedScore = $signal->top_industries[(string) $industry1->id] ?? 0;

    expect($appliedScore)->toBeGreaterThan($savedScore);
});

test('intent signal updates existing record on recompute', function () {
    $candidateUser = User::factory()->candidate()->create();
    $candidate = CandidateProfile::create(['user_id' => $candidateUser->id, 'full_name' => 'Test', 'work_mode_pref' => 'any']);
    $job = makeJobWithIndustry($candidate);

    $candidate->savedJobs()->create(['job_listing_id' => $job->id]);
    (new ComputeCandidateIntentJob($candidate))->handle();

    $this->travel(5)->seconds();
    (new ComputeCandidateIntentJob($candidate))->handle();

    expect(CandidateIntentSignal::query()->where('candidate_id', $candidate->id)->count())->toBe(1);
});
