<?php

namespace App\Http\Controllers\Employer;

use App\Actions\Employer\ResolveEmployerCompany;
use App\Http\Controllers\Controller;
use App\Http\Requests\Employer\SubmitCompanyVerificationRequest;
use App\Models\CompanyVerification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class EmployerCompanyVerificationController extends Controller
{
    public function index(Request $request, ResolveEmployerCompany $resolveEmployerCompany): Response|RedirectResponse
    {
        $company = $resolveEmployerCompany->handle($request->user());

        if ($company === null) {
            Inertia::flash('toast', ['type' => 'warning', 'message' => 'Lengkapi profil perusahaan sebelum submit verifikasi.']);

            return to_route('employer.company.edit');
        }

        $company->load('latestVerification.submitter:id,name,email');

        return Inertia::render('employer/verification', [
            'company' => [
                'id' => $company->id,
                'name' => $company->name,
                'verification_status' => $company->verification_status,
                'is_verified' => $company->is_verified,
            ],
            'verification' => $company->latestVerification === null ? null : [
                'id' => $company->latestVerification->id,
                'legal_name' => $company->latestVerification->legal_name,
                'nib' => $company->latestVerification->nib,
                'npwp' => $company->latestVerification->npwp,
                'document_url' => $company->latestVerification->document_url,
                'status' => $company->latestVerification->status,
                'status_label' => str($company->latestVerification->status)->headline()->toString(),
                'rejection_reason' => $company->latestVerification->rejection_reason,
                'submitted_by' => $company->latestVerification->submitter?->name,
                'submitted_at' => $company->latestVerification->created_at?->format('d M Y H:i'),
                'reviewed_at' => $company->latestVerification->reviewed_at?->format('d M Y H:i'),
            ],
            'canSubmit' => in_array($company->verification_status, ['unverified', 'rejected', 'need_revision'], true),
        ]);
    }

    public function store(SubmitCompanyVerificationRequest $request, ResolveEmployerCompany $resolveEmployerCompany): RedirectResponse
    {
        $company = $resolveEmployerCompany->handle($request->user());

        abort_if($company === null, 404);
        abort_if(in_array($company->verification_status, ['pending', 'approved'], true), 403);

        $validated = $request->validated();
        $documentUrl = $validated['document_url'] ?? null;

        if ($request->hasFile('document')) {
            $documentUrl = Storage::disk('public')->url(
                $request->file('document')->store('company-verifications', 'public')
            );
        }

        DB::transaction(function () use ($company, $documentUrl, $request, $validated): void {
            CompanyVerification::create([
                'company_id' => $company->id,
                'submitted_by' => $request->user()->id,
                'legal_name' => $validated['legal_name'],
                'nib' => $validated['nib'] ?? null,
                'npwp' => $validated['npwp'] ?? null,
                'document_url' => $documentUrl,
                'status' => 'pending',
            ]);

            $company->update([
                'is_verified' => false,
                'verification_status' => 'pending',
            ]);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Verifikasi perusahaan berhasil dikirim.']);

        return to_route('employer.verification.index');
    }
}
