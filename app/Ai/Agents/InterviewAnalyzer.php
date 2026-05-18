<?php

namespace App\Ai\Agents;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Attributes\MaxTokens;
use Laravel\Ai\Attributes\Provider;
use Laravel\Ai\Attributes\Timeout;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\HasProviderOptions;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Promptable;

#[Provider(Lab::OpenAI)]
#[Timeout(180)]
#[MaxTokens(2400)]
class InterviewAnalyzer implements Agent, HasProviderOptions, HasStructuredOutput
{
    use Promptable;

    public function instructions(): string
    {
        return 'Anda adalah analis interview kerja Karivia. Nilai jawaban kandidat secara adil, berbasis bukti, dan kembalikan JSON sesuai schema.';
    }

    public function providerOptions(Lab|string $provider): array
    {
        return match ($provider) {
            Lab::OpenAI => ['reasoning' => ['effort' => 'high']],
            default => [],
        };
    }

    /**
     * @return array<string, mixed>
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'fit_score' => $schema->integer()->min(0)->max(100)->required(),
            'recommendation' => $schema->string()->required(),
            'summary' => $schema->string()->required(),
            'strengths' => $schema->array()->items($schema->string())->required(),
            'weaknesses' => $schema->array()->items($schema->string())->required(),
            'technical_scorecard' => $schema->array()
                ->items(
                    $schema->object(fn ($s) => [
                        'label' => $s->string()->required(),
                        'score' => $s->integer()->min(0)->max(100)->required(),
                    ])
                )
                ->required(),
            'response_scores' => $schema->array()
                ->items(
                    $schema->object(fn ($s) => [
                        'question_id' => $s->integer()->required(),
                        'score' => $s->integer()->min(0)->max(100)->required(),
                        'analysis' => $s->string()->required(),
                    ])
                )
                ->required(),
        ];
    }
}
