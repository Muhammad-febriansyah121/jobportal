<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiService
{
    private const API_URL = 'https://api.openai.com/v1/chat/completions';

    private const DEFAULT_MODEL = 'gpt-5';

    public function modelName(): string
    {
        $model = trim((string) Setting::get('ai_model', self::DEFAULT_MODEL));

        return $model !== '' ? $model : self::DEFAULT_MODEL;
    }

    public function chat(array $messages, int $maxTokens = 1000, float $temperature = 0.7): ?string
    {
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

        $response = Http::withToken($apiKey)
            ->timeout(60)
            ->post($this->endpointUrl(), $payload);

        if (! $response->successful()) {
            Log::error('AiService: API request failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return null;
        }

        return $response->json('choices.0.message.content');
    }

    /**
     * @param  array<int, array{role: string, content: string}>  $messages
     * @param  array<string, mixed>  $schema
     * @return array<string, mixed>|null
     */
    public function chatJson(array $messages, array $schema, string $schemaName, int $maxTokens = 1600): ?array
    {
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

        $response = Http::withToken($apiKey)
            ->timeout(60)
            ->post($this->endpointUrl(), $payload);

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

        return is_array($decoded) ? $decoded : null;
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
