<?php

namespace App\Http\Controllers\Employer;

use App\Actions\Employer\ResolveEmployerCompany;
use App\Http\Controllers\Controller;
use App\Http\Requests\Employer\SaveEmployerCompanyRequest;
use App\Models\Company;
use App\Models\CompanySize;
use App\Models\Industry;
use App\Support\UniqueSlug;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class EmployerCompanyController extends Controller
{
    public function edit(Request $request, ResolveEmployerCompany $resolveEmployerCompany): Response
    {
        $company = $resolveEmployerCompany->handle($request->user());
        $company?->load('latestVerification');

        return Inertia::render('employer/company', [
            'company' => $company === null ? null : [
                'id' => $company->id,
                'name' => $company->name,
                'slug' => $company->slug,
                'industry_id' => $company->industry_id,
                'industry_name' => $company->industry?->name,
                'logo_url' => $company->logo_url,
                'cover_url' => $company->cover_url,
                'description' => $company->description,
                'culture' => $company->culture,
                'benefits' => $company->benefits,
                'company_size' => $company->company_size,
                'website' => $company->website,
                'hq_city' => $company->hq_city,
                'hq_province' => $company->hq_province,
                'address' => $company->address,
                'verification_status' => $company->verification_status,
                'verification_rejection_reason' => $company->latestVerification?->rejection_reason,
                'subscription_name' => $company->activeSubscription?->plan?->name,
            ],
            'verification' => $company === null ? null : ($company->latestVerification === null ? null : [
                'legal_name' => $company->latestVerification->legal_name,
                'nib' => $company->latestVerification->nib,
                'npwp' => $company->latestVerification->npwp,
                'document_url' => $company->latestVerification->document_url,
                'status' => $company->latestVerification->status,
            ]),
            'canSubmitVerification' => $company !== null && in_array($company->verification_status, ['unverified', 'rejected', 'need_revision'], true),
            'industries' => Industry::query()
                ->select(['id', 'name'])
                ->orderBy('name')
                ->get()
                ->map(fn (Industry $industry): array => [
                    'value' => (string) $industry->id,
                    'label' => $industry->name,
                ]),
            'companySizes' => CompanySize::query()
                ->select(['label'])
                ->orderBy('sort_order')
                ->orderBy('label')
                ->pluck('label'),
        ]);
    }

    public function update(SaveEmployerCompanyRequest $request, ResolveEmployerCompany $resolveEmployerCompany): RedirectResponse
    {
        $company = $resolveEmployerCompany->handle($request->user());
        $request->attributes->set('employerCompany', $company);

        $data = $request->validated();
        $data['slug'] = UniqueSlug::make(Company::class, $data['name'], 'perusahaan', $company);

        if ($request->hasFile('logo')) {
            if ($company?->logo_url && str_starts_with($company->logo_url, '/storage/')) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $company->logo_url));
            }
            $data['logo_url'] = Storage::disk('public')->url(
                $request->file('logo')->store('companies/logos', 'public'),
            );
        }

        if ($request->hasFile('cover')) {
            if ($company?->cover_url && str_starts_with($company->cover_url, '/storage/')) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $company->cover_url));
            }
            $data['cover_url'] = Storage::disk('public')->url(
                $request->file('cover')->store('companies/covers', 'public'),
            );
        }

        unset($data['logo'], $data['cover']);

        if ($company === null) {
            Company::create([
                ...$data,
                'owner_id' => $request->user()->id,
                'verification_status' => 'unverified',
                'is_verified' => false,
            ]);

            Inertia::flash('toast', ['type' => 'success', 'message' => 'Profil perusahaan berhasil dibuat.']);

            return to_route('employer.company.edit');
        }

        $company->update($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Profil perusahaan berhasil diperbarui.']);

        return to_route('employer.company.edit');
    }
}
