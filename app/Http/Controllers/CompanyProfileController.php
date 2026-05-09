<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\Company;
use App\Models\CompanyReview;
use App\Models\JobListing;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CompanyProfileController extends Controller
{
    public function show(Request $request, Company $company): Response
    {
        abort_unless($company->is_active && ! $company->suspended_at, 404);

        $company->load(['industry:id,name', 'badges', 'offices']);

        $jobs = JobListing::query()
            ->published()
            ->where('company_id', $company->id)
            ->select(['id', 'slug', 'title', 'location_city', 'location_province', 'work_mode', 'job_type', 'experience_level', 'salary_min', 'salary_max', 'is_salary_visible', 'published_at', 'closes_at'])
            ->latest('published_at')
            ->limit(10)
            ->get()
            ->map(fn (JobListing $job): array => [
                'id' => $job->id,
                'slug' => $job->slug,
                'title' => $job->title,
                'location' => collect([$job->location_city, $job->location_province])->filter()->implode(', '),
                'work_mode_label' => str($job->work_mode)->headline()->toString(),
                'job_type_label' => str($job->job_type)->headline()->toString(),
                'experience_level' => str($job->experience_level)->headline()->toString(),
                'salary_range' => $this->salaryRange($job),
                'published_at' => $job->published_at?->diffForHumans(),
            ]);

        $publishedReviews = $company->reviews()
            ->where('status', 'approved');

        $recentReviews = (clone $publishedReviews)
            ->select(['id', 'rating', 'title', 'review', 'status', 'employer_reply', 'employer_replied_at'])
            ->latest('id')
            ->limit(2)
            ->get()
            ->map(fn ($review): array => [
                'id' => $review->id,
                'rating' => $review->rating,
                'title' => $review->title,
                'review' => $review->review,
                'employer_reply' => $review->employer_reply,
                'employer_replied_at' => $review->employer_replied_at?->format('d M Y'),
            ]);

        $avgRating = (clone $publishedReviews)->avg('rating');

        $canSubmitReview = false;
        $myReview = null;

        $user = $request->user();
        if ($user?->role === 'candidate' && $user->candidateProfile !== null) {
            $candidateId = $user->candidateProfile->id;

            $canSubmitReview = Application::query()
                ->where('candidate_id', $candidateId)
                ->where('status', 'hired')
                ->whereHas('jobListing', fn (Builder $query): Builder => $query->where('company_id', $company->id))
                ->exists();

            $existingReview = CompanyReview::query()
                ->where('company_id', $company->id)
                ->where('candidate_id', $candidateId)
                ->first();

            if ($existingReview !== null) {
                $myReview = [
                    'rating' => (int) $existingReview->rating,
                    'title' => $existingReview->title,
                    'review' => $existingReview->review,
                ];
            }
        }

        return Inertia::render('companies/show', [
            'company' => [
                'id' => $company->id,
                'name' => $company->name,
                'slug' => $company->slug,
                'logo_url' => $company->logo_url,
                'cover_url' => $company->cover_url,
                'description' => $company->description,
                'culture' => $company->culture,
                'benefits' => $company->benefits,
                'company_size' => $company->company_size,
                'website' => $company->website,
                'hq_city' => $company->hq_city,
                'hq_province' => $company->hq_province,
                'is_verified' => $company->is_verified,
                'trust_score' => $company->trust_score,
                'response_rate' => $company->response_rate,
                'median_response_hours' => $company->median_response_hours,
                'industry' => $company->industry?->name,
                'badges' => $company->badges->map(fn ($badge): array => [
                    'id' => $badge->id,
                    'type' => $badge->type,
                    'label' => $badge->label,
                    'issued_at' => $badge->issued_at?->format('M Y'),
                ]),
                'offices' => $company->offices->map(fn ($office): array => [
                    'id' => $office->id,
                    'city' => $office->city,
                    'province' => $office->province,
                    'address' => $office->address,
                ]),
                'open_jobs_count' => $jobs->count(),
                'review_summary' => [
                    'average_rating' => $avgRating !== null ? round((float) $avgRating, 1) : null,
                    'total_reviews' => (clone $publishedReviews)->count(),
                    'recent_reviews' => $recentReviews,
                ],
                'review_access' => [
                    'can_submit' => $canSubmitReview,
                    'my_review' => $myReview,
                ],
            ],
            'jobs' => $jobs,
        ]);
    }

    private function salaryRange(JobListing $job): string
    {
        if (! $job->is_salary_visible || ($job->salary_min === null && $job->salary_max === null)) {
            return 'Salary tidak ditampilkan';
        }

        return collect([$job->salary_min, $job->salary_max])
            ->filter(fn (?int $amount): bool => $amount !== null)
            ->map(fn (int $amount): string => 'Rp'.number_format($amount, 0, ',', '.'))
            ->implode(' - ');
    }
}
