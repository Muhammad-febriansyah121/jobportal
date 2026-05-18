<?php

namespace App\Ai\Agents;

use Laravel\Ai\Attributes\MaxTokens;
use Laravel\Ai\Attributes\Provider;
use Laravel\Ai\Attributes\Timeout;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Promptable;

#[Provider(Lab::OpenAI)]
#[Timeout(120)]
#[MaxTokens(1800)]
class SkillQuizGenerator implements Agent
{
    use Promptable;

    public function instructions(): string
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
