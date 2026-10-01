<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\JobListing;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminJobseekerReportController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();
        $applications = Application::query()
            ->whereNotNull('job_listing_id')
            ->where('applied_at', '>=', $this->reportStart())
            ->get(['job_listing_id', 'candidate_id', 'status', 'applied_at']);

        $jobs = JobListing::query()
            ->select(['id', 'company_id', 'title', 'status', 'published_at'])
            ->with('company:id,name')
            ->withCount([
                'applications',
                'applications as shortlisted_count' => fn ($query) => $query->where('status', 'shortlisted'),
                'applications as interview_count' => fn ($query) => $query->where('status', 'interview'),
                'applications as hired_count' => fn ($query) => $query->where('status', 'hired'),
            ])
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('title', 'like', "%{$search}%")
                        ->orWhereHas('company', fn ($company) => $company->where('name', 'like', "%{$search}%"));
                });
            })
            ->whereHas('applications')
            ->orderByDesc('applications_count')
            ->orderByDesc('id')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (JobListing $job): array => [
                'id' => $job->id,
                'title' => $job->title,
                'company' => $job->company?->name ?? 'Tanpa perusahaan',
                'status' => $job->status,
                'applications' => (int) $job->applications_count,
                'shortlisted' => (int) $job->shortlisted_count,
                'interview' => (int) $job->interview_count,
                'hired' => (int) $job->hired_count,
                'published_at' => $job->published_at?->format('d M Y') ?? '-',
            ]);

        $statusCounts = Application::query()
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

        $topJobs = JobListing::query()
            ->with('company:id,name')
            ->withCount('applications')
            ->whereHas('applications')
            ->orderByDesc('applications_count')
            ->limit(7)
            ->get(['id', 'title', 'company_id'])
            ->map(fn (JobListing $job): array => [
                'title' => $job->title,
                'company' => $job->company?->name ?? 'Tanpa perusahaan',
                'applications' => (int) $job->applications_count,
            ])->values()->all();

        $totalApplications = Application::count();
        $respondedApplications = Application::whereNotIn('status', ['applied', 'withdrawn'])->count();

        return Inertia::render('admin/jobseeker-reports', [
            'jobs' => $jobs,
            'filters' => ['search' => $search],
            'summary' => [
                'total_applications' => $totalApplications,
                'unique_candidates' => Application::distinct('candidate_id')->count('candidate_id'),
                'active_jobs' => JobListing::where('status', 'published')->count(),
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
}
