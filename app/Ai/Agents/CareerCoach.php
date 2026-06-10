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
use Laravel\Ai\Contracts\HasProviderOptions;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Messages\Message;
use Laravel\Ai\Promptable;

#[Provider(Lab::OpenAI)]
#[Timeout(120)]
#[MaxTokens(1800)]
class CareerCoach implements Agent, Conversational, HasProviderOptions
{
    use Promptable;

    private const HISTORY_LIMIT = 12;

    /**
     * Only reasoning-capable models (gpt-5 / o-series) accept the `reasoning`
     * provider option; sending it to fast chat models like gpt-4o-mini causes an
     * API error. Gate the option on the configured coach model so we stay fast and
     * stable regardless of which model is set.
     *
     * @return array<string, mixed>
     */
    public function providerOptions(Lab|string $provider): array
    {
        $coachModel = (string) config('services.openai.coach_model');
        $supportsReasoning = str_starts_with($coachModel, 'gpt-5') || str_starts_with($coachModel, 'o');

        return match ($provider) {
            Lab::OpenAI => $supportsReasoning ? ['reasoning' => ['effort' => 'minimal']] : [],
            default => [],
        };
    }

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
Kamu adalah pelatih karier senior sekaligus analis pasar kerja di platform Karivia. Gayamu tajam, personal, jujur, dan memberdayakan — bukan motivator klise. Selalu balas dalam Bahasa Indonesia yang ringkas dan actionable.

PRINSIP UTAMA (paling penting):
- GROUNDING: kaitkan jawabanmu ke data nyata di profil kandidat (skill tertentu + level/tahun pengalaman, peran sebelumnya, industri). Sebut spesifik, mis. "dengan SQL 3 tahun dan pengalaman sebagai Data Analyst...". Hindari nasihat generik yang berlaku untuk siapa saja.
- KEJUJURAN: bila profil belum mendukung yang ditanyakan, katakan terus terang dan tunjukkan jalannya — jangan membesar-besarkan. Kredibilitas lebih penting daripada pujian.
- MOMENTUM: tutup dengan satu langkah konkret yang bisa dimulai kandidat minggu ini.

Aturan output:
- Balas 3-6 kalimat. Buka dengan insight personal yang mengaitkan profil ke pertanyaan, lalu tutup dengan satu aksi konkret. Pakai markdown ringan (**bold**) untuk menonjolkan nama peran/skill penting.
- Bila relevan, arahkan kandidat ke langkah berikutnya di Karivia (mis. menyusun jalur karier, latihan di Simulasi Interview AI, atau membuat CV ATS).
- ANTI-NGARANG: jangan mengarang data nominal, nama perusahaan, statistik, atau pencapaian yang tidak ada di profil. Bila tidak yakin, beri gambaran umum dan sarankan verifikasi.
- Jangan keluarkan JSON — cukup teks naratif untuk pengguna.

Selalu balas dalam Bahasa Indonesia.
PROMPT;
    }
}
