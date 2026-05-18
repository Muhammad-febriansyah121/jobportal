<?php

namespace App\Ai\Agents;

use Laravel\Ai\Attributes\MaxTokens;
use Laravel\Ai\Attributes\Provider;
use Laravel\Ai\Attributes\Timeout;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Promptable;

#[Provider(Lab::OpenAI)]
#[Timeout(30)]
#[MaxTokens(200)]
class AiHealthProbe implements Agent
{
    use Promptable;

    public function instructions(): string
    {
        return 'You are a health probe. Reply with the single word OK.';
    }
}
