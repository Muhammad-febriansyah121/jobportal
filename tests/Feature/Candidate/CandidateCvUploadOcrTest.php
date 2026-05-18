<?php

use App\Ai\Agents\CvUploadParser;
use App\Models\Setting;
use App\Models\Skill;
use App\Models\User;
use App\Services\CvTextExtractorService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('candidate cv upload auto fills profile data via ocr parser', function () {
    Storage::fake('public');

    $user = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);

    Skill::query()->create([
        'name' => 'Laravel',
        'slug' => 'laravel',
    ]);

    Setting::set('ai_api_key', 'test-ai-key');
    config()->set('services.openai.api_key', 'test-ai-key');

    $this->mock(CvTextExtractorService::class, function ($mock): void {
        $mock->shouldReceive('extractFromPath')
            ->once()
            ->andReturn('John Doe resume text');
    });

    CvUploadParser::fake([
        [
            'full_name' => 'John Doe',
            'headline' => 'Backend Engineer',
            'summary' => 'Experienced Laravel developer',
            'phone' => '',
            'location_city' => 'Bandung',
            'location_province' => 'Jawa Barat',
            'linkedin_url' => 'https://linkedin.com/in/johndoe',
            'github_url' => 'https://github.com/johndoe',
            'portfolio_url' => 'https://johndoe.dev',
            'skills' => ['Laravel'],
            'experiences' => [[
                'company_name' => 'PT Contoh',
                'job_title' => 'Backend Engineer',
                'start_date' => '2023-01-01',
                'end_date' => '2024-01-01',
                'is_current' => false,
                'location' => 'Bandung',
                'description' => 'Membangun API Laravel',
            ]],
            'educations' => [[
                'institution' => 'Universitas Contoh',
                'degree' => 'S1',
                'field_of_study' => 'Informatika',
                'start_year' => '2018',
                'end_year' => '2022',
                'gpa' => '3.7',
            ]],
        ],
    ]);

    $response = $this->actingAs($user)->post(route('candidate.cvs.store'), [
        'cv_file' => UploadedFile::fake()->create('resume.pdf', 250, 'application/pdf'),
        'is_primary' => '1',
    ]);

    $response->assertRedirect();

    $candidate = $user->candidateProfile()->firstOrFail()->refresh();

    expect($candidate->full_name)->toBe('John Doe')
        ->and($candidate->headline)->toBe('Backend Engineer')
        ->and($candidate->location_city)->toBe('Bandung');

    expect($candidate->experiences()->exists())->toBeTrue();
    expect($candidate->educations()->exists())->toBeTrue();
    expect($candidate->skills()->where('name', 'Laravel')->exists())->toBeTrue();
});
