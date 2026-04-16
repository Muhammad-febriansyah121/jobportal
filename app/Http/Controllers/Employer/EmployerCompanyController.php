<?php

namespace App\Http\Controllers\Employer;

use App\Actions\Employer\ResolveEmployerCompany;
use App\Http\Controllers\Controller;
use App\Http\Requests\Employer\SaveEmployerCompanyRequest;
use App\Models\Company;
use App\Models\Industry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class EmployerCompanyController extends Controller
{
    public function edit(Request $request, ResolveEmployerCompany $resolveEmployerCompany): Response
    {
        $company = $resolveEmployerCompany->handle($request->user());

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
                'company_size' => $company->company_size,
                'website' => $company->website,
                'hq_city' => $company->hq_city,
                'hq_province' => $company->hq_province,
                'address' => $company->address,
                'verification_status' => $company->verification_status,
                'verification_rejection_reason' => $company->latestVerification?->rejection_reason,
                'subscription_name' => $company->activeSubscription?->plan?->name,
            ],
            'industries' => Industry::query()
                ->select(['id', 'name'])
                ->orderBy('name')
                ->get()
                ->map(fn (Industry $industry): array => [
                    'value' => (string) $industry->id,
                    'label' => $industry->name,
                ]),
        ]);
    }

    public function update(SaveEmployerCompanyRequest $request, ResolveEmployerCompany $resolveEmployerCompany): RedirectResponse
    {
        $company = $resolveEmployerCompany->handle($request->user());
        $request->attributes->set('employerCompany', $company);

        $data = $request->validated();
        $data['slug'] = $this->generateSlug($data['slug'] ?? null, $data['name'], $company);

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

    private function generateSlug(?string $requestedSlug, string $name, ?Company $company = null): string
    {
        $baseSlug = Str::slug($requestedSlug ?: $name);
        $slug = $baseSlug !== '' ? $baseSlug : 'perusahaan';
        $counter = 1;

        while (
            Company::query()
                ->when($company !== null, fn ($query) => $query->whereKeyNot($company->id))
                ->where('slug', $slug)
                ->exists()
        ) {
            $slug = $baseSlug.'-'.$counter;
            $counter++;
        }

        return $slug;
    }
}
