<?php

use App\Ai\Agents\InterviewAnalyzer;
use App\Models\AiAuditLog;
use App\Models\AiInterviewQuestion;
use App\Models\AiInterviewRescheduleHistory;
use App\Models\AiInterviewSession;
use App\Models\CandidateProfile;
use App\Models\CareerResource;
use App\Models\Company;
use App\Models\Interview;
use App\Models\JobListing;
use App\Models\Setting;
use App\Models\User;
use App\Services\AiService;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;

test('candidate can confirm and decline own interview', function () {
    $candidateUser = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Kandidat',
        'work_mode_pref' => 'any',
    ]);
    $employer = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Karivia',
        'slug' => 'karivia',
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'title' => 'QA Engineer',
        'slug' => 'qa-engineer',
        'description' => 'Test products.',
        'status' => 'published',
        'published_at' => now(),
    ]);
    $application = $candidate->applications()->create([
        'job_listing_id' => $job->id,
        'status' => 'interview',
        'applied_at' => now(),
    ]);
    $interview = Interview::create([
        'application_id' => $application->id,
        'scheduled_by' => $employer->id,
        'scheduled_at' => now()->addDay(),
        'mode' => 'online',
        'location_url' => 'https://meet.example.com/interview',
        'status' => 'scheduled',
    ]);

    $this->actingAs($candidateUser)
        ->patch(route('candidate.interviews.confirm', $interview))
        ->assertRedirect();

    expect($interview->refresh()->status)->toBe('confirmed');

    $this->actingAs($candidateUser)
        ->patch(route('candidate.interviews.decline', $interview))
        ->assertRedirect();

    expect($interview->refresh()->status)->toBe('cancelled');
});

test('candidate interview link is only visible after passing ai stage', function () {
    $candidateUser = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Kandidat Link Rule',
        'work_mode_pref' => 'any',
    ]);
    $employer = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Karivia Link Rule',
        'slug' => 'karivia-link-rule',
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'title' => 'Product Designer',
        'slug' => 'product-designer-link-rule',
        'description' => 'Test interview link visibility.',
        'status' => 'published',
        'published_at' => now(),
    ]);
    $jobAfterPass = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'title' => 'Product Designer Lanjutan',
        'slug' => 'product-designer-link-rule-lanjutan',
        'description' => 'Test interview link visibility after pass ai.',
        'status' => 'published',
        'published_at' => now(),
    ]);

    $applicationBeforePass = $candidate->applications()->create([
        'job_listing_id' => $job->id,
        'status' => 'interview',
        'applied_at' => now(),
    ]);

    $interviewBeforePass = Interview::create([
        'application_id' => $applicationBeforePass->id,
        'scheduled_by' => $employer->id,
        'scheduled_at' => now()->addDay(),
        'mode' => 'online',
        'location_url' => 'https://meet.example.com/before-pass',
        'status' => 'scheduled',
    ]);

    $applicationAfterPass = $candidate->applications()->create([
        'job_listing_id' => $jobAfterPass->id,
        'status' => 'offer',
        'applied_at' => now()->addMinute(),
    ]);

    $interviewAfterPass = Interview::create([
        'application_id' => $applicationAfterPass->id,
        'scheduled_by' => $employer->id,
        'scheduled_at' => now()->addDays(2),
        'mode' => 'online',
        'location_url' => 'https://meet.example.com/after-pass',
        'status' => 'scheduled',
    ]);

    $this->actingAs($candidateUser)
        ->get(route('candidate.interviews.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('candidate/interviews/index')
            ->where('interviews.data.0.id', $interviewAfterPass->id)
            ->where('interviews.data.0.show_meeting_link', true)
            ->where('interviews.data.1.id', $interviewBeforePass->id)
            ->where('interviews.data.1.show_meeting_link', false)
            ->etc()
        );

    $this->actingAs($candidateUser)
        ->get(route('candidate.interviews.show', $interviewBeforePass))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('candidate/interviews/show')
            ->where('interview.id', $interviewBeforePass->id)
            ->where('interview.show_meeting_link', false)
            ->etc()
        );
});

test('candidate interview pagination links are relative URLs', function () {
    $candidateUser = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Kandidat Pagination',
        'work_mode_pref' => 'any',
    ]);
    $employer = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Karivia Pagination',
        'slug' => 'karivia-pagination',
    ]);
    foreach (range(1, 13) as $index) {
        $job = JobListing::create([
            'company_id' => $company->id,
            'created_by' => $employer->id,
            'title' => "Pagination Tester {$index}",
            'slug' => "pagination-tester-{$index}",
            'description' => 'Test interview pagination links.',
            'status' => 'published',
            'published_at' => now(),
        ]);

        $application = $candidate->applications()->create([
            'job_listing_id' => $job->id,
            'status' => 'interview',
            'applied_at' => now()->subMinutes($index),
        ]);

        Interview::create([
            'application_id' => $application->id,
            'scheduled_by' => $employer->id,
            'scheduled_at' => now()->addDay(),
            'mode' => 'online',
            'location_url' => "https://meet.example.com/pagination-{$index}",
            'status' => 'scheduled',
        ]);
    }

    $this->actingAs($candidateUser)
        ->get(route('candidate.interviews.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('candidate/interviews/index')
            ->where('interviews.links.2.url', '/candidate/interviews?page=2')
            ->etc()
        );
});

test('candidate ai interview start list keeps applications available even when prior sessions exist', function () {
    $candidateUser = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Kandidat Filter AI',
        'work_mode_pref' => 'any',
    ]);
    $employer = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Karivia Filter',
        'slug' => 'karivia-filter',
    ]);
    $jobOpen = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'title' => 'Open Slot',
        'slug' => 'open-slot',
        'description' => 'Open for start.',
        'status' => 'published',
        'published_at' => now(),
    ]);
    $jobLocked = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'title' => 'Locked Slot',
        'slug' => 'locked-slot',
        'description' => 'Already has interview.',
        'status' => 'published',
        'published_at' => now(),
    ]);

    $openApplication = $candidate->applications()->create([
        'job_listing_id' => $jobOpen->id,
        'status' => 'shortlisted',
        'applied_at' => now(),
    ]);
    $lockedApplication = $candidate->applications()->create([
        'job_listing_id' => $jobLocked->id,
        'status' => 'interview',
        'applied_at' => now(),
    ]);

    AiInterviewSession::create([
        'application_id' => $lockedApplication->id,
        'candidate_id' => $candidate->id,
        'status' => 'scheduled',
        'interview_mode' => 'voice',
        'scheduled_at' => now()->addHour(),
        'duration_minutes' => 30,
        'voice' => 'marin',
    ]);

    $this->actingAs($candidateUser)
        ->get(route('candidate.ai-interviews.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('candidate/ai-interviews/index')
            ->has('applications', 2)
            ->where('applications.0.id', $lockedApplication->id)
            ->where('applications.1.id', $openApplication->id)
            ->where('setup.defaults.application_id', null)
            ->etc()
        );
});

test('candidate ai interview simulator accepts setup prefill from query', function () {
    $candidateUser = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Kandidat Prefill',
        'work_mode_pref' => 'any',
    ]);
    $employer = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Karivia Prefill',
        'slug' => 'karivia-prefill',
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'title' => 'Data Engineer',
        'slug' => 'data-engineer-prefill',
        'description' => 'Build data pipelines.',
        'status' => 'published',
        'published_at' => now(),
    ]);
    $application = $candidate->applications()->create([
        'job_listing_id' => $job->id,
        'status' => 'interview',
        'applied_at' => now(),
    ]);

    $this->actingAs($candidateUser)
        ->get(route('candidate.ai-interviews.index', [
            'application_id' => $application->id,
            'interview_mode' => 'text',
            'interview_language' => 'en',
            'interview_focus' => 'technical',
            'candidate_level' => 'mid',
            'question_count' => 7,
            'duration_minutes' => 45,
        ]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('candidate/ai-interviews/index')
            ->where('setup.defaults.application_id', $application->id)
            ->where('setup.defaults.interview_mode', 'text')
            ->where('setup.defaults.interview_language', 'en')
            ->where('setup.defaults.interview_focus', 'technical')
            ->where('setup.defaults.candidate_level', 'mid')
            ->where('setup.defaults.question_count', 7)
            ->where('setup.defaults.duration_minutes', 45)
        );
});

test('candidate can start ai interview again when previous session already exists', function () {
    $candidateUser = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Kandidat Lock AI',
        'work_mode_pref' => 'any',
    ]);
    $employer = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Karivia Lock AI',
        'slug' => 'karivia-lock-ai',
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'title' => 'Locked Interview Job',
        'slug' => 'locked-interview-job',
        'description' => 'Cannot start twice.',
        'status' => 'published',
        'published_at' => now(),
    ]);
    $application = $candidate->applications()->create([
        'job_listing_id' => $job->id,
        'status' => 'interview',
        'applied_at' => now(),
    ]);

    AiInterviewSession::create([
        'application_id' => $application->id,
        'candidate_id' => $candidate->id,
        'status' => 'completed',
        'interview_mode' => 'text',
        'completed_at' => now(),
        'duration_minutes' => 30,
        'voice' => 'marin',
    ]);

    $this->actingAs($candidateUser)
        ->post(route('candidate.ai-interviews.store'), [
            'application_id' => $application->id,
        ])
        ->assertRedirect();

    expect(AiInterviewSession::query()->where('application_id', $application->id)->count())->toBe(2);
});

test('candidate can start ai interview simulator with setup options', function () {
    $candidateUser = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Kandidat Setup Simulator',
        'work_mode_pref' => 'any',
    ]);
    $employer = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Karivia Setup',
        'slug' => 'karivia-setup',
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'title' => 'Data Analyst',
        'slug' => 'data-analyst-setup',
        'description' => 'Analisis data, dashboard, dan insight bisnis.',
        'required_qualifications' => 'SQL, data storytelling, komunikasi',
        'status' => 'published',
        'published_at' => now(),
    ]);
    $application = $candidate->applications()->create([
        'job_listing_id' => $job->id,
        'status' => 'interview',
        'applied_at' => now(),
    ]);

    $this->actingAs($candidateUser)
        ->post(route('candidate.ai-interviews.store'), [
            'application_id' => $application->id,
            'interview_mode' => 'text',
            'interview_language' => 'id',
            'interview_focus' => 'technical',
            'candidate_level' => 'junior',
            'question_count' => 7,
            'duration_minutes' => 45,
        ])
        ->assertRedirect();

    $session = AiInterviewSession::query()
        ->where('application_id', $application->id)
        ->latest('id')
        ->first();

    expect($session)->not->toBeNull();
    expect($session?->status)->toBe('in_progress');
    expect($session?->interview_mode)->toBe('text');
    expect($session?->interview_language)->toBe('id');
    expect($session?->duration_minutes)->toBe(45);
    expect($session?->started_at)->not->toBeNull();
    expect(
        AiInterviewQuestion::query()
            ->where('session_id', $session?->id)
            ->count()
    )->toBe(7);
});

test('candidate can complete scheduled ai interview answers', function () {
    $candidateUser = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Kandidat AI',
        'work_mode_pref' => 'any',
    ]);
    $employer = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Karivia AI',
        'slug' => 'karivia-ai',
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'title' => 'Backend AI Engineer',
        'slug' => 'backend-ai-engineer',
        'description' => 'Build AI interview tools.',
        'status' => 'published',
        'published_at' => now(),
    ]);
    $application = $candidate->applications()->create([
        'job_listing_id' => $job->id,
        'status' => 'interview',
        'applied_at' => now(),
    ]);
    $session = AiInterviewSession::create([
        'application_id' => $application->id,
        'candidate_id' => $candidate->id,
        'status' => 'scheduled',
        'interview_mode' => 'text',
        'scheduled_at' => now()->addHour(),
        'duration_minutes' => 30,
        'voice' => 'marin',
    ]);
    $question = AiInterviewQuestion::create([
        'application_id' => $application->id,
        'session_id' => $session->id,
        'question' => 'Ceritakan pengalaman backend terbaik.',
        'category' => 'technical',
        'rubric' => 'Nilai contoh konkret.',
        'weight' => 100,
        'allow_ai_followup' => true,
        'order_number' => 1,
    ]);

    $this->actingAs($candidateUser)
        ->patch(route('candidate.ai-interviews.start', $session))
        ->assertRedirect();

    expect($session->refresh()->status)->toBe('in_progress');
    expect($session->started_at)->not->toBeNull();

    $this->actingAs($candidateUser)
        ->patch(route('candidate.ai-interviews.answer', $session), [
            'answers' => [
                $question->id => 'Saya membangun service Laravel yang memproses transaksi real-time dengan queue dan observability.',
            ],
            'live_transcript' => 'AI: Ceritakan pengalaman backend terbaik.',
        ])
        ->assertRedirect();

    $session->refresh();

    expect($session->status)->toBe('completed');
    expect($session->analysis)->not->toBeNull();
    expect($session->responses()->where('question_id', $question->id)->first()?->answer_text)->toContain('Laravel');
});

test('candidate voice transcript is stored and analyzed with ai structured output', function () {
    $candidateUser = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Kandidat Voice Analysis',
        'work_mode_pref' => 'any',
    ]);
    $employer = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Karivia Analysis',
        'slug' => 'karivia-analysis',
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'title' => 'Backend Platform Engineer',
        'slug' => 'backend-platform-engineer',
        'description' => 'Build reliable platform services.',
        'status' => 'published',
        'published_at' => now(),
    ]);
    $application = $candidate->applications()->create([
        'job_listing_id' => $job->id,
        'status' => 'interview',
        'applied_at' => now(),
    ]);
    $session = AiInterviewSession::create([
        'application_id' => $application->id,
        'candidate_id' => $candidate->id,
        'status' => 'in_progress',
        'interview_mode' => 'voice',
        'duration_minutes' => 30,
        'voice' => 'marin',
        'started_at' => now(),
    ]);
    $firstQuestion = AiInterviewQuestion::create([
        'application_id' => $application->id,
        'session_id' => $session->id,
        'question' => 'Ceritakan pengalaman backend paling relevan.',
        'category' => 'technical',
        'rubric' => 'Nilai kedalaman teknis dan contoh konkret.',
        'weight' => 60,
        'order_number' => 1,
    ]);
    $secondQuestion = AiInterviewQuestion::create([
        'application_id' => $application->id,
        'session_id' => $session->id,
        'question' => 'Bagaimana cara Anda berkomunikasi saat incident?',
        'category' => 'communication',
        'rubric' => 'Nilai struktur komunikasi dan kolaborasi.',
        'weight' => 40,
        'order_number' => 2,
    ]);

    $this->mock(AiService::class, function ($mock): void {
        $mock->shouldReceive('isConfigured')->andReturn(true);
    });

    InterviewAnalyzer::fake([
        [
            'fit_score' => 91,
            'recommendation' => 'Lanjutkan ke interview user',
            'summary' => 'Kandidat memberi contoh backend dan komunikasi yang kuat.',
            'strengths' => ['Contoh teknis konkret', 'Komunikasi terstruktur'],
            'weaknesses' => ['Perlu validasi sistem skala besar'],
            'technical_scorecard' => [
                ['label' => 'technical_skills', 'score' => 92],
                ['label' => 'communication', 'score' => 88],
            ],
            'response_scores' => [
                [
                    'question_id' => $firstQuestion->id,
                    'score' => 92,
                    'analysis' => 'Jawaban teknis kuat dan relevan.',
                ],
                [
                    'question_id' => $secondQuestion->id,
                    'score' => 88,
                    'analysis' => 'Jawaban komunikasi cukup terstruktur.',
                ],
            ],
        ],
    ]);

    $this->actingAs($candidateUser)
        ->patch(route('candidate.ai-interviews.answer', $session), [
            'answers' => [
                $firstQuestion->id => '',
                $secondQuestion->id => '',
            ],
            'live_transcript' => implode("\n", [
                'AI: Ceritakan pengalaman backend paling relevan.',
                'Kandidat: Saya membangun service Laravel dengan queue, retry, dan observability untuk transaksi real-time.',
                'AI: Bagaimana cara Anda berkomunikasi saat incident?',
                'Kandidat: Saya membuat update berkala, menjelaskan impact, owner, dan ETA dengan bahasa yang mudah dipahami.',
            ]),
        ])
        ->assertRedirect();

    $session->refresh();

    expect($session->status)->toBe('completed');
    expect($session->live_transcript)->toContain('transaksi real-time');
    expect($session->analysis?->fit_score)->toBe(91);
    expect($session->analysis?->recommendation)->toBe('Lanjutkan ke interview user');
    expect($session->analysis?->technical_scorecard)->toMatchArray([
        'technical_skills' => 92,
        'communication' => 88,
    ]);
    expect($session->responses()->where('question_id', $firstQuestion->id)->first()?->answer_text)->toContain('Laravel');
    expect($session->responses()->where('question_id', $secondQuestion->id)->first()?->answer_text)->toContain('update berkala');
    expect(AiAuditLog::query()->where('feature', 'candidate.ai_interview.analysis')->value('status'))->toBe('completed');
});

test('fallback fit score penalizes unanswered questions when ai analysis is unavailable', function () {
    $candidateUser = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Kandidat Fallback Score',
        'work_mode_pref' => 'any',
    ]);
    $employer = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Karivia Fallback Score',
        'slug' => 'karivia-fallback-score',
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'title' => 'Frontend Engineer',
        'slug' => 'frontend-engineer-fallback-score',
        'description' => 'Fallback score should include unanswered questions.',
        'status' => 'published',
        'published_at' => now(),
    ]);
    $application = $candidate->applications()->create([
        'job_listing_id' => $job->id,
        'status' => 'interview',
        'applied_at' => now(),
    ]);
    $session = AiInterviewSession::create([
        'application_id' => $application->id,
        'candidate_id' => $candidate->id,
        'status' => 'in_progress',
        'interview_mode' => 'voice',
        'duration_minutes' => 30,
        'started_at' => now(),
    ]);
    $firstQuestion = AiInterviewQuestion::create([
        'application_id' => $application->id,
        'session_id' => $session->id,
        'question' => 'Pertanyaan pertama.',
        'category' => 'behavioral',
        'order_number' => 1,
    ]);
    $secondQuestion = AiInterviewQuestion::create([
        'application_id' => $application->id,
        'session_id' => $session->id,
        'question' => 'Pertanyaan kedua.',
        'category' => 'technical',
        'order_number' => 2,
    ]);
    $thirdQuestion = AiInterviewQuestion::create([
        'application_id' => $application->id,
        'session_id' => $session->id,
        'question' => 'Pertanyaan ketiga.',
        'category' => 'motivation',
        'order_number' => 3,
    ]);

    $this->mock(AiService::class, function ($mock): void {
        $mock->shouldReceive('isConfigured')->andReturn(false);
    });

    $this->actingAs($candidateUser)
        ->patch(route('candidate.ai-interviews.answer', $session), [
            'answers' => [
                $firstQuestion->id => 'Saya mengerjakan satu proyek dan menyelesaikannya tepat waktu.',
                $secondQuestion->id => '',
                $thirdQuestion->id => '',
            ],
            'live_transcript' => '',
        ])
        ->assertRedirect();

    $session->refresh();

    expect($session->analysis)->not->toBeNull();
    expect($session->analysis?->fit_score)->toBe(21);
    expect($session->analysis?->recommendation)->toBe('Perlu review manual recruiter');
});

test('candidate can confirm and decline ai interview invitation', function () {
    $candidateUser = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Kandidat Invite',
        'work_mode_pref' => 'any',
    ]);
    $employer = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Karivia Invite',
        'slug' => 'karivia-invite',
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'title' => 'Frontend AI Engineer',
        'slug' => 'frontend-ai-engineer',
        'description' => 'Build AI interview frontend.',
        'status' => 'published',
        'published_at' => now(),
    ]);
    $application = $candidate->applications()->create([
        'job_listing_id' => $job->id,
        'status' => 'interview',
        'applied_at' => now(),
    ]);
    $session = AiInterviewSession::create([
        'application_id' => $application->id,
        'candidate_id' => $candidate->id,
        'status' => 'scheduled',
        'interview_mode' => 'voice',
        'scheduled_at' => now()->addDay(),
    ]);

    $this->actingAs($candidateUser)
        ->patch(route('candidate.ai-interviews.confirm', $session))
        ->assertRedirect();

    expect($session->refresh()->candidate_confirmed_at)->not->toBeNull();
    expect($session->status)->toBe('scheduled');

    $this->actingAs($candidateUser)
        ->patch(route('candidate.ai-interviews.decline', $session))
        ->assertRedirect(route('candidate.ai-interviews.index'));

    expect($session->refresh()->status)->toBe('cancelled');
    expect($session->declined_at)->not->toBeNull();
});

test('candidate realtime client secret uses ai api key from settings table', function () {
    Http::fake([
        'api.openai.com/*' => Http::response(['value' => 'ephemeral-secret-from-openai'], 200),
    ]);

    Setting::set('ai_api_key', 'settings-table-key');

    $candidateUser = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Kandidat Voice',
        'work_mode_pref' => 'any',
    ]);
    $employer = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Karivia Voice',
        'slug' => 'karivia-voice',
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'title' => 'Voice AI Engineer',
        'slug' => 'voice-ai-engineer',
        'description' => 'Build voice interview tools.',
        'status' => 'published',
        'published_at' => now(),
    ]);
    $application = $candidate->applications()->create([
        'job_listing_id' => $job->id,
        'status' => 'interview',
        'applied_at' => now(),
    ]);
    $session = AiInterviewSession::create([
        'application_id' => $application->id,
        'candidate_id' => $candidate->id,
        'status' => 'scheduled',
        'interview_mode' => 'voice',
        'duration_minutes' => 30,
        'voice' => 'marin',
    ]);
    AiInterviewQuestion::create([
        'application_id' => $application->id,
        'session_id' => $session->id,
        'question' => 'Ceritakan pengalaman voice AI terbaik.',
        'category' => 'technical',
        'order_number' => 1,
    ]);

    $this->actingAs($candidateUser)
        ->postJson(route('candidate.ai-interviews.client-secret', $session), [
            'interview_language' => 'en',
        ])
        ->assertOk()
        ->assertJson([
            'client_secret' => 'ephemeral-secret-from-openai',
            'model' => 'gpt-realtime-2',
        ]);

    Http::assertSent(function ($request): bool {
        $data = $request->data();
        $instructions = (string) ($data['session']['instructions'] ?? '');

        return $request->url() === 'https://api.openai.com/v1/realtime/client_secrets'
            && $request->hasHeader('Authorization', 'Bearer settings-table-key')
            && (
                ($data['session']['audio']['input']['transcription']['model'] ?? null) === 'gpt-realtime-whisper' ||
                ($data['session']['audio']['input']['transcription']['model'] ?? null) === 'gpt-4o-mini-transcribe'
            )
            && ($data['session']['audio']['input']['transcription']['language'] ?? null) === 'en'
            && str_contains($instructions, 'Speak in English only for all spoken responses in this session.')
            && str_contains($instructions, 'Never output Indonesian')
            && str_contains($instructions, 'Karivia Voice')
            && str_contains($instructions, 'Kandidat Voice');
    });

    expect($session->refresh()->interview_language)->toBe('en');
});

test('candidate can see ai interview opening before questions on detail page', function () {
    $candidateUser = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Kandidat Intro',
        'work_mode_pref' => 'any',
    ]);
    $employer = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Karivia Intro',
        'slug' => 'karivia-intro',
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'title' => 'AI Product Engineer',
        'slug' => 'ai-product-engineer',
        'description' => 'Design interview introduction.',
        'status' => 'published',
        'published_at' => now(),
    ]);
    $application = $candidate->applications()->create([
        'job_listing_id' => $job->id,
        'status' => 'interview',
        'applied_at' => now(),
    ]);
    $session = AiInterviewSession::create([
        'application_id' => $application->id,
        'candidate_id' => $candidate->id,
        'status' => 'scheduled',
        'interview_mode' => 'voice',
        'interview_language' => 'en',
        'scheduled_at' => now()->addHour(),
        'voice' => 'marin',
    ]);
    AiInterviewQuestion::create([
        'application_id' => $application->id,
        'session_id' => $session->id,
        'question' => 'Ceritakan pengalaman memimpin produk AI.',
        'category' => 'behavioral',
        'order_number' => 1,
    ]);

    $this->actingAs($candidateUser)
        ->get(route('candidate.ai-interviews.show', $session))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('candidate/ai-interviews/show')
            ->where('session.ai_intro.assistant_name', 'Karivia AI')
            ->where('session.ai_intro.assistant_role', 'Virtual Interviewer')
            ->where('session.interview_language', 'en')
            ->where('session.ai_intro.greeting', fn (string $greeting): bool => str_contains($greeting, 'Hello Kandidat Intro')
                && str_contains($greeting, 'AI Product Engineer')
                && str_contains($greeting, 'Karivia Intro')
                && str_contains($greeting, 'first question')));
});

test('candidate can open ai interview when session candidate id is missing but application ownership matches', function () {
    $candidateUser = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Kandidat Ownership Fallback',
        'work_mode_pref' => 'any',
    ]);
    $otherCandidateUser = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);
    $otherCandidate = CandidateProfile::create([
        'user_id' => $otherCandidateUser->id,
        'full_name' => 'Kandidat Lain',
        'work_mode_pref' => 'any',
    ]);
    $employer = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Karivia Ownership Fallback',
        'slug' => 'karivia-ownership-fallback',
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'title' => 'Backend Engineer',
        'slug' => 'backend-engineer-ownership-fallback',
        'description' => 'Ownership fallback for ai interview session.',
        'status' => 'published',
        'published_at' => now(),
    ]);
    $application = $candidate->applications()->create([
        'job_listing_id' => $job->id,
        'status' => 'interview',
        'applied_at' => now(),
    ]);
    $session = AiInterviewSession::create([
        'application_id' => $application->id,
        'candidate_id' => $otherCandidate->id,
        'status' => 'scheduled',
        'interview_mode' => 'voice',
        'scheduled_at' => now()->addHour(),
        'duration_minutes' => 30,
    ]);
    AiInterviewQuestion::create([
        'application_id' => $application->id,
        'session_id' => $session->id,
        'question' => 'Ceritakan pengalaman paling relevan Anda.',
        'category' => 'behavioral',
        'order_number' => 1,
    ]);

    $this->actingAs($candidateUser)
        ->get(route('candidate.ai-interviews.show', $session))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('candidate/ai-interviews/show')
            ->where('session.id', $session->id)
            ->etc()
        );

    expect($session->refresh()->candidate_id)->toBe($candidate->id);
});

test('candidate visiting completed ai interview show is redirected to feedback page', function () {
    $candidateUser = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Kandidat Redirect Result',
        'work_mode_pref' => 'any',
    ]);
    $employer = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Karivia Redirect Result',
        'slug' => 'karivia-redirect-result',
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'title' => 'Frontend Engineer',
        'slug' => 'frontend-engineer-redirect-result',
        'description' => 'Redirect to result page.',
        'status' => 'published',
        'published_at' => now(),
    ]);
    $application = $candidate->applications()->create([
        'job_listing_id' => $job->id,
        'status' => 'interview',
        'applied_at' => now(),
    ]);
    $session = AiInterviewSession::create([
        'application_id' => $application->id,
        'candidate_id' => $candidate->id,
        'status' => 'completed',
        'interview_mode' => 'voice',
        'completed_at' => now(),
    ]);

    $this->actingAs($candidateUser)
        ->get(route('candidate.ai-interviews.show', $session))
        ->assertRedirect(route('candidate.ai-interviews.feedback', $session));
});

test('candidate can request ai interview reschedule', function () {
    $candidateUser = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Kandidat Reschedule',
        'work_mode_pref' => 'any',
    ]);
    $employer = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Karivia Reschedule',
        'slug' => 'karivia-reschedule',
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'title' => 'Frontend Engineer',
        'slug' => 'frontend-engineer-reschedule',
        'description' => 'Handle frontend interview experience.',
        'status' => 'published',
        'published_at' => now(),
    ]);
    $application = $candidate->applications()->create([
        'job_listing_id' => $job->id,
        'status' => 'interview',
        'applied_at' => now(),
    ]);
    $session = AiInterviewSession::create([
        'application_id' => $application->id,
        'candidate_id' => $candidate->id,
        'status' => 'scheduled',
        'interview_mode' => 'voice',
        'scheduled_at' => now()->addDay(),
    ]);

    $this->actingAs($candidateUser)
        ->patch(route('candidate.ai-interviews.reschedule', $session), [
            'proposed_at' => now()->addDays(2)->setTime(10, 0)->toDateTimeString(),
            'reason' => 'Jadwal sebelumnya bentrok dengan jadwal kerja.',
        ])
        ->assertRedirect();

    $session->refresh();

    expect($session->reschedule_requested_at)->not->toBeNull();
    expect($session->reschedule_proposed_at)->not->toBeNull();
    expect($session->reschedule_reason)->toContain('bentrok');
    expect($session->status)->toBe('scheduled');
    expect(AiInterviewRescheduleHistory::query()
        ->where('session_id', $session->id)
        ->where('action', 'requested')
        ->exists())->toBeTrue();
});

test('candidate can view ai interview feedback page after session completed', function () {
    $candidateUser = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Kandidat Feedback',
        'work_mode_pref' => 'any',
    ]);
    $employer = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Karivia Feedback',
        'slug' => 'karivia-feedback',
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'title' => 'Backend Engineer',
        'slug' => 'backend-engineer-feedback',
        'description' => 'Backend interview flow.',
        'status' => 'published',
        'published_at' => now(),
    ]);
    $application = $candidate->applications()->create([
        'job_listing_id' => $job->id,
        'status' => 'interview',
        'applied_at' => now(),
    ]);
    $session = AiInterviewSession::create([
        'application_id' => $application->id,
        'candidate_id' => $candidate->id,
        'status' => 'completed',
        'interview_mode' => 'text',
        'completed_at' => now(),
    ]);
    $questionBehavioral = AiInterviewQuestion::create([
        'application_id' => $application->id,
        'session_id' => $session->id,
        'question' => 'Apa kontribusi terbesar Anda di tim sebelumnya?',
        'category' => 'behavioral',
        'order_number' => 1,
    ]);
    $questionTechnical = AiInterviewQuestion::create([
        'application_id' => $application->id,
        'session_id' => $session->id,
        'question' => 'Teknologi apa yang paling sering Anda gunakan?',
        'category' => 'technical',
        'order_number' => 2,
    ]);
    $session->responses()->create([
        'question_id' => $questionBehavioral->id,
        'answer_text' => 'Saya membantu tim meningkatkan koordinasi antar divisi.',
        'ai_score' => 72,
        'ai_analysis' => 'Komunikasi sudah baik, perlu contoh dampak lebih terukur.',
    ]);
    $session->responses()->create([
        'question_id' => $questionTechnical->id,
        'answer_text' => 'Saya sering menggunakan Laravel dan MySQL.',
        'ai_score' => 86,
        'ai_analysis' => 'Jawaban relevan dan terstruktur.',
    ]);
    $session->analysis()->create([
        'fit_score' => 84,
        'recommendation' => 'Lanjut ke review user',
        'summary' => 'Komunikasi kandidat baik dan jawaban relevan.',
        'strengths' => ['Komunikasi jelas'],
        'weaknesses' => ['Perlu contoh lebih teknis'],
        'technical_scorecard' => ['communication' => 84],
    ]);
    CareerResource::factory()->create([
        'published_at' => now(),
    ]);

    $this->actingAs($candidateUser)
        ->get(route('candidate.ai-interviews.feedback', $session))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('candidate/ai-interviews/feedback')
            ->where('session.id', $session->id)
            ->where('session.fit_score', 84)
            ->where('session.category_scores.0.category', 'behavioral')
            ->where('session.category_scores.0.average_score', 72)
            ->where('session.category_scores.0.priority_rank', 1)
            ->where('session.category_scores.1.category', 'technical')
            ->where('session.category_scores.1.average_score', 86)
            ->where('session.category_scores.1.priority_rank', 2)
            ->where('progress_trends.points.0.session_id', $session->id)
            ->where('progress_trends.categories.0', 'behavioral'));
});

test('candidate feedback page retries ai analysis when placeholder analysis still exists', function () {
    $candidateUser = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Kandidat Retry Analysis',
        'work_mode_pref' => 'any',
    ]);
    $employer = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Karivia Retry Analysis',
        'slug' => 'karivia-retry-analysis',
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'title' => 'Backend Engineer',
        'slug' => 'backend-engineer-retry-analysis',
        'description' => 'Retry ai analysis from feedback.',
        'status' => 'published',
        'published_at' => now(),
    ]);
    $application = $candidate->applications()->create([
        'job_listing_id' => $job->id,
        'status' => 'interview',
        'applied_at' => now(),
    ]);
    $session = AiInterviewSession::create([
        'application_id' => $application->id,
        'candidate_id' => $candidate->id,
        'status' => 'completed',
        'interview_mode' => 'voice',
        'completed_at' => now(),
    ]);
    $question = AiInterviewQuestion::create([
        'application_id' => $application->id,
        'session_id' => $session->id,
        'question' => 'Ceritakan pengalaman backend paling relevan.',
        'category' => 'technical',
        'order_number' => 1,
    ]);
    $session->responses()->create([
        'question_id' => $question->id,
        'answer_text' => 'Saya membangun API Laravel dengan queue dan observability.',
        'ai_score' => 62,
        'ai_analysis' => 'Jawaban tersimpan dan menunggu analisis AI interview.',
    ]);
    $session->analysis()->create([
        'fit_score' => 62,
        'recommendation' => 'Perlu review manual recruiter',
        'summary' => 'Fallback summary.',
        'strengths' => ['Selesai interview'],
        'weaknesses' => ['Perlu pendalaman'],
        'technical_scorecard' => ['technical' => 62],
    ]);

    $this->mock(AiService::class, function ($mock): void {
        $mock->shouldReceive('isConfigured')->andReturn(true);
    });

    InterviewAnalyzer::fake([
        [
            'fit_score' => 88,
            'recommendation' => 'Lanjutkan ke interview user',
            'summary' => 'Analisis AI berhasil diproses ulang.',
            'strengths' => ['Contoh teknis konkret'],
            'weaknesses' => ['Perlu detail skala lebih besar'],
            'technical_scorecard' => [
                ['label' => 'technical', 'score' => 88],
            ],
            'response_scores' => [
                [
                    'question_id' => $question->id,
                    'score' => 88,
                    'analysis' => 'Jawaban teknis jelas dengan dampak terukur.',
                ],
            ],
        ],
    ]);

    $this->actingAs($candidateUser)
        ->get(route('candidate.ai-interviews.feedback', $session))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('candidate/ai-interviews/feedback')
            ->where('session.id', $session->id)
            ->where('session.fit_score', 88)
            ->etc()
        );

    expect($session->responses()->where('question_id', $question->id)->value('ai_analysis'))
        ->toBe('Jawaban teknis jelas dengan dampak terukur.');
});
