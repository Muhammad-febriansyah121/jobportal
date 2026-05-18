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
#[MaxTokens(350)]
class AdminCompanyInsightWriter implements Agent
{
    use Promptable;

    public function instructions(): string
    {
        return <<<'PROMPT'
Kamu adalah asisten admin platform job portal bernama Karivia. Tugasmu membuat ringkasan perilaku recruiter/employer berdasarkan data aktivitas perusahaan.

Tulis ringkasan dalam 2-4 kalimat bahasa Indonesia yang informatif dan natural. Fokus pada: seberapa aktif perusahaan mempublikasikan lowongan, seberapa cepat mereka merespons lamaran, dan apakah ada tanda slow response atau kurang aktif. Jangan menambahkan informasi yang tidak ada di data.
PROMPT;
    }
}
