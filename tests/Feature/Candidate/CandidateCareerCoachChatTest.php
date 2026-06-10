<?php

use App\Ai\Agents\CareerCoachReplyGenerator;
use App\Models\AiAuditLog;
use App\Models\AiCareerCoachingMessage;
use App\Models\AiCareerCoachingSession;
use App\Models\AiCareerRecommendation;
use App\Models\CandidateProfile;
use App\Models\Setting;
use App\Models\User;

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
    config()->set('services.openai.api_key', 'test-ai-key');
    CareerCoachReplyGenerator::fake([$payload]);
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

test('career coach stream returns SSE fallback when AI key missing', function () {
    Setting::set('ai_api_key', '');
    config()->set('services.openai.api_key', null);

    $session = AiCareerCoachingSession::create([
        'candidate_id' => $this->profile->id,
        'title' => 'Coaching',
        'status' => 'active',
    ]);

    $response = $this->actingAs($this->candidate)
        ->post(route('candidate.career-coach.stream'), [
            'session_id' => $session->id,
            'content' => 'Halo coach',
        ]);

    $response->assertOk();
    expect($response->headers->get('Content-Type'))->toContain('text/event-stream');

    $body = $response->streamedContent();
    expect($body)->toContain('text_delta');
    expect($body)->toContain('[DONE]');

    $userMessage = AiCareerCoachingMessage::query()
        ->where('session_id', $session->id)
        ->where('role', 'user')
        ->first();
    expect($userMessage)->not->toBeNull();
    expect($userMessage->content)->toBe('Halo coach');

    $assistantReply = AiCareerCoachingMessage::query()
        ->where('session_id', $session->id)
        ->where('role', 'assistant')
        ->first();
    expect($assistantReply)->not->toBeNull();
    expect($assistantReply->content)->toContain('Lengkapi profil');
    expect($assistantReply->meta_json['quick_prompts'])->toBeArray()->not->toBeEmpty();
});

test('career coach recommend endpoint persists target recommendation when chat asks for a path', function () {
    Setting::set('ai_api_key', 'test-ai-key');
    config()->set('services.openai.api_key', 'test-ai-key');

    CareerCoachReplyGenerator::fake([[
        'reply' => 'Jalur yang paling realistis: **Junior Event & Portrait Photographer**.',
        'quick_prompts' => ['Lihat learning step pertama'],
        'should_generate_path' => true,
        'recommendation' => [
            'target_role' => 'Junior Event & Portrait Photographer (On-site)',
            'match_score' => 28,
            'summary' => 'Disiplin operasional dari pengalaman IT Support relevan.',
            'growth_potential' => '+12% YoY',
            'salary_range' => 'IDR 4.500.000 - 8.500.000/bulan',
            'key_gap_insight' => 'Belum ada portofolio fotografi tervalidasi.',
            'skill_breakdown' => [
                ['name' => 'Komposisi & Teknik Fotografi', 'current_level' => 18, 'required_level' => 70, 'note' => 'Bangun portofolio.'],
            ],
            'learning_steps' => [
                ['title' => 'Dasar Fotografi Event', 'description' => 'Kuasai teknik dasar.', 'tag' => 'Direkomendasikan AI'],
            ],
        ],
    ]]);

    $session = AiCareerCoachingSession::create([
        'candidate_id' => $this->profile->id,
        'title' => 'Coaching',
        'status' => 'active',
    ]);

    $this->actingAs($this->candidate)
        ->postJson(route('candidate.career-coach.recommend'), [
            'session_id' => $session->id,
            'content' => 'Jalur karier apa yang cocok untuk saya?',
        ])
        ->assertOk()
        ->assertJson(['persisted' => true]);

    $recommendation = AiCareerRecommendation::query()
        ->where('candidate_id', $this->profile->id)
        ->where('is_primary', true)
        ->first();

    expect($recommendation)->not->toBeNull();
    expect($recommendation->target_role)->toBe('Junior Event & Portrait Photographer (On-site)');
    expect($recommendation->match_score)->toBe(28);
    expect($recommendation->coaching_session_id)->toBe($session->id);
    expect($recommendation->learningPathSteps()->count())->toBe(1);
});

test('career coach recommend normalizes skill levels returned on a small scale', function () {
    Setting::set('ai_api_key', 'test-ai-key');
    config()->set('services.openai.api_key', 'test-ai-key');

    CareerCoachReplyGenerator::fake([[
        'reply' => 'Target kamu Data Lead.',
        'quick_prompts' => ['Lihat estimasi gaji'],
        'should_generate_path' => true,
        'recommendation' => [
            'target_role' => 'Data Lead',
            'match_score' => 70,
            'summary' => 'Cocok dengan pengalaman data.',
            'growth_potential' => 'Naik ~15% tiap tahun',
            'salary_range' => 'IDR 20-40 juta/bulan',
            'key_gap_insight' => 'Perlu pengalaman memimpin tim.',
            'skill_breakdown' => [
                ['name' => 'SQL', 'current_level' => 2, 'required_level' => 4, 'note' => 'n'],
                ['name' => 'Machine Learning', 'current_level' => 1, 'required_level' => 5, 'note' => 'n'],
            ],
            'learning_steps' => [
                ['title' => 'Pimpin proyek data', 'description' => 'd', 'tag' => 'Strategis'],
            ],
        ],
    ]]);

    $session = AiCareerCoachingSession::create([
        'candidate_id' => $this->profile->id,
        'title' => 'Coaching',
        'status' => 'active',
    ]);

    $this->actingAs($this->candidate)
        ->postJson(route('candidate.career-coach.recommend'), [
            'session_id' => $session->id,
            'content' => 'Buatkan jalur karier dengan analisis kesenjangan skill.',
        ])
        ->assertOk()
        ->assertJson(['persisted' => true]);

    $skills = AiCareerRecommendation::query()
        ->where('candidate_id', $this->profile->id)
        ->latest()
        ->first()
        ->recommendation_json['skill_breakdown'];

    // Whole set sat at <=5, so it is scaled up by 20 to a readable 0-100 range.
    expect($skills[0]['current_level'])->toBe(40);
    expect($skills[0]['required_level'])->toBe(80);
    expect($skills[1]['current_level'])->toBe(20);
    expect($skills[1]['required_level'])->toBe(100);
});

test('career coach recommend endpoint skips recommendation model for general chit-chat', function () {
    Setting::set('ai_api_key', 'test-ai-key');
    config()->set('services.openai.api_key', 'test-ai-key');

    CareerCoachReplyGenerator::fake([])->preventStrayPrompts();

    $session = AiCareerCoachingSession::create([
        'candidate_id' => $this->profile->id,
        'title' => 'Coaching',
        'status' => 'active',
    ]);

    $this->actingAs($this->candidate)
        ->postJson(route('candidate.career-coach.recommend'), [
            'session_id' => $session->id,
            'content' => 'Halo, apa kabar?',
        ])
        ->assertOk()
        ->assertJson(['persisted' => false]);

    expect(AiCareerRecommendation::query()->where('candidate_id', $this->profile->id)->exists())->toBeFalse();
});

test('career coach stream validates content', function () {
    $session = AiCareerCoachingSession::create([
        'candidate_id' => $this->profile->id,
        'title' => 'Coaching',
        'status' => 'active',
    ]);

    $this->actingAs($this->candidate)
        ->post(route('candidate.career-coach.stream'), [
            'session_id' => $session->id,
            'content' => '',
        ])
        ->assertSessionHasErrors('content');
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
