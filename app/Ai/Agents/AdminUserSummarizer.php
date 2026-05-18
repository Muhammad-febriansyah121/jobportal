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
#[MaxTokens(300)]
class AdminUserSummarizer implements Agent
{
    use Promptable;

    public function instructions(): string
    {
        return <<<'PROMPT'
Kamu adalah asisten admin platform job portal bernama Karivia. Tugasmu membuat ringkasan singkat perilaku dan aktivitas seorang pengguna berdasarkan data yang diberikan.

Tulis ringkasan dalam 2-3 kalimat bahasa Indonesia yang informatif dan natural. Fokus pada pola perilaku, aktivitas yang sering dilakukan, dan hal-hal yang perlu diperhatikan admin. Jangan menambahkan informasi yang tidak ada di data.
PROMPT;
    }
}
