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
#[Timeout(120)]
#[MaxTokens(1800)]
class CareerPathPlanner implements Agent, HasStructuredOutput
{
    use Promptable;

    public function instructions(): string
    {
        return <<<'PROMPT'
Kamu adalah pelatih karier AI untuk platform Karivia. Kamu menghasilkan satu jalur karier yang realistis untuk seorang kandidat berdasarkan profil mereka dan target peran yang diinginkan.

Input akan menyertakan field `cv_review` (ringkasan kesiapan CV: ats_score, strengths, gaps, top_skills, stats). Gunakan informasi ini untuk:
- Menyesuaikan match_score (semakin rendah ATS score atau makin banyak gap, semakin rendah match_score awal).
- Menonjolkan strengths sebagai modal di summary dan skill_breakdown.
- Mengubah gaps utama menjadi target di learning_steps & key_gap_insight.

Selalu balas dalam Bahasa Indonesia. Output harus mengikuti JSON schema ketat. Pastikan:
- target_role mengacu pada target yang dapat diukur dan spesifik.
- match_score adalah angka 0-100 yang merefleksikan kecocokan antara skill saat ini dengan target peran.
- summary maksimal 3 kalimat menjelaskan rasional jalur karier ini, mengaitkan strengths/gaps dari cv_review.
- growth_potential berisi gambaran pertumbuhan industri dalam Bahasa Indonesia awam (mis. "+24% per tahun"); DILARANG memakai singkatan Inggris seperti "YoY", "CAGR", atau "MoM".
- salary_range memberi estimasi gaji dalam IDR atau USD relevan dengan target.
- key_gap_insight menyoroti satu kesenjangan paling kritikal yang harus diisi (prioritaskan dari cv_review.gaps).
- skill_breakdown berisi 4-6 skill. current_level dan required_level WAJIB persentase skala 0-100 (mis. 45 = 45%, 80 = 80%) — DILARANG skala 1-5 atau 1-10. required_level peran menengah biasanya 70-85, senior 80-95.
- learning_steps berisi 3-6 langkah praktis yang berurutan untuk menutup kesenjangan; setiap langkah punya title, description, dan tag (mis. "Direkomendasikan AI", "Strategis", "Dampak Tinggi").
- milestones berisi 3-5 milestone karier dalam 6-18 bulan.
PROMPT;
    }

    /**
     * @return array<string, mixed>
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'target_role' => $schema->string()->required(),
            'match_score' => $schema->integer()->min(0)->max(100)->required(),
            'summary' => $schema->string()->required(),
            'growth_potential' => $schema->string()->required(),
            'salary_range' => $schema->string()->required(),
            'key_gap_insight' => $schema->string()->required(),
            'skill_breakdown' => $schema->array()
                ->items(
                    $schema->object(fn ($s) => [
                        'name' => $s->string()->required(),
                        'current_level' => $s->integer()->min(0)->max(100)->required(),
                        'required_level' => $s->integer()->min(0)->max(100)->required(),
                        'note' => $s->string()->required(),
                    ])
                )
                ->required(),
            'learning_steps' => $schema->array()
                ->items(
                    $schema->object(fn ($s) => [
                        'title' => $s->string()->required(),
                        'description' => $s->string()->required(),
                        'tag' => $s->string()->required(),
                    ])
                )
                ->required(),
            'milestones' => $schema->array()
                ->items(
                    $schema->object(fn ($s) => [
                        'title' => $s->string()->required(),
                        'timeframe' => $s->string()->required(),
                    ])
                )
                ->required(),
        ];
    }
}
