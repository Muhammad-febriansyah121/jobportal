<?php

namespace App\Http\Controllers\Employer;

use App\Actions\Employer\GenerateTalentSearchRecommendations;
use App\Actions\Employer\MatchCandidateToCompanyJobs;
use App\Actions\Employer\ResolveEmployerCompany;
use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\CandidateProfile;
use App\Models\Company;
use App\Models\Conversation;
use App\Models\EmployerTalentCandidate;
use App\Models\GoogleCalendarToken;
use App\Models\JobListing;
use App\Models\Skill;
use App\Services\WhatsAppGatewayService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class EmployerWorkspaceController extends Controller
{
    public function candidates(
        Request $request,
        ResolveEmployerCompany $resolveEmployerCompany,
        WhatsAppGatewayService $whatsApp,
    ): Response|RedirectResponse {
        $company = $resolveEmployerCompany->handle($request->user());

        if ($company === null) {
            Inertia::flash('toast', ['type' => 'warning', 'message' => 'Lengkapi profil perusahaan sebelum melihat kandidat.']);

            return to_route('employer.company.edit');
        }

        $search = $request->string('search')->toString();
        $status = $request->string('status')->toString();
        $aiInterviewStatus = $request->string('ai_interview_status')->toString();
        $jobId = $request->integer('job_id') ?: null;

        $applications = Application::query()
            ->select(['id', 'job_listing_id', 'candidate_id', 'candidate_cv_id', 'status', 'cover_letter', 'screening_answers_json', 'ai_fit_score', 'ai_skill_match', 'applied_at', 'first_responded_at'])
            ->whereHas('jobListing', fn ($query) => $query->where('company_id', $company->id))
            ->with([
                'candidate.user:id,name,email,phone,avatar_url',
                'candidate.skills:id,name',
                'candidate.preferredIndustry:id,name',
                'cv:id,candidate_id,file_url,is_primary,uploaded_at',
                'jobListing:id,company_id,title,status',
                'latestStatusHistory',
                'interviews' => fn ($query) => $query
                    ->select(['id', 'application_id', 'scheduled_at', 'mode', 'status'])
                    ->latest('scheduled_at')
                    ->limit(1),
                'latestAiInterviewSession',
                'latestAiInterviewSession.analysis:id,session_id,fit_score',
            ])
            ->withCount('interviews')
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($query) use ($search): void {
                    $query
                        ->whereHas('candidate', fn ($candidateQuery) => $candidateQuery
                            ->where('full_name', 'like', '%'.$search.'%')
                            ->orWhere('headline', 'like', '%'.$search.'%')
                            ->orWhere('preferred_role', 'like', '%'.$search.'%'))
                        ->orWhereHas('candidate.user', fn ($userQuery) => $userQuery
                            ->where('email', 'like', '%'.$search.'%'))
                        ->orWhereHas('jobListing', fn ($jobQuery) => $jobQuery
                            ->where('title', 'like', '%'.$search.'%'));
                });
            })
            ->when($status !== '', fn ($query) => $query->where('status', $status))
            ->when($jobId !== null, fn ($query) => $query->where('job_listing_id', $jobId))
            ->when($aiInterviewStatus !== '', function ($query) use ($aiInterviewStatus): void {
                if ($aiInterviewStatus === 'none') {
                    $query->whereDoesntHave('aiInterviewSessions');

                    return;
                }

                $query->whereHas('latestAiInterviewSession', fn ($sessionQuery) => $sessionQuery->where('status', $aiInterviewStatus));
            })
            ->latest('applied_at')
            ->paginate(12)
            ->withQueryString()
            ->through(fn (Application $application): array => $this->candidateRow($application));

        $selectedJob = null;
        $suggestedQuestions = [];

        if ($jobId !== null) {
            $selectedJob = JobListing::query()
                ->select(['id', 'title'])
                ->where('company_id', $company->id)
                ->find($jobId);

            if ($selectedJob !== null) {
                $suggestedQuestions = $this->aiInterviewSuggestedQuestions($selectedJob);
            }
        }

        $statusCounts = Application::query()
            ->select('status', DB::raw('COUNT(*) as total'))
            ->whereHas('jobListing', fn ($query) => $query->where('company_id', $company->id))
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($query) use ($search): void {
                    $query
                        ->whereHas('candidate', fn ($candidateQuery) => $candidateQuery
                            ->where('full_name', 'like', '%'.$search.'%')
                            ->orWhere('headline', 'like', '%'.$search.'%')
                            ->orWhere('preferred_role', 'like', '%'.$search.'%'))
                        ->orWhereHas('candidate.user', fn ($userQuery) => $userQuery
                            ->where('email', 'like', '%'.$search.'%'))
                        ->orWhereHas('jobListing', fn ($jobQuery) => $jobQuery
                            ->where('title', 'like', '%'.$search.'%'));
                });
            })
            ->when($jobId !== null, fn ($query) => $query->where('job_listing_id', $jobId))
            ->when($aiInterviewStatus !== '', function ($query) use ($aiInterviewStatus): void {
                if ($aiInterviewStatus === 'none') {
                    $query->whereDoesntHave('aiInterviewSessions');

                    return;
                }

                $query->whereHas('latestAiInterviewSession', fn ($sessionQuery) => $sessionQuery->where('status', $aiInterviewStatus));
            })
            ->groupBy('status')
            ->pluck('total', 'status');

        $totalAcrossStatuses = $statusCounts->sum();

        return Inertia::render('employer/candidates', [
            'company' => [
                'id' => $company->id,
                'name' => $company->name,
            ],
            'filters' => [
                'search' => $search,
                'status' => $status,
                'job_id' => $jobId ? (string) $jobId : '',
                'ai_interview_status' => $aiInterviewStatus,
            ],
            'selected_job' => $selectedJob ? [
                'id' => $selectedJob->id,
                'title' => $selectedJob->title,
            ] : null,
            'suggested_questions' => $suggestedQuestions,
            'status_counts' => [
                'all' => $totalAcrossStatuses,
                'applied' => (int) ($statusCounts['applied'] ?? 0),
                'screened' => (int) ($statusCounts['screened'] ?? 0),
                'shortlisted' => (int) ($statusCounts['shortlisted'] ?? 0),
                'interview' => (int) ($statusCounts['interview'] ?? 0),
                'offer' => (int) ($statusCounts['offer'] ?? 0),
                'hired' => (int) ($statusCounts['hired'] ?? 0),
                'rejected' => (int) ($statusCounts['rejected'] ?? 0),
                'withdrawn' => (int) ($statusCounts['withdrawn'] ?? 0),
            ],
            'jobOptions' => JobListing::query()
                ->select(['id', 'title'])
                ->whereBelongsTo($company)
                ->latest()
                ->get()
                ->map(fn (JobListing $job): array => [
                    'value' => (string) $job->id,
                    'label' => $job->title,
                ]),
            'statusOptions' => $this->applicationStatusOptions(),
            'metrics' => [
                'total' => Application::query()
                    ->whereHas('jobListing', fn ($query) => $query->where('company_id', $company->id))
                    ->count(),
                'shortlisted' => Application::query()
                    ->whereHas('jobListing', fn ($query) => $query->where('company_id', $company->id))
                    ->whereIn('status', ['shortlisted', 'interview', 'offer', 'hired'])
                    ->count(),
                'interviews' => Application::query()
                    ->whereHas('jobListing', fn ($query) => $query->where('company_id', $company->id))
                    ->where('status', 'interview')
                    ->count(),
                'average_ai_fit' => (int) round((float) Application::query()
                    ->whereHas('jobListing', fn ($query) => $query->where('company_id', $company->id))
                    ->whereNotNull('ai_fit_score')
                    ->avg('ai_fit_score')),
            ],
            'applications' => $applications,
            'google_calendar' => $this->googleCalendarStatus($request->user()->id),
            'whatsapp_gateway' => $this->whatsappGatewayStatus($request->user(), $whatsApp),
        ]);
    }

    private function googleCalendarStatus(int $userId): array
    {
        $token = GoogleCalendarToken::where('user_id', $userId)->first();

        return [
            'connected' => $token !== null,
            'email' => $token?->calendar_email,
        ];
    }

    /**
     * @return array{configured: bool, session_id: ?string, has_session: bool}
     */
    private function whatsappGatewayStatus($user, WhatsAppGatewayService $whatsApp): array
    {
        $settings = is_array($user?->notification_settings) ? $user->notification_settings : [];
        $sessionId = trim((string) data_get($settings, 'whatsapp.session_id'));

        return [
            'configured' => $whatsApp->isConfigured(),
            'session_id' => $sessionId === '' ? null : $sessionId,
            'has_session' => $sessionId !== '',
        ];
    }

    public function messages(Request $request, ResolveEmployerCompany $resolveEmployerCompany): Response|RedirectResponse
    {
        $company = $resolveEmployerCompany->handle($request->user());

        if ($company === null) {
            Inertia::flash('toast', ['type' => 'warning', 'message' => 'Lengkapi profil perusahaan sebelum menggunakan fitur pesan.']);

            return to_route('employer.company.edit');
        }

        $search = $request->string('search')->toString();

        $conversations = Conversation::query()
            ->where('company_id', $company->id)
            ->whereNotNull('application_id')
            ->whereHas('application.jobListing', fn ($query) => $query->where('company_id', $company->id))
            ->with(['candidate.user:id,name,avatar_url', 'latestMessage.sender:id,name', 'application.jobListing:id,title'])
            ->withCount([
                'messages as unread_count' => fn ($query) => $query
                    ->whereNull('read_at')
                    ->where('sender_id', '!=', $request->user()->id),
            ])
            ->when($search !== '', fn ($query) => $query->whereHas(
                'candidate',
                fn ($candidateQuery) => $candidateQuery->where('full_name', 'like', '%'.$search.'%')
            ))
            ->latest('last_message_at')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Conversation $conversation): array => [
                'id' => $conversation->id,
                'candidate' => [
                    'id' => $conversation->candidate?->id,
                    'name' => $conversation->candidate?->full_name ?? $conversation->candidate?->user?->name ?? 'Kandidat',
                    'avatar_url' => $conversation->candidate?->user?->avatar_url,
                    'headline' => $conversation->candidate?->headline,
                ],
                'latest_message' => $conversation->latestMessage ? [
                    'body' => str((string) $conversation->latestMessage->body)->limit(80)->toString(),
                    'sent_at' => $conversation->latestMessage->created_at?->diffForHumans(),
                    'is_mine' => $conversation->latestMessage->sender_id === $request->user()->id,
                ] : null,
                'job_title' => $conversation->application?->jobListing?->title,
                'unread_count' => $conversation->unread_count,
                'last_message_at' => $conversation->last_message_at?->format('d M Y'),
            ]);

        $unreadTotal = Conversation::query()
            ->where('company_id', $company->id)
            ->whereNotNull('application_id')
            ->whereHas('application.jobListing', fn ($query) => $query->where('company_id', $company->id))
            ->withCount([
                'messages as unread_count' => fn ($query) => $query
                    ->whereNull('read_at')
                    ->where('sender_id', '!=', $request->user()->id),
            ])
            ->get()
            ->sum('unread_count');

        return Inertia::render('employer/messages', [
            'filters' => ['search' => $search],
            'conversations' => $conversations,
            'unread_total' => $unreadTotal,
        ]);
    }

    public function analytics(): Response
    {
        return $this->page(
            'Analytics',
            'Lihat performa lowongan, sumber kandidat, dan SLA rekrutmen.',
            'Analytics employer akan merangkum conversion rate, response time, dan progres lamaran.'
        );
    }

    public function billing(): Response
    {
        return $this->page(
            'Billing',
            'Kelola paket aktif, limit lowongan, seat recruiter, dan riwayat pembayaran.',
            'Billing akan tersambung dengan subscription, invoice, dan kuota AI screening.'
        );
    }

    public function talentSearch(
        Request $request,
        ResolveEmployerCompany $resolveEmployerCompany,
        GenerateTalentSearchRecommendations $generateTalentSearchRecommendations
    ): Response {
        return $this->renderTalentSearchPage(
            request: $request,
            resolveEmployerCompany: $resolveEmployerCompany,
            generateTalentSearchRecommendations: $generateTalentSearchRecommendations,
            savedOnly: $request->boolean('saved_only')
        );
    }

    public function talentPool(
        Request $request,
        ResolveEmployerCompany $resolveEmployerCompany,
        GenerateTalentSearchRecommendations $generateTalentSearchRecommendations
    ): Response {
        return $this->renderTalentSearchPage(
            request: $request,
            resolveEmployerCompany: $resolveEmployerCompany,
            generateTalentSearchRecommendations: $generateTalentSearchRecommendations,
            savedOnly: true
        );
    }

    public function showTalent(
        Request $request,
        CandidateProfile $candidateProfile,
        ResolveEmployerCompany $resolveEmployerCompany,
    ): Response {
        $company = $resolveEmployerCompany->handle($request->user());

        $candidateProfile->load([
            'user:id,name,email,phone,avatar_url',
            'preferredIndustry:id,name',
            'skills:id,name',
            'experiences' => fn ($query) => $query
                ->orderByDesc('is_current')
                ->orderByDesc('start_date'),
            'educations' => fn ($query) => $query
                ->orderByDesc('end_year')
                ->orderByDesc('start_year'),
            'certifications' => fn ($query) => $query->orderByDesc('issue_date'),
            'primaryCv',
        ]);

        $companyJobIds = $company
            ? JobListing::query()->whereBelongsTo($company)->pluck('id')->all()
            : [];

        $aiMatchScore = $candidateProfile->aiMatchScores()
            ->when($companyJobIds !== [], fn ($query) => $query->whereIn('job_listing_id', $companyJobIds))
            ->latest('computed_at')
            ->first();

        $talentAction = $company
            ? EmployerTalentCandidate::query()
                ->where('company_id', $company->id)
                ->where('candidate_id', $candidateProfile->id)
                ->first()
            : null;

        $conversationId = null;
        if ($company !== null) {
            $conversationId = Conversation::query()
                ->where('company_id', $company->id)
                ->where('candidate_id', $candidateProfile->id)
                ->whereNull('application_id')
                ->value('id');
        }

        $totalYears = 0.0;
        foreach ($candidateProfile->experiences as $experience) {
            $start = $experience->start_date;

            if (! $start) {
                continue;
            }

            $end = $experience->is_current
                ? now()
                : ($experience->end_date ?? now());

            $totalYears += max(0.0, (float) $start->diffInMonths($end)) / 12;
        }

        return Inertia::render('employer/talent-search/show', [
            'company' => $company ? [
                'id' => $company->id,
                'name' => $company->name,
            ] : null,
            'candidate' => [
                'id' => $candidateProfile->id,
                'name' => $candidateProfile->full_name ?? $candidateProfile->user?->name ?? 'Kandidat',
                'avatar_url' => $candidateProfile->user?->avatar_url,
                'headline' => $candidateProfile->headline ?? $candidateProfile->preferred_role ?? 'Kandidat Karivia',
                'bio' => $candidateProfile->bio,
                'location' => collect([$candidateProfile->location_city, $candidateProfile->location_province])->filter()->join(', '),
                'preferred_role' => $candidateProfile->preferred_role,
                'preferred_industry' => $candidateProfile->preferredIndustry?->name,
                'salary_range' => $this->salaryRange($candidateProfile->expected_salary_min, $candidateProfile->expected_salary_max),
                'availability' => $candidateProfile->availability ?? '-',
                'work_mode_pref' => $candidateProfile->work_mode_pref
                    ? str($candidateProfile->work_mode_pref)->headline()->toString()
                    : '-',
                'profile_completion' => $candidateProfile->profile_completion,
                'years_total_experience' => round($totalYears, 1),
                'match_score' => $aiMatchScore?->overall_score
                    ? (int) round((float) $aiMatchScore->overall_score)
                    : null,
                'match_reason' => $aiMatchScore?->explanation,
                'skills' => $candidateProfile->skills->map(fn ($skill): array => [
                    'name' => $skill->name,
                    'years_exp' => $skill->pivot->years_exp ?? null,
                    'proficiency' => $skill->pivot->proficiency ?? null,
                    'verified' => filled($skill->pivot->verified_at ?? null),
                ])->values(),
                'experiences' => $candidateProfile->experiences->map(fn ($experience): array => [
                    'job_title' => $experience->job_title,
                    'company_name' => $experience->company_name,
                    'location' => $experience->location,
                    'description' => $experience->description,
                    'start_date' => $experience->start_date?->format('M Y'),
                    'end_date' => $experience->is_current ? null : $experience->end_date?->format('M Y'),
                    'is_current' => (bool) $experience->is_current,
                ])->values(),
                'educations' => $candidateProfile->educations->map(fn ($education): array => [
                    'institution' => $education->institution,
                    'degree' => $education->degree,
                    'field_of_study' => $education->field_of_study,
                    'start_year' => $education->start_year,
                    'end_year' => $education->end_year,
                    'gpa' => $education->gpa,
                ])->values(),
                'certifications' => $candidateProfile->certifications->map(fn ($certification): array => [
                    'name' => $certification->name,
                    'issuing_org' => $certification->issuing_org,
                    'issue_date' => $certification->issue_date?->format('M Y'),
                    'credential_url' => $certification->credential_url,
                ])->values(),
                'is_saved' => $talentAction?->saved_at !== null,
                'is_shortlisted' => $talentAction?->shortlisted_at !== null,
                'is_unlocked' => $talentAction?->unlocked_at !== null,
                'unlocked_at' => $talentAction?->unlocked_at?->format('d M Y H:i'),
                'email' => $talentAction?->unlocked_at !== null ? $candidateProfile->user?->email : null,
                'phone' => $talentAction?->unlocked_at !== null ? $candidateProfile->user?->phone : null,
                'cv' => $talentAction?->unlocked_at !== null && $candidateProfile->primaryCv ? [
                    'id' => $candidateProfile->primaryCv->id,
                    'file_url' => $candidateProfile->primaryCv->file_url,
                    'uploaded_at' => $candidateProfile->primaryCv->uploaded_at?->format('d M Y'),
                ] : null,
                'conversation_id' => $conversationId,
            ],
            'invitationQuota' => $this->buildInvitationQuota($company),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function buildInvitationQuota(?Company $company): array
    {
        if ($company === null) {
            return ['limit' => 0, 'used' => 0, 'remaining' => 0];
        }

        $activeSubscription = $company->activeSubscription()->with('plan:id,talent_search_quota')->first();
        $limit = (int) ($activeSubscription?->plan?->talent_search_quota ?? 0);
        $used = EmployerTalentCandidate::query()
            ->where('company_id', $company->id)
            ->whereNotNull('unlocked_at')
            ->count();

        return [
            'limit' => $limit,
            'used' => $used,
            'remaining' => max(0, $limit - $used),
        ];
    }

    public function matchTalent(
        Request $request,
        CandidateProfile $candidateProfile,
        ResolveEmployerCompany $resolveEmployerCompany,
        MatchCandidateToCompanyJobs $matchCandidateToCompanyJobs,
    ): Response|RedirectResponse {
        $company = $resolveEmployerCompany->handle($request->user());

        if ($company === null) {
            Inertia::flash('toast', ['type' => 'warning', 'message' => 'Lengkapi profil perusahaan dulu sebelum job matching.']);

            return to_route('employer.company.edit');
        }

        $matches = $matchCandidateToCompanyJobs->handle($company, $candidateProfile);

        $candidateProfile->load(['user:id,name,avatar_url', 'skills:id,name']);

        return Inertia::render('employer/talent-search/match', [
            'company' => [
                'id' => $company->id,
                'name' => $company->name,
            ],
            'candidate' => [
                'id' => $candidateProfile->id,
                'name' => $candidateProfile->full_name ?? $candidateProfile->user?->name ?? 'Kandidat',
                'avatar_url' => $candidateProfile->user?->avatar_url,
                'headline' => $candidateProfile->headline ?? $candidateProfile->preferred_role ?? 'Kandidat Karivia',
                'skills' => $candidateProfile->skills->pluck('name')->values(),
            ],
            'matches' => $matches,
        ]);
    }

    private function renderTalentSearchPage(
        Request $request,
        ResolveEmployerCompany $resolveEmployerCompany,
        GenerateTalentSearchRecommendations $generateTalentSearchRecommendations,
        bool $savedOnly = false
    ): Response {
        $company = $resolveEmployerCompany->handle($request->user());
        $search = $request->string('q')->toString();
        $skillId = $request->integer('skill_id') ?: null;
        $location = $request->string('location')->toString();
        $salary = $request->string('salary')->toString();
        $experience = $request->string('experience')->toString();
        $availability = $request->string('availability')->toString();
        $sort = $request->string('sort', 'match')->toString();
        $poolFilter = $savedOnly
            ? in_array($request->string('pool')->toString(), ['saved', 'shortlisted'], true)
                ? $request->string('pool')->toString()
                : 'all'
            : 'all';
        $companyJobIds = $company
            ? JobListing::query()->whereBelongsTo($company)->pluck('id')->all()
            : [];

        $filters = [
            'q' => $search,
            'skill_id' => $skillId ? (string) $skillId : '',
            'location' => $location,
            'salary' => $salary,
            'experience' => $experience,
            'availability' => $availability,
            'sort' => $sort,
            'saved_only' => $savedOnly ? '1' : '',
            'pool' => $poolFilter,
        ];

        $candidates = CandidateProfile::query()
            ->select([
                'id',
                'user_id',
                'full_name',
                'headline',
                'location_city',
                'location_province',
                'expected_salary_min',
                'expected_salary_max',
                'work_mode_pref',
                'preferred_role',
                'availability',
                'profile_completion',
            ])
            ->with([
                'user:id,name,avatar_url',
                'skills:id,name',
                'experiences' => fn ($query) => $query
                    ->orderByDesc('is_current')
                    ->orderByDesc('start_date')
                    ->limit(3),
                'educations' => fn ($query) => $query
                    ->orderByDesc('end_year')
                    ->orderByDesc('start_year')
                    ->limit(2),
                'applications:id,candidate_id,status,created_at',
                'aiMatchScores' => fn ($query) => $query
                    ->when($companyJobIds !== [], fn ($query) => $query->whereIn('job_listing_id', $companyJobIds))
                    ->latest('computed_at'),
            ])
            ->withCount(['applications as company_applications_count' => fn ($query) => $query
                ->when($company !== null, fn ($query) => $query->whereHas('jobListing', fn ($jobQuery) => $jobQuery->where('company_id', $company->id)))])
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($query) use ($search): void {
                    $query
                        ->where('full_name', 'like', '%'.$search.'%')
                        ->orWhere('headline', 'like', '%'.$search.'%')
                        ->orWhere('preferred_role', 'like', '%'.$search.'%')
                        ->orWhere('bio', 'like', '%'.$search.'%')
                        ->orWhereHas('skills', fn ($skillQuery) => $skillQuery->where('name', 'like', '%'.$search.'%'));
                });
            })
            ->when($skillId !== null, fn ($query) => $query->whereHas('skills', fn ($skillQuery) => $skillQuery->whereKey($skillId)))
            ->when($location !== '', fn ($query) => $query->where(function ($query) use ($location): void {
                $query
                    ->where('location_city', 'like', '%'.$location.'%')
                    ->orWhere('location_province', 'like', '%'.$location.'%');
            }))
            ->when($salary !== '', fn ($query) => $this->applySalaryFilter($query, $salary))
            ->when($experience !== '', fn ($query) => $this->applyExperienceFilter($query, $experience))
            ->when($availability !== '', fn ($query) => $query->where('availability', $availability))
            ->when(
                $savedOnly && $company !== null,
                fn ($query) => $query->whereHas(
                    'talentActions',
                    fn ($talentActionQuery) => $talentActionQuery
                        ->where('company_id', $company->id)
                        ->where(function ($q) use ($poolFilter): void {
                            if ($poolFilter === 'saved') {
                                $q->whereNotNull('saved_at');
                            } elseif ($poolFilter === 'shortlisted') {
                                $q->whereNotNull('shortlisted_at');
                            } else {
                                $q->whereNotNull('saved_at')->orWhereNotNull('shortlisted_at');
                            }
                        })
                )
            )
            ->when($savedOnly && $company === null, fn ($query) => $query->whereRaw('1 = 0'))
            ->when($sort === 'recent', fn ($query) => $query->latest())
            ->when($sort !== 'recent', fn ($query) => $query->orderByDesc('profile_completion')->latest())
            ->paginate(10)
            ->withQueryString();

        $candidateIds = $candidates->getCollection()->pluck('id')->values();

        $talentActions = collect();
        $conversations = collect();

        if ($company !== null && $candidateIds->isNotEmpty()) {
            $talentActions = EmployerTalentCandidate::query()
                ->where('company_id', $company->id)
                ->whereIn('candidate_id', $candidateIds)
                ->get()
                ->keyBy('candidate_id');

            $conversations = Conversation::query()
                ->where('company_id', $company->id)
                ->whereIn('candidate_id', $candidateIds)
                ->whereNull('application_id')
                ->pluck('id', 'candidate_id');
        }

        $candidateRows = $candidates->getCollection()->map(function (CandidateProfile $candidate) use ($search, $talentActions, $conversations): array {
            /** @var EmployerTalentCandidate|null $action */
            $action = $talentActions->get($candidate->id);

            return $this->talentRow(
                $candidate,
                $search,
                $action?->saved_at !== null,
                $action?->shortlisted_at !== null,
                $conversations->has($candidate->id)
                    ? (int) $conversations->get($candidate->id)
                    : null
            );
        });

        $hasActiveFilter = $search !== ''
            || $skillId !== null
            || $location !== ''
            || $salary !== ''
            || $experience !== ''
            || $availability !== '';

        $computedRanked = $candidateRows
            ->map(fn (array $row): array => $row + [
                'match_source' => $row['match_source'] ?? 'computed',
                'match_reason' => $row['match_reason'] ?? null,
            ])
            ->sortByDesc('match_score')
            ->values();

        $candidates->setCollection($computedRanked);

        $deferredRerank = null;

        if ($hasActiveFilter) {
            $rerankUser = $request->user();
            $rerankFilters = $filters;
            $rerankInputRows = $candidateRows;

            $deferredRerank = Inertia::defer(function () use ($generateTalentSearchRecommendations, $rerankUser, $rerankFilters, $rerankInputRows) {
                try {
                    return $generateTalentSearchRecommendations
                        ->handle($rerankUser, $rerankFilters, $rerankInputRows)
                        ->values()
                        ->all();
                } catch (\Throwable $e) {
                    report($e);

                    return null;
                }
            });
        }

        $savedCandidatesCount = 0;
        $shortlistedCount = 0;
        $poolTotalCount = 0;

        if ($company !== null) {
            $poolStats = EmployerTalentCandidate::query()
                ->where('company_id', $company->id)
                ->where(fn ($q) => $q->whereNotNull('saved_at')->orWhereNotNull('shortlisted_at'))
                ->selectRaw('COUNT(DISTINCT candidate_id) as total, '
                    .'SUM(CASE WHEN saved_at IS NOT NULL THEN 1 ELSE 0 END) as saved_count, '
                    .'SUM(CASE WHEN shortlisted_at IS NOT NULL THEN 1 ELSE 0 END) as shortlisted_count')
                ->first();

            $savedCandidatesCount = (int) ($poolStats->saved_count ?? 0);
            $shortlistedCount = (int) ($poolStats->shortlisted_count ?? 0);
            $poolTotalCount = (int) ($poolStats->total ?? 0);
        }

        return Inertia::render('employer/talent-search', [
            'company' => $company ? [
                'id' => $company->id,
                'name' => $company->name,
            ] : null,
            'filters' => $filters,
            'filterOptions' => [
                'skills' => Skill::query()
                    ->orderBy('name')
                    ->limit(50)
                    ->get(['id', 'name'])
                    ->map(fn (Skill $skill): array => [
                        'value' => (string) $skill->id,
                        'label' => $skill->name,
                    ]),
                'locations' => CandidateProfile::query()
                    ->select('location_city')
                    ->whereNotNull('location_city')
                    ->distinct()
                    ->orderBy('location_city')
                    ->limit(20)
                    ->pluck('location_city')
                    ->map(fn (string $city): array => [
                        'value' => $city,
                        'label' => $city,
                    ]),
            ],
            'aiSuggestions' => $this->talentSearchSuggestions($search, $skillId, $location),
            'recommendationSource' => 'computed',
            'aiRerankedCandidates' => $deferredRerank,
            'candidates' => $candidates,
            'totalCandidates' => CandidateProfile::count(),
            'savedCandidatesCount' => $savedCandidatesCount,
            'shortlistedCount' => $shortlistedCount,
            'poolTotalCount' => $poolTotalCount,
            'viewMode' => $savedOnly ? 'saved' : 'all',
        ]);
    }

    private function page(string $title, string $description, string $message): Response
    {
        return Inertia::render('employer/workspace', [
            'title' => $title,
            'description' => $description,
            'message' => $message,
        ]);
    }

    private function applySalaryFilter($query, string $salary): void
    {
        match ($salary) {
            'under_10' => $query->where(fn ($query) => $query->whereNull('expected_salary_max')->orWhere('expected_salary_max', '<=', 10000000)),
            '10_20' => $query->where('expected_salary_min', '<=', 20000000)->where('expected_salary_max', '>=', 10000000),
            '20_35' => $query->where('expected_salary_min', '<=', 35000000)->where('expected_salary_max', '>=', 20000000),
            'above_35' => $query->where('expected_salary_min', '>=', 35000000),
            default => null,
        };
    }

    private function applyExperienceFilter($query, string $experience): void
    {
        match ($experience) {
            '0_2' => $query->whereHas('skills', fn ($skillQuery) => $skillQuery->whereBetween('candidate_skill.years_exp', [0, 2])),
            '3_5' => $query->whereHas('skills', fn ($skillQuery) => $skillQuery->whereBetween('candidate_skill.years_exp', [3, 5])),
            '6_plus' => $query->whereHas('skills', fn ($skillQuery) => $skillQuery->where('candidate_skill.years_exp', '>=', 6)),
            default => null,
        };
    }

    /**
     * @return array<string, mixed>
     */
    private function talentRow(
        CandidateProfile $candidate,
        string $search,
        bool $isSaved = false,
        bool $isShortlisted = false,
        ?int $conversationId = null,
    ): array {
        $aiScore = (int) round((float) $candidate->aiMatchScores->avg('overall_score'));
        $skills = $candidate->skills
            ->map(fn ($skill): array => [
                'name' => $skill->name,
                'years_exp' => $skill->pivot->years_exp,
                'verified' => filled($skill->pivot->verified_at),
            ])
            ->values();

        $experiences = $candidate->experiences
            ->map(fn ($experience): array => [
                'job_title' => $experience->job_title,
                'company_name' => $experience->company_name,
                'start_date' => $experience->start_date?->format('M Y'),
                'end_date' => $experience->is_current
                    ? null
                    : $experience->end_date?->format('M Y'),
                'is_current' => (bool) $experience->is_current,
            ])
            ->values()
            ->all();

        $educations = $candidate->educations
            ->map(fn ($education): array => [
                'institution' => $education->institution,
                'degree' => $education->degree,
                'field_of_study' => $education->field_of_study,
                'end_year' => $education->end_year,
            ])
            ->values()
            ->all();

        return [
            'id' => $candidate->id,
            'name' => $candidate->full_name ?? $candidate->user?->name ?? 'Kandidat',
            'avatar_url' => $candidate->user?->avatar_url,
            'headline' => $candidate->headline ?? $candidate->preferred_role ?? 'Kandidat Karivia',
            'location' => collect([$candidate->location_city, $candidate->location_province])->filter()->join(', '),
            'salary_range' => $this->salaryRange($candidate->expected_salary_min, $candidate->expected_salary_max),
            'max_years_exp' => (int) $skills->max('years_exp'),
            'availability' => $candidate->availability ?? '-',
            'work_mode_pref' => $candidate->work_mode_pref ? str($candidate->work_mode_pref)->headline()->toString() : '-',
            'profile_completion' => $candidate->profile_completion,
            'company_applications_count' => $candidate->company_applications_count,
            'match_score' => $aiScore > 0 ? $aiScore : $this->computedTalentScore($candidate, $skills, $search),
            'match_source' => $aiScore > 0 ? 'ai_match_score' : 'computed',
            'match_reason' => $candidate->aiMatchScores->first()?->explanation,
            'skills' => $skills->take(5)->all(),
            'experiences' => $experiences,
            'educations' => $educations,
            'is_saved' => $isSaved,
            'is_shortlisted' => $isShortlisted,
            'conversation_id' => $conversationId,
        ];
    }

    private function computedTalentScore(CandidateProfile $candidate, Collection $skills, string $search): int
    {
        $score = 50 + (int) floor(($candidate->profile_completion ?? 0) * 0.25) + min(15, $skills->count() * 3);

        if ($search !== '') {
            $haystack = str($candidate->full_name.' '.$candidate->headline.' '.$candidate->preferred_role.' '.$skills->pluck('name')->join(' '))->lower();

            if ($haystack->contains(str($search)->lower())) {
                $score += 10;
            }
        }

        return max(55, min(98, $score));
    }

    /**
     * @return array<int, string>
     */
    private function talentSearchSuggestions(string $search, ?int $skillId, string $location): array
    {
        return collect([
            $search !== '' ? 'AI membaca intensi pencarian: '.$search : null,
            $skillId !== null ? 'Filter skill aktif membantu mempersempit kandidat teknis.' : null,
            $location !== '' ? 'Lokasi diprioritaskan untuk area '.$location.'.' : null,
            $search === '' && $skillId === null && $location === '' ? 'Coba masukkan role, skill, lokasi, atau senioritas untuk hasil lebih presisi.' : null,
        ])->filter()->values()->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function candidateRow(Application $application): array
    {
        $candidate = $application->candidate;
        $interview = $application->interviews->first();
        $aiSession = $application->latestAiInterviewSession;

        return [
            'id' => $application->id,
            'status' => $application->status,
            'status_label' => str($application->status)->headline()->toString(),
            'applied_at' => $application->applied_at?->format('d M Y') ?? '-',
            'first_responded_at' => $application->first_responded_at?->format('d M Y') ?? null,
            'ai_fit_score' => $application->ai_fit_score,
            'ai_skill_match' => [
                'matched' => $application->ai_skill_match['matched'] ?? [],
                'missing' => $application->ai_skill_match['missing'] ?? [],
            ],
            'cover_letter' => str((string) $application->cover_letter)->limit(180)->toString(),
            'candidate' => [
                'id' => $candidate?->id,
                'name' => $candidate?->full_name ?? $candidate?->user?->name ?? 'Kandidat',
                'email' => $candidate?->user?->email,
                'phone' => $candidate?->user?->phone,
                'whatsapp_phone' => $this->normalizeWhatsappPhone($candidate?->user?->phone),
                'avatar_url' => $candidate?->user?->avatar_url,
                'headline' => $candidate?->headline,
                'preferred_role' => $candidate?->preferred_role,
                'location' => collect([$candidate?->location_city, $candidate?->location_province])->filter()->join(', '),
                'expected_salary' => $this->salaryRange($candidate?->expected_salary_min, $candidate?->expected_salary_max),
                'work_mode_pref' => $candidate?->work_mode_pref ? str($candidate->work_mode_pref)->headline()->toString() : '-',
                'availability' => $candidate?->availability ?? '-',
                'profile_completion' => $candidate?->profile_completion ?? 0,
                'industry' => $candidate?->preferredIndustry?->name,
                'skills' => $candidate?->skills
                    ->take(6)
                    ->map(fn ($skill): string => $skill->name)
                    ->values()
                    ->all() ?? [],
            ],
            'job' => [
                'id' => $application->jobListing?->id,
                'title' => $application->jobListing?->title ?? '-',
                'status' => $application->jobListing?->status ?? '-',
            ],
            'cv' => $application->cv ? [
                'file_url' => $application->cv->file_url,
                'uploaded_at' => $application->cv->uploaded_at?->format('d M Y'),
            ] : null,
            'latest_history' => $application->latestStatusHistory ? [
                'to_status' => $application->latestStatusHistory->to_status,
                'note' => $application->latestStatusHistory->note,
                'created_at' => $application->latestStatusHistory->created_at?->format('d M Y H:i'),
            ] : null,
            'interview' => $interview ? [
                'status' => $interview->status,
                'mode' => str((string) $interview->mode)->headline()->toString(),
                'scheduled_at' => $interview->scheduled_at?->format('d M Y H:i'),
            ] : null,
            'interviews_count' => $application->interviews_count,
            'latest_ai_session' => $aiSession ? [
                'id' => $aiSession->id,
                'status' => $aiSession->status,
                'interview_mode' => $aiSession->interview_mode ?? 'voice',
                'scheduled_at' => $aiSession->scheduled_at?->format('d M Y H:i'),
                'completed_at' => $aiSession->completed_at?->format('d M Y H:i'),
                'fit_score' => $aiSession->analysis?->fit_score,
            ] : null,
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function aiInterviewSuggestedQuestions(JobListing $jobListing): array
    {
        return [
            [
                'question' => "Ceritakan pengalaman paling relevan Anda untuk posisi {$jobListing->title}.",
                'category' => 'behavioral',
                'rubric' => 'Cari contoh konkret, konteks masalah, aksi kandidat, dan dampaknya.',
                'weight' => 25,
                'allow_ai_followup' => true,
            ],
            [
                'question' => 'Bagaimana Anda menyelesaikan masalah teknis paling sulit di pekerjaan sebelumnya?',
                'category' => 'technical',
                'rubric' => 'Nilai kedalaman teknis, cara berpikir, trade-off, dan ownership.',
                'weight' => 25,
                'allow_ai_followup' => true,
            ],
            [
                'question' => 'Apa pendekatan Anda saat harus bekerja dengan deadline ketat dan kebutuhan berubah?',
                'category' => 'problem_solving',
                'rubric' => 'Nilai prioritas, komunikasi, adaptasi, dan manajemen risiko.',
                'weight' => 25,
                'allow_ai_followup' => true,
            ],
            [
                'question' => 'Mengapa Anda tertarik dengan posisi dan perusahaan ini?',
                'category' => 'motivation',
                'rubric' => 'Nilai motivasi, riset kandidat, dan kesesuaian ekspektasi.',
                'weight' => 25,
                'allow_ai_followup' => false,
            ],
        ];
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function applicationStatusOptions(): array
    {
        $statusLabels = [
            'applied' => 'Terkirim',
            'screened' => 'Seleksi Awal',
            'shortlisted' => 'Terpilih',
            'interview' => 'Wawancara',
            'offer' => 'Penawaran',
            'hired' => 'Diterima',
            'rejected' => 'Ditolak',
            'withdrawn' => 'Ditarik',
        ];

        return collect(['applied', 'screened', 'shortlisted', 'interview', 'offer', 'hired', 'rejected', 'withdrawn'])
            ->map(fn (string $status): array => [
                'value' => $status,
                'label' => $statusLabels[$status] ?? str($status)->headline()->toString(),
            ])
            ->all();
    }

    private function salaryRange(?int $minimum, ?int $maximum): string
    {
        if (! $minimum && ! $maximum) {
            return '-';
        }

        $format = fn (?int $amount): string => $amount ? 'Rp '.number_format($amount, 0, ',', '.') : '-';

        return $format($minimum).' - '.$format($maximum);
    }

    private function normalizeWhatsappPhone(?string $phone): ?string
    {
        if ($phone === null || trim($phone) === '') {
            return null;
        }

        $digits = preg_replace('/\D+/', '', $phone) ?? '';

        if ($digits === '') {
            return null;
        }

        if (str_starts_with($digits, '0')) {
            $digits = '62'.substr($digits, 1);
        }

        return $digits;
    }
}
