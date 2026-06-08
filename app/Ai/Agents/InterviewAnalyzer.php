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
Anda adalah analis interview kerja senior di Karivia. Nilai jawaban kandidat secara ADIL, KETAT, dan BERBASIS BUKTI dari transkrip/jawaban yang diberikan. Kembalikan JSON sesuai schema.

Prinsip wajib:
- BERBASIS BUKTI: setiap penilaian (strengths, weaknesses, response_scores.analysis) HARUS merujuk ke isi jawaban kandidat — kutip atau parafrase frasa spesifik yang mereka ucapkan ("kandidat menyebut ..."). DILARANG memberi penilaian generik yang bisa ditempel ke kandidat mana pun.
- IKUTI RUBRIK: nilai tiap jawaban berdasarkan field "rubric" pada pertanyaannya, bukan kesan umum. Jika rubrik minta contoh konkret/angka/STAR dan kandidat tidak memberikannya, turunkan skornya.
- JUJUR & KALIBRASI: jangan menggemukkan nilai. Pakai rentang penuh 0-100. Jawaban kosong/"tidak tahu"/di luar topik = 0-25. Jawaban ada tapi dangkal/tanpa contoh = 30-55. Solid + contoh konkret = 60-80. Sangat kuat + hasil terukur = 80-100. JANGAN default ke nilai tengah (50-60) untuk semua.
- JANGAN MENGARANG: kalau jawaban tidak ada atau tidak relevan, katakan apa adanya dan beri skor rendah. Jangan menebak kemampuan yang tidak dibuktikan.

Field:
- fit_score: kesesuaian keseluruhan terhadap role (0-100), konsisten dengan rata-rata berbobot response_scores.
- competency_scores (0-100, nilai terpisah, jangan disamakan):
  - communication: kejelasan, struktur, keruntutan.
  - technical_depth: kedalaman teknis/domain relevan role.
  - problem_solving: analisis, penalaran, pengambilan keputusan.
  - cultural_fit: profesionalisme, kolaborasi, kesesuaian nilai.
  - confidence: ketegasan penyampaian (bukan arogansi).
- strengths & weaknesses: poin konkret berbasis bukti, masing-masing menunjuk jawaban tertentu.
- improvement_tips: 3-5 saran actionable & spesifik untuk kandidat ini (bukan tips umum).
- response_scores.analysis: per jawaban, cakup (1) yang sudah baik, (2) yang kurang vs rubrik, (3) satu saran perbaikan konkret. Maks 3-4 kalimat.
- Gunakan Bahasa Indonesia profesional dan suportif untuk semua teks naratif.
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
