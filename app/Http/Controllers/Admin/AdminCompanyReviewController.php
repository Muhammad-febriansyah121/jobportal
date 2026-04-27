<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CompanyReview;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdminCompanyReviewController extends Controller
{
    private const VALID_TABS = ['pending', 'history', 'flagged'];

    public function index(Request $request): Response
    {
        $tab = $request->string('tab')->toString();
        $tab = in_array($tab, self::VALID_TABS, true) ? $tab : 'pending';
        $search = $request->string('search')->toString();

        $query = CompanyReview::query()
            ->with([
                'company:id,name,slug',
                'candidate:id,user_id,full_name',
                'candidate.user:id,name,email',
                'reviewer:id,name',
                'flagger:id,name',
            ])
            ->when($search !== '', function ($builder) use ($search): void {
                $builder->where(function ($builder) use ($search): void {
                    $builder->where('title', 'like', "%{$search}%")
                        ->orWhere('review', 'like', "%{$search}%")
                        ->orWhereHas('company', fn ($q) => $q->where('name', 'like', "%{$search}%"));
                });
            });

        if ($tab === 'pending') {
            $query->where('status', 'pending');
        } elseif ($tab === 'flagged') {
            $query->whereNotNull('flagged_at')->whereNull('flag_resolved_at');
        } else {
            $query->whereIn('status', ['approved', 'rejected'])
                ->whereNotNull('reviewed_at');
        }

        $orderBy = match ($tab) {
            'pending' => 'created_at',
            'flagged' => 'flagged_at',
            default => 'reviewed_at',
        };

        $reviews = $query
            ->latest($orderBy)
            ->paginate(20)
            ->withQueryString()
            ->through(fn (CompanyReview $review): array => $this->mapReview($review));

        $counts = [
            'pending' => CompanyReview::where('status', 'pending')->count(),
            'flagged' => CompanyReview::whereNotNull('flagged_at')->whereNull('flag_resolved_at')->count(),
            'history' => CompanyReview::whereIn('status', ['approved', 'rejected'])->whereNotNull('reviewed_at')->count(),
        ];

        return Inertia::render('admin/company-reviews/index', [
            'tab' => $tab,
            'search' => $search,
            'reviews' => $reviews,
            'counts' => $counts,
        ]);
    }

    public function approve(Request $request, CompanyReview $companyReview): RedirectResponse
    {
        $companyReview->update([
            'status' => 'approved',
            'reviewed_at' => now(),
            'reviewed_by' => $request->user()->id,
            'rejection_reason' => null,
            'flag_resolved_at' => $companyReview->flagged_at ? now() : null,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Ulasan disetujui dan akan tampil publik.']);

        return back();
    }

    public function reject(Request $request, CompanyReview $companyReview): RedirectResponse
    {
        $data = $request->validate([
            'rejection_reason' => ['nullable', 'string', 'max:1000'],
            'status' => ['nullable', 'string', Rule::in(['rejected'])],
        ]);

        $companyReview->update([
            'status' => 'rejected',
            'reviewed_at' => now(),
            'reviewed_by' => $request->user()->id,
            'rejection_reason' => $data['rejection_reason'] ?? null,
            'flag_resolved_at' => $companyReview->flagged_at ? now() : null,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Ulasan ditolak dan tidak akan tampil publik.']);

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function mapReview(CompanyReview $review): array
    {
        return [
            'id' => $review->id,
            'rating' => $review->rating,
            'title' => $review->title,
            'review' => $review->review,
            'status' => $review->status,
            'created_at' => $review->created_at?->format('d M Y H:i'),
            'reviewed_at' => $review->reviewed_at?->format('d M Y H:i'),
            'reviewer_name' => $review->reviewer?->name,
            'rejection_reason' => $review->rejection_reason,
            'company' => [
                'id' => $review->company?->id,
                'name' => $review->company?->name,
                'slug' => $review->company?->slug,
            ],
            'candidate' => [
                'name' => $review->candidate?->full_name ?? $review->candidate?->user?->name ?? 'Kandidat',
                'email' => $review->candidate?->user?->email,
            ],
            'employer_reply' => $review->employer_reply,
            'employer_replied_at' => $review->employer_replied_at?->format('d M Y H:i'),
            'flag_reason' => $review->flag_reason,
            'flagged_at' => $review->flagged_at?->format('d M Y H:i'),
            'flagged_by' => $review->flagger?->name,
            'flag_resolved_at' => $review->flag_resolved_at?->format('d M Y H:i'),
        ];
    }
}
