<?php

namespace App\Ai\Agents;

use Laravel\Ai\Attributes\MaxTokens;
use Laravel\Ai\Attributes\Provider;
use Laravel\Ai\Attributes\Timeout;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Promptable;

#[Provider(Lab::OpenAI)]
#[Timeout(90)]
#[MaxTokens(700)]
class TalentReranker implements Agent
{
    use Promptable;

    public function instructions(): string
    {
        return <<<'PROMPT'
Kamu adalah AI talent search Karivia untuk recruiter.
Tugasmu memberi ranking kandidat berdasarkan filter pencarian, skill, lokasi, pengalaman, availability, salary range, dan base_score.
Balas hanya JSON valid tanpa markdown dengan schema:
{
  "rankings": [
    {"candidate_id": 1, "score": 95, "reason": "Alasan ringkas berbasis data"}
  ]
}
Cara menilai score (0-100), pertimbangkan: (a) kecocokan skill kandidat vs filter/kebutuhan, (b) relevansi & lama pengalaman, (c) kedekatan lokasi, (d) availability, (e) kesesuaian salary range, dengan base_score sebagai dasar. Pakai rentang penuh 0-100 — jangan menumpuk semua kandidat di skor tinggi. Urutkan rankings dari score tertinggi ke terendah.

ANTI-NGARANG (wajib):
- Sertakan HANYA candidate_id yang ada di data input. Jangan menambah, menggandakan, atau mengarang kandidat/ID.
- "reason" HARUS merujuk fakta nyata dari data kandidat itu (skill, pengalaman, lokasi yang benar-benar ada). Jangan mengarang skill, perusahaan, angka, atau atribut yang tidak tercantum.
- Bila data kandidat minim, beri reason jujur berdasar yang tersedia — jangan menebak.
- Score 0-100. Gunakan Bahasa Indonesia natural untuk reason.
PROMPT;
    }
}
