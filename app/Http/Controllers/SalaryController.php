<?php

namespace App\Http\Controllers;

use App\Models\Industry;
use App\Models\SalaryInsight;
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

        $insights = SalaryInsight::query()
            ->select(['id', 'industry_id', 'job_title', 'location_city', 'salary_min', 'salary_median', 'salary_max', 'source_count'])
            ->with('industry:id,name')
            ->when(
                $request->filled('search'),
                fn ($query) => $query->where('job_title', 'like', '%'.$request->string('search')->toString().'%'),
            )
            ->when(
                $request->filled('industry_id'),
                fn ($query) => $query->where('industry_id', $request->integer('industry_id')),
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
                'location_city' => $insight->location_city,
                'salary_min' => $insight->salary_min,
                'salary_median' => $insight->salary_median,
                'salary_max' => $insight->salary_max,
                'source_count' => $insight->source_count,
            ]);

        return Inertia::render('front/salary/index', [
            'filters' => [
                'search' => $request->string('search')->toString(),
                'industry_id' => $request->string('industry_id')->toString(),
                'location' => $request->string('location')->toString(),
            ],
            'industries' => $industries,
            'insights' => $insights,
        ]);
    }
}
