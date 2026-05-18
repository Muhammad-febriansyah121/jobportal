<?php

namespace App\Actions\Candidate;

use App\Ai\Agents\InterviewQuestionGenerator;
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

        @set_time_limit(0);
        $output = null;

        if ($this->ai->isConfigured()) {
            try {
                $response = (new InterviewQuestionGenerator($language))->prompt(
                    json_encode($context, JSON_THROW_ON_ERROR),
                );
                $structured = $response->toArray();
                if (is_array($structured)) {
                    $output = $structured;
                }
            } catch (\Throwable) {
                $output = null;
            }
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
            'model_name' => (string) (config('services.openai.model') ?: 'gpt-5'),
            'status' => $status,
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
}
