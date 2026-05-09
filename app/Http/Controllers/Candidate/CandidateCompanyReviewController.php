<?php

namespace App\Http\Controllers\Candidate;

use App\Actions\Candidate\ResolveCandidateProfile;
use App\Http\Controllers\Controller;
use App\Http\Requests\Candidate\StoreCompanyReviewRequest;
use App\Models\Application;
use App\Models\Company;
use App\Models\CompanyReview;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CandidateCompanyReviewController extends Controller
{
    public function index(Request $request, ResolveCandidateProfile $resolveCandidateProfile): Response
    {
        $candidate = $resolveCandidateProfile->handle($request->user());

        $reviews = CompanyReview::query()
            ->where('candidate_id', $candidate->id)
            ->with(['company:id,name,slug,logo_url'])
            ->latest()
            ->get()
            ->map(fn (CompanyReview $review): array => [
                'id' => $review->id,
                'company_id' => $review->company_id,
                'company_name' => $review->company?->name ?? '-',
                'company_slug' => $review->company?->slug ?? '',
                'company_logo' => $review->company?->logo_url,
                'rating' => $review->rating,
                'title' => $review->title,
                'review' => $review->review,
                'status' => $review->status,
                'rejection_reason' => $review->rejection_reason,
                'created_at' => $review->created_at?->format('d M Y'),
                'reviewed_at' => $review->reviewed_at?->format('d M Y'),
            ]);

        $reviewedCompanyIds = $reviews->pluck('company_id')->all();

        $eligibleCompanies = Company::query()
            ->whereHas('jobListings.applications', fn (Builder $query): Builder => $query
                ->where('candidate_id', $candidate->id)
                ->where('status', 'hired')
            )
            ->whereNotIn('id', $reviewedCompanyIds)
            ->select(['id', 'name', 'slug', 'logo_url'])
            ->orderBy('name')
            ->get()
            ->map(fn (Company $company): array => [
                'id' => $company->id,
                'name' => $company->name,
                'slug' => $company->slug,
                'logo_url' => $company->logo_url,
            ]);

        return Inertia::render('candidate/company-reviews/index', [
            'reviews' => $reviews,
            'eligible_companies' => $eligibleCompanies,
        ]);
    }

    public function storeFromList(
        StoreCompanyReviewRequest $request,
        ResolveCandidateProfile $resolveCandidateProfile
    ): RedirectResponse {
        $request->validate([
            'company_id' => ['required', 'integer', 'exists:companies,id'],
        ]);

        $company = Company::query()->findOrFail($request->integer('company_id'));

        return $this->store($request, $company, $resolveCandidateProfile);
    }

    public function store(
        StoreCompanyReviewRequest $request,
        Company $company,
        ResolveCandidateProfile $resolveCandidateProfile
    ): RedirectResponse {
        $candidate = $resolveCandidateProfile->handle($request->user());

        $hasWorkedAtCompany = Application::query()
            ->where('candidate_id', $candidate->id)
            ->where('status', 'hired')
            ->whereHas('jobListing', fn (Builder $query): Builder => $query->where('company_id', $company->id))
            ->exists();

        abort_unless($hasWorkedAtCompany, 403);

        $review = CompanyReview::query()->firstOrNew([
            'company_id' => $company->id,
            'candidate_id' => $candidate->id,
        ]);

        $isNewReview = ! $review->exists;

        $title = $request->string('title')->trim()->toString();

        $review->fill([
            'rating' => $request->integer('rating'),
            'title' => $title !== '' ? $title : null,
            'review' => $request->string('review')->trim()->toString(),
            'status' => 'pending',
            'reviewed_at' => null,
            'reviewed_by' => null,
            'rejection_reason' => null,
        ])->save();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $isNewReview
                ? 'Ulasan dikirim dan menunggu pratinjau perusahaan sebelum tampil publik.'
                : 'Ulasan diperbarui dan akan ditinjau ulang oleh perusahaan.',
        ]);

        return to_route('candidate.company-reviews.index');
    }

    public function destroy(
        Request $request,
        CompanyReview $companyReview,
        ResolveCandidateProfile $resolveCandidateProfile
    ): RedirectResponse {
        $candidate = $resolveCandidateProfile->handle($request->user());

        abort_unless((int) $companyReview->candidate_id === (int) $candidate->id, 403);
        abort_unless($companyReview->status === 'pending', 403, 'Hanya ulasan yang menunggu pratinjau yang dapat dihapus.');

        $companyReview->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Ulasan dihapus.']);

        return to_route('candidate.company-reviews.index');
    }
}
