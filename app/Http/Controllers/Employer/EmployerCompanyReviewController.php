<?php

namespace App\Http\Controllers\Employer;

use App\Actions\Employer\ResolveEmployerCompany;
use App\Http\Controllers\Controller;
use App\Models\CompanyReview;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmployerCompanyReviewController extends Controller
{
    public function index(Request $request, ResolveEmployerCompany $resolveEmployerCompany): Response|RedirectResponse
    {
        $company = $resolveEmployerCompany->handle($request->user());

        if ($company === null) {
            Inertia::flash('toast', ['type' => 'warning', 'message' => 'Lengkapi profil perusahaan dulu.']);

            return to_route('employer.company.edit');
        }

        $pending = CompanyReview::query()
            ->where('company_id', $company->id)
            ->where('status', 'pending')
            ->with([
                'candidate:id,user_id,full_name',
                'candidate.user:id,name',
            ])
            ->latest()
            ->get()
            ->map(fn (CompanyReview $review): array => [
                'id' => $review->id,
                'rating' => $review->rating,
                'title' => $review->title,
                'review' => $review->review,
                'candidate_name' => $review->candidate?->full_name ?? $review->candidate?->user?->name ?? 'Kandidat',
                'created_at' => $review->created_at?->format('d M Y H:i'),
            ]);

        $approved = CompanyReview::query()
            ->where('company_id', $company->id)
            ->where('status', 'approved')
            ->with([
                'candidate:id,user_id,full_name',
                'candidate.user:id,name',
            ])
            ->latest('reviewed_at')
            ->paginate(15)
            ->through(fn (CompanyReview $review): array => [
                'id' => $review->id,
                'rating' => $review->rating,
                'title' => $review->title,
                'review' => $review->review,
                'reviewed_at' => $review->reviewed_at?->format('d M Y H:i'),
                'candidate_name' => $review->candidate?->full_name ?? $review->candidate?->user?->name ?? 'Kandidat',
                'employer_reply' => $review->employer_reply,
                'employer_replied_at' => $review->employer_replied_at?->format('d M Y H:i'),
                'flag_reason' => $review->flag_reason,
                'flagged_at' => $review->flagged_at?->format('d M Y H:i'),
                'flag_resolved_at' => $review->flag_resolved_at?->format('d M Y H:i'),
            ]);

        $stats = [
            'total' => CompanyReview::where('company_id', $company->id)->where('status', 'approved')->count(),
            'avg' => round((float) CompanyReview::where('company_id', $company->id)->where('status', 'approved')->avg('rating'), 1),
            'pending_count' => $pending->count(),
        ];

        return Inertia::render('employer/company-reviews/index', [
            'company' => ['id' => $company->id, 'name' => $company->name],
            'pending' => $pending,
            'reviews' => $approved,
            'stats' => $stats,
        ]);
    }

    public function approve(
        Request $request,
        CompanyReview $companyReview,
        ResolveEmployerCompany $resolveEmployerCompany,
    ): RedirectResponse {
        $this->ensureOwns($request, $companyReview, $resolveEmployerCompany);

        abort_unless($companyReview->status === 'pending', 422, 'Ulasan ini sudah diproses.');

        $companyReview->update([
            'status' => 'approved',
            'reviewed_at' => now(),
            'reviewed_by' => $request->user()->id,
            'rejection_reason' => null,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Ulasan disetujui dan kini tampil publik.']);

        return back();
    }

    public function reject(
        Request $request,
        CompanyReview $companyReview,
        ResolveEmployerCompany $resolveEmployerCompany,
    ): RedirectResponse {
        $this->ensureOwns($request, $companyReview, $resolveEmployerCompany);

        abort_unless($companyReview->status === 'pending', 422, 'Ulasan ini sudah diproses.');

        $data = $request->validate([
            'rejection_reason' => ['required', 'string', 'min:10', 'max:500'],
        ]);

        $companyReview->update([
            'status' => 'rejected',
            'reviewed_at' => now(),
            'reviewed_by' => $request->user()->id,
            'rejection_reason' => $data['rejection_reason'],
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Ulasan ditolak.']);

        return back();
    }

    public function reply(
        Request $request,
        CompanyReview $companyReview,
        ResolveEmployerCompany $resolveEmployerCompany,
    ): RedirectResponse {
        $this->ensureOwns($request, $companyReview, $resolveEmployerCompany);

        $data = $request->validate([
            'employer_reply' => ['required', 'string', 'max:2000'],
        ]);

        $companyReview->update([
            'employer_reply' => $data['employer_reply'],
            'employer_replied_at' => now(),
            'employer_replied_by' => $request->user()->id,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Balasan kamu sudah tampil di ulasan tersebut.']);

        return back();
    }

    public function deleteReply(
        Request $request,
        CompanyReview $companyReview,
        ResolveEmployerCompany $resolveEmployerCompany,
    ): RedirectResponse {
        $this->ensureOwns($request, $companyReview, $resolveEmployerCompany);

        $companyReview->update([
            'employer_reply' => null,
            'employer_replied_at' => null,
            'employer_replied_by' => null,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Balasan dihapus.']);

        return back();
    }

    public function flag(
        Request $request,
        CompanyReview $companyReview,
        ResolveEmployerCompany $resolveEmployerCompany,
    ): RedirectResponse {
        $this->ensureOwns($request, $companyReview, $resolveEmployerCompany);

        $data = $request->validate([
            'flag_reason' => ['required', 'string', 'min:10', 'max:1000'],
        ]);

        $companyReview->update([
            'flag_reason' => $data['flag_reason'],
            'flagged_at' => now(),
            'flagged_by' => $request->user()->id,
            'flag_resolved_at' => null,
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Ulasan dilaporkan ke admin untuk ditinjau ulang.',
        ]);

        return back();
    }

    private function ensureOwns(
        Request $request,
        CompanyReview $review,
        ResolveEmployerCompany $resolveEmployerCompany,
    ): void {
        $company = $resolveEmployerCompany->handle($request->user());

        abort_if($company === null, 404);
        abort_unless((int) $review->company_id === (int) $company->id, 404);
    }
}
