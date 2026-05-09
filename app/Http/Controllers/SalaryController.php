<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSalarySubmissionRequest;
use App\Models\Industry;
use App\Models\SalaryInsight;
use App\Models\SalarySubmission;
use App\Models\SubIndustry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SalaryController extends Controller
{
    public function index(Request $request): Response
    {
        $industries = Industry::query()
            ->select(['id', 'name'])
            ->orderBy('name')
            ->get()
            ->map(fn (Industry $industry): array => [
                'id' => $industry->id,
                'name' => $industry->name,
            ]);

        $subIndustries = SubIndustry::query()
            ->select(['id', 'industry_id', 'name'])
            ->orderBy('name')
            ->get()
            ->map(fn (SubIndustry $subIndustry): array => [
                'id' => $subIndustry->id,
                'industry_id' => $subIndustry->industry_id,
                'name' => $subIndustry->name,
            ]);

        $insights = SalaryInsight::query()
            ->select(['id', 'industry_id', 'sub_industry_id', 'job_title', 'location_city', 'salary_min', 'salary_max', 'qualification', 'experience_min_years', 'experience_max_years', 'source_count'])
            ->with(['industry:id,name', 'subIndustry:id,name'])
            ->when(
                $request->filled('search'),
                fn ($query) => $query->where('job_title', 'like', '%'.$request->string('search')->toString().'%'),
            )
            ->when(
                $request->filled('industry_id'),
                fn ($query) => $query->where('industry_id', $request->integer('industry_id')),
            )
            ->when(
                $request->filled('sub_industry_id'),
                fn ($query) => $query->where('sub_industry_id', $request->integer('sub_industry_id')),
            )
            ->when(
                $request->filled('location'),
                fn ($query) => $query->where('location_city', 'like', '%'.$request->string('location')->toString().'%'),
            )
            ->orderBy('job_title')
            ->paginate(12)
            ->withQueryString()
            ->through(fn (SalaryInsight $insight): array => [
                'id' => $insight->id,
                'job_title' => $insight->job_title,
                'industry' => $insight->industry?->name,
                'sub_industry' => $insight->subIndustry?->name,
                'location_city' => $insight->location_city,
                'salary_min' => $insight->salary_min,
                'salary_max' => $insight->salary_max,
                'qualification' => $this->qualificationLabel($insight->qualification),
                'experience_years' => $this->experienceYearsLabel($insight->experience_min_years, $insight->experience_max_years),
                'source_count' => $insight->source_count,
            ]);

        return Inertia::render('front/salary/index', [
            'filters' => [
                'search' => $request->string('search')->toString(),
                'industry_id' => $request->string('industry_id')->toString(),
                'sub_industry_id' => $request->string('sub_industry_id')->toString(),
                'location' => $request->string('location')->toString(),
            ],
            'industries' => $industries,
            'subIndustries' => $subIndustries,
            'insights' => $insights,
        ]);
    }

    public function store(StoreSalarySubmissionRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $isAnonymous = (bool) ($validated['is_anonymous'] ?? true);

        SalarySubmission::create([
            'user_id' => $request->user()?->id,
            'industry_id' => $validated['industry_id'] ?? null,
            'job_title' => $validated['job_title'],
            'company_name' => $validated['company_name'] ?? null,
            'location_city' => $validated['location_city'] ?? null,
            'employment_type' => $validated['employment_type'] ?? null,
            'years_experience' => $validated['years_experience'] ?? null,
            'monthly_salary' => $validated['monthly_salary'],
            'is_anonymous' => $isAnonymous,
            'contributor_name' => $isAnonymous ? null : ($validated['contributor_name'] ?? null),
            'contributor_email' => $isAnonymous ? null : ($validated['contributor_email'] ?? null),
            'status' => 'pending',
        ]);

        return back()->with('success', 'Terima kasih! Data gaji Anda telah dikirim untuk diverifikasi.');
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
}
