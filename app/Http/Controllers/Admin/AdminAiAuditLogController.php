<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\RecordActivity;
use App\Http\Controllers\Admin\Concerns\BuildsAdminPages;
use App\Http\Controllers\Controller;
use App\Models\AiAuditLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminAiAuditLogController extends Controller
{
    use BuildsAdminPages;

    public function index(Request $request): Response
    {
        $logs = AiAuditLog::query()
            ->select(['id', 'user_id', 'feature', 'input_hash', 'model_name', 'status', 'created_at'])
            ->with(['user:id,name,email'])
            ->when($request->filled('feature'), fn ($query) => $query->where('feature', $request->string('feature')->toString()))
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()))
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn (AiAuditLog $log): array => [
                'id' => $log->id,
                'feature' => str($log->feature)->headline()->toString(),
                'user' => $log->user?->name ?? 'Sistem',
                'model_name' => $log->model_name,
                'input_hash' => $log->input_hash,
                'status' => [
                    'label' => str($log->status)->headline()->toString(),
                    'tone' => $this->statusTone($log->status),
                ],
                'created_at' => $log->created_at?->format('d M Y H:i'),
                'actions' => $this->aiLogActions($log),
            ]);

        return Inertia::render('admin/resources/index', [
            'title' => 'AI Audit Log',
            'description' => 'Audit input hash, output JSON, model name, status, dan retry request untuk AI job yang gagal.',
            'indexAction' => route('admin.ai-audit-logs.index'),
            'filters' => [
                $this->field('feature', 'Feature', 'select', $request->string('feature')->toString(), $this->featureOptions()),
                $this->field('status', 'Status', 'select', $request->string('status')->toString(), $this->statusOptions()),
            ],
            'columns' => [
                ['key' => 'feature', 'label' => 'Feature'],
                ['key' => 'user', 'label' => 'User'],
                ['key' => 'model_name', 'label' => 'Model'],
                ['key' => 'input_hash', 'label' => 'Input hash'],
                ['key' => 'status', 'label' => 'Status'],
                ['key' => 'created_at', 'label' => 'Tanggal'],
            ],
            'rows' => $logs,
            'emptyState' => 'Belum ada AI audit log.',
        ]);
    }

    public function show(AiAuditLog $aiAuditLog): Response
    {
        $aiAuditLog->load(['user:id,name,email']);

        return Inertia::render('admin/resources/show', [
            'title' => 'Detail AI Log',
            'description' => str($aiAuditLog->feature)->headline()->toString(),
            'backHref' => route('admin.ai-audit-logs.index'),
            'actions' => $this->aiLogActions($aiAuditLog),
            'sections' => [
                [
                    'title' => 'Audit',
                    'items' => [
                        ['label' => 'Feature', 'value' => str($aiAuditLog->feature)->headline()->toString()],
                        ['label' => 'User', 'value' => $aiAuditLog->user?->name.' <'.$aiAuditLog->user?->email.'>'],
                        ['label' => 'Model', 'value' => $aiAuditLog->model_name],
                        ['label' => 'Status', 'value' => str($aiAuditLog->status)->headline()->toString()],
                        ['label' => 'Input hash', 'value' => $aiAuditLog->input_hash],
                        ['label' => 'Created at', 'value' => $aiAuditLog->created_at?->format('d M Y H:i')],
                    ],
                ],
                [
                    'title' => 'Output JSON',
                    'items' => [
                        ['label' => 'Output', 'value' => json_encode($aiAuditLog->output_json, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)],
                    ],
                ],
            ],
        ]);
    }

    public function retry(Request $request, AiAuditLog $aiAuditLog, RecordActivity $activity): RedirectResponse
    {
        if ($aiAuditLog->status !== 'failed') {
            $this->flash('Hanya AI log dengan status failed yang bisa diminta retry.', 'error');

            return back();
        }

        $aiAuditLog->update(['status' => 'retry_requested']);
        $activity->handle($request->user(), 'retry_ai_audit_log', $aiAuditLog);

        $this->flash('Retry AI job ditandai untuk diproses aman.');

        return back();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function aiLogActions(AiAuditLog $log): array
    {
        return [
            $this->action('Lihat Detail', route('admin.ai-audit-logs.show', $log), 'Eye'),
            $this->action('Retry', route('admin.ai-audit-logs.retry', $log), 'ShieldCheck', 'patch', 'outline', 'Retry AI job?', 'Status log failed akan ditandai retry_requested.'),
        ];
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function featureOptions(): array
    {
        return [
            ['value' => '', 'label' => 'Semua feature'],
            ...AiAuditLog::query()
                ->select('feature')
                ->distinct()
                ->orderBy('feature')
                ->pluck('feature')
                ->map(fn (string $feature): array => ['value' => $feature, 'label' => str($feature)->headline()->toString()])
                ->all(),
        ];
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function statusOptions(): array
    {
        return [
            ['value' => '', 'label' => 'Semua status'],
            ...AiAuditLog::query()
                ->select('status')
                ->distinct()
                ->orderBy('status')
                ->pluck('status')
                ->map(fn (string $status): array => ['value' => $status, 'label' => str($status)->headline()->toString()])
                ->all(),
        ];
    }
}
