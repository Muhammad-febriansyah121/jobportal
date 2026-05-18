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
Score 0-100. Jangan menambahkan kandidat di luar data. Gunakan bahasa Indonesia natural untuk reason.
PROMPT;
    }
}
