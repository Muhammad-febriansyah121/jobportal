<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SystemReview;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminSystemReviewController extends Controller
{
    private const VALID_TABS = ['pending', 'history'];

    public function index(Request $request): Response
    {
        $tab = $request->string('tab')->toString();
        $tab = in_array($tab, self::VALID_TABS, true) ? $tab : 'pending';
        $search = $request->string('search')->toString();

        $query = SystemReview::query()
            ->with(['user:id,name,email,role,avatar_url', 'reviewer:id,name'])
            ->when($search !== '', function ($builder) use ($search): void {
                $builder->where(function ($builder) use ($search): void {
                    $builder->where('review', 'like', "%{$search}%")
                        ->orWhereHas('user', fn ($q) => $q
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%"));
                });
            });

        if ($tab === 'pending') {
            $query->where('status', 'pending');
        } else {
            $query->whereIn('status', ['approved', 'rejected'])
                ->whereNotNull('reviewed_at');
        }

        $orderBy = $tab === 'pending' ? 'created_at' : 'reviewed_at';

        $reviews = $query
            ->latest($orderBy)
            ->paginate(20)
            ->withQueryString()
            ->through(fn (SystemReview $review): array => $this->mapReview($review));

        $counts = [
            'pending' => SystemReview::where('status', 'pending')->count(),
            'history' => SystemReview::whereIn('status', ['approved', 'rejected'])->whereNotNull('reviewed_at')->count(),
        ];

        return Inertia::render('admin/system-reviews/index', [
            'tab' => $tab,
            'search' => $search,
            'reviews' => $reviews,
            'counts' => $counts,
        ]);
    }

    public function approve(Request $request, SystemReview $systemReview): RedirectResponse
    {
        $systemReview->update([
            'status' => 'approved',
            'reviewed_at' => now(),
            'reviewed_by' => $request->user()->id,
            'rejection_reason' => null,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Ulasan disetujui dan akan tampil publik.']);

        return back();
    }

    public function reject(Request $request, SystemReview $systemReview): RedirectResponse
    {
        $data = $request->validate([
            'rejection_reason' => ['nullable', 'string', 'max:1000'],
        ]);

        $systemReview->update([
            'status' => 'rejected',
            'reviewed_at' => now(),
            'reviewed_by' => $request->user()->id,
            'rejection_reason' => $data['rejection_reason'] ?? null,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Ulasan ditolak.']);

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function mapReview(SystemReview $review): array
    {
        return [
            'id' => $review->id,
            'rating' => $review->rating,
            'review' => $review->review,
            'status' => $review->status,
            'rejection_reason' => $review->rejection_reason,
            'created_at' => $review->created_at?->format('d M Y H:i'),
            'reviewed_at' => $review->reviewed_at?->format('d M Y H:i'),
            'reviewer_name' => $review->reviewer?->name,
            'user' => [
                'id' => $review->user?->id,
                'name' => $review->user?->name,
                'email' => $review->user?->email,
                'role' => $review->user?->role,
                'avatar_url' => $review->user?->avatar_url,
            ],
        ];
    }
}
