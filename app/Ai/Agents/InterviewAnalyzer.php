<?php

namespace App\Ai\Agents;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Attributes\MaxTokens;
use Laravel\Ai\Attributes\Provider;
use Laravel\Ai\Attributes\Timeout;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\HasProviderOptions;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Promptable;

#[Provider(Lab::OpenAI)]
#[Timeout(180)]
#[MaxTokens(4000)]
class InterviewAnalyzer implements Agent, HasProviderOptions, HasStructuredOutput
{
    use Promptable;

    public function instructions(): string
    {
        return <<<'PROMPT'
Anda adalah analis interview kerja senior di Karivia. Nilai jawaban kandidat secara adil, berbasis bukti dari jawaban yang diberikan, dan kembalikan JSON sesuai schema.

Pedoman penilaian:
- fit_score: kesesuaian kandidat secara keseluruhan terhadap role (0-100).
- competency_scores: nilai 5 kompetensi inti secara terpisah (0-100):
  - communication: kejelasan, struktur, dan keruntutan jawaban.
  - technical_depth: kedalaman pengetahuan teknis/domain relevan dengan role.
  - problem_solving: kemampuan analisis, penalaran, dan pengambilan keputusan.
  - cultural_fit: sikap profesional, kolaborasi, dan kesesuaian nilai kerja.
  - confidence: ketegasan dan keyakinan penyampaian (bukan arogansi).
- strengths & weaknesses: poin konkret berbasis kutipan/isi jawaban, bukan generik.
- improvement_tips: 3-5 saran actionable dan spesifik agar kandidat bisa memperbaiki performa di interview berikutnya.
- response_scores.analysis: untuk tiap jawaban, tulis evaluasi yang mencakup (1) apa yang sudah baik, (2) apa yang kurang, dan (3) satu saran perbaikan konkret. Maksimal 3-4 kalimat.
- Jika kandidat tidak menjawab atau jawaban kosong/tidak relevan, beri skor rendah dan jelaskan alasannya. JANGAN mengarang jawaban yang tidak ada.
- Gunakan Bahasa Indonesia yang profesional dan suportif untuk semua teks naratif.
PROMPT;
    }

    public function providerOptions(Lab|string $provider): array
    {
        return match ($provider) {
            Lab::OpenAI => ['reasoning' => ['effort' => 'high']],
            default => [],
        };
    }

    /**
     * @return array<string, mixed>
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'fit_score' => $schema->integer()->min(0)->max(100)->required(),
            'recommendation' => $schema->string()->required(),
            'summary' => $schema->string()->required(),
            'strengths' => $schema->array()->items($schema->string())->required(),
            'weaknesses' => $schema->array()->items($schema->string())->required(),
            'technical_scorecard' => $schema->array()
                ->items(
                    $schema->object(fn ($s) => [
                        'label' => $s->string()->required(),
                        'score' => $s->integer()->min(0)->max(100)->required(),
                    ])
                )
                ->required(),
            'competency_scores' => $schema->object(fn ($s) => [
                'communication' => $s->integer()->min(0)->max(100)->required(),
                'technical_depth' => $s->integer()->min(0)->max(100)->required(),
                'problem_solving' => $s->integer()->min(0)->max(100)->required(),
                'cultural_fit' => $s->integer()->min(0)->max(100)->required(),
                'confidence' => $s->integer()->min(0)->max(100)->required(),
            ])->required(),
            'improvement_tips' => $schema->array()->items($schema->string())->required(),
            'response_scores' => $schema->array()
                ->items(
                    $schema->object(fn ($s) => [
                        'question_id' => $s->integer()->required(),
                        'score' => $s->integer()->min(0)->max(100)->required(),
                        'analysis' => $s->string()->required(),
                    ])
                )
                ->required(),
        ];
    }
}
