<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\AiAuditLog;
use App\Models\Application;
use App\Models\Company;
use App\Models\JobListing;
use App\Models\Report;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $metrics = Cache::remember('admin.dashboard.metrics', now()->addSeconds(60), fn (): array => [
            'total_users' => User::count(),
            'total_candidates' => User::where('role', 'candidate')->count(),
            'total_companies' => Company::count(),
            'total_mentors' => User::where('role', 'mentor')->count(),
            'active_jobs' => JobListing::where('status', 'published')->count(),
            'total_applications' => Application::count(),
            'pending_company_verifications' => Company::where('verification_status', 'pending')->count(),
            'pending_reports' => Report::whereIn('status', ['open', 'pending'])->count(),
            'active_subscriptions' => Subscription::where('status', 'active')->count(),
            'ai_usage' => [
                'total' => AiAuditLog::count(),
                'failed' => AiAuditLog::where('status', 'failed')->count(),
                'success' => AiAuditLog::where('status', 'success')->count(),
            ],
        ]);

        return Inertia::render('admin/dashboard', [
            'metrics' => $metrics,
            'aiUsageByFeature' => AiAuditLog::query()
                ->selectRaw('feature, count(*) as total')
                ->groupBy('feature')
                ->orderByDesc('total')
                ->limit(6)
                ->get()
                ->map(fn (AiAuditLog $log): array => [
                    'feature' => $log->feature,
                    'total' => (int) $log->total,
                ]),
            'recentActivity' => ActivityLog::query()
                ->select(['id', 'actor_id', 'action', 'subject_type', 'subject_id', 'created_at'])
                ->with(['actor:id,name,email'])
                ->latest()
                ->limit(8)
                ->get()
                ->map(fn (ActivityLog $activity): array => [
                    'id' => $activity->id,
                    'actor' => $activity->actor?->name ?? 'Sistem',
                    'action' => str($activity->action)->headline()->toString(),
                    'subject' => class_basename((string) $activity->subject_type).' #'.$activity->subject_id,
                    'created_at' => $activity->created_at?->diffForHumans(),
                ]),
        ]);
    }
}
