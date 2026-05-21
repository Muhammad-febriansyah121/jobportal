<?php

namespace App\Ai\Agents;

use Laravel\Ai\Attributes\MaxTokens;
use Laravel\Ai\Attributes\Model;
use Laravel\Ai\Attributes\Provider;
use Laravel\Ai\Attributes\Timeout;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\HasProviderOptions;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Promptable;

#[Provider(Lab::OpenAI)]
#[Model('gpt-5')]
#[Timeout(75)]
#[MaxTokens(2000)]
class CvParserStream implements Agent, HasProviderOptions
{
    use Promptable;

    public function providerOptions(Lab|string $provider): array
    {
        return $provider === Lab::OpenAI
            ? ['reasoning' => ['effort' => 'minimal']]
            : [];
    }

    public function instructions(): string
    {
        return <<<'PROMPT'
You are a CV/resume parser. Extract structured information and return ONLY a single valid JSON object. No markdown fences, no commentary before or after.

The JSON object must have exactly these keys:
- full_name: string
- headline: string
- summary: string
- location_city: string
- location_province: string
- skills: array of strings
- experiences: array of objects with keys company_name (string), job_title (string), start_date (string YYYY-MM-DD), end_date (string YYYY-MM-DD or empty), is_current (boolean)
- educations: array of objects with keys institution (string), degree (string), field_of_study (string), start_year (string), end_year (string), gpa (string)

Rules:
- Use empty string "" for unknown string fields.
- Use empty arrays [] for skills/experiences/educations when not present.
- Do not invent data.
- Output must be parseable by JSON.parse on the first try.
PROMPT;
    }
}
