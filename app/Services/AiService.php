<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class AiService
{
    private const API_URL = 'https://api.openai.com/v1/chat/completions';

    private const DEFAULT_MODEL = 'gpt-5';

    /**
     * @var array{prompt_tokens: int|null, completion_tokens: int|null, reasoning_tokens: int|null, total_tokens: int|null}
     */
    private array $lastUsage = [
        'prompt_tokens' => null,
        'completion_tokens' => null,
        'reasoning_tokens' => null,
        'total_tokens' => null,
    ];

    public function modelName(): string
    {
        $model = trim((string) Setting::get('ai_model', self::DEFAULT_MODEL));

        return $model !== '' ? $model : self::DEFAULT_MODEL;
    }

    /**
     * Token usage from the most recent successful chat/chatJson call.
     * Returns nulls if no call has succeeded yet (or the call failed before
     * a response was parsed). Spread into AiAuditLog::create payloads.
     *
     * @return array{prompt_tokens: int|null, completion_tokens: int|null, reasoning_tokens: int|null, total_tokens: int|null}
     */
    public function tokenUsage(): array
    {
        return $this->lastUsage;
    }

    public function chat(array $messages, int $maxTokens = 1000, float $temperature = 0.7): ?string
    {
        $this->resetUsage();

        $apiKey = Setting::get('ai_api_key');

        if (! $apiKey) {
            Log::warning('AiService: ai_api_key not configured in settings.');

            return null;
        }

        $payload = [
            'model' => $this->modelName(),
            'messages' => $messages,
            'max_completion_tokens' => $maxTokens,
        ];

        if ($this->supportsTemperature()) {
            $payload['temperature'] = $temperature;
        }

        try {
            $response = Http::withToken($apiKey)
                ->connectTimeout(5)
                ->timeout(25)
                ->post($this->endpointUrl(), $payload);
        } catch (ConnectionException $exception) {
            Log::warning('AiService: connection/timeout failure', ['message' => $exception->getMessage()]);

            return null;
        } catch (Throwable $exception) {
            Log::error('AiService: unexpected exception', ['message' => $exception->getMessage()]);

            return null;
        }

        if (! $response->successful()) {
            Log::error('AiService: API request failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return null;
        }

        $this->captureUsage($response->json('usage'));

        return $response->json('choices.0.message.content');
    }

    /**
     * @param  array<int, array{role: string, content: string}>  $messages
     * @param  array<string, mixed>  $schema
     * @return array<string, mixed>|null
     */
    public function chatJson(array $messages, array $schema, string $schemaName, int $maxTokens = 1600): ?array
    {
        $this->resetUsage();

        $apiKey = Setting::get('ai_api_key');

        if (! $apiKey) {
            Log::warning('AiService: ai_api_key not configured in settings.');

            return null;
        }

        $payload = [
            'model' => $this->modelName(),
            'messages' => $messages,
            'max_completion_tokens' => $maxTokens,
            'response_format' => [
                'type' => 'json_schema',
                'json_schema' => [
                    'name' => $schemaName,
                    'strict' => true,
                    'schema' => $schema,
                ],
            ],
        ];

        if ($this->supportsTemperature()) {
            $payload['temperature'] = 0.2;
        }

        try {
            $response = Http::withToken($apiKey)
                ->connectTimeout(5)
                ->timeout(25)
                ->post($this->endpointUrl(), $payload);
        } catch (ConnectionException $exception) {
            Log::warning('AiService: structured connection/timeout failure', ['message' => $exception->getMessage()]);

            return null;
        } catch (Throwable $exception) {
            Log::error('AiService: structured unexpected exception', ['message' => $exception->getMessage()]);

            return null;
        }

        if (! $response->successful()) {
            Log::error('AiService: structured API request failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return null;
        }

        $content = $response->json('choices.0.message.content');

        if (! is_string($content) || trim($content) === '') {
            return null;
        }

        $decoded = json_decode($content, true);

        if (! is_array($decoded)) {
            return null;
        }

        $this->captureUsage($response->json('usage'));

        return $decoded;
    }

    private function resetUsage(): void
    {
        $this->lastUsage = [
            'prompt_tokens' => null,
            'completion_tokens' => null,
            'reasoning_tokens' => null,
            'total_tokens' => null,
        ];
    }

    /**
     * @param  array<string, mixed>|null  $usage
     */
    private function captureUsage(?array $usage): void
    {
        if (! is_array($usage)) {
            return;
        }

        $this->lastUsage = [
            'prompt_tokens' => $this->intOrNull($usage['prompt_tokens'] ?? null),
            'completion_tokens' => $this->intOrNull($usage['completion_tokens'] ?? null),
            'reasoning_tokens' => $this->intOrNull($usage['completion_tokens_details']['reasoning_tokens'] ?? null),
            'total_tokens' => $this->intOrNull($usage['total_tokens'] ?? null),
        ];
    }

    private function intOrNull(mixed $value): ?int
    {
        return is_numeric($value) ? (int) $value : null;
    }

    private function supportsTemperature(): bool
    {
        $model = strtolower($this->modelName());

        // GPT-5 and o-series reasoning models only support default temperature (1).
        if (str_starts_with($model, 'gpt-5') || str_starts_with($model, 'o1') || str_starts_with($model, 'o3') || str_starts_with($model, 'o4')) {
            return false;
        }

        return true;
    }

    private function endpointUrl(): string
    {
        $configuredUrl = trim((string) Setting::get('ai_api_url', ''));

        if ($configuredUrl !== '') {
            return $configuredUrl;
        }

        return self::API_URL;
    }
}
