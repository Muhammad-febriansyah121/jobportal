<?php

namespace App\Http\Controllers\Employer;

use App\Actions\Employer\ResolveEmployerCompany;
use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\JobListing;
use App\Models\JobListingAnalytic;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class EmployerAnalyticsController extends Controller
{
    public function __invoke(Request $request, ResolveEmployerCompany $resolveEmployerCompany): Response
    {
        $company = $resolveEmployerCompany->handle($request->user());

        if ($company === null) {
            return Inertia::render('employer/analytics', [
                'hasCompany' => false,
                'overview' => [],
                'pipeline' => [],
                'topJobs' => [],
                'applicationsTrend' => [],
                'viewsTrend' => [],
            ]);
        }

        $jobIds = $company->jobListings()->pluck('id');
        $since = Carbon::now()->subDays(30)->startOfDay();

        // Overview metrics
        $totalApplications = Application::query()
            ->whereIn('job_listing_id', $jobIds)
            ->count();

        $hiredCount = Application::query()
            ->whereIn('job_listing_id', $jobIds)
            ->where('status', 'hired')
            ->count();

        $avgFitScore = Application::query()
            ->whereIn('job_listing_id', $jobIds)
            ->whereNotNull('ai_fit_score')
            ->avg('ai_fit_score');

        $totalViews = JobListingAnalytic::query()
            ->whereIn('job_listing_id', $jobIds)
            ->where('date', '>=', $since)
            ->sum('views_count');

        $totalClicks = JobListingAnalytic::query()
            ->whereIn('job_listing_id', $jobIds)
            ->where('date', '>=', $since)
            ->sum('apply_clicks_count');

        $conversionRate = $totalViews > 0
            ? round(($totalClicks / $totalViews) * 100, 1)
            : 0;

        // Pipeline by status
        $pipelineRaw = Application::query()
            ->selectRaw('status, count(*) as total')
            ->whereIn('job_listing_id', $jobIds)
            ->groupBy('status')
            ->pluck('total', 'status');

        $pipeline = collect(['applied', 'screened', 'shortlisted', 'interview', 'offer', 'hired', 'rejected', 'withdrawn'])
            ->map(fn (string $status): array => [
                'status' => $status,
                'label' => str($status)->headline()->toString(),
                'total' => (int) ($pipelineRaw[$status] ?? 0),
            ])
            ->filter(fn (array $s): bool => $s['total'] > 0)
            ->values()
            ->all();

        // Top jobs by applications (last 30 days)
        $topJobs = JobListing::query()
            ->select(['id', 'company_id', 'title', 'status', 'published_at'])
            ->whereIn('id', $jobIds)
            ->withCount([
                'applications',
                'applications as hired_count' => fn ($q) => $q->where('status', 'hired'),
            ])
            ->withSum(['analytics as views_total' => fn ($q) => $q->where('date', '>=', $since)], 'views_count')
            ->withSum(['analytics as clicks_total' => fn ($q) => $q->where('date', '>=', $since)], 'apply_clicks_count')
            ->orderByDesc('applications_count')
            ->limit(10)
            ->get()
            ->map(fn (JobListing $job): array => [
                'id' => $job->id,
                'title' => $job->title,
                'status' => $job->status,
                'applications_count' => $job->applications_count,
                'hired_count' => $job->hired_count,
                'views_total' => (int) ($job->views_total ?? 0),
                'clicks_total' => (int) ($job->clicks_total ?? 0),
                'conversion_rate' => $job->views_total > 0
                    ? round(((int) $job->clicks_total / (int) $job->views_total) * 100, 1)
                    : 0,
                'published_at' => $job->published_at?->format('d M Y') ?? '-',
            ])
            ->all();

        // Applications trend (last 30 days, grouped by week)
        $applicationsTrend = Application::query()
            ->selectRaw('DATE(applied_at) as day, count(*) as total')
            ->whereIn('job_listing_id', $jobIds)
            ->where('applied_at', '>=', $since)
            ->groupByRaw('DATE(applied_at)')
            ->orderBy('day')
            ->get()
            ->map(fn ($row): array => [
                'day' => $row->day,
                'total' => (int) $row->total,
            ])
            ->all();

        // Views trend (last 30 days)
        $viewsTrend = JobListingAnalytic::query()
            ->selectRaw('date, SUM(views_count) as views, SUM(apply_clicks_count) as clicks')
            ->whereIn('job_listing_id', $jobIds)
            ->where('date', '>=', $since)
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(fn ($row): array => [
                'day' => $row->date->format('Y-m-d'),
                'views' => (int) $row->views,
                'clicks' => (int) $row->clicks,
            ])
            ->all();

        return Inertia::render('employer/analytics', [
            'hasCompany' => true,
            'overview' => [
                'total_applications' => $totalApplications,
                'hired_count' => $hiredCount,
                'avg_fit_score' => $avgFitScore !== null ? round((float) $avgFitScore, 1) : null,
                'total_views_30d' => (int) $totalViews,
                'total_clicks_30d' => (int) $totalClicks,
                'conversion_rate_30d' => $conversionRate,
                'response_rate' => $company->response_rate,
                'median_response_hours' => $company->median_response_hours,
            ],
            'pipeline' => $pipeline,
            'topJobs' => $topJobs,
            'applicationsTrend' => $applicationsTrend,
            'viewsTrend' => $viewsTrend,
        ]);
    }
}
