<?php

namespace App\Ai\Agents;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Attributes\MaxTokens;
use Laravel\Ai\Attributes\Model;
use Laravel\Ai\Attributes\Provider;
use Laravel\Ai\Attributes\Timeout;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\HasProviderOptions;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Promptable;

#[Provider(Lab::OpenAI)]
#[Model('gpt-5')]
#[Timeout(75)]
#[MaxTokens(2000)]
class CvParser implements Agent, HasProviderOptions, HasStructuredOutput
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
You are a meticulous CV/resume parser for the Indonesian job market. Read the ENTIRE document — including headers, footers, and sidebars where contact details often sit — and return ONLY valid JSON matching the schema.

Rules:
- Extract only real information present in the CV. NEVER invent or guess data (names, companies, dates, GPA). If a string field is unknown, return "". Use empty arrays only when a section genuinely does not exist.
- Make a best effort on noisy/irregular text (PDF extraction artifacts, repeated characters) — still map it to the correct fields when the information is clearly there.
- Dates: use YYYY-MM-DD; if only the year is known use "YYYY-01-01"; if year+month, "YYYY-MM-01". Education start_year/end_year are 4-digit year strings.
PROMPT;
    }

    /**
     * @return array<string, mixed>
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'full_name' => $schema->string()->required(),
            'headline' => $schema->string()->required(),
            'summary' => $schema->string()->required(),
            'location_city' => $schema->string()->required(),
            'location_province' => $schema->string()->required(),
            'skills' => $schema->array()->items($schema->string())->required(),
            'experiences' => $schema->array()
                ->items(
                    $schema->object(fn ($s) => [
                        'company_name' => $s->string()->required(),
                        'job_title' => $s->string()->required(),
                        'start_date' => $s->string()->required(),
                        'end_date' => $s->string()->required(),
                        'is_current' => $s->boolean()->required(),
                    ])
                )
                ->required(),
            'educations' => $schema->array()
                ->items(
                    $schema->object(fn ($s) => [
                        'institution' => $s->string()->required(),
                        'degree' => $s->string()->required(),
                        'field_of_study' => $s->string()->required(),
                        'start_year' => $s->string()->required(),
                        'end_year' => $s->string()->required(),
                        'gpa' => $s->string()->required(),
                    ])
                )
                ->required(),
        ];
    }
}
