<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\RecordActivity;
use App\Http\Controllers\Admin\Concerns\BuildsAdminPages;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ModerateReportRequest;
use App\Models\Company;
use App\Models\JobListing;
use App\Models\Report;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminReportController extends Controller
{
    use BuildsAdminPages;

    public function index(Request $request): Response
    {
        $reports = Report::query()
            ->select(['id', 'reporter_id', 'reportable_type', 'reportable_id', 'reason', 'status', 'reviewed_by', 'reviewed_at', 'created_at'])
            ->with(['reporter:id,name,email', 'reviewer:id,name,email'])
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()))
            ->when($request->filled('subject_type'), fn ($query) => $query->where('reportable_type', $request->string('subject_type')->toString()))
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Report $report): array => [
                'id' => $report->id,
                'reporter' => $report->reporter?->name,
                'subject' => class_basename((string) $report->reportable_type).' #'.$report->reportable_id,
                'reason' => $report->reason,
                'status' => [
                    'label' => str($report->status)->headline()->toString(),
                    'tone' => $this->statusTone($report->status),
                ],
                'reviewer' => $report->reviewer?->name ?? '-',
                'created_at' => $report->created_at?->format('d M Y'),
                'actions' => $this->reportActions($report),
            ]);

        return Inertia::render('admin/resources/index', [
            'title' => 'Moderasi Report',
            'description' => 'Review laporan user, tandai proses, selesaikan, atau suspend subject jika diperlukan.',
            'indexAction' => route('admin.reports.index'),
            'filters' => [
                $this->field('status', 'Status', 'select', $request->string('status')->toString(), $this->options([
                    '' => 'Semua status',
                    'open' => 'Open',
                    'under_review' => 'Under Review',
                    'resolved' => 'Resolved',
                    'dismissed' => 'Dismissed',
                ])),
                $this->field('subject_type', 'Subject', 'select', $request->string('subject_type')->toString(), $this->options([
                    '' => 'Semua subject',
                    JobListing::class => 'Lowongan',
                    Company::class => 'Perusahaan',
                    User::class => 'Kandidat/User',
                    'App\\Models\\Message' => 'Pesan',
                ])),
            ],
            'columns' => [
                ['key' => 'reporter', 'label' => 'Reporter'],
                ['key' => 'subject', 'label' => 'Subject'],
                ['key' => 'reason', 'label' => 'Reason'],
                ['key' => 'status', 'label' => 'Status'],
                ['key' => 'reviewer', 'label' => 'Reviewer'],
                ['key' => 'created_at', 'label' => 'Tanggal'],
            ],
            'rows' => $reports,
            'emptyState' => 'Belum ada report.',
        ]);
    }

    public function show(Report $report): Response
    {
        $report->load(['reporter:id,name,email', 'reviewer:id,name,email', 'reportable']);

        return Inertia::render('admin/resources/show', [
            'title' => 'Detail Report',
            'description' => $report->reason,
            'backHref' => route('admin.reports.index'),
            'actions' => $this->reportActions($report),
            'sections' => [
                [
                    'title' => 'Report',
                    'items' => [
                        ['label' => 'Reporter', 'value' => $report->reporter?->name.' <'.$report->reporter?->email.'>'],
                        ['label' => 'Subject', 'value' => class_basename((string) $report->reportable_type).' #'.$report->reportable_id],
                        ['label' => 'Reason', 'value' => $report->reason],
                        ['label' => 'Status', 'value' => str($report->status)->headline()->toString()],
                        ['label' => 'Catatan admin', 'value' => $report->admin_note ?? '-'],
                    ],
                ],
                [
                    'title' => 'Review',
                    'items' => [
                        ['label' => 'Reviewer', 'value' => $report->reviewer?->name ?? '-'],
                        ['label' => 'Reviewed at', 'value' => $report->reviewed_at?->format('d M Y H:i') ?? '-'],
                        ['label' => 'Tanggal report', 'value' => $report->created_at?->format('d M Y H:i')],
                    ],
                ],
            ],
        ]);
    }

    public function underReview(ModerateReportRequest $request, Report $report, RecordActivity $activity): RedirectResponse
    {
        return $this->moderate($request, $report, $activity, 'under_review', 'Report ditandai sedang diproses.', 'review_report');
    }

    public function resolve(ModerateReportRequest $request, Report $report, RecordActivity $activity): RedirectResponse
    {
        return $this->moderate($request, $report, $activity, 'resolved', 'Report ditandai selesai.', 'resolve_report');
    }

    public function dismiss(ModerateReportRequest $request, Report $report, RecordActivity $activity): RedirectResponse
    {
        return $this->moderate($request, $report, $activity, 'dismissed', 'Report ditutup.', 'dismiss_report');
    }

    public function suspendSubject(ModerateReportRequest $request, Report $report, RecordActivity $activity): RedirectResponse
    {
        $subject = $report->reportable;

        match (true) {
            $subject instanceof JobListing => $subject->update(['status' => 'suspended']),
            $subject instanceof Company => $subject->update([
                'is_active' => false,
                'suspended_at' => now(),
                'suspension_reason' => $request->validated('note'),
            ]),
            $subject instanceof User => $subject->update(['is_active' => false]),
            default => null,
        };

        if (! $subject instanceof JobListing && ! $subject instanceof Company && ! $subject instanceof User) {
            $this->flash('Subject report belum mendukung aksi suspend.', 'error');

            return back();
        }

        $report->update([
            'status' => 'resolved',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'admin_note' => $request->validated('note'),
        ]);

        $activity->handle($request->user(), 'suspend_report_subject', $subject, [
            'report_id' => $report->id,
            'note' => $request->validated('note'),
        ]);

        $this->flash('Subject report berhasil disuspend.');

        return back();
    }

    private function moderate(ModerateReportRequest $request, Report $report, RecordActivity $activity, string $status, string $message, string $action): RedirectResponse
    {
        $report->update([
            'status' => $status,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'admin_note' => $request->validated('note'),
        ]);

        $activity->handle($request->user(), $action, $report, ['note' => $request->validated('note')]);
        $this->flash($message);

        return back();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function reportActions(Report $report): array
    {
        return [
            $this->action('Lihat Detail', route('admin.reports.show', $report), 'Eye'),
            $this->action('Proses', route('admin.reports.under-review', $report), 'ShieldCheck', 'patch', 'outline', 'Tandai sedang diproses?', 'Laporan akan ditandai sedang ditinjau dan tercatat atas namamu.', [
                $this->field('note', 'Catatan admin', 'textarea'),
            ]),
            $this->action('Selesai', route('admin.reports.resolve', $report), 'Check', 'patch', 'default', 'Selesaikan laporan?', 'Laporan akan ditandai selesai. Pastikan tindak lanjut sudah dilakukan.', [
                $this->field('note', 'Catatan admin', 'textarea'),
            ]),
            $this->action('Nonaktifkan Subject', route('admin.reports.suspend-subject', $report), 'Ban', 'patch', 'destructive', 'Nonaktifkan subject?', 'Subject yang dilaporkan akan dinonaktifkan dan laporan ditandai selesai. Aksi ini sulit dibatalkan.', [
                $this->field('note', 'Catatan admin', 'textarea'),
            ]),
            $this->action('Tutup', route('admin.reports.dismiss', $report), 'X', 'patch', 'outline', 'Tutup laporan?', 'Laporan akan ditandai ditolak/ditutup tanpa tindakan lanjutan.', [
                $this->field('note', 'Catatan admin', 'textarea'),
            ]),
        ];
    }
}
