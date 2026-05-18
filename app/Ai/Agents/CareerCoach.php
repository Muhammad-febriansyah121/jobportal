<?php

namespace App\Ai\Agents;

use App\Models\AiCareerCoachingMessage;
use App\Models\AiCareerCoachingSession;
use App\Models\CandidateProfile;
use Laravel\Ai\Attributes\MaxTokens;
use Laravel\Ai\Attributes\Provider;
use Laravel\Ai\Attributes\Timeout;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\Conversational;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Messages\Message;
use Laravel\Ai\Promptable;

#[Provider(Lab::OpenAI)]
#[Timeout(120)]
#[MaxTokens(1800)]
class CareerCoach implements Agent, Conversational
{
    use Promptable;

    private const HISTORY_LIMIT = 12;

    public function __construct(
        public CandidateProfile $candidate,
        public AiCareerCoachingSession $session,
        /** @var array<string, mixed>|null */
        public ?array $activeRecommendation = null,
    ) {}

    public function instructions(): string
    {
        $context = $this->buildContext();
        $contextLine = 'Profil kandidat: '.json_encode($context, JSON_UNESCAPED_UNICODE);

        $recommendationLine = '';
        if ($this->activeRecommendation) {
            $recommendationLine = "\n\nRekomendasi target aktif: ".json_encode([
                'target_role' => $this->activeRecommendation['target_role'] ?? null,
                'match_score' => $this->activeRecommendation['match_score'] ?? null,
                'key_gap_insight' => $this->activeRecommendation['key_gap_insight'] ?? null,
            ], JSON_UNESCAPED_UNICODE);
        }

        return $this->systemPrompt()."\n\n".$contextLine.$recommendationLine;
    }

    /**
     * @return iterable<int, Message>
     */
    public function messages(): iterable
    {
        return $this->session->messages()
            ->orderBy('id')
            ->get(['role', 'content'])
            ->take(-self::HISTORY_LIMIT)
            ->values()
            ->map(fn (AiCareerCoachingMessage $message): Message => new Message(
                $message->role === 'user' ? 'user' : 'assistant',
                $message->content,
            ))
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function buildContext(): array
    {
        $this->candidate->loadMissing(['skills', 'experiences', 'preferredIndustry']);

        return [
            'candidate' => [
                'name' => $this->candidate->full_name,
                'headline' => $this->candidate->headline,
                'preferred_role' => $this->candidate->preferred_role,
                'preferred_industry' => $this->candidate->preferredIndustry?->name,
                'top_skills' => $this->candidate->skills
                    ->take(8)
                    ->map(fn ($skill): array => [
                        'name' => $skill->name,
                        'proficiency' => $skill->pivot->proficiency,
                        'years_exp' => $skill->pivot->years_exp,
                    ])
                    ->values()
                    ->all(),
                'experiences' => $this->candidate->experiences
                    ->take(5)
                    ->map(fn ($exp): array => [
                        'job_title' => $exp->job_title,
                        'company' => $exp->company_name,
                    ])
                    ->values()
                    ->all(),
            ],
        ];
    }

    private function systemPrompt(): string
    {
        return <<<'PROMPT'
Kamu adalah pelatih karier AI di platform Karivia. Selalu balas dalam Bahasa Indonesia yang ringkas, hangat, dan actionable.

Aturan output:
- Balas singkat 3-6 kalimat. Boleh memakai sintaks markdown ringan (**bold**) untuk menonjolkan nama peran, skill, atau frasa penting.
- Sebut profil kandidat secara spesifik (mis. peran, skill, industri) bila relevan.
- Jangan berhalusinasi data nominal/perusahaan; bila tidak yakin, tetap berikan gambaran umum dan sarankan verifikasi.
- Jangan keluarkan JSON — cukup teks naratif untuk pengguna.

Selalu balas dalam Bahasa Indonesia.
PROMPT;
    }
}
