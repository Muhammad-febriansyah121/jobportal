<?php

namespace App\Ai\Agents;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Attributes\MaxTokens;
use Laravel\Ai\Attributes\Model;
use Laravel\Ai\Attributes\Provider;
use Laravel\Ai\Attributes\Timeout;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Promptable;

#[Provider(Lab::OpenAI)]
#[Model('gpt-4o')]
#[Timeout(120)]
#[MaxTokens(2000)]
class CvUploadParser implements Agent, HasStructuredOutput
{
    use Promptable;

    public function instructions(): string
    {
        return <<<'PROMPT'
You are a meticulous CV/resume parser for the Indonesian job market. The CV is
provided either as an ATTACHED PDF DOCUMENT or as raw text extracted from a
PDF/DOCX file. When a PDF is attached, read it directly and visually — do not
rely on noisy extracted text.

Read the ENTIRE document, including headers, footers, sidebars, and contact
blocks: contact details are frequently placed in those areas next to small
icons rather than in the body.

Return only valid JSON matching the schema. If a field is not found, use an
empty string or empty array. Extract only real information — never invent or
hallucinate data.

Contact details (capture these with extra care, they are the most common miss):
- phone: the candidate's phone number. Indonesian numbers appear as
  "+62 812-3456-7890", "0812 3456 7890", "0812.3456.7890", "(021) 123-4567",
  or beside a phone icon. Capture every digit even when separated by spaces,
  dots, dashes, or parentheses. Return the number as written.
- email: the candidate's email address.
- linkedin_url / github_url / portfolio_url: the full URLs when present.

Dates: use YYYY-MM-DD for experience dates; if only the year is known use
"YYYY-01-01". For education start_year/end_year use a 4-digit year string.
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
            'email' => $schema->string()->required(),
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
