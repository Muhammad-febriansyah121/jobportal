<?php

namespace App\Http\Controllers\Candidate;

use App\Actions\Candidate\BuildCandidateCvReview;
use App\Actions\Candidate\ResolveCandidateProfile;
use App\Http\Controllers\Controller;
use App\Models\AiAuditLog;
use App\Models\AiCareerCoachingMessage;
use App\Models\AiCareerCoachingSession;
use App\Models\AiCareerRecommendation;
use App\Models\CandidateProfile;
use App\Models\Setting;
use App\Services\AiService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use JsonException;

class CandidateCareerCoachController extends Controller
{
    private const HISTORY_LIMIT = 12;

    public function __construct(private readonly AiService $ai) {}

    public function index(
        Request $request,
        ResolveCandidateProfile $resolveCandidateProfile,
        BuildCandidateCvReview $buildCandidateCvReview,
    ): Response {
        $candidate = $resolveCandidateProfile->handle($request->user());
        $activeSession = $candidate->careerCoachingSessions()
            ->with('messages')
            ->latest()
            ->first();

        $latestQuickPrompts = $this->resolveLatestQuickPrompts($activeSession);
        $cvReview = $buildCandidateCvReview->handle($candidate);

        return Inertia::render('candidate/career-coach', [
            'sessions' => $candidate->careerCoachingSessions()
                ->latest()
                ->get()
                ->map(fn (AiCareerCoachingSession $session): array => [
                    'id' => $session->id,
                    'title' => $session->title,
                    'status' => $session->status,
                    'updated_at' => $session->updated_at?->diffForHumans(),
                ]),
            'activeSession' => $activeSession ? [
                'id' => $activeSession->id,
                'title' => $activeSession->title,
                'status' => $activeSession->status,
                'messages' => $activeSession->messages
                    ->map(fn (AiCareerCoachingMessage $message): array => [
                        'id' => $message->id,
                        'role' => $message->role,
                        'content' => $message->content,
                        'created_at' => $message->created_at?->format('d M Y H:i'),
                    ]),
            ] : null,
            'recommendations' => $candidate->careerCoachingSessions()->exists()
                ? AiCareerRecommendation::query()
                    ->where('candidate_id', $candidate->id)
                    ->latest()
                    ->limit(6)
                    ->get()
                    ->map(fn (AiCareerRecommendation $recommendation): array => [
                        'id' => $recommendation->id,
                        'title' => $recommendation->title,
                        'match_score' => $recommendation->match_score,
                        'recommendation' => $recommendation->recommendation_json,
                    ])
                : [],
            'targetRecommendation' => $this->resolveTargetRecommendation($candidate),
            'quickPrompts' => $latestQuickPrompts,
            'aiEnabled' => filled(Setting::get('ai_api_key')),
            'cvReview' => $cvReview,
        ]);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function resolveTargetRecommendation(CandidateProfile $candidate): ?array
    {
        $recommendation = AiCareerRecommendation::query()
            ->where('candidate_id', $candidate->id)
            ->orderByDesc('is_primary')
            ->orderByDesc('match_score')
            ->latest()
            ->first();

        if (! $recommendation) {
            return null;
        }

        $data = is_array($recommendation->recommendation_json) ? $recommendation->recommendation_json : [];

        return [
            'id' => $recommendation->id,
            'title' => $recommendation->title,
            'target_role' => $recommendation->target_role ?? ($data['target_role'] ?? $recommendation->title),
            'match_score' => $recommendation->match_score,
            'summary' => $data['summary'] ?? null,
            'growth_potential' => $data['growth_potential'] ?? null,
            'salary_range' => $data['salary_range'] ?? null,
            'key_gap_insight' => $data['key_gap_insight'] ?? null,
            'skill_breakdown' => is_array($data['skill_breakdown'] ?? null)
                ? array_values($data['skill_breakdown'])
                : [],
            'learning_steps' => is_array($data['learning_steps'] ?? null)
                ? array_values($data['learning_steps'])
                : [],
        ];
    }

    /**
     * @return array<int, string>
     */
    private function resolveLatestQuickPrompts(?AiCareerCoachingSession $session): array
    {
        if (! $session) {
            return $this->defaultQuickPrompts();
        }

        $latestAssistant = $session->messages
            ->where('role', 'assistant')
            ->sortByDesc('id')
            ->first();

        $prompts = $latestAssistant?->meta_json['quick_prompts'] ?? null;

        if (is_array($prompts) && count($prompts) > 0) {
            return array_values(array_filter(array_map(
                fn ($p) => is_string($p) ? trim($p) : '',
                $prompts,
            )));
        }

        return $this->defaultQuickPrompts();
    }

    /**
     * @return array<int, string>
     */
    private function defaultQuickPrompts(): array
    {
        return [
            'Jalur karier apa yang harus saya ambil untuk peran AI Product Lead?',
            'Apa skill paling kritikal yang perlu saya kuasai 3 bulan ke depan?',
            'Bandingkan peran Senior Designer vs Product Manager untuk profilku.',
        ];
    }

    public function start(Request $request, ResolveCandidateProfile $resolveCandidateProfile): RedirectResponse
    {
        $data = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
        ]);

        $candidate = $resolveCandidateProfile->handle($request->user());
        $session = $candidate->careerCoachingSessions()->create([
            'title' => $data['title'] ?? 'Career coaching',
            'status' => 'active',
        ]);

        $session->messages()->create([
            'role' => 'assistant',
            'content' => 'Mulai dari target peran, skill yang ingin kamu kuatkan, atau lowongan yang sedang kamu incar.',
            'meta_json' => ['quick_prompts' => $this->defaultQuickPrompts()],
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Sesi career coach dimulai.']);

        return back();
    }

    public function message(Request $request, ResolveCandidateProfile $resolveCandidateProfile): RedirectResponse
    {
        $data = $request->validate([
            'session_id' => ['nullable', 'integer', 'exists:ai_career_coaching_sessions,id'],
            'content' => ['required', 'string', 'max:5000'],
        ]);

        $candidate = $resolveCandidateProfile->handle($request->user());
        $session = filled($data['session_id'] ?? null)
            ? $candidate->careerCoachingSessions()->whereKey($data['session_id'])->firstOrFail()
            : $candidate->careerCoachingSessions()->create(['title' => 'Career coaching', 'status' => 'active']);

        $session->messages()->create([
            'role' => 'user',
            'content' => $data['content'],
        ]);

        $aiResult = $this->generateAssistantResponse($request->user()->id, $candidate, $session, $data['content']);

        $session->messages()->create([
            'role' => 'assistant',
            'content' => $aiResult['reply'],
            'meta_json' => [
                'quick_prompts' => $aiResult['quick_prompts'] ?? null,
                'recommendation_id' => $aiResult['recommendation_id'] ?? null,
            ],
        ]);

        $session->touch();

        if (! empty($aiResult['recommendation_persisted'])) {
            Inertia::flash('toast', [
                'type' => 'success',
                'message' => 'Rekomendasi target diperbarui oleh AI.',
            ]);
        }

        return back();
    }

    /**
     * @return array{reply: string, quick_prompts: array<int, string>, recommendation_id: ?int, recommendation_persisted: bool}
     */
    private function generateAssistantResponse(
        int $userId,
        CandidateProfile $candidate,
        AiCareerCoachingSession $session,
        string $userContent
    ): array {
        $fallbackReply = 'Saya catat. Lengkapi profil dan target peran agar rekomendasi karier berikutnya makin presisi.';
        $defaultPrompts = $this->defaultQuickPrompts();
        $apiKeyMissing = ! filled(Setting::get('ai_api_key'));

        $candidate->loadMissing(['skills', 'experiences', 'preferredIndustry']);
        $context = $this->buildContext($candidate);

        if ($apiKeyMissing) {
            return [
                'reply' => $fallbackReply,
                'quick_prompts' => $defaultPrompts,
                'recommendation_id' => null,
                'recommendation_persisted' => false,
            ];
        }

        $history = $session->messages()
            ->orderBy('id')
            ->get(['role', 'content'])
            ->map(fn (AiCareerCoachingMessage $message): array => [
                'role' => $message->role === 'user' ? 'user' : 'assistant',
                'content' => $message->content,
            ])
            ->take(-self::HISTORY_LIMIT)
            ->values()
            ->all();

        $activeRecommendation = $this->resolveTargetRecommendation($candidate);

        $messages = [
            ['role' => 'system', 'content' => $this->systemPrompt()],
            ['role' => 'system', 'content' => 'Profil kandidat: '.json_encode($context, JSON_UNESCAPED_UNICODE)],
        ];

        if ($activeRecommendation) {
            $messages[] = [
                'role' => 'system',
                'content' => 'Rekomendasi target aktif: '.json_encode([
                    'target_role' => $activeRecommendation['target_role'],
                    'match_score' => $activeRecommendation['match_score'],
                    'key_gap_insight' => $activeRecommendation['key_gap_insight'],
                ], JSON_UNESCAPED_UNICODE),
            ];
        }

        $messages = array_merge($messages, $history);

        try {
            $inputHash = hash('sha256', json_encode([
                'context' => $context,
                'history' => $history,
                'message' => $userContent,
                'active_recommendation_id' => $activeRecommendation['id'] ?? null,
            ], JSON_THROW_ON_ERROR));
        } catch (JsonException) {
            return [
                'reply' => $fallbackReply,
                'quick_prompts' => $defaultPrompts,
                'recommendation_id' => null,
                'recommendation_persisted' => false,
            ];
        }

        $cached = AiAuditLog::query()
            ->where('user_id', $userId)
            ->where('feature', 'candidate_career_coach_chat')
            ->where('input_hash', $inputHash)
            ->where('status', 'success')
            ->latest()
            ->first();

        if (is_array($cached?->output_json) && is_string($cached->output_json['reply'] ?? null)) {
            return [
                'reply' => $cached->output_json['reply'],
                'quick_prompts' => is_array($cached->output_json['quick_prompts'] ?? null)
                    ? $cached->output_json['quick_prompts']
                    : $defaultPrompts,
                'recommendation_id' => null,
                'recommendation_persisted' => false,
            ];
        }

        $output = $this->ai->chatJson(
            messages: $messages,
            schema: $this->messageSchema(),
            schemaName: 'career_coach_message',
            maxTokens: 1800,
        );

        if (! is_array($output) || ! isset($output['reply'])) {
            AiAuditLog::create([
                'user_id' => $userId,
                'feature' => 'candidate_career_coach_chat',
                'input_hash' => $inputHash,
                'input_json' => ['context' => $context, 'history' => $history, 'message' => $userContent],
                'output_json' => ['reply' => $fallbackReply, 'quick_prompts' => $defaultPrompts],
                'model_name' => $this->ai->modelName(),
                'status' => 'fallback',
                ...$this->ai->tokenUsage(),
            ]);

            return [
                'reply' => $fallbackReply,
                'quick_prompts' => $defaultPrompts,
                'recommendation_id' => null,
                'recommendation_persisted' => false,
            ];
        }

        $reply = trim((string) $output['reply']);
        $quickPrompts = is_array($output['quick_prompts'] ?? null)
            ? array_values(array_filter(array_map(
                fn ($p) => is_string($p) ? trim($p) : '',
                $output['quick_prompts'],
            )))
            : $defaultPrompts;

        $shouldGenerate = ! empty($output['should_generate_path'])
            && is_array($output['recommendation'] ?? null)
            && ! empty($output['recommendation']['target_role']);

        $recommendationId = null;
        $persisted = false;

        if ($shouldGenerate) {
            $recommendationId = $this->persistRecommendation(
                $candidate,
                $session,
                $output['recommendation']
            );
            $persisted = $recommendationId !== null;
        }

        AiAuditLog::create([
            'user_id' => $userId,
            'feature' => 'candidate_career_coach_chat',
            'input_hash' => $inputHash,
            'input_json' => ['context' => $context, 'history' => $history, 'message' => $userContent],
            'output_json' => [
                'reply' => $reply !== '' ? $reply : $fallbackReply,
                'quick_prompts' => $quickPrompts,
                'recommendation_id' => $recommendationId,
            ],
            'model_name' => $this->ai->modelName(),
            'status' => $reply !== '' ? 'success' : 'fallback',
            ...$this->ai->tokenUsage(),
        ]);

        return [
            'reply' => $reply !== '' ? $reply : $fallbackReply,
            'quick_prompts' => count($quickPrompts) > 0 ? $quickPrompts : $defaultPrompts,
            'recommendation_id' => $recommendationId,
            'recommendation_persisted' => $persisted,
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function persistRecommendation(
        CandidateProfile $candidate,
        AiCareerCoachingSession $session,
        array $payload
    ): ?int {
        $targetRole = trim((string) ($payload['target_role'] ?? ''));
        if ($targetRole === '') {
            return null;
        }

        return DB::transaction(function () use ($candidate, $session, $payload, $targetRole): int {
            AiCareerRecommendation::query()
                ->where('candidate_id', $candidate->id)
                ->update(['is_primary' => false]);

            $recommendation = AiCareerRecommendation::create([
                'candidate_id' => $candidate->id,
                'coaching_session_id' => $session->id,
                'title' => $targetRole,
                'target_role' => $targetRole,
                'match_score' => isset($payload['match_score']) ? (int) $payload['match_score'] : null,
                'is_primary' => true,
                'recommendation_json' => $payload,
            ]);

            $steps = is_array($payload['learning_steps'] ?? null) ? $payload['learning_steps'] : [];
            foreach ($steps as $index => $step) {
                if (! is_array($step)) {
                    continue;
                }

                $recommendation->learningPathSteps()->create([
                    'title' => (string) ($step['title'] ?? 'Langkah pembelajaran'),
                    'description' => isset($step['description']) ? (string) $step['description'] : null,
                    'order_number' => $index + 1,
                    'status' => 'not_started',
                ]);
            }

            return $recommendation->id;
        });
    }

    /**
     * @return array<string, mixed>
     */
    private function buildContext(CandidateProfile $candidate): array
    {
        return [
            'candidate' => [
                'name' => $candidate->full_name,
                'headline' => $candidate->headline,
                'preferred_role' => $candidate->preferred_role,
                'preferred_industry' => $candidate->preferredIndustry?->name,
                'top_skills' => $candidate->skills
                    ->take(8)
                    ->map(fn ($skill) => [
                        'name' => $skill->name,
                        'proficiency' => $skill->pivot->proficiency,
                        'years_exp' => $skill->pivot->years_exp,
                    ])
                    ->values()
                    ->all(),
                'experiences' => $candidate->experiences
                    ->take(5)
                    ->map(fn ($exp) => [
                        'job_title' => $exp->job_title,
                        'company' => $exp->company_name,
                    ])
                    ->values()
                    ->all(),
            ],
        ];
    }

    private function systemPrompt(): string
    {
        return <<<'PROMPT'
Kamu adalah pelatih karier AI di platform Karivia. Selalu balas dalam Bahasa Indonesia yang ringkas, hangat, dan actionable.

Aturan output JSON yang HARUS kamu patuhi:
- "reply": balasan singkat 3-6 kalimat. Kamu boleh memakai sintaks markdown ringan (**bold**) untuk menonjolkan nama peran, skill, atau frasa penting. Sebut profil kandidat secara spesifik (mis. peran, skill, industri) bila relevan.
- "quick_prompts": berikan 2-4 lanjutan pertanyaan/aksi yang relevan dan singkat dalam Bahasa Indonesia (maks 60 karakter per item) — misal "Lihat Wawasan Gaji", "Bandingkan dengan peran PM".
- "should_generate_path": true HANYA jika user secara eksplisit/menentukan minta peta jalur karier, target peran baru, atau analisis kesenjangan skill terstruktur. Jika user hanya bertanya umum, set false.
- "recommendation": isi field-nya HANYA jika should_generate_path=true. target_role wajib spesifik (mis. "Product Design Lead (Sistem AI)"). match_score 0-100 berbasis profil. summary 2-3 kalimat menjelaskan rasional. growth_potential ringkas (mis. "+24% YoY"). salary_range realistis dalam IDR atau USD. key_gap_insight sorot 1 kesenjangan paling kritis. skill_breakdown 3-5 skill dengan current_level & required_level (0-100). learning_steps 3 langkah dengan title, description singkat, dan tag pendek (mis. "Direkomendasikan AI", "Strategis", "Dampak Tinggi").

Selalu balas dalam Bahasa Indonesia. Jangan berhalusinasi data nominal/perusahaan; bila tidak yakin, tetap berikan gambaran umum dan sarankan verifikasi.
PROMPT;
    }

    /**
     * @return array<string, mixed>
     */
    private function messageSchema(): array
    {
        return [
            'type' => 'object',
            'additionalProperties' => false,
            'required' => ['reply', 'quick_prompts', 'should_generate_path', 'recommendation'],
            'properties' => [
                'reply' => ['type' => 'string'],
                'quick_prompts' => [
                    'type' => 'array',
                    'items' => ['type' => 'string'],
                ],
                'should_generate_path' => ['type' => 'boolean'],
                'recommendation' => [
                    'type' => 'object',
                    'additionalProperties' => false,
                    'required' => [
                        'target_role',
                        'match_score',
                        'summary',
                        'growth_potential',
                        'salary_range',
                        'key_gap_insight',
                        'skill_breakdown',
                        'learning_steps',
                    ],
                    'properties' => [
                        'target_role' => ['type' => 'string'],
                        'match_score' => ['type' => 'integer', 'minimum' => 0, 'maximum' => 100],
                        'summary' => ['type' => 'string'],
                        'growth_potential' => ['type' => 'string'],
                        'salary_range' => ['type' => 'string'],
                        'key_gap_insight' => ['type' => 'string'],
                        'skill_breakdown' => [
                            'type' => 'array',
                            'items' => [
                                'type' => 'object',
                                'additionalProperties' => false,
                                'required' => ['name', 'current_level', 'required_level', 'note'],
                                'properties' => [
                                    'name' => ['type' => 'string'],
                                    'current_level' => ['type' => 'integer', 'minimum' => 0, 'maximum' => 100],
                                    'required_level' => ['type' => 'integer', 'minimum' => 0, 'maximum' => 100],
                                    'note' => ['type' => 'string'],
                                ],
                            ],
                        ],
                        'learning_steps' => [
                            'type' => 'array',
                            'items' => [
                                'type' => 'object',
                                'additionalProperties' => false,
                                'required' => ['title', 'description', 'tag'],
                                'properties' => [
                                    'title' => ['type' => 'string'],
                                    'description' => ['type' => 'string'],
                                    'tag' => ['type' => 'string'],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];
    }
}
