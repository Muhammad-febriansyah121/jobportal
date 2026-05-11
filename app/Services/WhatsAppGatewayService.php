<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppGatewayService
{
    public function isConfigured(): bool
    {
        return $this->baseUrl() !== '' && $this->apiKey() !== '';
    }

    /**
     * @return array<string, mixed>|null
     */
    public function sendText(string $sessionId, string $to, string $text): ?array
    {
        if (trim($sessionId) === '' || trim($to) === '' || trim($text) === '') {
            return null;
        }

        return $this->request('post', '/messages/send', [
            'sessionId' => $sessionId,
            'to' => $to,
            'text' => $text,
        ], [
            'session_id' => $sessionId,
            'to' => $to,
        ]);
    }

    /**
     * @return array<string, mixed>|null
     */
    public function connectSession(string $label, bool $isNewNumber = true): ?array
    {
        if (trim($label) === '') {
            return null;
        }

        return $this->request('post', '/sessions/connect', [
            'label' => $label,
            'isNewNumber' => $isNewNumber,
        ], [
            'label' => $label,
        ]);
    }

    /**
     * @return array<string, mixed>|null
     */
    public function getSession(string $sessionId): ?array
    {
        if (trim($sessionId) === '') {
            return null;
        }

        return $this->request('get', "/sessions/{$sessionId}", null, [
            'session_id' => $sessionId,
        ]);
    }

    /**
     * @return array<string, mixed>|null
     */
    public function reconnectSession(string $sessionId): ?array
    {
        if (trim($sessionId) === '') {
            return null;
        }

        return $this->request('post', "/sessions/{$sessionId}/reconnect", [], [
            'session_id' => $sessionId,
        ]);
    }

    public function deleteSession(string $sessionId): bool
    {
        if (trim($sessionId) === '') {
            return false;
        }

        $response = $this->requestRaw('delete', "/sessions/{$sessionId}", null, [
            'session_id' => $sessionId,
        ]);

        return $response !== null;
    }

    /**
     * @param  array<string, mixed>|null  $payload
     * @param  array<string, mixed>  $context
     * @return array<string, mixed>|null
     */
    private function request(string $method, string $uri, ?array $payload, array $context = []): ?array
    {
        $response = $this->requestRaw($method, $uri, $payload, $context);

        if ($response === null) {
            return null;
        }

        $data = $response->json('data');

        if (is_array($data)) {
            return $data;
        }

        $all = $response->json();

        return is_array($all) ? $all : null;
    }

    /**
     * @param  array<string, mixed>|null  $payload
     * @param  array<string, mixed>  $context
     */
    private function requestRaw(string $method, string $uri, ?array $payload, array $context = []): ?Response
    {
        $request = $this->client();

        if ($request === null) {
            return null;
        }

        try {
            $response = $payload === null
                ? $request->{$method}($uri)
                : $request->{$method}($uri, $payload);
        } catch (\Throwable $exception) {
            Log::warning('WhatsApp gateway request failed.', [
                ...$context,
                'method' => strtoupper($method),
                'uri' => $uri,
                'error' => $exception->getMessage(),
            ]);

            return null;
        }

        if ($response->failed()) {
            Log::warning('WhatsApp gateway returned an error response.', [
                ...$context,
                'method' => strtoupper($method),
                'uri' => $uri,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return null;
        }

        return $response;
    }

    private function client(): ?PendingRequest
    {
        $baseUrl = $this->baseUrl();
        $apiKey = $this->apiKey();

        if ($baseUrl === '' || $apiKey === '') {
            return null;
        }

        return Http::baseUrl($baseUrl)
            ->acceptJson()
            ->asJson()
            ->withHeaders(['x-api-key' => $apiKey])
            ->connectTimeout($this->connectTimeout())
            ->timeout($this->timeout())
            ->retry([200, 500], throw: false);
    }

    private function baseUrl(): string
    {
        $fromConfig = trim((string) config('services.whatsapp.base_url'));
        $fromSetting = trim((string) Setting::get('whatsapp_gateway_url', ''));
        $value = $fromConfig !== '' ? $fromConfig : $fromSetting;

        return rtrim($value, '/');
    }

    private function apiKey(): string
    {
        $fromConfig = trim((string) config('services.whatsapp.api_key'));
        $fromSetting = trim((string) Setting::get('whatsapp_gateway_api_key', ''));

        return $fromConfig !== '' ? $fromConfig : $fromSetting;
    }

    private function connectTimeout(): int
    {
        $fromConfig = (int) config('services.whatsapp.connect_timeout', 0);
        $fromSetting = (int) Setting::get('whatsapp_gateway_connect_timeout', 0);
        $value = $fromConfig > 0 ? $fromConfig : $fromSetting;

        return max(1, $value > 0 ? $value : 3);
    }

    private function timeout(): int
    {
        $fromConfig = (int) config('services.whatsapp.timeout', 0);
        $fromSetting = (int) Setting::get('whatsapp_gateway_timeout', 0);
        $value = $fromConfig > 0 ? $fromConfig : $fromSetting;

        return max(1, $value > 0 ? $value : 10);
    }
}
