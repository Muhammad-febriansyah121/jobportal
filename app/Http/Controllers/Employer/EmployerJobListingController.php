<?php

namespace App\Http\Controllers\Employer;

use App\Actions\Employer\ResolveEmployerCompany;
use App\Http\Controllers\Controller;
use App\Http\Requests\Employer\SaveEmployerJobRequest;
use App\Models\Application;
use App\Models\Industry;
use App\Models\JobListing;
use App\Support\UniqueSlug;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class EmployerJobListingController extends Controller
{
    public function index(Request $request, ResolveEmployerCompany $resolveEmployerCompany): Response|RedirectResponse
    {
        $company = $resolveEmployerCompany->handle($request->user());

        if ($company === null) {
            Inertia::flash('toast', ['type' => 'warning', 'message' => 'Lengkapi profil perusahaan sebelum membuat lowongan.']);

            return to_route('employer.company.edit');
        }

        return Inertia::render('employer/jobs/index', [
            'company' => [
                'id' => $company->id,
                'name' => $company->name,
            ],
            'filters' => [
                'search' => $request->string('search')->toString(),
                'status' => $request->string('status')->toString(),
            ],
            'jobs' => JobListing::query()
                ->select(['id', 'company_id', 'title', 'slug', 'status', 'work_mode', 'job_type', 'is_anonymous', 'published_at', 'created_at'])
                ->withCount('applications')
                ->whereBelongsTo($company)
                ->when($request->filled('search'), fn ($query) => $query->where('title', 'like', '%'.$request->string('search')->toString().'%'))
                ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()))
                ->latest()
                ->paginate(12)
                ->withQueryString()
                ->through(fn (JobListing $job): array => [
                    'id' => $job->id,
                    'title' => $job->title,
                    'status' => $job->status,
                    'status_label' => str($job->status)->headline()->toString(),
                    'work_mode' => str($job->work_mode)->headline()->toString(),
                    'job_type' => str($job->job_type)->headline()->toString(),
                    'is_anonymous' => (bool) $job->is_anonymous,
                    'applications_count' => $job->applications_count,
                    'published_at' => $job->published_at?->format('d M Y') ?? '-',
                ]),
        ]);
    }

    public function create(Request $request, ResolveEmployerCompany $resolveEmployerCompany): Response|RedirectResponse
    {
        $company = $resolveEmployerCompany->handle($request->user());

        if ($company === null) {
            Inertia::flash('toast', ['type' => 'warning', 'message' => 'Lengkapi profil perusahaan sebelum membuat lowongan.']);

            return to_route('employer.company.edit');
        }

        if (! $company->isApproved()) {
            Inertia::flash('toast', ['type' => 'warning', 'message' => 'Perusahaan Anda belum disetujui. Tunggu proses verifikasi sebelum membuat lowongan.']);

            return to_route('employer.jobs.index');
        }

        return Inertia::render('employer/jobs/form', [
            'mode' => 'create',
            'job' => null,
            'industries' => $this->industries(),
        ]);
    }

    public function show(Request $request, JobListing $jobListing, ResolveEmployerCompany $resolveEmployerCompany): Response|RedirectResponse
    {
        $company = $resolveEmployerCompany->handle($request->user());

        if ($company === null) {
            return to_route('employer.company.edit');
        }

        $this->ensureBelongsToCompany($jobListing, $company->id);

        $jobListing->load([
            'industry:id,name',
            'skills:id,name',
        ])->loadCount([
            'applications',
            'applications as shortlisted_applications_count' => fn ($query) => $query->where('status', 'shortlisted'),
            'applications as interview_applications_count' => fn ($query) => $query->where('status', 'interview'),
            'applications as offer_applications_count' => fn ($query) => $query->where('status', 'offer'),
            'applications as hired_applications_count' => fn ($query) => $query->where('status', 'hired'),
        ]);

        $recentApplications = Application::query()
            ->select(['id', 'candidate_id', 'status', 'ai_fit_score', 'applied_at'])
            ->with('candidate:id,full_name,headline')
            ->where('job_listing_id', $jobListing->id)
            ->when($request->filled('recent_search'), function ($query) use ($request): void {
                $search = $request->string('recent_search')->toString();

                $query->whereHas('candidate', fn ($candidateQuery) => $candidateQuery
                    ->where('full_name', 'like', '%'.$search.'%')
                    ->orWhere('headline', 'like', '%'.$search.'%'));
            })
            ->latest('applied_at')
            ->paginate(5, ['*'], 'recent_page')
            ->withQueryString()
            ->through(fn (Application $application): array => [
                'id' => $application->id,
                'candidate_name' => $application->candidate?->full_name ?? 'Kandidat',
                'candidate_headline' => $application->candidate?->headline,
                'status' => $application->status,
                'status_label' => $this->applicationStatusLabel($application->status),
                'ai_fit_score' => $application->ai_fit_score,
                'applied_at' => $application->applied_at?->format('d M Y H:i'),
            ]);

        $applications = Application::query()
            ->select(['id', 'job_listing_id', 'candidate_id', 'status', 'ai_fit_score', 'applied_at'])
            ->with([
                'candidate:id,user_id,full_name,headline,location_city,location_province',
                'candidate.user:id,name,email',
                'latestAiInterviewSession',
                'latestAiInterviewSession.analysis:id,session_id,fit_score,recommendation',
            ])
            ->where('job_listing_id', $jobListing->id)
            ->when($request->filled('search'), function ($query) use ($request): void {
                $search = $request->string('search')->toString();

                $query->where(function ($query) use ($search): void {
                    $query
                        ->whereHas('candidate', fn ($candidateQuery) => $candidateQuery
                            ->where('full_name', 'like', '%'.$search.'%')
                            ->orWhere('headline', 'like', '%'.$search.'%')
                        )
                        ->orWhereHas('candidate.user', fn ($userQuery) => $userQuery
                            ->where('name', 'like', '%'.$search.'%')
                            ->orWhere('email', 'like', '%'.$search.'%')
                        );
                });
            })
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()))
            ->when($request->filled('ai_interview_status'), function ($query) use ($request): void {
                $aiInterviewStatus = $request->string('ai_interview_status')->toString();

                if ($aiInterviewStatus === 'none') {
                    $query->whereDoesntHave('aiInterviewSessions');

                    return;
                }

                $query->whereHas('latestAiInterviewSession', fn ($sessionQuery) => $sessionQuery->where('status', $aiInterviewStatus));
            })
            ->latest('applied_at')
            ->paginate(10)
            ->withQueryString()
            ->through(function (Application $application): array {
                $latestSession = $application->latestAiInterviewSession;

                return [
                    'id' => $application->id,
                    'candidate_name' => $application->candidate?->full_name ?? $application->candidate?->user?->name ?? 'Kandidat',
                    'candidate_headline' => $application->candidate?->headline,
                    'candidate_email' => $application->candidate?->user?->email,
                    'candidate_location' => collect([$application->candidate?->location_city, $application->candidate?->location_province])->filter()->implode(', '),
                    'status' => $application->status,
                    'status_label' => $this->applicationStatusLabel($application->status),
                    'ai_fit_score' => $application->ai_fit_score,
                    'applied_at' => $application->applied_at?->format('d M Y H:i'),
                    'latest_ai_session' => $latestSession ? [
                        'id' => $latestSession->id,
                        'status' => $latestSession->status,
                        'interview_mode' => $latestSession->interview_mode ?? 'voice',
                        'scheduled_at' => $latestSession->scheduled_at?->format('d M Y H:i'),
                        'completed_at' => $latestSession->completed_at?->format('d M Y H:i'),
                        'fit_score' => $latestSession->analysis?->fit_score,
                    ] : null,
                ];
            });

        return Inertia::render('employer/jobs/show', [
            'company' => [
                'id' => $company->id,
                'name' => $company->name,
            ],
            'job' => [
                'id' => $jobListing->id,
                'title' => $jobListing->title,
                'slug' => $jobListing->slug,
                'status' => $jobListing->status,
                'status_label' => str($jobListing->status)->headline()->toString(),
                'industry' => $jobListing->industry?->name,
                'work_mode' => str($jobListing->work_mode)->headline()->toString(),
                'job_type' => str($jobListing->job_type)->headline()->toString(),
                'experience_level' => str($jobListing->experience_level)->headline()->toString(),
                'qualification' => $jobListing->qualification,
                'qualification_label' => $this->qualificationLabel($jobListing->qualification),
                'experience_years' => $this->experienceYearsLabel($jobListing->experience_min_years, $jobListing->experience_max_years),
                'location' => collect([$jobListing->location_city, $jobListing->location_province])->filter()->implode(', '),
                'salary_range' => $this->salaryRange($jobListing->salary_min, $jobListing->salary_max),
                'is_salary_visible' => $jobListing->is_salary_visible,
                'is_anonymous' => (bool) $jobListing->is_anonymous,
                'response_sla_hours' => $jobListing->response_sla_hours,
                'published_at' => $jobListing->published_at?->format('d M Y H:i') ?? '-',
                'closes_at' => $jobListing->closes_at?->format('d M Y') ?? '-',
                'created_at' => $jobListing->created_at?->format('d M Y H:i') ?? '-',
                'description' => $jobListing->description,
                'responsibilities' => $jobListing->responsibilities,
                'required_qualifications' => $jobListing->required_qualifications,
                'preferred_qualifications' => $jobListing->preferred_qualifications,
                'benefits' => $jobListing->benefits,
                'skills' => $jobListing->skills
                    ->map(fn ($skill): array => [
                        'id' => $skill->id,
                        'name' => $skill->name,
                    ])
                    ->values()
                    ->all(),
                'applications_count' => (int) $jobListing->applications_count,
                'shortlisted_applications_count' => (int) $jobListing->shortlisted_applications_count,
                'interview_applications_count' => (int) $jobListing->interview_applications_count,
                'offer_applications_count' => (int) $jobListing->offer_applications_count,
                'hired_applications_count' => (int) $jobListing->hired_applications_count,
            ],
            'filters' => [
                'search' => $request->string('search')->toString(),
                'status' => $request->string('status')->toString(),
                'ai_interview_status' => $request->string('ai_interview_status')->toString(),
            ],
            'recent_filters' => [
                'recent_search' => $request->string('recent_search')->toString(),
            ],
            'recent_applications' => $recentApplications,
            'applications' => $applications,
            'suggested_questions' => $this->suggestedInterviewQuestions($jobListing),
        ]);
    }

    public function store(SaveEmployerJobRequest $request, ResolveEmployerCompany $resolveEmployerCompany): RedirectResponse
    {
        $company = $resolveEmployerCompany->handle($request->user());

        if ($company === null) {
            Inertia::flash('toast', ['type' => 'warning', 'message' => 'Lengkapi profil perusahaan sebelum membuat lowongan.']);

            return to_route('employer.company.edit');
        }

        if (! $company->isApproved()) {
            Inertia::flash('toast', ['type' => 'warning', 'message' => 'Perusahaan Anda belum disetujui. Tunggu proses verifikasi sebelum membuat lowongan.']);

            return to_route('employer.jobs.index');
        }

        $data = $this->normalizeJobData($request->validated());
        $data['slug'] = UniqueSlug::make(JobListing::class, $data['title'], 'lowongan');

        $shouldPublish = $request->boolean('publish');

        if ($shouldPublish) {
            Validator::make($data, [
                'description' => ['required', 'string'],
                'required_qualifications' => ['required', 'string'],
            ], [
                'description.required' => 'Deskripsi lowongan wajib diisi sebelum publish.',
                'required_qualifications.required' => 'Kualifikasi wajib harus diisi sebelum publish.',
            ])->validate();
        }

        JobListing::create([
            ...$data,
            'company_id' => $company->id,
            'created_by' => $request->user()->id,
            'status' => $shouldPublish ? 'published' : 'draft',
            'published_at' => $shouldPublish ? now() : null,
        ]);

        $message = $shouldPublish
            ? 'Lowongan berhasil dibuat dan dipublikasikan.'
            : 'Draft lowongan berhasil dibuat.';

        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return to_route('employer.jobs.index');
    }

    public function edit(Request $request, JobListing $jobListing, ResolveEmployerCompany $resolveEmployerCompany): Response|RedirectResponse
    {
        $company = $resolveEmployerCompany->handle($request->user());

        if ($company === null) {
            return to_route('employer.company.edit');
        }

        $this->ensureBelongsToCompany($jobListing, $company->id);

        return Inertia::render('employer/jobs/form', [
            'mode' => 'edit',
            'job' => [
                'id' => $jobListing->id,
                'title' => $jobListing->title,
                'slug' => $jobListing->slug,
                'industry_id' => $jobListing->industry_id,
                'description' => $jobListing->description,
                'responsibilities' => $jobListing->responsibilities,
                'required_qualifications' => $jobListing->required_qualifications,
                'preferred_qualifications' => $jobListing->preferred_qualifications,
                'benefits' => $jobListing->benefits,
                'location_city' => $jobListing->location_city,
                'location_province' => $jobListing->location_province,
                'work_mode' => $jobListing->work_mode,
                'job_type' => $jobListing->job_type,
                'experience_level' => $jobListing->experience_level,
                'qualification' => $jobListing->qualification,
                'experience_min_years' => $jobListing->experience_min_years,
                'experience_max_years' => $jobListing->experience_max_years,
                'salary_min' => $jobListing->salary_min,
                'salary_max' => $jobListing->salary_max,
                'salary_currency' => $jobListing->salary_currency,
                'is_salary_visible' => $jobListing->is_salary_visible,
                'is_anonymous' => (bool) $jobListing->is_anonymous,
                'is_urgent' => (bool) $jobListing->is_urgent,
                'response_sla_hours' => $jobListing->response_sla_hours,
                'closes_at' => $jobListing->closes_at?->toDateString(),
                'status' => $jobListing->status,
            ],
            'industries' => $this->industries(),
        ]);
    }

    public function update(SaveEmployerJobRequest $request, JobListing $jobListing, ResolveEmployerCompany $resolveEmployerCompany): RedirectResponse
    {
        $company = $resolveEmployerCompany->handle($request->user());

        abort_if($company === null, 404);

        $this->ensureBelongsToCompany($jobListing, $company->id);

        $data = $this->normalizeJobData($request->validated());
        $data['slug'] = UniqueSlug::make(JobListing::class, $data['title'], 'lowongan', $jobListing);

        $jobListing->update($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Lowongan berhasil diperbarui.']);

        return to_route('employer.jobs.index');
    }

    public function publish(Request $request, JobListing $jobListing, ResolveEmployerCompany $resolveEmployerCompany): RedirectResponse
    {
        $company = $resolveEmployerCompany->handle($request->user());

        abort_if($company === null, 404);

        $this->ensureBelongsToCompany($jobListing, $company->id);

        if (! $company->isApproved()) {
            Inertia::flash('toast', ['type' => 'warning', 'message' => 'Perusahaan Anda belum disetujui. Tunggu proses verifikasi sebelum mempublikasikan lowongan.']);

            return to_route('employer.jobs.index');
        }

        Validator::make($jobListing->toArray(), [
            'description' => ['required', 'string'],
            'required_qualifications' => ['required', 'string'],
            'work_mode' => ['required', 'string'],
            'job_type' => ['required', 'string'],
            'experience_level' => ['required', 'string'],
        ], [
            'description.required' => 'Deskripsi lowongan wajib diisi sebelum publish.',
            'required_qualifications.required' => 'Kualifikasi wajib harus diisi sebelum publish.',
        ])->validate();

        $jobListing->update([
            'status' => 'published',
            'published_at' => $jobListing->published_at ?? now(),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Lowongan berhasil dipublikasikan.']);

        return to_route('employer.jobs.index');
    }

    public function close(Request $request, JobListing $jobListing, ResolveEmployerCompany $resolveEmployerCompany): RedirectResponse
    {
        $company = $resolveEmployerCompany->handle($request->user());

        abort_if($company === null, 404);

        $this->ensureBelongsToCompany($jobListing, $company->id);

        $jobListing->update(['status' => 'closed']);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Lowongan berhasil ditutup.']);

        return to_route('employer.jobs.index');
    }

    public function destroy(Request $request, JobListing $jobListing, ResolveEmployerCompany $resolveEmployerCompany): RedirectResponse
    {
        $company = $resolveEmployerCompany->handle($request->user());

        abort_if($company === null, 404);

        $this->ensureBelongsToCompany($jobListing, $company->id);

        throw_if($jobListing->status !== 'draft', ValidationException::withMessages([
            'job' => 'Hanya draft yang dapat dihapus.',
        ]));

        $jobListing->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Draft lowongan berhasil dihapus.']);

        return to_route('employer.jobs.index');
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function industries(): array
    {
        return Industry::query()
            ->select(['id', 'name'])
            ->orderBy('name')
            ->get()
            ->map(fn (Industry $industry): array => [
                'value' => (string) $industry->id,
                'label' => $industry->name,
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

    private function qualificationLabel(?string $qualification): ?string
    {
        return match ($qualification) {
            'sma' => 'SMA/SMK',
            'd3' => 'D3',
            's1' => 'S1',
            's2' => 'S2',
            's3' => 'S3',
            default => null,
        };
    }

    private function experienceYearsLabel(?int $min, ?int $max): ?string
    {
        if ($min === null && $max === null) {
            return null;
        }

        if ($min !== null && $max !== null && $min !== $max) {
            return $min.'-'.$max;
        }

        return (string) ($min ?? $max);
    }

    private function applicationStatusLabel(string $status): string
    {
        return [
            'applied' => 'Terkirim',
            'screened' => 'Seleksi Awal',
            'shortlisted' => 'Terpilih',
            'interview' => 'Wawancara',
            'offer' => 'Penawaran',
            'hired' => 'Diterima',
            'rejected' => 'Ditolak',
            'withdrawn' => 'Ditarik',
        ][$status] ?? str($status)->headline()->toString();
    }

    private function ensureBelongsToCompany(JobListing $jobListing, int $companyId): void
    {
        abort_unless((int) $jobListing->company_id === $companyId, 404);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function suggestedInterviewQuestions(JobListing $jobListing): array
    {
        return [
            [
                'question' => "Ceritakan pengalaman paling relevan Anda untuk posisi {$jobListing->title}.",
                'category' => 'behavioral',
                'rubric' => 'Cari contoh konkret, konteks masalah, aksi kandidat, dan dampaknya.',
                'weight' => 20,
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
                'weight' => 20,
                'allow_ai_followup' => true,
            ],
            [
                'question' => 'Mengapa Anda tertarik dengan posisi dan perusahaan ini?',
                'category' => 'motivation',
                'rubric' => 'Nilai motivasi, riset kandidat, dan kesesuaian ekspektasi.',
                'weight' => 15,
                'allow_ai_followup' => false,
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function normalizeJobData(array $data): array
    {
        $data['description'] = (string) ($data['description'] ?? '');
        $data['is_anonymous'] = (bool) ($data['is_anonymous'] ?? false);
        $data['is_urgent'] = (bool) ($data['is_urgent'] ?? false);

        return $data;
    }
}
