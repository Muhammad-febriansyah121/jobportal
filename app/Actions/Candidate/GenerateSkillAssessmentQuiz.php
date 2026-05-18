<?php

namespace App\Actions\Candidate;

use App\Ai\Agents\SkillQuizGenerator;
use App\Models\Skill;
use App\Services\AiService;
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

        try {
            $response = (new SkillQuizGenerator)->prompt(json_encode([
                'skill' => $skill->name,
                'category' => $skill->category,
                'difficulty' => $difficulty,
                'count' => $count,
            ], JSON_THROW_ON_ERROR));
            $payload = $response->text;
        } catch (Throwable) {
            return [];
        }

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
