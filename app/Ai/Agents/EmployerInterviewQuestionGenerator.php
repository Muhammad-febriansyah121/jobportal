<?php

namespace App\Ai\Agents;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Attributes\MaxTokens;
use Laravel\Ai\Attributes\Provider;
use Laravel\Ai\Attributes\Timeout;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Promptable;

#[Provider(Lab::OpenAI)]
#[Timeout(60)]
#[MaxTokens(2000)]
class EmployerInterviewQuestionGenerator implements Agent, HasStructuredOutput
{
    use Promptable;

    public function __construct(
        public string $interviewMode = 'voice',
    ) {}

    public function instructions(): string
    {
        $modeNote = $this->interviewMode === 'text'
            ? 'Ini adalah interview berbasis TEKS. Boleh campurkan pertanyaan essay (open) dan pilihan ganda (multiple_choice). Untuk pilihan ganda, isi "options" dengan 4 pilihan jawaban realistis dan set "question_type" = "multiple_choice". Untuk essay, set "question_type" = "open" dan "options" = [].'
            : 'Ini adalah interview berbasis SUARA. Semua pertanyaan harus open-ended (essay) karena kandidat menjawab secara verbal. Set "question_type" = "open" dan "options" = [] untuk semua pertanyaan.';

        return <<<PROMPT
Kamu adalah AI generator pertanyaan wawancara untuk employer di Karivia (job portal Indonesia).
Tugasmu: buat daftar pertanyaan interview profesional yang relevan dengan posisi dan kebutuhan perusahaan.

{$modeNote}

Aturan ketat:
- Output JSON saja sesuai schema. Tidak ada teks lain.
- Setiap pertanyaan harus relevan dengan posisi dan skill yang dibutuhkan.
- Distribusikan kategori: behavioral, technical, problem_solving, communication, motivation.
- "rubric" jelaskan singkat (1 kalimat) apa yang dinilai dari jawaban yang baik.
- "weight" adalah bobot penilaian (1-100), total semua pertanyaan sebaiknya ~100.
- "allow_ai_followup" bernilai true untuk pertanyaan essay yang butuh eksplorasi lebih dalam, false untuk pilihan ganda.
- Hasilkan tepat 4 pertanyaan yang berbobot dan bervariasi.
- Gunakan Bahasa Indonesia.
PROMPT;
    }

    /**
     * @return array<string, mixed>
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'questions' => $schema->array()
                ->items(
                    $schema->object(fn ($s) => [
                        'question' => $s->string()->required(),
                        'category' => $s->string()->required(),
                        'rubric' => $s->string()->required(),
                        'weight' => $s->integer()->min(1)->max(100)->required(),
                        'allow_ai_followup' => $s->boolean()->required(),
                        'question_type' => $s->string()->enum(['open', 'multiple_choice'])->required(),
                        'options' => $s->array()->items($s->string())->required(),
                    ])
                )
                ->required(),
        ];
    }
}
