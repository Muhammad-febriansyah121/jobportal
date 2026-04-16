<?php

namespace App\Http\Controllers\Employer;

use App\Actions\Employer\ResolveEmployerCompany;
use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\JobListing;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmployerDashboardController extends Controller
{
    public function __invoke(Request $request, ResolveEmployerCompany $resolveEmployerCompany): Response
    {
        $company = $resolveEmployerCompany->handle($request->user());

        if ($company === null) {
            return Inertia::render('employer/dashboard', [
                'company' => null,
                'metrics' => [
                    'active_jobs' => 0,
                    'total_applications' => 0,
                    'team_members' => 0,
                    'avg_response_hours' => null,
                ],
                'pipelineSummary' => [],
                'recentApplications' => [],
                'recentJobs' => [],
            ]);
        }

        $pipelineSummary = Application::query()
            ->selectRaw('status, count(*) as total')
            ->whereHas('jobListing', fn ($query) => $query->whereBelongsTo($company))
            ->groupBy('status')
            ->pluck('total', 'status');

        return Inertia::render('employer/dashboard', [
            'company' => [
                'id' => $company->id,
                'name' => $company->name,
                'verification_status' => $company->verification_status,
                'is_verified' => $company->is_verified,
                'subscription' => $company->activeSubscription?->plan?->name,
            ],
            'metrics' => [
                'active_jobs' => $company->jobListings()->where('status', 'published')->count(),
                'total_applications' => Application::query()
                    ->whereHas('jobListing', fn ($query) => $query->whereBelongsTo($company))
                    ->count(),
                'team_members' => $company->members()->where('is_active', true)->count() + 1,
                'avg_response_hours' => $company->median_response_hours,
            ],
            'pipelineSummary' => collect(['applied', 'screened', 'shortlisted', 'interview', 'offer', 'hired', 'rejected'])
                ->map(fn (string $status): array => [
                    'status' => $status,
                    'label' => str($status)->headline()->toString(),
                    'total' => (int) ($pipelineSummary[$status] ?? 0),
                ])
                ->all(),
            'recentApplications' => Application::query()
                ->select(['id', 'job_listing_id', 'candidate_id', 'status', 'ai_fit_score', 'applied_at'])
                ->with(['candidate:id,full_name,headline,location_city', 'jobListing:id,title,company_id'])
                ->whereHas('jobListing', fn ($query) => $query->whereBelongsTo($company))
                ->latest('applied_at')
                ->limit(5)
                ->get()
                ->map(fn (Application $application): array => [
                    'id' => $application->id,
                    'candidate_name' => $application->candidate?->full_name ?? 'Kandidat',
                    'headline' => $application->candidate?->headline,
                    'job_title' => $application->jobListing?->title,
                    'status' => str($application->status)->headline()->toString(),
                    'ai_fit_score' => $application->ai_fit_score,
                    'applied_at' => $application->applied_at?->diffForHumans(),
                ]),
            'recentJobs' => JobListing::query()
                ->select(['id', 'company_id', 'title', 'status', 'published_at', 'created_at'])
                ->withCount('applications')
                ->whereBelongsTo($company)
                ->latest()
                ->limit(4)
                ->get()
                ->map(fn (JobListing $job): array => [
                    'id' => $job->id,
                    'title' => $job->title,
                    'status' => str($job->status)->headline()->toString(),
                    'applications_count' => $job->applications_count,
                    'published_at' => $job->published_at?->format('d M Y') ?? '-',
                ]),
        ]);
    }
}
