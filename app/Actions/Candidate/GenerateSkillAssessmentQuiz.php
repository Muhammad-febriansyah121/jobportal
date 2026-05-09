<?php

namespace App\Actions\Candidate;

use App\Models\Skill;
use App\Services\AiService;
use JsonException;

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

        $payload = $this->ai->chat([
            ['role' => 'system', 'content' => $this->systemPrompt()],
            ['role' => 'user', 'content' => json_encode([
                'skill' => $skill->name,
                'category' => $skill->category,
                'difficulty' => $difficulty,
                'count' => $count,
            ], JSON_THROW_ON_ERROR)],
        ], maxTokens: 1800, temperature: 0.4);

        if ($payload === null) {
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

    private function systemPrompt(): string
    {
        return <<<'PROMPT'
Kamu adalah AI yang membuat soal pilihan ganda (multiple choice) untuk
assessment skill profesional dalam Bahasa Indonesia.

WAJIB balas hanya JSON valid tanpa markdown, tanpa code fence, tanpa komentar.
Skema:
{
  "questions": [
    {
      "question": "kalimat pertanyaan singkat dan jelas",
      "options": ["opsi A", "opsi B", "opsi C", "opsi D"],
      "answer_index": 0
    }
  ]
}

Aturan:
- WAJIB 4 opsi per pertanyaan, opsi tidak boleh kosong.
- "answer_index" adalah indeks 0-3 dari opsi yang benar.
- Pertanyaan harus relevan dengan skill yang diminta dan sesuai level
  difficulty (easy = pemahaman dasar, medium = penerapan, hard = analisis /
  trade-off).
- Jangan menambah field di luar skema.
PROMPT;
    }
}
