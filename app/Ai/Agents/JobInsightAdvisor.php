<?php

namespace App\Ai\Agents;

use Laravel\Ai\Attributes\MaxTokens;
use Laravel\Ai\Attributes\Provider;
use Laravel\Ai\Attributes\Timeout;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Promptable;

#[Provider(Lab::OpenAI)]
#[Timeout(60)]
#[MaxTokens(300)]
class JobInsightAdvisor implements Agent
{
    use Promptable;

    public function instructions(): string
    {
        return <<<'PROMPT'
Kamu adalah AI career advisor Karivia untuk job portal Indonesia.
Balas hanya JSON valid tanpa markdown dengan schema:
{
  "recruitment_stages": ["Seleksi Berkas", "Technical Test", "Interview HR", "User Interview", "Offering"],
  "application_tip": "1-2 kalimat tip spesifik untuk kandidat ini berdasarkan skill dan kebutuhan pekerjaan"
}
Buat tahapan rekrutmen realistis (3-6 tahap) sesuai jenis dan level pekerjaan.
Gunakan bahasa Indonesia yang natural.
PROMPT;
    }
}
