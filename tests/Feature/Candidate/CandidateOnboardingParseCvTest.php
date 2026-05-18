<?php

use App\Ai\Agents\CvParser;
use App\Models\CandidateProfile;
use App\Models\Setting;
use App\Models\User;
use App\Services\CvTextExtractorService;
use Illuminate\Http\UploadedFile;

beforeEach(function () {
    $this->candidate = User::factory()->candidate()->create([
        'onboarding_completed_at' => null,
    ]);

    CandidateProfile::create([
        'user_id' => $this->candidate->id,
        'profile_completion' => 30,
        'full_name' => '',
        'work_mode_pref' => 'any',
    ]);

    $this->mock(CvTextExtractorService::class, function ($mock): void {
        $mock->shouldReceive('extractFromPath')
            ->andReturn('Sari Dev — Senior UI Designer. Skills: Figma, Sketch, UX research. Worked at PT ABC.');
    });
});

test('parseCv returns parsed structure when AI configured', function () {
    Setting::set('ai_api_key', 'test-ai-key');
    config()->set('services.openai.api_key', 'test-ai-key');

    CvParser::fake([
        [
            'full_name' => 'Sari Dev',
            'headline' => 'Senior UI Designer',
            'summary' => 'Designer dengan 6 tahun pengalaman.',
            'location_city' => 'Jakarta',
            'location_province' => 'DKI Jakarta',
            'skills' => ['Figma', 'Sketch', 'UX research'],
            'experiences' => [[
                'company_name' => 'PT ABC',
                'job_title' => 'Senior UI Designer',
                'start_date' => '2020-01-01',
                'end_date' => '',
                'is_current' => true,
            ]],
            'educations' => [],
        ],
    ]);

    $file = UploadedFile::fake()->create('cv.pdf', 50, 'application/pdf');

    $response = $this->actingAs($this->candidate)
        ->post(route('candidate.onboarding.parse-cv'), ['cv_file' => $file]);

    $response->assertOk();
    $response->assertJson([
        'full_name' => 'Sari Dev',
        'headline' => 'Senior UI Designer',
        'location_city' => 'Jakarta',
    ]);
});

test('parseCv returns 422 when AI not configured', function () {
    Setting::set('ai_api_key', '');
    config()->set('services.openai.api_key', null);

    $file = UploadedFile::fake()->create('cv.pdf', 50, 'application/pdf');

    $this->actingAs($this->candidate)
        ->post(route('candidate.onboarding.parse-cv'), ['cv_file' => $file])
        ->assertStatus(422)
        ->assertJson(['error' => 'AI belum dikonfigurasi. Isi form manual.']);
});
