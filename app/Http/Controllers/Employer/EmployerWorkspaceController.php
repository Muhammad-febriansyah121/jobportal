<?php

namespace App\Http\Controllers\Employer;

use App\Actions\Employer\ResolveEmployerCompany;
use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\JobListing;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmployerWorkspaceController extends Controller
{
    public function candidates(Request $request, ResolveEmployerCompany $resolveEmployerCompany): Response|RedirectResponse
    {
        $company = $resolveEmployerCompany->handle($request->user());

        if ($company === null) {
            Inertia::flash('toast', ['type' => 'warning', 'message' => 'Lengkapi profil perusahaan sebelum melihat kandidat.']);

            return to_route('employer.company.edit');
        }

        $search = $request->string('search')->toString();
        $status = $request->string('status')->toString();
        $jobId = $request->integer('job_id') ?: null;

        $applications = Application::query()
            ->select(['id', 'job_listing_id', 'candidate_id', 'candidate_cv_id', 'status', 'cover_letter', 'screening_answers_json', 'ai_fit_score', 'ai_skill_match', 'applied_at', 'first_responded_at'])
            ->whereHas('jobListing', fn ($query) => $query->where('company_id', $company->id))
            ->with([
                'candidate.user:id,name,email,avatar_url',
                'candidate.skills:id,name',
                'candidate.preferredIndustry:id,name',
                'cv:id,candidate_id,file_url,is_primary,uploaded_at',
                'jobListing:id,company_id,title,status',
                'latestStatusHistory',
                'interviews' => fn ($query) => $query
                    ->select(['id', 'application_id', 'scheduled_at', 'mode', 'status'])
                    ->latest('scheduled_at')
                    ->limit(1),
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
            ->latest('applied_at')
            ->paginate(12)
            ->withQueryString()
            ->through(fn (Application $application): array => $this->candidateRow($application));

        return Inertia::render('employer/candidates', [
            'company' => [
                'id' => $company->id,
                'name' => $company->name,
            ],
            'filters' => [
                'search' => $search,
                'status' => $status,
                'job_id' => $jobId ? (string) $jobId : '',
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
        ]);
    }

    public function messages(): Response
    {
        return $this->page(
            'Pesan',
            'Pantau percakapan kandidat dan follow-up recruiter.',
            'Inbox kandidat akan menampilkan thread pesan, status terbaca, dan konteks lowongan.'
        );
    }

    public function analytics(): Response
    {
        return $this->page(
            'Analytics',
            'Lihat performa lowongan, sumber kandidat, dan SLA rekrutmen.',
            'Analytics employer akan merangkum conversion rate, response time, dan pipeline velocity.'
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

    public function talentSearch(): Response
    {
        return $this->page(
            'Cari Talenta',
            'Temukan kandidat relevan berdasarkan skill, lokasi, pengalaman, dan kecocokan AI.',
            'Talent search akan memakai filter kandidat dan rekomendasi match score.'
        );
    }

    private function page(string $title, string $description, string $message): Response
    {
        return Inertia::render('employer/workspace', [
            'title' => $title,
            'description' => $description,
            'message' => $message,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function candidateRow(Application $application): array
    {
        $candidate = $application->candidate;
        $interview = $application->interviews->first();

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
        ];
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function applicationStatusOptions(): array
    {
        return collect(['applied', 'screened', 'shortlisted', 'interview', 'offer', 'hired', 'rejected', 'withdrawn'])
            ->map(fn (string $status): array => [
                'value' => $status,
                'label' => str($status)->headline()->toString(),
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
}
