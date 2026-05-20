<?php

namespace App\Http\Controllers\Admin;

use App\Ai\Agents\AiHealthProbe;
use App\Http\Controllers\Controller;
use App\Services\AiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class AdminAiHealthController extends Controller
{
    public function show(AiService $ai): Response
    {
        return Inertia::render('admin/ai-health/index', [
            'snapshot' => [
                'configured' => $ai->isConfigured(),
                'model' => $ai->modelName(),
            ],
        ]);
    }

    public function run(AiService $ai): JsonResponse
    {
        if (! $ai->isConfigured()) {
            return response()->json([
                'ok' => false,
                'configured' => false,
                'model' => $ai->modelName(),
                'latency_ms' => null,
                'message' => 'OPENAI_API_KEY belum diatur di .env (atau ai_api_key di settings). AI tidak akan jalan sampai key valid disiapkan.',
            ]);
        }

        @set_time_limit(60);
        $startedAt = microtime(true);
        $reply = null;
        $errorMessage = null;
        $usage = ['prompt_tokens' => null, 'completion_tokens' => null, 'reasoning_tokens' => null, 'total_tokens' => null];

        try {
            $response = (new AiHealthProbe)->prompt(
                'ping',
                model: $ai->modelName(),
            );
            $reply = $response->text;

            $promptTokens = $response->usage?->promptTokens;
            $completionTokens = $response->usage?->completionTokens;
            $reasoningTokens = $response->usage?->reasoningTokens;
            $usage = [
                'prompt_tokens' => $promptTokens,
                'completion_tokens' => $completionTokens,
                'reasoning_tokens' => $reasoningTokens,
                'total_tokens' => ($promptTokens ?? 0) + ($completionTokens ?? 0) + ($reasoningTokens ?? 0),
            ];
        } catch (Throwable $exception) {
            $reply = null;
            $errorMessage = $exception->getMessage();
            Log::warning('AiHealthProbe failed', [
                'model' => $ai->modelName(),
                'exception' => $exception::class,
                'message' => $errorMessage,
            ]);
        }

        $latencyMs = (int) round((microtime(true) - $startedAt) * 1000);
        $ok = is_string($reply) && trim($reply) !== '';

        return response()->json([
            'ok' => $ok,
            'configured' => true,
            'model' => $ai->modelName(),
            'latency_ms' => $latencyMs,
            'reply_preview' => $ok ? mb_substr(trim($reply), 0, 120) : null,
            'token_usage' => $usage,
            'message' => $ok
                ? 'AI provider sehat. Key valid, model menjawab, latency tercatat.'
                : ($errorMessage !== null
                    ? 'AI provider gagal menjawab: '.mb_substr($errorMessage, 0, 240)
                    : 'AI provider tidak menjawab. Cek tail log (storage/logs/laravel.log) untuk error API atau timeout terbaru.'),
        ]);
    }
}
