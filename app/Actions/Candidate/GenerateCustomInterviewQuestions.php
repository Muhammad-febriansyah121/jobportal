<?php

namespace App\Actions\Candidate;

use App\Models\AiAuditLog;
use App\Models\CandidateProfile;
use App\Services\AiService;
use Illuminate\Support\Collection;
use JsonException;

class GenerateCustomInterviewQuestions
{
    public function __construct(private readonly AiService $ai) {}

    /**
     * @param  array{interview_focus?: string, candidate_level?: string, interview_language?: string, question_count?: int, target_role?: string}  $options
     * @return Collection<int, array{question: string, category: string, rubric: string, weight: int, allow_ai_followup: bool, order_number: int}>|null null = AI failed, fallback to template
     */
    public function handle(CandidateProfile $candidate, array $options): ?Collection
    {
        $candidate->loadMissing(['skills:id,name', 'experiences', 'educations', 'preferredIndustry:id,name']);

        $focus = (string) ($options['interview_focus'] ?? 'mixed');
        $level = (string) ($options['candidate_level'] ?? 'junior');
        $language = (string) ($options['interview_language'] ?? 'id');
        $count = max(3, min(10, (int) ($options['question_count'] ?? 5)));
        $targetRole = trim((string) ($options['target_role'] ?? $candidate->preferred_role ?? $candidate->headline ?? ''));

        $context = [
            'language' => $language,
            'target_role' => $targetRole !== '' ? $targetRole : null,
            'focus' => $focus,
            'level' => $level,
            'question_count' => $count,
            'profile' => [
                'headline' => $candidate->headline,
                'preferred_industry' => $candidate->preferredIndustry?->name,
                'bio' => $candidate->bio ? mb_substr((string) $candidate->bio, 0, 400) : null,
                'top_skills' => $candidate->skills
                    ->take(8)
                    ->map(fn ($skill): array => [
                        'name' => $skill->name,
                        'years_exp' => $skill->pivot->years_exp ?? null,
                        'proficiency' => $skill->pivot->proficiency ?? null,
                    ])
                    ->values()
                    ->all(),
                'recent_experiences' => $candidate->experiences
                    ->sortByDesc('is_current')
                    ->take(3)
                    ->map(fn ($exp): array => [
                        'job_title' => $exp->job_title,
                        'company_name' => $exp->company_name,
                        'is_current' => (bool) $exp->is_current,
                        'description' => $exp->description ? mb_substr((string) $exp->description, 0, 200) : null,
                    ])
                    ->values()
                    ->all(),
                'latest_education' => $candidate->educations
                    ->sortByDesc('end_year')
                    ->first()
                    ? [
                        'degree' => $candidate->educations->sortByDesc('end_year')->first()->degree,
                        'field_of_study' => $candidate->educations->sortByDesc('end_year')->first()->field_of_study,
                        'institution' => $candidate->educations->sortByDesc('end_year')->first()->institution,
                    ]
                    : null,
            ],
        ];

        // Skip AI if profile is too thin — let template fallback take over.
        if (count($context['profile']['top_skills']) === 0 && count($context['profile']['recent_experiences']) === 0) {
            return null;
        }

        try {
            $inputHash = hash('sha256', json_encode($context, JSON_THROW_ON_ERROR));
        } catch (JsonException) {
            return null;
        }

        $cached = AiAuditLog::query()
            ->where('user_id', $candidate->user_id)
            ->where('feature', 'candidate_custom_interview_questions')
            ->where('input_hash', $inputHash)
            ->whereIn('status', ['success', 'fallback'])
            ->where('created_at', '>=', now()->subMinutes(15))
            ->latest()
            ->first();

        if ($cached?->status === 'success' && is_array($cached->output_json)) {
            $questions = $this->mapOutputToQuestions($cached->output_json, $language, $count);

            if ($questions->isNotEmpty()) {
                return $questions;
            }
        }

        if ($cached?->status === 'fallback') {
            return null;
        }

        try {
            $output = $this->ai->chatJson(
                messages: [
                    ['role' => 'system', 'content' => $this->systemPrompt($language)],
                    ['role' => 'user', 'content' => json_encode($context, JSON_THROW_ON_ERROR)],
                ],
                schema: $this->responseSchema(),
                schemaName: 'custom_interview_questions',
                maxTokens: 1200,
            );
        } catch (\Throwable) {
            $output = null;
        }

        $status = is_array($output) && isset($output['questions']) && count((array) $output['questions']) >= $count
            ? 'success'
            : 'fallback';

        AiAuditLog::create([
            'user_id' => $candidate->user_id,
            'feature' => 'candidate_custom_interview_questions',
            'input_hash' => $inputHash,
            'input_json' => $context,
            'output_json' => $output,
            'model_name' => $this->ai->modelName(),
            'status' => $status,
            ...$this->ai->tokenUsage(),
        ]);

        if ($status === 'fallback') {
            return null;
        }

        return $this->mapOutputToQuestions((array) $output, $language, $count);
    }

    /**
     * @param  array<string, mixed>  $output
     * @return Collection<int, array{question: string, category: string, rubric: string, weight: int, allow_ai_followup: bool, order_number: int}>
     */
    private function mapOutputToQuestions(array $output, string $language, int $count): Collection
    {
        $rubricFallback = $language === 'en'
            ? 'Score based on clarity, relevance to the candidate profile, and concrete examples.'
            : 'Nilai berdasarkan kejelasan, relevansi terhadap profil kandidat, dan contoh konkret.';

        return collect($output['questions'] ?? [])
            ->filter(fn ($q): bool => is_array($q) && filled($q['question'] ?? null))
            ->map(fn (array $q, int $index): array => [
                'question' => $this->cleanText((string) $q['question']),
                'category' => trim((string) ($q['category'] ?? 'behavioral')),
                'rubric' => trim((string) ($q['rubric'] ?? '')) !== ''
                    ? $this->cleanText((string) $q['rubric'])
                    : $rubricFallback,
                'weight' => 10,
                'allow_ai_followup' => true,
                'order_number' => $index + 1,
            ])
            ->take($count)
            ->values();
    }

    private function cleanText(string $value): string
    {
        $stripped = strip_tags($value);
        $decoded = html_entity_decode($stripped, ENT_QUOTES | ENT_HTML5, 'UTF-8');

        return trim((string) preg_replace('/\s+/', ' ', $decoded));
    }

    private function systemPrompt(string $language): string
    {
        if ($language === 'en') {
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
- Gunakan Bahasa Indonesia natural untuk semua field.
PROMPT;
    }

    /**
     * @return array<string, mixed>
     */
    private function responseSchema(): array
    {
        return [
            'type' => 'object',
            'additionalProperties' => false,
            'required' => ['questions'],
            'properties' => [
                'questions' => [
                    'type' => 'array',
                    'minItems' => 3,
                    'maxItems' => 12,
                    'items' => [
                        'type' => 'object',
                        'additionalProperties' => false,
                        'required' => ['question', 'category', 'rubric'],
                        'properties' => [
                            'question' => ['type' => 'string', 'minLength' => 20, 'maxLength' => 400],
                            'category' => [
                                'type' => 'string',
                                'enum' => [
                                    'behavioral',
                                    'technical',
                                    'problem_solving',
                                    'communication',
                                    'case_study',
                                    'motivation',
                                ],
                            ],
                            'rubric' => ['type' => 'string', 'minLength' => 10, 'maxLength' => 200],
                        ],
                    ],
                ],
            ],
        ];
    }
}
