<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\ScrapedJob;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminJobseekerReportController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();
        $tab = in_array($request->string('tab')->toString(), ['list', 'analytics', 'candidates'], true)
            ? $request->string('tab')->toString()
            : 'list';

        $applications = Application::query()
            ->whereNotNull('scraped_job_id')
            ->where('applied_at', '>=', $this->reportStart())
            ->get(['scraped_job_id', 'candidate_id', 'status', 'applied_at']);

        $jobs = ScrapedJob::query()
            ->select(['id', 'title', 'company_name', 'status', 'imported_at'])
            ->withCount([
                'applications',
                'applications as shortlisted_count' => fn ($query) => $query->where('status', 'shortlisted'),
                'applications as interview_count' => fn ($query) => $query->where('status', 'interview'),
                'applications as hired_count' => fn ($query) => $query->where('status', 'hired'),
                'applications as email_sent_count' => fn ($query) => $query->where('email_status', 'sent'),
                'applications as email_failed_count' => fn ($query) => $query->where('email_status', 'failed'),
                'applications as email_pending_count' => fn ($query) => $query->whereIn('email_status', ['queued', 'sending', 'pending_smtp']),
            ])
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('title', 'like', "%{$search}%")
                        ->orWhere('company_name', 'like', "%{$search}%");
                });
            })
            ->whereHas('applications')
            ->orderByDesc('applications_count')
            ->orderByDesc('id')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (ScrapedJob $job): array => [
                'id' => $job->id,
                'title' => $job->title,
                'company' => $job->company_name ?? 'Tanpa perusahaan',
                'status' => $this->emailStatusForJob($job),
                'applications' => (int) $job->applications_count,
                'shortlisted' => (int) $job->shortlisted_count,
                'interview' => (int) $job->interview_count,
                'hired' => (int) $job->hired_count,
                'published_at' => $job->imported_at?->format('d M Y') ?? '-',
            ]);

        $applicants = Application::query()
            ->select(['id', 'scraped_job_id', 'candidate_id', 'status', 'email_status', 'email_sent_at', 'applied_at'])
            ->with([
                'candidate:id,user_id,full_name',
                'candidate.user:id,name,email',
                'scrapedJob:id,title,company_name',
            ])
            ->whereNotNull('scraped_job_id')
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($query) use ($search): void {
                    $query->whereHas('candidate', fn ($candidate) => $candidate
                        ->where('full_name', 'like', "%{$search}%")
                        ->orWhereHas('user', fn ($user) => $user
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")))
                        ->orWhereHas('scrapedJob', fn ($job) => $job
                            ->where('title', 'like', "%{$search}%")
                            ->orWhere('company_name', 'like', "%{$search}%"));
                });
            })
            ->latest('applied_at')
            ->paginate(10, pageName: 'candidates_page')
            ->withQueryString()
            ->through(fn (Application $application): array => [
                'id' => $application->id,
                'candidate' => $application->candidate?->full_name ?? $application->candidate?->user?->name ?? 'Kandidat tanpa nama',
                'email' => $application->candidate?->user?->email ?? '-',
                'job' => $application->scrapedJob?->title ?? '-',
                'company' => $application->scrapedJob?->company_name ?? 'Perusahaan eksternal',
                'status' => $application->status,
                'email_status' => $application->email_status,
                'email_sent_at' => $application->email_sent_at?->format('d M Y H:i'),
                'applied_at' => $application->applied_at?->format('d M Y H:i') ?? '-',
            ]);

        $statusCounts = Application::query()
            ->whereNotNull('scraped_job_id')
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status')
            ->map(fn (mixed $total): int => (int) $total)
            ->all();

        $trend = collect(range(0, 11))->map(function (int $offset) use ($applications): array {
            $month = $this->reportStart()->addMonths($offset);
            $monthApplications = $applications->filter(fn (Application $application): bool => $application->applied_at?->format('Y-m') === $month->format('Y-m'));

            return [
                'month' => $month->format('Y-m'),
                'applications' => $monthApplications->count(),
                'candidates' => $monthApplications->pluck('candidate_id')->unique()->count(),
                'hired' => $monthApplications->where('status', 'hired')->count(),
            ];
        })->values()->all();

        $topJobs = ScrapedJob::query()
            ->withCount('applications')
            ->whereHas('applications')
            ->orderByDesc('applications_count')
            ->limit(7)
            ->get(['id', 'title', 'company_name'])
            ->map(fn (ScrapedJob $job): array => [
                'title' => $job->title,
                'company' => $job->company_name ?? 'Tanpa perusahaan',
                'applications' => (int) $job->applications_count,
            ])->values()->all();

        $totalApplications = Application::whereNotNull('scraped_job_id')->count();
        $respondedApplications = Application::whereNotNull('scraped_job_id')->whereNotIn('status', ['applied', 'withdrawn'])->count();

        return Inertia::render('admin/jobseeker-reports', [
            'jobs' => $jobs,
            'applicants' => $applicants,
            'filters' => ['search' => $search, 'tab' => $tab],
            'summary' => [
                'total_applications' => $totalApplications,
                'unique_candidates' => Application::whereNotNull('scraped_job_id')->distinct('candidate_id')->count('candidate_id'),
                'active_jobs' => ScrapedJob::whereIn('status', ScrapedJob::VISIBLE_STATUSES)->count(),
                'hired_candidates' => (int) ($statusCounts['hired'] ?? 0),
                'response_rate' => $totalApplications > 0 ? round(($respondedApplications / $totalApplications) * 100, 1) : 0,
            ],
            'trend' => $trend,
            'statusCounts' => $statusCounts,
            'topJobs' => $topJobs,
        ]);
    }

    private function reportStart(): CarbonImmutable
    {
        return CarbonImmutable::now()->startOfMonth()->subMonths(11);
    }

    private function emailStatusForJob(ScrapedJob $job): string
    {
        if ((int) $job->email_failed_count > 0) {
            return 'failed';
        }

        if ((int) $job->email_pending_count > 0) {
            return 'queued';
        }

        if ((int) $job->applications_count > 0 && (int) $job->email_sent_count === (int) $job->applications_count) {
            return 'sent';
        }

        return 'pending';
    }
}
