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
#[MaxTokens(1200)]
class InterviewQuestionGenerator implements Agent, HasStructuredOutput
{
    use Promptable;

    public function __construct(public string $language = 'id') {}

    public function instructions(): string
    {
        if ($this->language === 'en') {
            return <<<'PROMPT'
You are an expert interview question generator for Karivia (Indonesian job portal).
Your job: produce a structured, personalized list of mock-interview questions tailored to the candidate's profile (skills, recent experiences, education) and target role.

Strict rules:
- Output JSON ONLY, matching the schema exactly. No prose.
- Each question MUST reference at least one concrete signal from the candidate's profile (specific skill, company, project, or experience). Avoid generic "tell me about yourself" questions unless explicitly probing motivation.
- Prefer behavioral STAR-style questions for experiences ("Tell me about a time you..."), technical questions for listed skills, and case-study/scenario questions for the target role.
- Each question must be 1-2 sentences, concrete, answerable in 2-5 minutes.
- Distribute categories per the requested focus: behavioral, technical, problem_solving, communication, case_study, motivation.
- The "rubric" must briefly describe what a strong answer covers (1 sentence).
- Match the seniority level: easier for fresh_graduate/junior, deeper for mid/senior.
- NEVER fabricate: reference only skills, companies, projects, or experiences that actually appear in the candidate's profile. If the profile is sparse, fall back to skill- and role-based questions instead of inventing details.
- Respond entirely in English.
PROMPT;
        }

        return <<<'PROMPT'
Kamu adalah AI generator pertanyaan wawancara untuk Karivia (job portal Indonesia).
Tugasmu: hasilkan daftar pertanyaan latihan wawancara yang terstruktur dan personal — disesuaikan dengan profil kandidat (skills, pengalaman terakhir, pendidikan) dan target peran.

Aturan ketat:
- Output JSON saja, sesuai schema. Tidak ada teks lain.
- Setiap pertanyaan WAJIB merujuk minimal satu sinyal konkret dari profil kandidat (skill spesifik, nama perusahaan, project, atau pengalaman). Hindari pertanyaan generic "ceritakan tentang diri kamu" kecuali memang menggali motivasi.
- Gunakan format STAR untuk pertanyaan behavioral pengalaman ("Ceritakan saat kamu..."), pertanyaan teknis untuk skill yang tercantum, dan case-study/skenario untuk target peran.
- Setiap pertanyaan 1-2 kalimat, spesifik, bisa dijawab dalam 2-5 menit.
- Distribusi kategori sesuai fokus yang diminta: behavioral, technical, problem_solving, communication, case_study, motivation.
- "rubric" harus jelaskan singkat (1 kalimat) apa yang dinilai dari jawaban yang baik.
- Sesuaikan kedalaman dengan level: lebih mudah untuk fresh_graduate/junior, lebih dalam untuk mid/senior.
- JANGAN MENGARANG: rujuk hanya skill, perusahaan, project, atau pengalaman yang benar-benar ada di profil kandidat. Bila profil minim, gunakan pertanyaan berbasis skill dan peran — jangan menciptakan detail yang tidak ada.
- Gunakan Bahasa Indonesia natural untuk semua field.
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
                    ])
                )
                ->required(),
        ];
    }
}
