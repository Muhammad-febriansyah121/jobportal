<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\RecordActivity;
use App\Http\Controllers\Admin\Concerns\BuildsAdminPages;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateJobIntegrityScoreRequest;
use App\Models\Company;
use App\Models\Industry;
use App\Models\JobListing;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminJobListingController extends Controller
{
    use BuildsAdminPages;

    public function index(Request $request): Response
    {
        $jobs = JobListing::query()
            ->select(['id', 'company_id', 'industry_id', 'title', 'slug', 'location_city', 'location_province', 'status', 'integrity_score', 'published_at', 'created_at'])
            ->with(['company:id,name,slug,is_verified', 'industry:id,name'])
            ->withCount('applications')
            ->when($request->filled('search'), fn ($query) => $query->where('title', 'like', '%'.$request->string('search')->toString().'%'))
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()))
            ->when($request->filled('company_id'), fn ($query) => $query->where('company_id', $request->integer('company_id')))
            ->when($request->filled('industry_id'), fn ($query) => $query->where('industry_id', $request->integer('industry_id')))
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn (JobListing $job): array => [
                'id' => $job->id,
                'title' => $job->title,
                'company' => $job->company?->name,
                'industry' => $job->industry?->name ?? '-',
                'location' => collect([$job->location_city, $job->location_province])->filter()->join(', ') ?: '-',
                'status' => [
                    'label' => str($job->status)->headline()->toString(),
                    'tone' => $this->statusTone($job->status),
                ],
                'integrity_score' => $job->integrity_score ?? '-',
                'applications_count' => $job->applications_count,
                'published_at' => $job->published_at?->format('d M Y') ?? '-',
                'actions' => $this->jobActions($job),
            ]);

        return Inertia::render('admin/resources/index', [
            'title' => 'Kelola Lowongan',
            'description' => 'Moderasi lowongan, integrity score, publish, suspend, dan reject.',
            'indexAction' => route('admin.jobs.index'),
            'filters' => [
                $this->field('search', 'Cari judul lowongan', 'search', $request->string('search')->toString()),
                $this->field('status', 'Status', 'select', $request->string('status')->toString(), $this->options([
                    '' => 'Semua status',
                    'draft' => 'Draft',
                    'pending_review' => 'Pending Review',
                    'published' => 'Published',
                    'closed' => 'Closed',
                    'suspended' => 'Suspended',
                    'rejected' => 'Rejected',
                ])),
                $this->field('company_id', 'Perusahaan', 'select', $request->string('company_id')->toString(), $this->companyOptions()),
                $this->field('industry_id', 'Industri', 'select', $request->string('industry_id')->toString(), $this->industryOptions()),
            ],
            'columns' => [
                ['key' => 'title', 'label' => 'Judul'],
                ['key' => 'company', 'label' => 'Perusahaan'],
                ['key' => 'location', 'label' => 'Lokasi'],
                ['key' => 'status', 'label' => 'Status'],
                ['key' => 'integrity_score', 'label' => 'Integrity'],
                ['key' => 'applications_count', 'label' => 'Lamaran'],
                ['key' => 'published_at', 'label' => 'Tanggal publish'],
            ],
            'rows' => $jobs,
            'emptyState' => 'Belum ada lowongan yang cocok dengan filter ini.',
        ]);
    }

    public function show(JobListing $jobListing): Response
    {
        $jobListing->load(['company:id,name,slug,is_verified', 'industry:id,name', 'creator:id,name,email'])
            ->loadCount('applications');

        return Inertia::render('admin/resources/show', [
            'title' => 'Detail Lowongan',
            'description' => $jobListing->title,
            'backHref' => route('admin.jobs.index'),
            'actions' => $this->jobActions($jobListing),
            'sections' => [
                [
                    'title' => 'Informasi lowongan',
                    'items' => [
                        ['label' => 'Judul', 'value' => $jobListing->title],
                        ['label' => 'Perusahaan', 'value' => $jobListing->company?->name],
                        ['label' => 'Industri', 'value' => $jobListing->industry?->name ?? '-'],
                        ['label' => 'Lokasi', 'value' => collect([$jobListing->location_city, $jobListing->location_province])->filter()->join(', ') ?: '-'],
                        ['label' => 'Work mode', 'value' => str($jobListing->work_mode)->headline()->toString()],
                        ['label' => 'Job type', 'value' => str($jobListing->job_type)->headline()->toString()],
                        ['label' => 'Experience', 'value' => str($jobListing->experience_level)->headline()->toString()],
                    ],
                ],
                [
                    'title' => 'Moderasi',
                    'items' => [
                        ['label' => 'Status', 'value' => str($jobListing->status)->headline()->toString()],
                        ['label' => 'Integrity score', 'value' => $jobListing->integrity_score ?? '-'],
                        ['label' => 'Lamaran', 'value' => $jobListing->applications_count],
                        ['label' => 'Published at', 'value' => $jobListing->published_at?->format('d M Y H:i') ?? '-'],
                        ['label' => 'Dibuat oleh', 'value' => $jobListing->creator?->name.' <'.$jobListing->creator?->email.'>'],
                    ],
                ],
                [
                    'title' => 'Deskripsi',
                    'items' => [
                        ['label' => 'Deskripsi', 'value' => $jobListing->description],
                        ['label' => 'Tanggung jawab', 'value' => $jobListing->responsibilities ?? '-'],
                        ['label' => 'Kualifikasi wajib', 'value' => $jobListing->required_qualifications ?? '-'],
                        ['label' => 'Kualifikasi tambahan', 'value' => $jobListing->preferred_qualifications ?? '-'],
                    ],
                ],
            ],
        ]);
    }

    public function updateIntegrityScore(UpdateJobIntegrityScoreRequest $request, JobListing $jobListing, RecordActivity $activity): RedirectResponse
    {
        $jobListing->update($request->validated());
        $activity->handle($request->user(), 'update_job_integrity_score', $jobListing, $request->validated());

        $this->flash('Integrity score lowongan diperbarui.');

        return back();
    }

    public function publish(Request $request, JobListing $jobListing, RecordActivity $activity): RedirectResponse
    {
        $jobListing->update([
            'status' => 'published',
            'published_at' => $jobListing->published_at ?? now(),
        ]);

        $activity->handle($request->user(), 'publish_job', $jobListing);
        $this->flash('Lowongan berhasil dipublish.');

        return back();
    }

    public function suspend(Request $request, JobListing $jobListing, RecordActivity $activity): RedirectResponse
    {
        $jobListing->update(['status' => 'suspended']);

        $activity->handle($request->user(), 'suspend_job', $jobListing);
        $this->flash('Lowongan berhasil disuspend.');

        return back();
    }

    public function reject(Request $request, JobListing $jobListing, RecordActivity $activity): RedirectResponse
    {
        $jobListing->update(['status' => 'rejected']);

        $activity->handle($request->user(), 'reject_job', $jobListing);
        $this->flash('Lowongan berhasil ditolak.');

        return back();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function jobActions(JobListing $job): array
    {
        return [
            $this->action('Lihat Detail', route('admin.jobs.show', $job), 'Eye'),
            $this->action('Update Score', route('admin.jobs.integrity-score', $job), 'Pencil', 'patch', 'outline', null, null, [
                $this->field('integrity_score', 'Integrity score', 'number', $job->integrity_score, [], ['min' => 0, 'max' => 100]),
            ]),
            $this->action('Publish', route('admin.jobs.publish', $job), 'Check', 'patch', 'default', 'Publish lowongan?', 'Lowongan akan tampil untuk kandidat.'),
            $this->action('Suspend', route('admin.jobs.suspend', $job), 'Ban', 'patch', 'destructive', 'Suspend lowongan?', 'Lowongan akan disembunyikan dari platform.'),
            $this->action('Reject', route('admin.jobs.reject', $job), 'X', 'patch', 'destructive', 'Tolak lowongan?', 'Status lowongan akan menjadi rejected.'),
        ];
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function companyOptions(): array
    {
        return [
            ['value' => '', 'label' => 'Semua perusahaan'],
            ...Company::query()
                ->select(['id', 'name'])
                ->orderBy('name')
                ->limit(200)
                ->get()
                ->map(fn (Company $company): array => [
                    'value' => (string) $company->id,
                    'label' => $company->name,
                ])
                ->all(),
        ];
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function industryOptions(): array
    {
        return [
            ['value' => '', 'label' => 'Semua industri'],
            ...Industry::query()
                ->select(['id', 'name'])
                ->orderBy('name')
                ->get()
                ->map(fn (Industry $industry): array => [
                    'value' => (string) $industry->id,
                    'label' => $industry->name,
                ])
                ->all(),
        ];
    }
}
