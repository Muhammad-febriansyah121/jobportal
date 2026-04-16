<?php

namespace App\Http\Controllers\Employer;

use App\Actions\Employer\ResolveEmployerCompany;
use App\Http\Controllers\Controller;
use App\Http\Requests\Employer\SaveEmployerJobRequest;
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
                ->select(['id', 'company_id', 'title', 'slug', 'status', 'work_mode', 'job_type', 'published_at', 'created_at'])
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

        return Inertia::render('employer/jobs/form', [
            'mode' => 'create',
            'job' => null,
            'industries' => $this->industries(),
        ]);
    }

    public function store(SaveEmployerJobRequest $request, ResolveEmployerCompany $resolveEmployerCompany): RedirectResponse
    {
        $company = $resolveEmployerCompany->handle($request->user());

        if ($company === null) {
            Inertia::flash('toast', ['type' => 'warning', 'message' => 'Lengkapi profil perusahaan sebelum membuat lowongan.']);

            return to_route('employer.company.edit');
        }

        $data = $request->validated();
        $data['slug'] = UniqueSlug::make(JobListing::class, $data['title'], 'lowongan');

        JobListing::create([
            ...$data,
            'company_id' => $company->id,
            'created_by' => $request->user()->id,
            'status' => 'draft',
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Draft lowongan berhasil dibuat.']);

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
                'location_city' => $jobListing->location_city,
                'location_province' => $jobListing->location_province,
                'work_mode' => $jobListing->work_mode,
                'job_type' => $jobListing->job_type,
                'experience_level' => $jobListing->experience_level,
                'salary_min' => $jobListing->salary_min,
                'salary_max' => $jobListing->salary_max,
                'salary_currency' => $jobListing->salary_currency,
                'is_salary_visible' => $jobListing->is_salary_visible,
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

        $data = $request->validated();
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

    private function ensureBelongsToCompany(JobListing $jobListing, int $companyId): void
    {
        abort_unless($jobListing->company_id === $companyId, 404);
    }
}
