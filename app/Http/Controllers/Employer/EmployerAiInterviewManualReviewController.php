<?php

namespace App\Http\Controllers\Employer;

use App\Actions\Employer\ResolveEmployerCompany;
use App\Http\Controllers\Controller;
use App\Http\Requests\Employer\SaveAiInterviewManualReviewRequest;
use App\Models\AiInterviewManualReview;
use App\Models\AiInterviewSession;
use App\Models\Company;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmployerAiInterviewManualReviewController extends Controller
{
    public function store(
        SaveAiInterviewManualReviewRequest $request,
        AiInterviewSession $aiInterviewSession,
        ResolveEmployerCompany $resolveEmployerCompany,
    ): RedirectResponse {
        $this->authorizedCompany($request, $aiInterviewSession, $resolveEmployerCompany);

        AiInterviewManualReview::updateOrCreate(
            [
                'ai_interview_session_id' => $aiInterviewSession->id,
                'reviewer_id' => $request->user()->id,
            ],
            [
                'rating' => (int) $request->validated('rating'),
                'decision' => (string) $request->validated('decision'),
                'notes' => $request->validated('notes'),
            ],
        );

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Review berhasil disimpan.',
        ]);

        return back();
    }

    public function destroy(
        Request $request,
        AiInterviewSession $aiInterviewSession,
        AiInterviewManualReview $manualReview,
        ResolveEmployerCompany $resolveEmployerCompany,
    ): RedirectResponse {
        $this->authorizedCompany($request, $aiInterviewSession, $resolveEmployerCompany);

        abort_unless($manualReview->ai_interview_session_id === $aiInterviewSession->id, 404);
        abort_unless($manualReview->reviewer_id === $request->user()->id, 403);

        $manualReview->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Review berhasil dihapus.',
        ]);

        return back();
    }

    private function authorizedCompany(
        Request $request,
        AiInterviewSession $session,
        ResolveEmployerCompany $resolveEmployerCompany,
    ): Company {
        $company = $resolveEmployerCompany->handle($request->user());

        abort_if($company === null, 404);

        $session->loadMissing([
            'application.jobListing.company',
        ]);

        abort_unless($session->application?->jobListing?->company_id === $company->id, 404);

        return $company;
    }
}
