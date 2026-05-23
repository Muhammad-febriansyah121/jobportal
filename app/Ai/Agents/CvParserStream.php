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
#[Timeout(90)]
#[MaxTokens(4000)]
class CvParserStream implements Agent, HasProviderOptions
{
    use Promptable;

    public function providerOptions(Lab|string $provider): array
    {
        return $provider === Lab::OpenAI
            ? ['reasoning' => ['effort' => 'low']]
            : [];
    }

    public function instructions(): string
    {
        return <<<'PROMPT'
You are a CV/resume parser. The user will provide a CV either as an attached PDF document or as raw text extracted from a PDF/DOCX. Extract structured information and return ONLY a single valid JSON object. No markdown fences, no commentary before or after.

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
- Use empty arrays [] only when the CV genuinely lacks that section. Always try hard to extract experiences and educations when they exist, even if the text is noisy, has repeated characters (PDF extraction artifacts), or uses irregular formatting.
- For experience start_date/end_date: prefer YYYY-MM-DD; if only year is known, use "YYYY-01-01"; if year+month known, use "YYYY-MM-01".
- For educations: start_year/end_year are 4-digit year strings; gpa is empty if not stated.
- Do not invent data — but do make a best effort to map noisy text to the correct fields.
- Output must be parseable by JSON.parse on the first try.
PROMPT;
    }
}
