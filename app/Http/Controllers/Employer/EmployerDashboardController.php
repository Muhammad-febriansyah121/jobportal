<?php

namespace App\Http\Controllers\Employer;

use App\Actions\Employer\ResolveEmployerCompany;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Application;
use App\Models\CompanyMember;
use App\Models\Conversation;
use App\Models\EmployerTalentCandidate;
use App\Models\Interview;
use App\Models\JobListing;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class EmployerDashboardController extends Controller
{
    private function formatInterviewTime(Interview $interview): string
    {
        $scheduled = $interview->scheduled_at;

        if ($scheduled === null) {
            return '-';
        }

        if ($scheduled->isToday()) {
            return 'Hari ini · '.$scheduled->format('H:i');
        }

        if ($scheduled->isTomorrow()) {
            return 'Besok · '.$scheduled->format('H:i');
        }

        return $scheduled->diffForHumans();
    }

    public function __invoke(Request $request, ResolveEmployerCompany $resolveEmployerCompany): Response
    {
        $company = $resolveEmployerCompany->handle($request->user());

        if ($company === null) {
            return Inertia::render('employer/dashboard', [
                'company' => null,
                'metrics' => [
                    'active_jobs' => 0,
                    'total_applications' => 0,
                    'avg_response_hours' => null,
                    'new_hires_month' => 0,
                ],
                'pipelineSummary' => [],
                'recentApplications' => [],
                'recentJobs' => [],
                'slaAlert' => null,
                'shortlistedCandidates' => [],
                'candidateSources' => [],
                'pipelineBoard' => [],
                'recentActivities' => [],
                'actionItems' => [],
                'todayInterviews' => [],
                'applicationTrend' => [],
                'topJobs' => [],
                'topSkills' => [],
                'coldTalentPool' => [],
                'sourceRoi' => [],
                'recruiterLeaderboard' => [],
            ]);
        }

        $jobIds = $company->jobListings()->pluck('id');
        $company->load('activeSubscription.plan');
        $activeSubscription = $company->activeSubscription;
        $activePlan = $activeSubscription?->plan;

        $companyApplications = Application::query()
            ->whereIn('job_listing_id', $jobIds)
            ->with(['jobListing:id,title,company_id,response_sla_hours', 'candidate:id,full_name,headline', 'cv:id,source']);

        $subscriptionAlert = null;

        if ($activeSubscription !== null && $activeSubscription->ends_at !== null) {
            $daysLeft = (int) now()->diffInDays($activeSubscription->ends_at, false);

            if ($daysLeft < 0) {
                $subscriptionAlert = [
                    'status' => 'expired',
                    'title' => 'Paket sudah berakhir',
                    'message' => 'Paket '.$activePlan?->name.' telah berakhir. Perbarui paket agar proses rekrutmen tidak terganggu.',
                    'ends_at' => $activeSubscription->ends_at->format('d M Y'),
                    'days_left' => $daysLeft,
                ];
            } elseif ($daysLeft <= 7) {
                $subscriptionAlert = [
                    'status' => 'critical',
                    'title' => 'Paket hampir berakhir',
                    'message' => 'Paket '.$activePlan?->name.' akan berakhir dalam '.$daysLeft.' hari. Segera perbarui agar tidak terjadi gangguan.',
                    'ends_at' => $activeSubscription->ends_at->format('d M Y'),
                    'days_left' => $daysLeft,
                ];
            } elseif ($daysLeft <= 14) {
                $subscriptionAlert = [
                    'status' => 'warning',
                    'title' => 'Paket segera berakhir',
                    'message' => 'Paket '.$activePlan?->name.' akan berakhir dalam '.$daysLeft.' hari. Siapkan perpanjangan agar layanan tetap aktif.',
                    'ends_at' => $activeSubscription->ends_at->format('d M Y'),
                    'days_left' => $daysLeft,
                ];
            }
        }

        $activeJobsUsed = $company->jobListings()->where('status', 'published')->count();
        $recruiterSeatUsed = $company->members()->where('is_active', true)->count() + 1;
        $talentSearchUsed = EmployerTalentCandidate::query()
            ->where('company_id', $company->id)
            ->where(function ($query): void {
                $query->whereNotNull('saved_at')->orWhereNotNull('shortlisted_at');
            })
            ->count();

        $quotaUsage = [
            [
                'key' => 'active_jobs',
                'label' => 'Lowongan Tayang',
                'used' => $activeJobsUsed,
                'limit' => $activePlan?->active_jobs_limit,
            ],
            [
                'key' => 'recruiter_seats',
                'label' => 'Anggota Tim',
                'used' => $recruiterSeatUsed,
                'limit' => $activePlan?->recruiter_seat_limit,
            ],
            [
                'key' => 'talent_search',
                'label' => 'Job Invitation',
                'used' => $talentSearchUsed,
                'limit' => $activePlan?->talent_search_quota,
            ],
        ];

        $quotaUsage = collect($quotaUsage)
            ->map(function (array $item): array {
                $limit = is_numeric($item['limit']) ? (int) $item['limit'] : null;
                $used = (int) $item['used'];
                $remaining = $limit === null ? null : max($limit - $used, 0);
                $percent = $limit === null || $limit === 0
                    ? ($used > 0 ? 100 : 0)
                    : min((int) round(($used / $limit) * 100), 100);

                return [
                    ...$item,
                    'limit' => $limit,
                    'remaining' => $remaining,
                    'percent' => $percent,
                    'is_over_limit' => $limit !== null && $used > $limit,
                ];
            })
            ->values()
            ->all();

        $pipelineSummary = Application::query()
            ->selectRaw('status, count(*) as total')
            ->whereHas('jobListing', fn ($query) => $query->whereBelongsTo($company))
            ->groupBy('status')
            ->pluck('total', 'status');

        $overdueApplication = $companyApplications
            ->clone()
            ->whereIn('status', ['applied', 'screened', 'shortlisted'])
            ->latest('applied_at')
            ->get()
            ->first(function (Application $application): bool {
                $slaHours = $application->jobListing?->response_sla_hours;

                if (! $slaHours || ! $application->applied_at) {
                    return false;
                }

                return now()->greaterThan($application->applied_at->copy()->addHours((int) $slaHours));
            });

        $candidateSourcesRaw = Application::query()
            ->selectRaw('candidate_cvs.source as source, count(*) as total')
            ->join('candidate_cvs', 'candidate_cvs.id', '=', 'applications.candidate_cv_id')
            ->whereIn('applications.job_listing_id', $jobIds)
            ->groupBy('candidate_cvs.source')
            ->get();

        $candidateSourcesRaw = $candidateSourcesRaw
            ->filter(fn ($row): bool => (string) $row->source !== 'demo')
            ->values();

        $sourceTotal = (int) $candidateSourcesRaw->sum('total');

        $candidateSources = $candidateSourcesRaw
            ->map(fn ($row): array => [
                'source' => (string) $row->source,
                'label' => match ((string) $row->source) {
                    'linkedin' => 'LinkedIn',
                    'upload' => 'Direct Upload',
                    'builder' => 'CV Builder',
                    default => str((string) $row->source)->headline()->toString(),
                },
                'total' => (int) $row->total,
                'percentage' => $sourceTotal > 0 ? round(((int) $row->total / $sourceTotal) * 100, 1) : 0.0,
            ])
            ->sortByDesc('total')
            ->values()
            ->all();

        $pipelineBoardStatuses = [
            'screened' => 'Seleksi Awal',
            'interview' => 'Wawancara',
            'offer' => 'Penawaran',
        ];

        $pipelineBoard = collect($pipelineBoardStatuses)
            ->map(function (string $label, string $status) use ($companyApplications, $pipelineSummary): array {
                $applications = $companyApplications
                    ->clone()
                    ->where('status', $status)
                    ->latest('updated_at')
                    ->limit(3)
                    ->get()
                    ->map(fn (Application $application): array => [
                        'id' => $application->id,
                        'candidate_name' => $application->candidate?->full_name ?? 'Kandidat',
                        'headline' => $application->candidate?->headline,
                        'updated_at' => $application->updated_at?->diffForHumans(),
                    ])
                    ->values()
                    ->all();

                return [
                    'status' => $status,
                    'label' => $label,
                    'total' => (int) ($pipelineSummary[$status] ?? 0),
                    'applications' => $applications,
                ];
            })
            ->values()
            ->all();

        $applicationIds = Application::query()
            ->whereIn('job_listing_id', $jobIds)
            ->pluck('id');

        $recentActivities = ActivityLog::query()
            ->with('actor:id,name')
            ->where(function ($query) use ($jobIds, $applicationIds): void {
                $query
                    ->where(function ($sub) use ($jobIds): void {
                        $sub->where('subject_type', JobListing::class)
                            ->whereIn('subject_id', $jobIds);
                    })
                    ->orWhere(function ($sub) use ($applicationIds): void {
                        $sub->where('subject_type', Application::class)
                            ->whereIn('subject_id', $applicationIds);
                    });
            })
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (ActivityLog $activity): array => [
                'id' => $activity->id,
                'title' => str($activity->action)->replace('_', ' ')->headline()->toString(),
                'actor' => $activity->actor?->name,
                'time' => $activity->created_at?->diffForHumans(),
            ])
            ->values()
            ->all();

        $pendingReviewCount = $companyApplications
            ->clone()
            ->whereIn('status', ['applied', 'screened'])
            ->count();
        $offerPendingCount = (int) ($pipelineSummary['offer'] ?? 0);
        $todayInterviewCount = Interview::query()
            ->whereIn('application_id', $applicationIds)
            ->whereIn('status', ['scheduled', 'rescheduled'])
            ->whereDate('scheduled_at', now()->toDateString())
            ->count();
        $tomorrowInterviewCount = Interview::query()
            ->whereIn('application_id', $applicationIds)
            ->whereIn('status', ['scheduled', 'rescheduled'])
            ->whereDate('scheduled_at', now()->addDay()->toDateString())
            ->count();

        $actionItems = [
            [
                'key' => 'pending_review',
                'label' => 'Belum direview',
                'count' => $pendingReviewCount,
                'tone' => $pendingReviewCount > 0 ? 'amber' : 'neutral',
                'href' => route('employer.candidates.index', ['status' => 'applied']),
                'cta' => 'Lihat kandidat',
            ],
            [
                'key' => 'today_interview',
                'label' => 'Wawancara hari ini',
                'count' => $todayInterviewCount,
                'tone' => $todayInterviewCount > 0 ? 'blue' : 'neutral',
                'href' => route('employer.candidates.index', ['status' => 'interview']),
                'cta' => 'Cek jadwal',
            ],
            [
                'key' => 'offer_pending',
                'label' => 'Offer menunggu jawaban',
                'count' => $offerPendingCount,
                'tone' => $offerPendingCount > 0 ? 'violet' : 'neutral',
                'href' => route('employer.candidates.index', ['status' => 'offer']),
                'cta' => 'Tindak lanjuti',
            ],
            [
                'key' => 'sla_overdue',
                'label' => 'Lewat batas waktu',
                'count' => $overdueApplication ? 1 : 0,
                'tone' => $overdueApplication ? 'red' : 'neutral',
                'href' => route('employer.candidates.index'),
                'cta' => 'Cek sekarang',
            ],
        ];

        $todayInterviews = Interview::query()
            ->with(['application.candidate:id,full_name', 'application.jobListing:id,title'])
            ->whereIn('application_id', $applicationIds)
            ->whereIn('status', ['scheduled', 'rescheduled'])
            ->whereBetween('scheduled_at', [now()->startOfDay(), now()->addDay()->endOfDay()])
            ->orderBy('scheduled_at')
            ->limit(6)
            ->get()
            ->map(fn (Interview $interview): array => [
                'id' => $interview->id,
                'candidate_name' => $interview->application?->candidate?->full_name ?? 'Kandidat',
                'job_title' => $interview->application?->jobListing?->title ?? '-',
                'mode' => $interview->mode,
                'mode_label' => str((string) $interview->mode)->headline()->toString(),
                'scheduled_at' => $interview->scheduled_at?->format('d M Y H:i'),
                'time_label' => $this->formatInterviewTime($interview),
                'duration_minutes' => $interview->duration_minutes,
                'meeting_url' => $interview->location_url,
            ])
            ->all();

        $funnelStages = [
            ['status' => 'applied', 'label' => 'Lamaran masuk'],
            ['status' => 'screened', 'label' => 'Seleksi awal'],
            ['status' => 'shortlisted', 'label' => 'Shortlist'],
            ['status' => 'interview', 'label' => 'Wawancara'],
            ['status' => 'offer', 'label' => 'Offer'],
            ['status' => 'hired', 'label' => 'Diterima'],
        ];

        $appliedTotal = (int) ($pipelineSummary['applied'] ?? 0);
        $cumulativeStageTotals = [];
        foreach ($funnelStages as $stage) {
            $cumulativeStageTotals[$stage['status']] = (int) ($pipelineSummary[$stage['status']] ?? 0);
        }
        $maxFunnelTotal = max(array_merge(array_values($cumulativeStageTotals), [1]));

        $pipelineFunnel = collect($funnelStages)
            ->map(function (array $stage) use ($cumulativeStageTotals, $appliedTotal, $maxFunnelTotal): array {
                $total = $cumulativeStageTotals[$stage['status']];
                $conversionFromApplied = $appliedTotal > 0
                    ? (int) round(($total / $appliedTotal) * 100)
                    : null;

                return [
                    'status' => $stage['status'],
                    'label' => $stage['label'],
                    'total' => $total,
                    'conversion_percent' => $conversionFromApplied,
                    'bar_percent' => $maxFunnelTotal > 0
                        ? (int) round(($total / $maxFunnelTotal) * 100)
                        : 0,
                ];
            })
            ->all();

        $startDate = now()->subDays(6)->startOfDay();
        $rawTrend = Application::query()
            ->selectRaw('DATE(applied_at) as day, COUNT(*) as total')
            ->whereIn('job_listing_id', $jobIds)
            ->where('applied_at', '>=', $startDate)
            ->groupBy('day')
            ->pluck('total', 'day');

        $applicationTrend = collect(range(0, 6))
            ->map(function (int $offset) use ($rawTrend): array {
                $date = now()->subDays(6 - $offset);
                $key = $date->toDateString();

                return [
                    'date' => $key,
                    'label' => $date->isoFormat('ddd'),
                    'short_date' => $date->format('d/m'),
                    'total' => (int) ($rawTrend[$key] ?? 0),
                ];
            })
            ->all();

        $maxTrend = max(collect($applicationTrend)->pluck('total')->max() ?? 0, 1);
        $applicationTrend = collect($applicationTrend)
            ->map(fn (array $day): array => $day + [
                'bar_percent' => (int) round(($day['total'] / $maxTrend) * 100),
            ])
            ->all();

        $totalApplicationsLast7Days = (int) collect($applicationTrend)->sum('total');

        $topJobs = JobListing::query()
            ->select(['id', 'company_id', 'title', 'status', 'published_at', 'created_at'])
            ->whereBelongsTo($company)
            ->where('status', 'published')
            ->withCount([
                'applications as recent_applications_count' => fn ($query) => $query
                    ->where('applied_at', '>=', now()->subDays(14)),
            ])
            ->withCount('applications')
            ->orderByDesc('recent_applications_count')
            ->orderByDesc('applications_count')
            ->limit(5)
            ->get()
            ->map(function (JobListing $job): array {
                $isStagnant = $job->recent_applications_count === 0
                    && $job->published_at !== null
                    && $job->published_at->lessThan(now()->subDays(7));

                return [
                    'id' => $job->id,
                    'title' => $job->title,
                    'applications_count' => $job->applications_count,
                    'recent_applications_count' => $job->recent_applications_count,
                    'published_at' => $job->published_at?->format('d M Y'),
                    'days_published' => $job->published_at?->diffInDays(now()),
                    'is_stagnant' => $isStagnant,
                ];
            })
            ->all();

        $candidateIdsInPipeline = Application::query()
            ->whereIn('job_listing_id', $jobIds)
            ->pluck('candidate_id')
            ->unique()
            ->values();

        $topSkillsRaw = collect();
        $topSkillsMax = 1;

        if ($candidateIdsInPipeline->isNotEmpty()) {
            $topSkillsRaw = DB::table('candidate_skill')
                ->join('skills', 'skills.id', '=', 'candidate_skill.skill_id')
                ->whereIn('candidate_skill.candidate_id', $candidateIdsInPipeline)
                ->groupBy('skills.id', 'skills.name')
                ->select('skills.name', DB::raw('COUNT(DISTINCT candidate_skill.candidate_id) as total'))
                ->orderByDesc('total')
                ->limit(8)
                ->get();

            $topSkillsMax = max((int) $topSkillsRaw->max('total'), 1);
        }

        $topSkills = $topSkillsRaw
            ->map(fn ($row): array => [
                'name' => (string) $row->name,
                'total' => (int) $row->total,
                'bar_percent' => (int) round(((int) $row->total / $topSkillsMax) * 100),
            ])
            ->all();

        $contactedCandidateIds = Conversation::query()
            ->where('company_id', $company->id)
            ->pluck('candidate_id');

        $appliedCandidateIds = Application::query()
            ->whereIn('job_listing_id', $jobIds)
            ->pluck('candidate_id');

        $coldTalentPool = EmployerTalentCandidate::query()
            ->with('candidate:id,full_name,headline,location_city,user_id', 'candidate.user:id,name,avatar_url')
            ->where('company_id', $company->id)
            ->whereNotNull('saved_at')
            ->where('saved_at', '<=', now()->subDays(14))
            ->whereNotIn('candidate_id', $contactedCandidateIds)
            ->whereNotIn('candidate_id', $appliedCandidateIds)
            ->orderBy('saved_at')
            ->limit(5)
            ->get()
            ->map(fn (EmployerTalentCandidate $row): array => [
                'id' => $row->candidate_id,
                'name' => $row->candidate?->full_name ?? $row->candidate?->user?->name ?? 'Kandidat',
                'headline' => $row->candidate?->headline,
                'location' => $row->candidate?->location_city,
                'avatar_url' => $row->candidate?->user?->avatar_url,
                'saved_at' => $row->saved_at?->format('d M Y'),
                'days_cold' => (int) $row->saved_at?->diffInDays(now()),
            ])
            ->all();

        $sourceRoiRaw = Application::query()
            ->join('candidate_cvs', 'candidate_cvs.id', '=', 'applications.candidate_cv_id')
            ->whereIn('applications.job_listing_id', $jobIds)
            ->whereNotNull('candidate_cvs.source')
            ->where('candidate_cvs.source', '!=', 'demo')
            ->groupBy('candidate_cvs.source')
            ->select(
                'candidate_cvs.source',
                DB::raw('COUNT(*) as total_apply'),
                DB::raw("SUM(CASE WHEN applications.status = 'hired' THEN 1 ELSE 0 END) as total_hire"),
                DB::raw("SUM(CASE WHEN applications.status IN ('shortlisted','interview','offer','hired') THEN 1 ELSE 0 END) as total_progressed"),
            )
            ->orderByDesc('total_apply')
            ->limit(6)
            ->get();

        $sourceRoi = $sourceRoiRaw
            ->map(function ($row): array {
                $apply = (int) $row->total_apply;
                $hire = (int) $row->total_hire;
                $progressed = (int) $row->total_progressed;

                return [
                    'source' => (string) $row->source,
                    'label' => match ((string) $row->source) {
                        'linkedin' => 'LinkedIn',
                        'upload' => 'Direct Upload',
                        'builder' => 'CV Builder',
                        default => str((string) $row->source)->headline()->toString(),
                    },
                    'apply' => $apply,
                    'progressed' => $progressed,
                    'hire' => $hire,
                    'hire_rate' => $apply > 0 ? round(($hire / $apply) * 100, 1) : 0.0,
                    'progress_rate' => $apply > 0 ? round(($progressed / $apply) * 100, 1) : 0.0,
                ];
            })
            ->all();

        $companyMemberUserIds = CompanyMember::query()
            ->where('company_id', $company->id)
            ->where('is_active', true)
            ->pluck('user_id')
            ->push($company->owner_id)
            ->unique()
            ->values();

        $recruiterLeaderboard = [];

        if ($companyMemberUserIds->count() >= 2) {
            $recruiterStats = DB::table('activity_logs')
                ->whereIn('actor_id', $companyMemberUserIds)
                ->where('subject_type', Application::class)
                ->whereIn('subject_id', $applicationIds)
                ->where('created_at', '>=', now()->subDays(30))
                ->groupBy('actor_id')
                ->select('actor_id', DB::raw('COUNT(*) as total_actions'))
                ->orderByDesc('total_actions')
                ->limit(5)
                ->get();

            $userMap = User::query()
                ->whereIn('id', $recruiterStats->pluck('actor_id'))
                ->get(['id', 'name', 'avatar_url'])
                ->keyBy('id');

            $maxActions = max((int) $recruiterStats->max('total_actions'), 1);

            $recruiterLeaderboard = $recruiterStats
                ->map(function ($row) use ($userMap, $maxActions): array {
                    $user = $userMap->get($row->actor_id);

                    return [
                        'user_id' => (int) $row->actor_id,
                        'name' => $user?->name ?? 'Anggota',
                        'avatar_url' => $user?->avatar_url,
                        'total_actions' => (int) $row->total_actions,
                        'bar_percent' => (int) round(((int) $row->total_actions / $maxActions) * 100),
                    ];
                })
                ->values()
                ->all();
        }

        $sevenDaysAgo = now()->subDays(7);
        $fourteenDaysAgo = now()->subDays(14);
        $thirtyDaysAgo = now()->subDays(30);
        $sixtyDaysAgo = now()->subDays(60);
        $startOfWeek = now()->startOfWeek();
        $endOfWeek = now()->endOfWeek();

        $applicationsThisWeek = Application::query()
            ->whereIn('job_listing_id', $jobIds)
            ->where('applied_at', '>=', $sevenDaysAgo)
            ->count();
        $applicationsPrevWeek = Application::query()
            ->whereIn('job_listing_id', $jobIds)
            ->whereBetween('applied_at', [$fourteenDaysAgo, $sevenDaysAgo])
            ->count();

        $hires30 = Application::query()
            ->whereIn('job_listing_id', $jobIds)
            ->where('status', 'hired')
            ->where('updated_at', '>=', $thirtyDaysAgo)
            ->count();
        $applications30 = Application::query()
            ->whereIn('job_listing_id', $jobIds)
            ->where('applied_at', '>=', $thirtyDaysAgo)
            ->count();
        $hireRate30 = $applications30 > 0
            ? (int) round(($hires30 / $applications30) * 100)
            : 0;

        $hiresPrev30 = Application::query()
            ->whereIn('job_listing_id', $jobIds)
            ->where('status', 'hired')
            ->whereBetween('updated_at', [$sixtyDaysAgo, $thirtyDaysAgo])
            ->count();
        $applicationsPrev30 = Application::query()
            ->whereIn('job_listing_id', $jobIds)
            ->whereBetween('applied_at', [$sixtyDaysAgo, $thirtyDaysAgo])
            ->count();
        $hireRatePrev30 = $applicationsPrev30 > 0
            ? (int) round(($hiresPrev30 / $applicationsPrev30) * 100)
            : 0;

        $needsResponseList = $companyApplications
            ->clone()
            ->whereIn('status', ['applied', 'screened'])
            ->whereNull('first_responded_at')
            ->get();
        $needsResponseCount = $needsResponseList->count();
        $needsResponseOverdue = $needsResponseList->filter(function (Application $application): bool {
            $slaHours = $application->jobListing?->response_sla_hours;

            if (! $slaHours || ! $application->applied_at) {
                return false;
            }

            return now()->greaterThan($application->applied_at->copy()->addHours((int) $slaHours));
        })->count();

        $interviewsThisWeek = Interview::query()
            ->whereHas('application.jobListing', fn ($query) => $query->where('company_id', $company->id))
            ->whereBetween('scheduled_at', [$startOfWeek, $endOfWeek])
            ->count();
        $interviewsToday = Interview::query()
            ->whereHas('application.jobListing', fn ($query) => $query->where('company_id', $company->id))
            ->whereBetween('scheduled_at', [now()->startOfDay(), now()->endOfDay()])
            ->count();

        return Inertia::render('employer/dashboard', [
            'company' => [
                'id' => $company->id,
                'name' => $company->name,
                'verification_status' => $company->verification_status,
                'is_verified' => $company->is_verified,
                'subscription' => $activePlan?->name,
            ],
            'subscriptionAlert' => $subscriptionAlert,
            'quotaUsage' => $quotaUsage,
            'metrics' => [
                'active_jobs' => $company->jobListings()->where('status', 'published')->count(),
                'total_applications' => Application::query()
                    ->whereHas('jobListing', fn ($query) => $query->whereBelongsTo($company))
                    ->count(),
                'avg_response_hours' => $company->median_response_hours,
                'new_hires_month' => Application::query()
                    ->whereIn('job_listing_id', $jobIds)
                    ->where('status', 'hired')
                    ->where('updated_at', '>=', now()->startOfMonth())
                    ->count(),
                'needs_response' => [
                    'count' => $needsResponseCount,
                    'overdue' => $needsResponseOverdue,
                ],
                'interviews_week' => [
                    'count' => $interviewsThisWeek,
                    'today' => $interviewsToday,
                ],
                'hire_rate_30d' => [
                    'rate' => $hireRate30,
                    'previous' => $hireRatePrev30,
                    'delta' => $hireRate30 - $hireRatePrev30,
                ],
                'applications_week' => [
                    'count' => $applicationsThisWeek,
                    'previous' => $applicationsPrevWeek,
                    'delta' => $applicationsPrevWeek === 0
                        ? null
                        : (int) round((($applicationsThisWeek - $applicationsPrevWeek) / $applicationsPrevWeek) * 100),
                ],
            ],
            'pipelineSummary' => collect(['applied', 'screened', 'shortlisted', 'interview', 'offer', 'hired', 'rejected'])
                ->map(fn (string $status): array => [
                    'status' => $status,
                    'label' => str($status)->headline()->toString(),
                    'total' => (int) ($pipelineSummary[$status] ?? 0),
                ])
                ->all(),
            'pipelineFunnel' => $pipelineFunnel,
            'actionItems' => $actionItems,
            'todayInterviews' => $todayInterviews,
            'applicationTrend' => $applicationTrend,
            'applicationTrendTotal' => $totalApplicationsLast7Days,
            'topJobs' => $topJobs,
            'topSkills' => $topSkills,
            'coldTalentPool' => $coldTalentPool,
            'sourceRoi' => $sourceRoi,
            'recruiterLeaderboard' => $recruiterLeaderboard,
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
            'slaAlert' => $overdueApplication ? [
                'job_title' => $overdueApplication->jobListing?->title,
                'candidate_name' => $overdueApplication->candidate?->full_name,
                'sla_hours' => $overdueApplication->jobListing?->response_sla_hours,
                'applied_at' => $overdueApplication->applied_at?->diffForHumans(),
            ] : null,
            'shortlistedCandidates' => $companyApplications
                ->clone()
                ->whereNotNull('ai_fit_score')
                ->latest('applied_at')
                ->limit(3)
                ->get()
                ->sortByDesc('ai_fit_score')
                ->values()
                ->map(fn (Application $application): array => [
                    'id' => $application->id,
                    'name' => $application->candidate?->full_name ?? 'Kandidat',
                    'headline' => $application->candidate?->headline ?? '-',
                    'score' => (int) ($application->ai_fit_score ?? 0),
                    'job_title' => $application->jobListing?->title,
                ])
                ->all(),
            'candidateSources' => $candidateSources,
            'pipelineBoard' => $pipelineBoard,
            'recentActivities' => $recentActivities,
        ]);
    }
}
