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
            ->select(['id', 'user_id', 'feature', 'input_hash', 'model_name', 'status', 'total_tokens', 'created_at'])
            ->with(['user:id,name,email'])
            ->when($request->filled('feature'), fn ($query) => $query->where('feature', $request->string('feature')->toString()))
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()))
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn (AiAuditLog $log): array => [
                'id' => $log->id,
                'feature' => $this->featureLabel($log->feature),
                'user' => $log->user?->name ?? 'Sistem',
                'model_name' => $log->model_name,
                'input_hash' => $log->input_hash,
                'status' => [
                    'label' => str($log->status)->headline()->toString(),
                    'tone' => $this->statusTone($log->status),
                ],
                'total_tokens' => $log->total_tokens !== null ? number_format($log->total_tokens) : '—',
                'created_at' => $log->created_at?->format('d M Y H:i'),
                'actions' => $this->aiLogActions($log),
            ]);

        $totals = AiAuditLog::query()
            ->when($request->filled('feature'), fn ($query) => $query->where('feature', $request->string('feature')->toString()))
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()))
            ->selectRaw('SUM(prompt_tokens) AS prompt_sum, SUM(completion_tokens) AS completion_sum, SUM(reasoning_tokens) AS reasoning_sum, SUM(total_tokens) AS total_sum, COUNT(*) AS row_count')
            ->first();

        return Inertia::render('admin/resources/index', [
            'title' => 'AI Audit Log',
            'description' => 'Audit input hash, output JSON, model name, status, token usage, dan retry request untuk AI job yang gagal.',
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
                ['key' => 'total_tokens', 'label' => 'Tokens'],
                ['key' => 'created_at', 'label' => 'Tanggal'],
            ],
            'rows' => $logs,
            'emptyState' => 'Belum ada AI audit log.',
            'summary' => [
                'rows' => (int) ($totals->row_count ?? 0),
                'prompt_tokens' => (int) ($totals->prompt_sum ?? 0),
                'completion_tokens' => (int) ($totals->completion_sum ?? 0),
                'reasoning_tokens' => (int) ($totals->reasoning_sum ?? 0),
                'total_tokens' => (int) ($totals->total_sum ?? 0),
            ],
        ]);
    }

    public function show(AiAuditLog $aiAuditLog): Response
    {
        $aiAuditLog->load(['user:id,name,email']);

        return Inertia::render('admin/ai-audit-logs/show', [
            'log' => [
                'id' => $aiAuditLog->id,
                'feature' => str($aiAuditLog->feature)->headline()->toString(),
                'user_name' => $aiAuditLog->user?->name ?? 'Sistem',
                'user_email' => $aiAuditLog->user?->email ?? '-',
                'model_name' => $aiAuditLog->model_name ?? '-',
                'status' => $aiAuditLog->status,
                'input_hash' => $aiAuditLog->input_hash ?? '-',
                'input_json' => $aiAuditLog->input_json,
                'output_json' => $aiAuditLog->output_json,
                'prompt_tokens' => $aiAuditLog->prompt_tokens,
                'completion_tokens' => $aiAuditLog->completion_tokens,
                'reasoning_tokens' => $aiAuditLog->reasoning_tokens,
                'total_tokens' => $aiAuditLog->total_tokens,
                'created_at' => $aiAuditLog->created_at?->format('d M Y H:i'),
            ],
            'backHref' => route('admin.ai-audit-logs.index'),
            'actions' => $this->aiLogActions($aiAuditLog),
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
            $this->action('Lihat Detail', route('admin.ai-audit-logs.show', $log), 'Eye', 'get', 'default'),
            $this->action('Retry', route('admin.ai-audit-logs.retry', $log), 'ShieldCheck', 'patch', 'violet', 'Retry AI job?', 'Status log failed akan ditandai retry_requested.'),
        ];
    }

    private function featureLabel(string $feature): string
    {
        return match ($feature) {
            'candidate_dashboard_insight' => 'Insight Dashboard Kandidat',
            'candidate_cv_builder_draft' => 'Pembuat Draft CV Kandidat',
            'candidate.ai_interview.analysis' => 'Analisis Interview AI Kandidat',
            'job_ai_insight' => 'Insight Lowongan AI',
            'employer_talent_search_rerank' => 'Pencarian Talent (Employer)',
            'admin_company_insight' => 'Insight Perusahaan (Admin)',
            'admin_user_summary' => 'Ringkasan Pengguna (Admin)',
            default => str($feature)->headline()->toString(),
        };
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
                ->map(fn (string $feature): array => ['value' => $feature, 'label' => $this->featureLabel($feature)])
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
