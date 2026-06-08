<?php

namespace App\Ai\Agents;

use App\Models\AiCareerCoachingMessage;
use App\Models\AiCareerCoachingSession;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Attributes\MaxTokens;
use Laravel\Ai\Attributes\Provider;
use Laravel\Ai\Attributes\Timeout;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\Conversational;
use Laravel\Ai\Contracts\HasProviderOptions;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Messages\Message;
use Laravel\Ai\Promptable;

#[Provider(Lab::OpenAI)]
#[Timeout(120)]
#[MaxTokens(1800)]
class CareerCoachReplyGenerator implements Agent, Conversational, HasProviderOptions, HasStructuredOutput
{
    use Promptable;

    /**
     * Minimal reasoning effort keeps gpt-5 fast for this lightweight reply +
     * quick-prompt generation.
     *
     * @return array<string, mixed>
     */
    public function providerOptions(Lab|string $provider): array
    {
        return match ($provider) {
            Lab::OpenAI => ['reasoning' => ['effort' => 'minimal']],
            default => [],
        };
    }

    private const HISTORY_LIMIT = 12;

    public function __construct(
        public AiCareerCoachingSession $session,
        public string $contextJson,
        /** @var array<string, mixed>|null */
        public ?array $activeRecommendation = null,
    ) {}

    public function instructions(): string
    {
        $base = <<<'PROMPT'
Kamu adalah pelatih karier AI di platform Karivia. Selalu balas dalam Bahasa Indonesia yang ringkas, hangat, dan actionable.

Aturan output JSON yang HARUS kamu patuhi:
- "reply": balasan singkat 3-6 kalimat. Kamu boleh memakai sintaks markdown ringan (**bold**) untuk menonjolkan nama peran, skill, atau frasa penting. Sebut profil kandidat secara spesifik (mis. peran, skill, industri) bila relevan.
- "quick_prompts": berikan 2-4 lanjutan pertanyaan/aksi yang relevan dan singkat dalam Bahasa Indonesia (maks 60 karakter per item) — misal "Lihat Wawasan Gaji", "Bandingkan dengan peran PM".
- "should_generate_path": true HANYA jika user secara eksplisit/menentukan minta peta jalur karier, target peran baru, atau analisis kesenjangan skill terstruktur. Jika user hanya bertanya umum, set false.
- "recommendation": isi field-nya HANYA jika should_generate_path=true. target_role wajib spesifik (mis. "Product Design Lead (Sistem AI)"). match_score 0-100 berbasis profil. summary 2-3 kalimat menjelaskan rasional. growth_potential ringkas (mis. "+24% YoY"). salary_range realistis dalam IDR atau USD. key_gap_insight sorot 1 kesenjangan paling kritis. skill_breakdown 3-5 skill dengan current_level & required_level (0-100). learning_steps 3 langkah dengan title, description singkat, dan tag pendek (mis. "Direkomendasikan AI", "Strategis", "Dampak Tinggi").

Selalu balas dalam Bahasa Indonesia. Jangan berhalusinasi data nominal/perusahaan; bila tidak yakin, tetap berikan gambaran umum dan sarankan verifikasi.
PROMPT;

        $instructions = $base."\n\nProfil kandidat: ".$this->contextJson;

        if ($this->activeRecommendation) {
            $instructions .= "\n\nRekomendasi target aktif: ".json_encode([
                'target_role' => $this->activeRecommendation['target_role'] ?? null,
                'match_score' => $this->activeRecommendation['match_score'] ?? null,
                'key_gap_insight' => $this->activeRecommendation['key_gap_insight'] ?? null,
            ], JSON_UNESCAPED_UNICODE);
        }

        return $instructions;
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
    public function schema(JsonSchema $schema): array
    {
        return [
            'reply' => $schema->string()->required(),
            'quick_prompts' => $schema->array()->items($schema->string())->required(),
            'should_generate_path' => $schema->boolean()->required(),
            'recommendation' => $schema->object(fn ($s) => [
                'target_role' => $s->string()->required(),
                'match_score' => $s->integer()->min(0)->max(100)->required(),
                'summary' => $s->string()->required(),
                'growth_potential' => $s->string()->required(),
                'salary_range' => $s->string()->required(),
                'key_gap_insight' => $s->string()->required(),
                'skill_breakdown' => $s->array()
                    ->items(
                        $s->object(fn ($n) => [
                            'name' => $n->string()->required(),
                            'current_level' => $n->integer()->min(0)->max(100)->required(),
                            'required_level' => $n->integer()->min(0)->max(100)->required(),
                            'note' => $n->string()->required(),
                        ])
                    )
                    ->required(),
                'learning_steps' => $s->array()
                    ->items(
                        $s->object(fn ($n) => [
                            'title' => $n->string()->required(),
                            'description' => $n->string()->required(),
                            'tag' => $n->string()->required(),
                        ])
                    )
                    ->required(),
            ])->required(),
        ];
    }
}
