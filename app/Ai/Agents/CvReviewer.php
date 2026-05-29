<?php

namespace App\Ai\Agents;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Attributes\MaxTokens;
use Laravel\Ai\Attributes\Model;
use Laravel\Ai\Attributes\Provider;
use Laravel\Ai\Attributes\Timeout;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Promptable;

#[Provider(Lab::OpenAI)]
#[Model('gpt-5')]
#[Timeout(60)]
#[MaxTokens(10000)]
class CvReviewer implements Agent, HasStructuredOutput
{
    use Promptable;

    public function instructions(): string
    {
        return <<<'PROMPT'
Kamu adalah AI CV Reviewer profesional khusus pasar kerja Indonesia.
Tugasmu mengevaluasi CV kandidat secara menyeluruh dan memberikan feedback yang
terstruktur, spesifik, dan actionable. Gunakan bahasa Indonesia yang mudah
dipahami, ramah, dan tidak menggurui.

Aturan:
- WAJIB sertakan 10 section di array "sections" dengan id sesuai: contact_information, professional_summary, work_experience, achievement, education_certification, skills, projects_portfolio, writing_quality, ats_keywords, career_recommendation.
- Skor section 0-30 = missing, 31-70 = warning, 71-100 = good. Set field "status" sesuai range.
- Score keseluruhan = rata-rata weighted dari section.
- "examples" boleh kosong [] kalau tidak relevan, tapi WAJIB ada untuk professional_summary, work_experience, dan achievement.
- "matched"/"missing" diambil dari skill, tools, soft skill yang umum untuk target_job. Kalau target_job kosong, infer dari headline/role di CV.
- Hindari saran umum seperti "perbaiki CV". Selalu berikan saran spesifik.
PROMPT;
    }

    public function schema(JsonSchema $schema): array
    {
        $exampleItem = $schema->object(fn (JsonSchema $s) => [
            'before' => $s->string()->required(),
            'after' => $s->string()->required(),
        ]);

        $sectionItem = $schema->object(fn (JsonSchema $s) => [
            'id' => $s->string()->required(),
            'title' => $s->string()->required(),
            'score' => $s->integer()->min(0)->max(100)->required(),
            'status' => $s->string()->enum(['good', 'warning', 'missing'])->required(),
            'analysis' => $s->string()->required(),
            'why_important' => $s->string()->required(),
            'action_points' => $s->array()->items($s->string())->required(),
            'examples' => $s->array()->items($exampleItem)->required(),
        ])->required();

        return [
            'score' => $schema->integer()->min(0)->max(100)->required(),
            'label' => $schema->string()->enum(['Sudah kuat', 'Cukup baik', 'Perlu ditingkatkan'])->required(),
            'summary' => $schema->string()->required(),
            'improved_summary' => $schema->string()->required(),
            'sections' => $schema->array()->items($sectionItem)->required(),
            'keyword_match' => $schema->object(fn (JsonSchema $s) => [
                'score' => $s->integer()->min(0)->max(100)->required(),
                'matched' => $s->array()->items($s->string())->required(),
                'missing' => $s->array()->items($s->string())->required(),
            ])->required(),
            'suggestions' => $schema->array()->items($schema->string())->required(),
        ];
    }
}
