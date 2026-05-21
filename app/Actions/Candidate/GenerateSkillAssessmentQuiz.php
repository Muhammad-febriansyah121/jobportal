<?php

namespace App\Actions\Candidate;

use App\Ai\Agents\SkillQuizGenerator;
use App\Models\AiAuditLog;
use App\Models\Skill;
use App\Services\AiService;
use Illuminate\Support\Facades\Auth;
use JsonException;
use Throwable;

class GenerateSkillAssessmentQuiz
{
    public function __construct(private readonly AiService $ai) {}

    /**
     * Generate quiz questions for the given skill via AI.
     *
     * @return array<int, array{question: string, options: array<int, string>, answer_index: int}>
     */
    public function handle(Skill $skill, int $count, string $difficulty): array
    {
        $count = max(1, min(20, $count));
        $difficulty = in_array($difficulty, ['easy', 'medium', 'hard'], true) ? $difficulty : 'medium';

        if (! $this->ai->isConfigured()) {
            return [];
        }

        @set_time_limit(0);
        $payload = null;
        $usage = null;
        $promptInput = [
            'skill' => $skill->name,
            'category' => $skill->category,
            'difficulty' => $difficulty,
            'count' => $count,
        ];
        $inputHash = hash('sha256', json_encode($promptInput));

        try {
            $response = (new SkillQuizGenerator)->prompt(json_encode($promptInput, JSON_THROW_ON_ERROR));
            $payload = $response->text;
            $usage = property_exists($response, 'usage') ? $response->usage : null;
        } catch (Throwable $exception) {
            AiAuditLog::create([
                'user_id' => Auth::id(),
                'feature' => 'admin.skill_quiz_generator',
                'input_hash' => $inputHash,
                'input_json' => $promptInput,
                'output_json' => ['error' => $exception->getMessage()],
                'model_name' => 'gpt-5',
                'status' => 'failed',
            ]);

            return [];
        }

        AiAuditLog::create([
            'user_id' => Auth::id(),
            'feature' => 'admin.skill_quiz_generator',
            'input_hash' => $inputHash,
            'input_json' => $promptInput,
            'output_json' => ['text_length' => mb_strlen((string) $payload), 'preview' => mb_substr((string) $payload, 0, 500)],
            'model_name' => 'gpt-5',
            'prompt_tokens' => (int) ($usage?->inputTokens ?? 0),
            'completion_tokens' => (int) ($usage?->outputTokens ?? 0),
            'reasoning_tokens' => (int) ($usage?->reasoningTokens ?? 0),
            'total_tokens' => (int) (($usage?->inputTokens ?? 0) + ($usage?->outputTokens ?? 0)),
            'status' => $payload !== null && $payload !== '' ? 'success' : 'failed',
        ]);

        if ($payload === null || $payload === '') {
            return [];
        }

        try {
            $decoded = json_decode($payload, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            return [];
        }

        $questions = is_array($decoded['questions'] ?? null) ? $decoded['questions'] : [];

        return collect($questions)
            ->filter(fn ($item): bool => is_array($item))
            ->map(function (array $item): array {
                $options = collect($item['options'] ?? [])
                    ->filter(fn ($value): bool => is_string($value) && $value !== '')
                    ->take(4)
                    ->values()
                    ->all();
                $answerIndex = (int) ($item['answer_index'] ?? 0);

                return [
                    'question' => trim((string) ($item['question'] ?? '')),
                    'options' => $options,
                    'answer_index' => max(0, min(count($options) - 1, $answerIndex)),
                ];
            })
            ->filter(fn (array $item): bool => $item['question'] !== '' && count($item['options']) >= 2)
            ->take($count)
            ->values()
            ->all();
    }
}
