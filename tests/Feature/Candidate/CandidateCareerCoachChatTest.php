<?php

use App\Models\AiAuditLog;
use App\Models\AiCareerCoachingMessage;
use App\Models\AiCareerCoachingSession;
use App\Models\AiCareerRecommendation;
use App\Models\CandidateProfile;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    $this->candidate = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);

    $this->profile = CandidateProfile::create([
        'user_id' => $this->candidate->id,
        'profile_completion' => 100,
        'full_name' => 'Sari Dev',
        'headline' => 'Senior UI Designer',
        'work_mode_pref' => 'any',
    ]);
});

function fakeChatJsonResponse(array $payload): void
{
    Http::fake([
        'https://api.openai.com/v1/chat/completions' => Http::response([
            'choices' => [
                ['message' => ['content' => json_encode($payload)]],
            ],
        ], 200),
    ]);
}

test('career coach chat uses AI when api key configured', function () {
    Setting::set('ai_api_key', 'test-ai-key');

    fakeChatJsonResponse([
        'reply' => 'Berdasarkan profilmu sebagai **Senior UI Designer**, fokus pada **AI strategy**.',
        'quick_prompts' => ['Lihat skill prioritas', 'Bandingkan dengan PM'],
        'should_generate_path' => false,
        'recommendation' => [
            'target_role' => '',
            'match_score' => 0,
            'summary' => '',
            'growth_potential' => '',
            'salary_range' => '',
            'key_gap_insight' => '',
            'skill_breakdown' => [],
            'learning_steps' => [],
        ],
    ]);

    $session = AiCareerCoachingSession::create([
        'candidate_id' => $this->profile->id,
        'title' => 'Coaching',
        'status' => 'active',
    ]);

    $this->actingAs($this->candidate)
        ->post(route('candidate.career-coach.message'), [
            'session_id' => $session->id,
            'content' => 'Skill apa yang harus saya prioritaskan?',
        ])
        ->assertRedirect();

    $assistantReply = AiCareerCoachingMessage::query()
        ->where('session_id', $session->id)
        ->where('role', 'assistant')
        ->latest()
        ->first();

    expect($assistantReply)->not->toBeNull();
    expect($assistantReply->content)->toContain('AI strategy');
    expect($assistantReply->meta_json['quick_prompts'])->toBe([
        'Lihat skill prioritas',
        'Bandingkan dengan PM',
    ]);

    expect(AiAuditLog::query()->where('feature', 'candidate_career_coach_chat')->where('status', 'success')->exists())->toBeTrue();
});

test('career coach chat persists recommendation when AI generates a path', function () {
    Setting::set('ai_api_key', 'test-ai-key');

    fakeChatJsonResponse([
        'reply' => 'Aku rekomendasikan **Product Design Lead (Sistem AI)**.',
        'quick_prompts' => ['Lihat learning step pertama'],
        'should_generate_path' => true,
        'recommendation' => [
            'target_role' => 'Product Design Lead (Sistem AI)',
            'match_score' => 92,
            'summary' => 'Pengalaman UI/UX 6+ tahun cocok untuk peran ini.',
            'growth_potential' => '+24% YoY',
            'salary_range' => 'IDR 30 jt - 50 jt',
            'key_gap_insight' => 'Pemahaman LLM dan database vektor.',
            'skill_breakdown' => [
                ['name' => 'Strategi Produk', 'current_level' => 60, 'required_level' => 85, 'note' => 'Asah strategi.'],
            ],
            'learning_steps' => [
                ['title' => 'AI for Designers', 'description' => 'Kursus dasar AI untuk desainer.', 'tag' => 'Direkomendasikan AI'],
                ['title' => 'Kepemimpinan Produk 101', 'description' => 'Beralih dari kontributor ke leader.', 'tag' => 'Strategis'],
            ],
        ],
    ]);

    $session = AiCareerCoachingSession::create([
        'candidate_id' => $this->profile->id,
        'title' => 'Coaching',
        'status' => 'active',
    ]);

    $this->actingAs($this->candidate)
        ->post(route('candidate.career-coach.message'), [
            'session_id' => $session->id,
            'content' => 'Jalur karier apa yang harus saya ambil untuk peran AI?',
        ])
        ->assertRedirect();

    $recommendation = AiCareerRecommendation::query()
        ->where('candidate_id', $this->profile->id)
        ->where('is_primary', true)
        ->first();

    expect($recommendation)->not->toBeNull();
    expect($recommendation->target_role)->toBe('Product Design Lead (Sistem AI)');
    expect($recommendation->match_score)->toBe(92);
    expect($recommendation->coaching_session_id)->toBe($session->id);
    expect($recommendation->learningPathSteps()->count())->toBe(2);
});

test('career coach chat falls back when AI key missing', function () {
    Setting::set('ai_api_key', '');

    $session = AiCareerCoachingSession::create([
        'candidate_id' => $this->profile->id,
        'title' => 'Coaching',
        'status' => 'active',
    ]);

    $this->actingAs($this->candidate)
        ->post(route('candidate.career-coach.message'), [
            'session_id' => $session->id,
            'content' => 'Halo coach',
        ])
        ->assertRedirect();

    $assistantReply = AiCareerCoachingMessage::query()
        ->where('session_id', $session->id)
        ->where('role', 'assistant')
        ->latest()
        ->first();

    expect($assistantReply)->not->toBeNull();
    expect($assistantReply->content)->toContain('Lengkapi profil');
});

test('career coach chat exposes quick prompts in inertia props', function () {
    Setting::set('ai_api_key', 'test-ai-key');

    fakeChatJsonResponse([
        'reply' => 'Halo, saya **Pelatih CareerAI**.',
        'quick_prompts' => ['Lihat Wawasan Gaji', 'Bandingkan dengan peran PM'],
        'should_generate_path' => false,
        'recommendation' => [
            'target_role' => '',
            'match_score' => 0,
            'summary' => '',
            'growth_potential' => '',
            'salary_range' => '',
            'key_gap_insight' => '',
            'skill_breakdown' => [],
            'learning_steps' => [],
        ],
    ]);

    $session = AiCareerCoachingSession::create([
        'candidate_id' => $this->profile->id,
        'title' => 'Coaching',
        'status' => 'active',
    ]);

    $this->actingAs($this->candidate)
        ->post(route('candidate.career-coach.message'), [
            'session_id' => $session->id,
            'content' => 'Halo',
        ]);

    $response = $this->actingAs($this->candidate)
        ->get(route('candidate.career-coach.index'))
        ->assertOk();

    $response->assertInertia(fn ($page) => $page
        ->component('candidate/career-coach')
        ->where('quickPrompts', [
            'Lihat Wawasan Gaji',
            'Bandingkan dengan peran PM',
        ])
        ->where('aiEnabled', true)
        ->etc()
    );
});
