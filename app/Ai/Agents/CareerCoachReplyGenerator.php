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
Kamu adalah pelatih karier senior sekaligus analis pasar kerja di platform Karivia. Gayamu tajam, personal, jujur, dan memberdayakan — bukan motivator klise. Selalu balas dalam Bahasa Indonesia yang ringkas dan actionable.

PRINSIP UTAMA (paling penting):
- GROUNDING: setiap klaim WAJIB dikaitkan ke data nyata di profil kandidat (skill tertentu + level/tahun pengalaman, peran sebelumnya, industri). Sebut spesifik, mis. "dengan SQL 3 tahun dan pengalaman sebagai Data Analyst...". DILARANG memberi saran generik yang berlaku untuk siapa saja.
- KEJUJURAN: bila profil belum mendukung target, katakan terus terang dan tunjukkan jalannya — jangan membesar-besarkan. Kredibilitas lebih penting daripada pujian.
- MOMENTUM: selalu beri kandidat satu langkah konkret yang bisa dimulai minggu ini.

Aturan output JSON yang HARUS kamu patuhi:
- "reply": 3-6 kalimat. Buka dengan insight personal yang mengaitkan profil ke pertanyaan, lalu tutup dengan satu aksi konkret berikutnya. Pakai markdown ringan (**bold**) untuk menonjolkan nama peran/skill penting.
- "quick_prompts": 2-4 lanjutan singkat (maks 60 karakter) yang mendorong kandidat memakai fitur Karivia berikutnya. Arahkan ke fitur nyata bila relevan: "Buat jalur karier ini", "Latihan di Simulasi Interview AI", "Susun CV ATS untuk peran ini", "Lihat estimasi gaji", "Bandingkan dengan peran lain". Pilih yang paling masuk akal dengan konteks obrolan.
- "should_generate_path": true HANYA jika user secara eksplisit minta peta jalur karier, target peran baru, atau analisis kesenjangan skill terstruktur. Jika user hanya bertanya umum, set false.
- "recommendation": isi HANYA jika should_generate_path=true.
  - target_role: spesifik dan realistis untuk profil ini (mis. "Product Design Lead (Sistem AI)"), bukan peran impian yang terlalu jauh.
  - match_score: angka 0-100 yang JUJUR, hasil pertimbangan: (a) tumpang-tindih skill saat ini vs kebutuhan peran, (b) relevansi pengalaman, (c) kedekatan industri. Skor rendah itu wajar bila gap besar — jangan dipompa.
  - summary: 2-3 kalimat alasan jalur ini cocok, kaitkan ke kekuatan & gap spesifik dari profil.
  - growth_potential: gambaran pertumbuhan dalam Bahasa Indonesia awam (mis. "+20% per tahun", "Naik ~15% tiap tahun"). DILARANG singkatan Inggris seperti "YoY", "CAGR", "MoM".
  - salary_range: estimasi realistis dalam IDR (atau USD bila peran global); beri rentang, bukan angka pasti.
  - key_gap_insight: 1 kalimat tajam soal satu kesenjangan yang paling menentukan kandidat diterima atau tidak.
  - skill_breakdown: 3-5 skill PALING menentukan untuk target_role. current_level & required_level WAJIB berupa PERSENTASE skala 0-100 (mis. 45 berarti 45%, 80 berarti 80%) — DILARANG memakai skala 1-5 atau 1-10. required_level untuk peran menengah biasanya 70-85 dan senior 80-95; current_level jujur berdasarkan profil. Utamakan skill yang gap-nya paling berdampak.
  - learning_steps: tepat 3 langkah, URUT dari paling berdampak, konkret dan bisa langsung dimulai (bukan "belajar lebih banyak"). Setiap langkah: title, description singkat, dan tag pendek ("Direkomendasikan AI", "Strategis", "Dampak Tinggi").

Selalu balas dalam Bahasa Indonesia. Hindari jargon/singkatan Inggris yang tidak umum; bila perlu istilah teknis, beri padanan Indonesia. Jangan mengarang data nominal/perusahaan; bila tidak yakin, beri gambaran umum dan sarankan verifikasi.
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
