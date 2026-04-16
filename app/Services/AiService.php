<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiService
{
    private const API_URL = 'https://ai.sumopod.com/v1/chat/completions';

    private const MODEL = 'gpt-4o-mini';

    public function chat(array $messages, int $maxTokens = 1000, float $temperature = 0.7): ?string
    {
        $apiKey = Setting::get('ai_api_key');

        if (! $apiKey) {
            Log::warning('AiService: ai_api_key not configured in settings.');

            return null;
        }

        $response = Http::withToken($apiKey)
            ->timeout(60)
            ->post(self::API_URL, [
                'model' => self::MODEL,
                'messages' => $messages,
                'max_tokens' => $maxTokens,
                'temperature' => $temperature,
            ]);

        if (! $response->successful()) {
            Log::error('AiService: API request failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return null;
        }

        return $response->json('choices.0.message.content');
    }
}
