<?php

namespace App\Ai\Agents;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Attributes\MaxTokens;
use Laravel\Ai\Attributes\Provider;
use Laravel\Ai\Attributes\Timeout;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Promptable;

#[Provider(Lab::OpenAI)]
#[Timeout(120)]
#[MaxTokens(2000)]
class CvUploadParser implements Agent, HasStructuredOutput
{
    use Promptable;

    public function instructions(): string
    {
        return <<<'PROMPT'
You are a CV/resume parser. Extract structured information from the given CV text.
Return only valid JSON matching the schema. If a field is not found, use empty string or empty array.
For dates use YYYY-MM-DD format. For years use integer (e.g. 2020).
Extract only real information — do not invent or hallucinate data.
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
            'phone' => $schema->string()->required(),
            'location_city' => $schema->string()->required(),
            'location_province' => $schema->string()->required(),
            'linkedin_url' => $schema->string()->required(),
            'github_url' => $schema->string()->required(),
            'portfolio_url' => $schema->string()->required(),
            'skills' => $schema->array()->items($schema->string())->required(),
            'experiences' => $schema->array()
                ->items(
                    $schema->object(fn ($s) => [
                        'company_name' => $s->string()->required(),
                        'job_title' => $s->string()->required(),
                        'start_date' => $s->string()->required(),
                        'end_date' => $s->string()->required(),
                        'is_current' => $s->boolean()->required(),
                        'location' => $s->string()->required(),
                        'description' => $s->string()->required(),
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
