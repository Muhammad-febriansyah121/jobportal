<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\RecordActivity;
use App\Http\Controllers\Admin\Concerns\BuildsAdminPages;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AdminNoteRequest;
use App\Models\Company;
use App\Models\CompanyMember;
use App\Models\CompanyVerification;
use App\Models\Industry;
use App\Models\JobListing;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminCompanyController extends Controller
{
    use BuildsAdminPages;

    public function index(Request $request): Response
    {
        $companies = Company::query()
            ->select(['id', 'industry_id', 'name', 'slug', 'logo_url', 'verification_status', 'is_verified', 'is_active', 'created_at'])
            ->with(['industry:id,name'])
            ->withCount([
                'members',
                'jobListings as active_jobs_count' => fn ($query) => $query->where('status', 'published'),
            ])
            ->when($request->filled('search'), fn ($query) => $query->where('name', 'like', '%'.$request->string('search')->toString().'%'))
            ->when($request->filled('verification_status'), fn ($query) => $query->where('verification_status', $request->string('verification_status')->toString()))
            ->when($request->filled('industry_id'), fn ($query) => $query->where('industry_id', $request->integer('industry_id')))
            ->when($request->filled('status'), fn ($query) => $query->where('is_active', $request->string('status')->toString() === 'active'))
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Company $company): array => [
                'id' => $company->id,
                'logo' => ['type' => 'image', 'src' => $company->logo_url, 'alt' => $company->name],
                'name' => $company->name,
                'industry' => $company->industry?->name ?? '-',
                'verification_status' => [
                    'label' => str($company->verification_status)->headline()->toString(),
                    'tone' => $this->statusTone($company->verification_status),
                ],
                'active_status' => [
                    'label' => $company->is_active ? 'Aktif' : 'Suspend',
                    'tone' => $company->is_active ? 'success' : 'danger',
                ],
                'active_jobs_count' => $company->active_jobs_count,
                'members_count' => $company->members_count,
                'created_at' => $company->created_at?->format('d M Y'),
                'actions' => $this->companyActions($company),
            ]);

        return Inertia::render('admin/resources/index', [
            'title' => 'Kelola Perusahaan',
            'description' => 'Moderasi profil perusahaan, status verifikasi, lowongan aktif, dan anggota recruiter.',
            'indexAction' => route('admin.companies.index'),
            'filters' => [
                $this->field('search', 'Cari perusahaan', 'search', $request->string('search')->toString()),
                $this->field('verification_status', 'Status verifikasi', 'select', $request->string('verification_status')->toString(), $this->options([
                    '' => 'Semua status',
                    'unverified' => 'Unverified',
                    'pending' => 'Pending',
                    'approved' => 'Approved',
                    'rejected' => 'Rejected',
                    'need_revision' => 'Need Revision',
                ])),
                $this->field('industry_id', 'Industri', 'select', $request->string('industry_id')->toString(), $this->industryOptions()),
                $this->field('status', 'Status aktif', 'select', $request->string('status')->toString(), $this->options([
                    '' => 'Semua status',
                    'active' => 'Aktif',
                    'suspended' => 'Suspend',
                ])),
            ],
            'columns' => [
                ['key' => 'logo', 'label' => 'Logo'],
                ['key' => 'name', 'label' => 'Nama perusahaan'],
                ['key' => 'industry', 'label' => 'Industri'],
                ['key' => 'verification_status', 'label' => 'Verifikasi'],
                ['key' => 'active_status', 'label' => 'Status'],
                ['key' => 'active_jobs_count', 'label' => 'Lowongan aktif'],
                ['key' => 'members_count', 'label' => 'Recruiter'],
                ['key' => 'created_at', 'label' => 'Tanggal bergabung'],
            ],
            'rows' => $companies,
            'emptyState' => 'Belum ada perusahaan yang cocok dengan filter ini.',
        ]);
    }

    public function show(Company $company): Response
    {
        $company->load(['industry:id,name', 'owner:id,name,email', 'latestVerification']);

        return Inertia::render('admin/resources/show', [
            'title' => 'Detail Perusahaan',
            'description' => $company->name,
            'backHref' => route('admin.companies.index'),
            'actions' => $this->companyActions($company),
            'sections' => [
                [
                    'title' => 'Profil perusahaan',
                    'items' => [
                        ['label' => 'Nama', 'value' => $company->name],
                        ['label' => 'Slug', 'value' => $company->slug],
                        ['label' => 'Industri', 'value' => $company->industry?->name ?? '-'],
                        ['label' => 'Website', 'value' => $company->website ?? '-'],
                        ['label' => 'Kota', 'value' => $company->hq_city ?? '-'],
                        ['label' => 'Status aktif', 'value' => $company->is_active ? 'Aktif' : 'Suspend'],
                        ['label' => 'Status verifikasi', 'value' => str($company->verification_status)->headline()->toString()],
                        ['label' => 'Owner', 'value' => $company->owner?->name.' <'.$company->owner?->email.'>'],
                    ],
                ],
                [
                    'title' => 'Trust',
                    'items' => [
                        ['label' => 'Verified', 'value' => $company->is_verified ? 'Ya' : 'Belum'],
                        ['label' => 'Response rate', 'value' => $company->response_rate ? $company->response_rate.'%' : '-'],
                        ['label' => 'Median response', 'value' => $company->median_response_hours ? $company->median_response_hours.' jam' : '-'],
                        ['label' => 'Trust score', 'value' => $company->trust_score ?? '-'],
                        ['label' => 'Alasan suspend', 'value' => $company->suspension_reason ?? '-'],
                    ],
                ],
            ],
            'tables' => [
                [
                    'title' => 'Lowongan perusahaan',
                    'columns' => [
                        ['key' => 'title', 'label' => 'Judul'],
                        ['key' => 'status', 'label' => 'Status'],
                        ['key' => 'published_at', 'label' => 'Publish'],
                    ],
                    'rows' => JobListing::query()
                        ->select(['id', 'title', 'status', 'published_at'])
                        ->whereBelongsTo($company)
                        ->latest()
                        ->limit(10)
                        ->get()
                        ->map(fn (JobListing $job): array => [
                            'id' => $job->id,
                            'title' => $job->title,
                            'status' => str($job->status)->headline()->toString(),
                            'published_at' => $job->published_at?->format('d M Y') ?? '-',
                        ]),
                ],
                [
                    'title' => 'Anggota recruiter',
                    'columns' => [
                        ['key' => 'name', 'label' => 'Nama'],
                        ['key' => 'email', 'label' => 'Email'],
                        ['key' => 'role', 'label' => 'Role'],
                        ['key' => 'status', 'label' => 'Status'],
                    ],
                    'rows' => CompanyMember::query()
                        ->select(['id', 'company_id', 'user_id', 'role', 'is_active'])
                        ->with(['user:id,name,email'])
                        ->whereBelongsTo($company)
                        ->latest()
                        ->limit(10)
                        ->get()
                        ->map(fn (CompanyMember $member): array => [
                            'id' => $member->id,
                            'name' => $member->user?->name,
                            'email' => $member->user?->email,
                            'role' => str($member->role)->headline()->toString(),
                            'status' => $member->is_active ? 'Aktif' : 'Nonaktif',
                        ]),
                ],
                [
                    'title' => 'Submission verifikasi',
                    'columns' => [
                        ['key' => 'legal_name', 'label' => 'Legal name'],
                        ['key' => 'status', 'label' => 'Status'],
                        ['key' => 'reviewed_at', 'label' => 'Review'],
                    ],
                    'rows' => CompanyVerification::query()
                        ->select(['id', 'company_id', 'legal_name', 'status', 'reviewed_at'])
                        ->whereBelongsTo($company)
                        ->latest()
                        ->limit(10)
                        ->get()
                        ->map(fn (CompanyVerification $verification): array => [
                            'id' => $verification->id,
                            'legal_name' => $verification->legal_name,
                            'status' => str($verification->status)->headline()->toString(),
                            'reviewed_at' => $verification->reviewed_at?->format('d M Y H:i') ?? '-',
                        ]),
                ],
            ],
        ]);
    }

    public function suspend(AdminNoteRequest $request, Company $company, RecordActivity $activity): RedirectResponse
    {
        $company->update([
            'is_active' => false,
            'suspended_at' => now(),
            'suspension_reason' => $request->validated('note'),
        ]);

        $activity->handle($request->user(), 'suspend_company', $company, [
            'note' => $request->validated('note'),
        ]);

        $this->flash('Perusahaan berhasil disuspend.');

        return back();
    }

    public function activate(Request $request, Company $company, RecordActivity $activity): RedirectResponse
    {
        $company->update([
            'is_active' => true,
            'suspended_at' => null,
            'suspension_reason' => null,
        ]);

        $activity->handle($request->user(), 'activate_company', $company);

        $this->flash('Perusahaan berhasil diaktifkan kembali.');

        return back();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function companyActions(Company $company): array
    {
        return [
            $this->action('Lihat Detail', route('admin.companies.show', $company), 'Eye'),
            $company->is_active
                ? $this->action('Suspend', route('admin.companies.suspend', $company), 'Ban', 'patch', 'destructive', 'Suspend perusahaan?', 'Perusahaan dan tim recruiter akan ditandai tidak aktif.', [
                    $this->field('note', 'Catatan admin', 'textarea'),
                ])
                : $this->action('Aktifkan', route('admin.companies.activate', $company), 'Check', 'patch'),
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
