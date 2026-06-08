<?php

use App\Http\Controllers\Candidate\CandidateAiInterviewController;
use App\Models\AiInterviewQuestion;
use App\Models\AiInterviewResponse;
use App\Models\AiInterviewSession;
use App\Models\CandidateProfile;
use App\Models\User;

function analysisScenario(): AiInterviewSession
{
    $candidate = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);
    $profile = CandidateProfile::create([
        'user_id' => $candidate->id,
        'full_name' => 'Analysis Tester',
        'work_mode_pref' => 'any',
    ]);
    $session = AiInterviewSession::create([
        'candidate_id' => $profile->id,
        'practice_mode' => 'interview',
        'status' => 'completed',
        'interview_mode' => 'voice',
        'interview_language' => 'id',
        'duration_minutes' => 30,
        'completed_at' => now(),
    ]);

    $questions = [
        ['category' => 'behavioral', 'score' => 80],
        ['category' => 'technical', 'score' => 60],
        ['category' => 'problem_solving', 'score' => 70],
    ];

    foreach ($questions as $index => $data) {
        $question = AiInterviewQuestion::create([
            'session_id' => $session->id,
            'question' => "Pertanyaan {$index}",
            'category' => $data['category'],
            'rubric' => 'Nilai berdasarkan kejelasan.',
            'weight' => 10,
            'allow_ai_followup' => true,
            'order_number' => $index + 1,
        ]);
        AiInterviewResponse::create([
            'session_id' => $session->id,
            'question_id' => $question->id,
            'answer_text' => 'Jawaban contoh.',
            'ai_score' => $data['score'],
            'ai_analysis' => 'Catatan.',
        ]);
    }

    return $session->load(['questions', 'responses.question']);
}

test('fallback analysis persists competency scores and improvement tips', function () {
    $session = analysisScenario();

    app(CandidateAiInterviewController::class)->applyFallbackAnalysis($session);

    $analysis = $session->analysis()->first();

    expect($analysis)->not->toBeNull();
    expect($analysis->competency_scores)
        ->toBeArray()
        ->toHaveKeys([
            'communication',
            'technical_depth',
            'problem_solving',
            'cultural_fit',
            'confidence',
        ]);
    expect($analysis->improvement_tips)->toBeArray()->not->toBeEmpty();
    expect($analysis->competency_scores['technical_depth'])->toBe(60);
});
