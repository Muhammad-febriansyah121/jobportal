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
class CvParser implements Agent, HasStructuredOutput
{
    use Promptable;

    public function instructions(): string
    {
        return 'You are a CV/resume parser. Extract structured information. Return only valid JSON. For dates use YYYY-MM-DD. For years use integers (as strings). Do not invent data. If a field is unknown, return an empty string.';
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
