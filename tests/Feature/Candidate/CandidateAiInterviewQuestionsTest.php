<?php

use App\Actions\Candidate\GenerateCustomInterviewQuestions;
use App\Http\Controllers\Candidate\CandidateAiInterviewController;
use App\Models\AiInterviewSession;
use App\Models\CandidateProfile;
use App\Models\User;

use function Pest\Laravel\actingAs;

function practiceInterviewScenario(): array
{
    $candidate = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);
    $profile = CandidateProfile::create([
        'user_id' => $candidate->id,
        'full_name' => 'Practice Tester',
        'work_mode_pref' => 'any',
    ]);
    $session = AiInterviewSession::create([
        'candidate_id' => $profile->id,
        'practice_mode' => 'interview',
        'status' => 'in_progress',
        'interview_mode' => 'voice',
        'interview_language' => 'id',
        'duration_minutes' => 30,
        'started_at' => now(),
        'questions_preparing' => false,
    ]);

    return [$candidate, $profile, $session];
}

test('question generation falls back to the static bank when the AI generator throws', function () {
    [, $profile, $session] = practiceInterviewScenario();

    $this->mock(GenerateCustomInterviewQuestions::class)
        ->shouldReceive('handle')
        ->once()
        ->andThrow(new RuntimeException('OpenAI timeout'));

    app(CandidateAiInterviewController::class)->buildGeneralInterviewQuestionsForJob(
        $session,
        $profile,
        [
            'interview_focus' => 'mixed',
            'candidate_level' => 'junior',
            'interview_language' => 'id',
            'question_count' => 5,
            'target_role' => 'Backend Engineer',
        ],
    );

    expect($session->questions()->count())->toBeGreaterThanOrEqual(3);
});

test('voice-log accepts diagnostic events from the session owner', function () {
    [$candidate, , $session] = practiceInterviewScenario();

    actingAs($candidate)
        ->postJson(route('candidate.ai-interviews.voice-log', $session), [
            'event' => 'datachannel_open',
            'detail' => ['state' => 'open'],
        ])
        ->assertOk()
        ->assertJson(['ok' => true]);
});

test('client-secret is refused when the session has no questions', function () {
    config()->set('services.openai.api_key', 'test-key');

    [$candidate, , $session] = practiceInterviewScenario();

    actingAs($candidate)
        ->postJson(route('candidate.ai-interviews.client-secret', $session), [
            'interview_language' => 'id',
        ])
        ->assertStatus(422)
        ->assertJson(['message' => 'Pertanyaan wawancara masih disiapkan. Tunggu beberapa saat lalu coba lagi.']);
});
