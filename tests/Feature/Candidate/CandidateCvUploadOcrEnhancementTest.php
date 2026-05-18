<?php

use App\Ai\Agents\CvUploadParser;
use App\Jobs\ParseUploadedCvJob;
use App\Models\CandidateProfile;
use App\Models\Setting;
use App\Models\Skill;
use App\Models\User;
use App\Services\CvTextExtractorService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

function fakeOcrExtractor(string $text = 'cv text'): void
{
    test()->mock(CvTextExtractorService::class, function ($mock) use ($text): void {
        $mock->shouldReceive('extractFromPath')
            ->andReturn($text);
    });
}

function fakeAiResponse(array $parsed): void
{
    config()->set('services.openai.api_key', 'test-ai-key');
    CvUploadParser::fake([$parsed]);
}

test('cv upload populates user phone when blank', function () {
    Storage::fake('public');
    Setting::set('ai_api_key', 'test-ai-key');
    Skill::query()->create(['name' => 'PHP', 'slug' => 'php']);

    $user = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
        'phone' => null,
    ]);

    fakeOcrExtractor();
    fakeAiResponse([
        'full_name' => 'Pak Telp',
        'headline' => 'Engineer',
        'summary' => 's',
        'phone' => '0812-3456-7890',
        'location_city' => 'Bandung',
        'location_province' => 'Jawa Barat',
        'linkedin_url' => '',
        'github_url' => '',
        'portfolio_url' => '',
        'skills' => [],
        'experiences' => [],
        'educations' => [],
    ]);

    $this->actingAs($user)->post(route('candidate.cvs.store'), [
        'cv_file' => UploadedFile::fake()->create('cv.pdf', 100, 'application/pdf'),
        'is_primary' => '1',
    ])->assertRedirect();

    $user->refresh();

    expect($user->phone)->toBe('6281234567890');
});

test('cv upload does not overwrite existing user phone', function () {
    Storage::fake('public');
    Setting::set('ai_api_key', 'test-ai-key');

    $user = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
        'phone' => '628999111222',
    ]);

    fakeOcrExtractor();
    fakeAiResponse([
        'full_name' => 'X',
        'headline' => '',
        'summary' => '',
        'phone' => '081111111111',
        'location_city' => '',
        'location_province' => '',
        'linkedin_url' => '',
        'github_url' => '',
        'portfolio_url' => '',
        'skills' => [],
        'experiences' => [],
        'educations' => [],
    ]);

    $this->actingAs($user)->post(route('candidate.cvs.store'), [
        'cv_file' => UploadedFile::fake()->create('cv.pdf', 100, 'application/pdf'),
        'is_primary' => '1',
    ])->assertRedirect();

    $user->refresh();

    expect($user->phone)->toBe('628999111222');
});

test('parser job appends new experience without duplicating existing one', function () {
    $user = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);
    $candidate = CandidateProfile::create([
        'user_id' => $user->id,
        'full_name' => 'Test',
        'work_mode_pref' => 'any',
    ]);

    $candidate->experiences()->create([
        'company_name' => 'PT Lama',
        'job_title' => 'Junior Dev',
        'start_date' => '2022-01-01',
        'end_date' => '2023-01-01',
        'is_current' => false,
        'description' => 'existing',
        'location' => 'Jakarta',
    ]);

    $cv = $candidate->cvs()->create([
        'file_url' => '/storage/dummy.pdf',
        'source' => 'upload',
        'is_primary' => true,
        'uploaded_at' => now(),
    ]);

    $job = new ParseUploadedCvJob($cv, $candidate);

    $reflection = new ReflectionClass($job);
    $fillExperiences = $reflection->getMethod('fillExperiences');
    $fillExperiences->invoke($job, [
        'experiences' => [
            [
                'company_name' => 'PT Lama',
                'job_title' => 'Junior Dev',
                'start_date' => '2022-01-01',
                'end_date' => '2023-01-01',
                'is_current' => false,
                'location' => 'Jakarta',
                'description' => 'updated desc',
            ],
            [
                'company_name' => 'PT Baru',
                'job_title' => 'Senior Dev',
                'start_date' => '2023-02-01',
                'end_date' => null,
                'is_current' => true,
                'location' => 'Jakarta',
                'description' => 'baru',
            ],
        ],
    ]);

    $candidate->refresh();
    $companies = $candidate->experiences()->pluck('company_name')->all();

    expect($candidate->experiences()->count())->toBe(2)
        ->and($companies)->toContain('PT Lama')
        ->and($companies)->toContain('PT Baru');
});

test('cv upload without ai api key shows warning and does not crash', function () {
    Storage::fake('public');
    Setting::set('ai_api_key', '');

    $user = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);

    $this->actingAs($user)->post(route('candidate.cvs.store'), [
        'cv_file' => UploadedFile::fake()->create('cv.pdf', 100, 'application/pdf'),
        'is_primary' => '1',
    ])->assertRedirect();

    expect($user->candidateProfile()->firstOrFail()->cvs()->count())->toBe(1);
});
