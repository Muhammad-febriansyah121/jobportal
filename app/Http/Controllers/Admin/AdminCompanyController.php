<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\GenerateCompanyAiInsight;
use App\Actions\Admin\RecordActivity;
use App\Http\Controllers\Admin\Concerns\BuildsAdminPages;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AdminNoteRequest;
use App\Models\AiAuditLog;
use App\Models\Company;
use App\Models\CompanyBadge;
use App\Models\CompanyMember;
use App\Models\CompanyOffice;
use App\Models\CompanyVerification;
use App\Models\Industry;
use App\Models\JobListing;
use App\Models\Subscription;
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
                    'label' => $company->is_active ? 'Aktif' : 'Nonaktif',
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
                    'suspended' => 'Nonaktif',
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
        $company->load(['industry:id,name', 'owner:id,name,email', 'latestVerification', 'activeSubscription.plan:id,name,duration_days']);

        $latestAiInsight = AiAuditLog::query()
            ->where('feature', 'admin_company_insight')
            ->where('status', 'success')
            ->whereJsonContains('output_json->company_id', $company->id)
            ->latest()
            ->first(['output_json', 'created_at']);

        $aiSummary = $latestAiInsight
            ? [
                'summary' => $latestAiInsight->output_json['summary'] ?? null,
                'generated_at' => $latestAiInsight->created_at?->format('d M Y H:i'),
            ]
            : null;

        return Inertia::render('admin/resources/show', [
            'title' => 'Detail Perusahaan',
            'description' => $company->name,
            'backHref' => route('admin.companies.index'),
            'actions' => $this->companyActions($company),
            'aiSummary' => $aiSummary,
            'hero' => [
                'name' => $company->name,
                'logo_url' => $company->logo_url ? asset(ltrim($company->logo_url, '/')) : null,
                'cover_url' => $company->cover_url ? asset(ltrim($company->cover_url, '/')) : null,
            ],
            'sections' => [
                [
                    'title' => 'Profil perusahaan',
                    'items' => [
                        ['label' => 'Nama', 'value' => $company->name],
                        ['label' => 'Slug', 'value' => $company->slug],
                        ['label' => 'Industri', 'value' => $company->industry?->name ?? '-'],
                        ['label' => 'Ukuran perusahaan', 'value' => $company->company_size ?? '-'],
                        ['label' => 'Website', 'value' => $company->website ?? '-'],
                        ['label' => 'Kota', 'value' => $company->hq_city ?? '-'],
                        ['label' => 'Provinsi', 'value' => $company->hq_province ?? '-'],
                        ['label' => 'Alamat', 'value' => $company->address ?? '-'],
                        ['label' => 'Status aktif', 'value' => $company->is_active ? 'Aktif' : 'Nonaktif'],
                        ['label' => 'Status verifikasi', 'value' => str($company->verification_status)->headline()->toString()],
                        ['label' => 'Owner', 'value' => $company->owner?->name.' <'.$company->owner?->email.'>'],
                        ['label' => 'Bergabung', 'value' => $company->created_at?->format('d M Y')],
                    ],
                ],
                [
                    'title' => 'Deskripsi',
                    'items' => [
                        ['label' => 'Deskripsi perusahaan', 'value' => $company->description ?? '-'],
                    ],
                ],
                [
                    'title' => 'Trust & Kredibilitas',
                    'items' => [
                        ['label' => 'Verified', 'value' => $company->is_verified ? 'Ya' : 'Belum'],
                        ['label' => 'Response rate', 'value' => $company->response_rate ? $company->response_rate.'%' : '-'],
                        ['label' => 'Median response', 'value' => $company->median_response_hours ? $company->median_response_hours.' jam' : '-'],
                        ['label' => 'Trust score', 'value' => $company->trust_score ?? '-'],
                        ['label' => 'Ditangguhkan pada', 'value' => $company->suspended_at?->format('d M Y H:i') ?? '-'],
                        ['label' => 'Alasan suspend', 'value' => $company->suspension_reason ?? '-'],
                    ],
                ],
                [
                    'title' => 'Langganan aktif',
                    'items' => [
                        ['label' => 'Paket', 'value' => $company->activeSubscription?->plan?->name ?? 'Tidak ada paket aktif'],
                        ['label' => 'Status', 'value' => $company->activeSubscription ? str($company->activeSubscription->status)->headline()->toString() : '-'],
                        ['label' => 'Mulai', 'value' => $company->activeSubscription?->starts_at?->format('d M Y') ?? '-'],
                        ['label' => 'Berakhir', 'value' => $company->activeSubscription?->ends_at?->format('d M Y') ?? '-'],
                    ],
                ],
            ],
            'tables' => [
                [
                    'title' => 'Lowongan perusahaan',
                    'columns' => [
                        ['key' => 'title', 'label' => 'Judul'],
                        ['key' => 'status', 'label' => 'Status'],
                        ['key' => 'published_at', 'label' => 'Tanggal terbit'],
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
                        ['key' => 'legal_name', 'label' => 'Nama legal'],
                        ['key' => 'nib', 'label' => 'NIB'],
                        ['key' => 'npwp', 'label' => 'NPWP'],
                        ['key' => 'document_url', 'label' => 'Dokumen'],
                        ['key' => 'status', 'label' => 'Status'],
                        ['key' => 'reviewed_at', 'label' => 'Review'],
                    ],
                    'rows' => CompanyVerification::query()
                        ->select(['id', 'company_id', 'legal_name', 'nib', 'npwp', 'document_url', 'status', 'reviewed_at'])
                        ->whereBelongsTo($company)
                        ->latest()
                        ->limit(10)
                        ->get()
                        ->map(fn (CompanyVerification $verification): array => [
                            'id' => $verification->id,
                            'legal_name' => $verification->legal_name,
                            'nib' => $verification->nib ?? '-',
                            'npwp' => $verification->npwp ?? '-',
                            'document_url' => $verification->document_url
                                ? ['type' => 'link', 'href' => asset(ltrim($verification->document_url, '/')), 'label' => 'Lihat Dokumen']
                                : '-',
                            'status' => str($verification->status)->headline()->toString(),
                            'reviewed_at' => $verification->reviewed_at?->format('d M Y H:i') ?? '-',
                        ]),
                ],
                [
                    'title' => 'Kantor cabang',
                    'columns' => [
                        ['key' => 'city', 'label' => 'Kota'],
                        ['key' => 'province', 'label' => 'Provinsi'],
                        ['key' => 'address', 'label' => 'Alamat'],
                    ],
                    'rows' => CompanyOffice::query()
                        ->select(['id', 'company_id', 'city', 'province', 'address'])
                        ->whereBelongsTo($company)
                        ->get()
                        ->map(fn (CompanyOffice $office): array => [
                            'id' => $office->id,
                            'city' => $office->city ?? '-',
                            'province' => $office->province ?? '-',
                            'address' => $office->address ?? '-',
                        ]),
                ],
                [
                    'title' => 'Badge perusahaan',
                    'columns' => [
                        ['key' => 'type', 'label' => 'Tipe'],
                        ['key' => 'label', 'label' => 'Label'],
                        ['key' => 'issued_at', 'label' => 'Diterbitkan'],
                    ],
                    'rows' => CompanyBadge::query()
                        ->select(['id', 'company_id', 'type', 'label', 'issued_at'])
                        ->whereBelongsTo($company)
                        ->latest('issued_at')
                        ->get()
                        ->map(fn (CompanyBadge $badge): array => [
                            'id' => $badge->id,
                            'type' => str($badge->type)->headline()->toString(),
                            'label' => $badge->label,
                            'issued_at' => $badge->issued_at?->format('d M Y') ?? '-',
                        ]),
                ],
                [
                    'title' => 'Riwayat langganan',
                    'columns' => [
                        ['key' => 'plan', 'label' => 'Paket'],
                        ['key' => 'status', 'label' => 'Status'],
                        ['key' => 'starts_at', 'label' => 'Mulai'],
                        ['key' => 'ends_at', 'label' => 'Berakhir'],
                    ],
                    'rows' => Subscription::query()
                        ->select(['id', 'company_id', 'pricing_plan_id', 'status', 'starts_at', 'ends_at'])
                        ->with(['plan:id,name'])
                        ->whereBelongsTo($company)
                        ->latest()
                        ->limit(10)
                        ->get()
                        ->map(fn (Subscription $subscription): array => [
                            'id' => $subscription->id,
                            'plan' => $subscription->plan?->name ?? '-',
                            'status' => str($subscription->status)->headline()->toString(),
                            'starts_at' => $subscription->starts_at?->format('d M Y') ?? '-',
                            'ends_at' => $subscription->ends_at?->format('d M Y') ?? '-',
                        ]),
                ],
            ],
        ]);
    }

    public function generateAiInsight(Company $company, GenerateCompanyAiInsight $action): RedirectResponse
    {
        $log = $action->handle($company);

        if ($log && $log->status === 'success') {
            $this->flash('Insight AI berhasil dibuat.');
        } else {
            $this->flash('Gagal membuat insight AI. Periksa konfigurasi API key.', 'error');
        }

        return back();
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
            $this->action('Analisis AI', route('admin.companies.generate-ai-insight', $company), 'Sparkles', 'post', 'outline'),
            $company->is_active
                ? $this->action('Nonaktifkan', route('admin.companies.suspend', $company), 'Ban', 'patch', 'destructive', 'Nonaktifkan perusahaan?', 'Perusahaan dan tim recruiter akan ditandai tidak aktif.', [
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
