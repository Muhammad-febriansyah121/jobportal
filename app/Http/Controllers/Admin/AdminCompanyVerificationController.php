<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\RecordActivity;
use App\Http\Controllers\Admin\Concerns\BuildsAdminPages;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ReviewCompanyVerificationRequest;
use App\Models\CompanyVerification;
use App\Models\UserNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AdminCompanyVerificationController extends Controller
{
    use BuildsAdminPages;

    public function index(Request $request): Response
    {
        $verifications = CompanyVerification::query()
            ->select(['id', 'company_id', 'submitted_by', 'legal_name', 'nib', 'npwp', 'document_url', 'status', 'reviewed_by', 'reviewed_at', 'created_at'])
            ->with(['company:id,name,slug,verification_status,is_verified', 'submitter:id,name,email', 'reviewer:id,name,email'])
            ->when($request->filled('search'), function ($query) use ($request): void {
                $search = $request->string('search')->toString();

                $query->where(function ($query) use ($search): void {
                    $query->where('legal_name', 'like', "%{$search}%")
                        ->orWhereHas('company', fn ($query) => $query->where('name', 'like', "%{$search}%"));
                });
            })
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()))
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn (CompanyVerification $verification): array => [
                'id' => $verification->id,
                'company' => $verification->company?->name,
                'legal_name' => $verification->legal_name,
                'nib' => $verification->nib ?? '-',
                'npwp' => $verification->npwp ?? '-',
                'status' => [
                    'label' => str($verification->status)->headline()->toString(),
                    'tone' => $this->statusTone($verification->status),
                ],
                'submitted_by' => $verification->submitter?->name,
                'created_at' => $verification->created_at?->format('d M Y'),
                'reviewed_by' => $verification->reviewer?->name ?? '-',
                'actions' => $this->verificationActions($verification),
            ]);

        return Inertia::render('admin/resources/index', [
            'title' => 'Verifikasi Perusahaan',
            'description' => 'Review dokumen legal, NIB, NPWP, dan submission verifikasi perusahaan.',
            'indexAction' => route('admin.company-verifications.index'),
            'filters' => [
                $this->field('search', 'Cari perusahaan/legal name', 'search', $request->string('search')->toString()),
                $this->field('status', 'Status', 'select', $request->string('status')->toString(), $this->options([
                    '' => 'Semua status',
                    'pending' => 'Pending',
                    'approved' => 'Approved',
                    'rejected' => 'Rejected',
                    'need_revision' => 'Need Revision',
                ])),
            ],
            'columns' => [
                ['key' => 'company', 'label' => 'Perusahaan'],
                ['key' => 'legal_name', 'label' => 'Legal name'],
                ['key' => 'nib', 'label' => 'NIB'],
                ['key' => 'npwp', 'label' => 'NPWP'],
                ['key' => 'status', 'label' => 'Status'],
                ['key' => 'submitted_by', 'label' => 'Submitter'],
                ['key' => 'reviewed_by', 'label' => 'Reviewer'],
                ['key' => 'created_at', 'label' => 'Tanggal submit'],
            ],
            'rows' => $verifications,
            'emptyState' => 'Belum ada submission verifikasi.',
        ]);
    }

    public function show(CompanyVerification $companyVerification): Response
    {
        $companyVerification->load(['company.owner:id,name,email', 'submitter:id,name,email', 'reviewer:id,name,email']);

        return Inertia::render('admin/resources/show', [
            'title' => 'Detail Verifikasi',
            'description' => $companyVerification->company?->name,
            'backHref' => route('admin.company-verifications.index'),
            'actions' => $this->verificationActions($companyVerification),
            'sections' => [
                [
                    'title' => 'Dokumen legal',
                    'items' => [
                        ['label' => 'Perusahaan', 'value' => $companyVerification->company?->name],
                        ['label' => 'Legal name', 'value' => $companyVerification->legal_name],
                        ['label' => 'NIB', 'value' => $companyVerification->nib ?? '-'],
                        ['label' => 'NPWP', 'value' => $companyVerification->npwp ?? '-'],
                        ['label' => 'Dokumen upload', 'value' => $companyVerification->document_url ?? '-'],
                        ['label' => 'Status', 'value' => str($companyVerification->status)->headline()->toString()],
                        ['label' => 'Catatan reviewer', 'value' => $companyVerification->rejection_reason ?? '-'],
                    ],
                ],
                [
                    'title' => 'Review',
                    'items' => [
                        ['label' => 'Submitter', 'value' => $companyVerification->submitter?->name.' <'.$companyVerification->submitter?->email.'>'],
                        ['label' => 'Reviewer', 'value' => $companyVerification->reviewer?->name ?? '-'],
                        ['label' => 'Reviewed at', 'value' => $companyVerification->reviewed_at?->format('d M Y H:i') ?? '-'],
                    ],
                ],
            ],
        ]);
    }

    public function approve(ReviewCompanyVerificationRequest $request, CompanyVerification $companyVerification, RecordActivity $activity): RedirectResponse
    {
        DB::transaction(function () use ($request, $companyVerification, $activity): void {
            $companyVerification->update([
                'status' => 'approved',
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
                'rejection_reason' => null,
            ]);

            $companyVerification->company()->update([
                'is_verified' => true,
                'verification_status' => 'approved',
            ]);

            $this->notifyCompany($companyVerification, 'Verifikasi disetujui', 'Perusahaan Anda sudah terverifikasi.');
            $activity->handle($request->user(), 'approve_company_verification', $companyVerification);
        });

        $this->flash('Verifikasi perusahaan disetujui.');

        return back();
    }

    public function reject(ReviewCompanyVerificationRequest $request, CompanyVerification $companyVerification, RecordActivity $activity): RedirectResponse
    {
        DB::transaction(function () use ($request, $companyVerification, $activity): void {
            $note = $request->validated('note');

            $companyVerification->update([
                'status' => 'rejected',
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
                'rejection_reason' => $note,
            ]);

            $companyVerification->company()->update([
                'is_verified' => false,
                'verification_status' => 'rejected',
            ]);

            $this->notifyCompany($companyVerification, 'Verifikasi ditolak', $note ?: 'Dokumen perusahaan belum memenuhi kriteria.');
            $activity->handle($request->user(), 'reject_company_verification', $companyVerification, ['note' => $note]);
        });

        $this->flash('Verifikasi perusahaan ditolak.');

        return back();
    }

    public function needRevision(ReviewCompanyVerificationRequest $request, CompanyVerification $companyVerification, RecordActivity $activity): RedirectResponse
    {
        DB::transaction(function () use ($request, $companyVerification, $activity): void {
            $note = $request->validated('note');

            $companyVerification->update([
                'status' => 'need_revision',
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
                'rejection_reason' => $note,
            ]);

            $companyVerification->company()->update([
                'is_verified' => false,
                'verification_status' => 'need_revision',
            ]);

            $this->notifyCompany($companyVerification, 'Verifikasi perlu revisi', $note ?: 'Silakan perbarui dokumen verifikasi perusahaan.');
            $activity->handle($request->user(), 'request_company_verification_revision', $companyVerification, ['note' => $note]);
        });

        $this->flash('Permintaan revisi verifikasi dikirim.');

        return back();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function verificationActions(CompanyVerification $verification): array
    {
        return [
            $this->action('Lihat Detail', route('admin.company-verifications.show', $verification), 'Eye'),
            $this->action('Setujui', route('admin.company-verifications.approve', $verification), 'Check', 'patch', 'default', 'Setujui verifikasi?', 'Perusahaan akan ditandai terverifikasi.'),
            $this->action('Tolak', route('admin.company-verifications.reject', $verification), 'X', 'patch', 'destructive', 'Tolak verifikasi?', 'Catatan reviewer akan dikirim ke perusahaan.', [
                $this->field('note', 'Catatan reviewer', 'textarea'),
            ]),
            $this->action('Minta Revisi', route('admin.company-verifications.need-revision', $verification), 'Pencil', 'patch', 'outline', 'Minta revisi dokumen?', 'Perusahaan dapat mengirim ulang dokumen.', [
                $this->field('note', 'Catatan revisi', 'textarea'),
            ]),
        ];
    }

    private function notifyCompany(CompanyVerification $verification, string $title, string $message): void
    {
        $ownerId = $verification->company?->owner_id;

        if (! $ownerId) {
            return;
        }

        UserNotification::create([
            'user_id' => $ownerId,
            'type' => 'company_verification',
            'title' => $title,
            'message' => $message,
            'data_json' => ['company_id' => $verification->company_id, 'verification_id' => $verification->id],
            'is_read' => false,
        ]);
    }
}
