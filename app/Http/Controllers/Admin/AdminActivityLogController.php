<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\BuildsAdminPages;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminActivityLogController extends Controller
{
    use BuildsAdminPages;

    public function index(Request $request): Response
    {
        $logs = ActivityLog::query()
            ->select(['id', 'actor_id', 'action', 'subject_type', 'subject_id', 'properties_json', 'created_at'])
            ->with(['actor:id,name,email'])
            ->when($request->filled('action'), fn ($query) => $query->where('action', 'like', '%'.$request->string('action')->toString().'%'))
            ->when($request->filled('subject'), fn ($query) => $query->where('subject_type', 'like', '%'.$request->string('subject')->toString().'%'))
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn (ActivityLog $log): array => [
                'id' => $log->id,
                'actor' => $log->actor?->name ?? 'Sistem',
                'action' => str($log->action)->headline()->toString(),
                'subject' => $this->subjectLabel($log),
                'created_at' => $log->created_at?->format('d M Y H:i'),
                'actions' => [
                    $this->action('Lihat Detail', route('admin.activity-logs.show', $log), 'Eye'),
                ],
            ]);

        return Inertia::render('admin/resources/index', [
            'title' => 'Activity Log',
            'description' => 'Audit aksi sensitif admin dan aktivitas platform.',
            'indexAction' => route('admin.activity-logs.index'),
            'filters' => [
                $this->field('action', 'Cari aksi', 'search', $request->string('action')->toString()),
                $this->field('subject', 'Cari subject', 'search', $request->string('subject')->toString()),
            ],
            'columns' => [
                ['key' => 'actor', 'label' => 'Actor'],
                ['key' => 'action', 'label' => 'Action'],
                ['key' => 'subject', 'label' => 'Subject'],
                ['key' => 'created_at', 'label' => 'Tanggal'],
            ],
            'rows' => $logs,
            'emptyState' => 'Belum ada activity log.',
        ]);
    }

    public function show(ActivityLog $activityLog): Response
    {
        $activityLog->load(['actor:id,name,email']);

        $actionLabel = ucwords(str_replace('_', ' ', $activityLog->action));
        $properties = $activityLog->properties_json;
        $propertiesValue = ($properties === null || $properties === [])
            ? '-'
            : json_encode($properties, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        return Inertia::render('admin/resources/show', [
            'title' => 'Detail Activity Log',
            'description' => $actionLabel,
            'backHref' => route('admin.activity-logs.index'),
            'sections' => [
                [
                    'title' => 'Activity',
                    'items' => [
                        ['label' => 'Actor', 'value' => $activityLog->actor ? $activityLog->actor->name.' <'.$activityLog->actor->email.'>' : 'Sistem'],
                        ['label' => 'Action', 'value' => $actionLabel],
                        ['label' => 'Subject', 'value' => $this->subjectLabel($activityLog)],
                        ['label' => 'Tanggal', 'value' => $activityLog->created_at?->format('d M Y H:i')],
                        ['label' => 'Properties', 'value' => $propertiesValue],
                    ],
                ],
            ],
        ]);
    }

    private function subjectLabel(ActivityLog $activityLog): string
    {
        if ($activityLog->subject_type === null) {
            return '-';
        }

        return class_basename((string) $activityLog->subject_type).' #'.$activityLog->subject_id;
    }
}
