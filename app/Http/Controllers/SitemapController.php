<?php

namespace App\Http\Controllers;

use App\Models\CareerResource;
use App\Models\Company;
use App\Models\JobListing;
use Illuminate\Http\Response;

class SitemapController extends Controller
{
    /**
     * Render the public XML sitemap for search engines.
     */
    public function __invoke(): Response
    {
        $urls = [];

        foreach ($this->staticRoutes() as $name => $changefreq) {
            $urls[] = [
                'loc' => route($name),
                'changefreq' => $changefreq,
                'priority' => $name === 'home' ? '1.0' : '0.7',
            ];
        }

        JobListing::query()
            ->where('status', 'published')
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now())
            ->select(['slug', 'updated_at'])
            ->orderByDesc('updated_at')
            ->limit(5000)
            ->get()
            ->each(function (JobListing $job) use (&$urls): void {
                $urls[] = [
                    'loc' => route('jobs.show', $job->slug),
                    'lastmod' => $job->updated_at?->toAtomString(),
                    'changefreq' => 'daily',
                    'priority' => '0.9',
                ];
            });

        Company::query()
            ->where('is_active', true)
            ->select(['slug', 'updated_at'])
            ->orderByDesc('updated_at')
            ->limit(5000)
            ->get()
            ->each(function (Company $company) use (&$urls): void {
                $urls[] = [
                    'loc' => route('companies.show', $company->slug),
                    'lastmod' => $company->updated_at?->toAtomString(),
                    'changefreq' => 'weekly',
                    'priority' => '0.6',
                ];
            });

        CareerResource::query()
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now())
            ->select(['slug', 'updated_at'])
            ->orderByDesc('updated_at')
            ->limit(5000)
            ->get()
            ->each(function (CareerResource $resource) use (&$urls): void {
                $urls[] = [
                    'loc' => route('career-resources.show', $resource->slug),
                    'lastmod' => $resource->updated_at?->toAtomString(),
                    'changefreq' => 'weekly',
                    'priority' => '0.6',
                ];
            });

        return response(view('sitemap', ['urls' => $urls])->render(), 200)
            ->header('Content-Type', 'application/xml')
            ->header('Cache-Control', 'public, max-age=3600');
    }

    /**
     * Static public routes mapped to their change frequency.
     *
     * @return array<string, string>
     */
    private function staticRoutes(): array
    {
        return [
            'home' => 'daily',
            'jobs.index' => 'daily',
            'companies.index' => 'daily',
            'salary.index' => 'weekly',
            'pricing' => 'monthly',
            'career-resources.index' => 'weekly',
            'cv-analyzer' => 'monthly',
            'ai-interview-simulator' => 'monthly',
            'about' => 'monthly',
            'contact' => 'monthly',
            'terms' => 'yearly',
            'privacy' => 'yearly',
        ];
    }
}
