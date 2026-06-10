<?php

namespace App\Http\Controllers\Candidate;

use App\Actions\Candidate\BuildCandidateCvReview;
use App\Actions\Candidate\ResolveCandidateProfile;
use App\Ai\Agents\CareerCoach;
use App\Ai\Agents\CareerCoachReplyGenerator;
use App\Http\Controllers\Controller;
use App\Models\AiAuditLog;
use App\Models\AiCareerCoachingMessage;
use App\Models\AiCareerCoachingSession;
use App\Models\AiCareerRecommendation;
use App\Models\CandidateProfile;
use App\Services\AiService;
use Illuminate\Contracts\Support\Responsable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use JsonException;
use Laravel\Ai\Responses\StreamedAgentResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

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
            'aiEnabled' => $this->ai->isConfigured(),
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

    public function stream(Request $request, ResolveCandidateProfile $resolveCandidateProfile): StreamedResponse|Responsable
    {
        $data = $request->validate([
            'session_id' => ['nullable', 'integer', 'exists:ai_career_coaching_sessions,id'],
            'content' => ['required', 'string', 'max:5000'],
        ]);

        @set_time_limit(0);

        $userId = $request->user()->id;
        $candidate = $resolveCandidateProfile->handle($request->user());
        $session = filled($data['session_id'] ?? null)
            ? $candidate->careerCoachingSessions()->whereKey($data['session_id'])->firstOrFail()
            : $candidate->careerCoachingSessions()->create(['title' => 'Career coaching', 'status' => 'active']);

        $userContent = $data['content'];

        $session->messages()->create([
            'role' => 'user',
            'content' => $userContent,
        ]);

        $defaultPrompts = $this->defaultQuickPrompts();
        $fallbackReply = 'Saya catat. Lengkapi profil dan target peran agar rekomendasi karier berikutnya makin presisi.';

        if (! $this->ai->isConfigured()) {
            $session->messages()->create([
                'role' => 'assistant',
                'content' => $fallbackReply,
                'meta_json' => ['quick_prompts' => $defaultPrompts],
            ]);
            $session->touch();

            return response()->stream(function () use ($fallbackReply): void {
                echo 'data: '.json_encode(['type' => 'text_delta', 'delta' => $fallbackReply])."\n\n";
                echo "data: [DONE]\n\n";
            }, 200, [
                'Content-Type' => 'text/event-stream',
                'Cache-Control' => 'no-cache, no-store, must-revalidate',
                'X-Accel-Buffering' => 'no',
            ]);
        }

        $activeRecommendation = $this->resolveTargetRecommendation($candidate);
        $agent = new CareerCoach($candidate, $session, $activeRecommendation);
        $sessionId = $session->id;

        return $agent
            ->stream(
                $userContent,
                model: (string) config('services.openai.coach_model'),
                timeout: 120,
            )
            ->then(function (StreamedAgentResponse $response) use (
                $userId,
                $session,
                $sessionId,
                $userContent,
                $defaultPrompts,
                $fallbackReply,
                $candidate,
            ): void {
                $reply = trim((string) $response->text);

                $session->messages()->create([
                    'role' => 'assistant',
                    'content' => $reply !== '' ? $reply : $fallbackReply,
                    'meta_json' => ['quick_prompts' => $defaultPrompts],
                ]);
                $session->touch();

                try {
                    $context = $this->buildContext($candidate);
                    $inputHash = hash('sha256', json_encode([
                        'session_id' => $sessionId,
                        'message' => $userContent,
                    ], JSON_THROW_ON_ERROR));

                    AiAuditLog::create([
                        'user_id' => $userId,
                        'feature' => 'candidate_career_coach_chat',
                        'input_hash' => $inputHash,
                        'input_json' => ['context' => $context, 'message' => $userContent],
                        'output_json' => [
                            'reply' => $reply !== '' ? $reply : $fallbackReply,
                            'quick_prompts' => $defaultPrompts,
                        ],
                        'model_name' => (string) config('services.openai.coach_model'),
                        'status' => $reply !== '' ? 'success' : 'fallback',
                    ]);
                } catch (JsonException) {
                    // Audit log is best-effort.
                }
            });
    }

    /**
     * Generate/refresh the target recommendation for the latest chat turn.
     * Called separately from the chat stream so the conversation stays snappy
     * while the heavier path analysis runs behind a skeleton in the UI.
     */
    public function recommend(Request $request, ResolveCandidateProfile $resolveCandidateProfile): JsonResponse
    {
        $data = $request->validate([
            'session_id' => ['nullable', 'integer', 'exists:ai_career_coaching_sessions,id'],
            'content' => ['required', 'string', 'max:5000'],
        ]);

        @set_time_limit(0);

        $candidate = $resolveCandidateProfile->handle($request->user());
        $session = filled($data['session_id'] ?? null)
            ? $candidate->careerCoachingSessions()->whereKey($data['session_id'])->first()
            : $candidate->careerCoachingSessions()->latest()->first();

        if (! $session) {
            return response()->json(['persisted' => false]);
        }

        $recommendationId = $this->maybeGenerateRecommendation(
            $candidate,
            $session,
            $data['content'],
            $this->resolveTargetRecommendation($candidate),
        );

        return response()->json(['persisted' => $recommendationId !== null]);
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
        $apiKeyMissing = ! $this->ai->isConfigured();

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

        @set_time_limit(0);
        $output = null;

        try {
            $contextJson = json_encode($context, JSON_UNESCAPED_UNICODE);
            $response = (new CareerCoachReplyGenerator($session, $contextJson, $activeRecommendation))
                ->prompt($userContent, model: (string) config('services.openai.model'));
            if (isset($response->structured) && is_array($response->structured)) {
                $output = $response->structured;
            }
        } catch (\Throwable) {
            $output = null;
        }

        if (! is_array($output) || ! isset($output['reply'])) {
            AiAuditLog::create([
                'user_id' => $userId,
                'feature' => 'candidate_career_coach_chat',
                'input_hash' => $inputHash,
                'input_json' => ['context' => $context, 'history' => $history, 'message' => $userContent],
                'output_json' => ['reply' => $fallbackReply, 'quick_prompts' => $defaultPrompts],
                'model_name' => (string) (config('services.openai.model') ?: 'gpt-5'),
                'status' => 'fallback',
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
            'model_name' => (string) (config('services.openai.model') ?: 'gpt-5'),
            'status' => $reply !== '' ? 'success' : 'fallback',
        ]);

        return [
            'reply' => $reply !== '' ? $reply : $fallbackReply,
            'quick_prompts' => count($quickPrompts) > 0 ? $quickPrompts : $defaultPrompts,
            'recommendation_id' => $recommendationId,
            'recommendation_persisted' => $persisted,
        ];
    }

    /**
     * Decide from the chat turn whether a fresh career path/target should be
     * generated, and persist it so the recommendation panel reflects the chat.
     *
     * @param  array<string, mixed>|null  $activeRecommendation
     */
    private function maybeGenerateRecommendation(
        CandidateProfile $candidate,
        AiCareerCoachingSession $session,
        string $userContent,
        ?array $activeRecommendation,
    ): ?int {
        if (! $this->ai->isConfigured() || ! $this->chatMayWarrantRecommendation($userContent)) {
            return null;
        }

        $candidate->loadMissing(['skills', 'experiences', 'preferredIndustry']);

        try {
            $contextJson = json_encode($this->buildContext($candidate), JSON_UNESCAPED_UNICODE);
            $response = (new CareerCoachReplyGenerator($session, $contextJson, $activeRecommendation))
                ->prompt($userContent, model: (string) config('services.openai.model'));
            $output = isset($response->structured) && is_array($response->structured)
                ? $response->structured
                : null;
        } catch (\Throwable) {
            return null;
        }

        $shouldGenerate = is_array($output)
            && ! empty($output['should_generate_path'])
            && is_array($output['recommendation'] ?? null)
            && ! empty($output['recommendation']['target_role']);

        if (! $shouldGenerate) {
            return null;
        }

        return $this->persistRecommendation($candidate, $session, $output['recommendation']);
    }

    /**
     * Cheap keyword gate so general chit-chat never triggers the heavy
     * structured recommendation model.
     */
    private function chatMayWarrantRecommendation(string $content): bool
    {
        $keywords = [
            'jalur', 'karier', 'karir', 'target', 'peran', 'role', 'posisi',
            'skill', 'rekomendasi', 'gap', 'kesenjangan', 'path', 'roadmap',
            'transisi', 'pindah', 'beralih', 'arah', 'cocok', 'gaji',
        ];

        $haystack = mb_strtolower($content);

        foreach ($keywords as $keyword) {
            if (str_contains($haystack, $keyword)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Defensive scale fix: the model occasionally returns skill levels on a
     * 0-5 or 0-10 scale instead of 0-100, which renders as near-empty bars.
     * If the whole set sits at <=10, scale it up so the UI stays readable.
     *
     * @param  mixed  $skills
     * @return array<int, array<string, mixed>>
     */
    private function normalizeSkillLevels($skills): array
    {
        if (! is_array($skills)) {
            return [];
        }

        $skills = array_values(array_filter($skills, 'is_array'));
        if ($skills === []) {
            return [];
        }

        $maxLevel = 0;
        foreach ($skills as $skill) {
            $maxLevel = max($maxLevel, (int) ($skill['current_level'] ?? 0), (int) ($skill['required_level'] ?? 0));
        }

        $factor = match (true) {
            $maxLevel > 0 && $maxLevel <= 5 => 20,
            $maxLevel <= 10 => 10,
            default => 1,
        };

        if ($factor === 1) {
            return $skills;
        }

        return array_map(function (array $skill) use ($factor): array {
            foreach (['current_level', 'required_level'] as $key) {
                if (isset($skill[$key])) {
                    $skill[$key] = min(100, (int) $skill[$key] * $factor);
                }
            }

            return $skill;
        }, $skills);
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

        $payload['skill_breakdown'] = $this->normalizeSkillLevels($payload['skill_breakdown'] ?? null);

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
}
