<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\AiService;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

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

        $startedAt = microtime(true);
        $reply = $ai->chat([
            ['role' => 'system', 'content' => 'You are a health probe. Reply with the single word OK.'],
            ['role' => 'user', 'content' => 'ping'],
        ], maxTokens: 20, temperature: 0.0);
        $latencyMs = (int) round((microtime(true) - $startedAt) * 1000);

        $usage = $ai->tokenUsage();
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
                : 'AI provider tidak menjawab. Cek tail log (storage/logs/laravel.log) untuk error API atau timeout terbaru.',
        ]);
    }
}
