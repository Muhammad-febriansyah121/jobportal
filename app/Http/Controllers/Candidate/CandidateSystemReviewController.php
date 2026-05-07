<?php

namespace App\Http\Controllers\Candidate;

use App\Http\Controllers\Controller;
use App\Http\Requests\Candidate\StoreSystemReviewRequest;
use App\Models\SystemReview;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CandidateSystemReviewController extends Controller
{
    public function index(Request $request): Response
    {
        $review = SystemReview::query()
            ->where('user_id', $request->user()->id)
            ->first();

        return Inertia::render('candidate/system-reviews/index', [
            'review' => $review === null ? null : [
                'id' => $review->id,
                'rating' => $review->rating,
                'review' => $review->review,
                'status' => $review->status,
                'rejection_reason' => $review->rejection_reason,
                'created_at' => $review->created_at?->format('d M Y'),
                'reviewed_at' => $review->reviewed_at?->format('d M Y'),
            ],
        ]);
    }

    public function store(StoreSystemReviewRequest $request): RedirectResponse
    {
        $userId = $request->user()->id;

        $existing = SystemReview::query()
            ->where('user_id', $userId)
            ->first();

        $isNew = $existing === null;

        SystemReview::query()->updateOrCreate(
            ['user_id' => $userId],
            [
                'rating' => $request->integer('rating'),
                'review' => $request->string('review')->trim()->toString(),
                'status' => 'pending',
                'rejection_reason' => null,
                'reviewed_at' => null,
                'reviewed_by' => null,
            ],
        );

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $isNew
                ? 'Ulasan dikirim dan menunggu moderasi tim Karivia.'
                : 'Ulasan diperbarui dan akan ditinjau ulang.',
        ]);

        return to_route('candidate.system-reviews.index');
    }

    public function destroy(Request $request, SystemReview $systemReview): RedirectResponse
    {
        abort_unless((int) $systemReview->user_id === (int) $request->user()->id, 403);
        abort_unless($systemReview->status === 'pending', 403, 'Hanya ulasan menunggu moderasi yang dapat dihapus.');

        $systemReview->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Ulasan dihapus.']);

        return to_route('candidate.system-reviews.index');
    }
}
