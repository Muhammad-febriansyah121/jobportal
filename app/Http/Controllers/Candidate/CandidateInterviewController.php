<?php

namespace App\Http\Controllers\Candidate;

use App\Actions\Candidate\ResolveCandidateProfile;
use App\Http\Controllers\Controller;
use App\Models\Interview;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CandidateInterviewController extends Controller
{
    public function index(Request $request, ResolveCandidateProfile $resolveCandidateProfile): Response
    {
        $candidate = $resolveCandidateProfile->handle($request->user());

        return Inertia::render('candidate/interviews/index', [
            'interviews' => Interview::query()
                ->with(['application.jobListing:id,title,company_id', 'application.jobListing.company:id,name'])
                ->whereHas('application', fn ($query) => $query->where('candidate_id', $candidate->id))
                ->latest('scheduled_at')
                ->paginate(12)
                ->withQueryString()
                ->through(fn (Interview $interview): array => $this->interviewPayload($interview)),
        ]);
    }

    public function show(Request $request, Interview $interview, ResolveCandidateProfile $resolveCandidateProfile): Response
    {
        $candidate = $resolveCandidateProfile->handle($request->user());
        $this->ensureOwnsInterview($interview, $candidate->id);

        $interview->load(['application.jobListing:id,title,company_id', 'application.jobListing.company:id,name', 'participants.user:id,name,email']);

        return Inertia::render('candidate/interviews/show', [
            'interview' => [
                ...$this->interviewPayload($interview),
                'participants' => $interview->participants
                    ->map(fn ($participant): array => [
                        'id' => $participant->id,
                        'name' => $participant->user?->name,
                        'email' => $participant->user?->email,
                        'role' => $participant->role,
                    ]),
            ],
        ]);
    }

    public function confirm(Request $request, Interview $interview, ResolveCandidateProfile $resolveCandidateProfile): RedirectResponse
    {
        $candidate = $resolveCandidateProfile->handle($request->user());
        $this->ensureOwnsInterview($interview, $candidate->id);
        $interview->update(['status' => 'confirmed']);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Jadwal interview berhasil dikonfirmasi.']);

        return back();
    }

    public function decline(Request $request, Interview $interview, ResolveCandidateProfile $resolveCandidateProfile): RedirectResponse
    {
        $candidate = $resolveCandidateProfile->handle($request->user());
        $this->ensureOwnsInterview($interview, $candidate->id);
        $interview->update(['status' => 'cancelled']);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Jadwal interview berhasil ditolak.']);

        return back();
    }

    private function interviewPayload(Interview $interview): array
    {
        return [
            'id' => $interview->id,
            'application_id' => $interview->application_id,
            'job_title' => $interview->application?->jobListing?->title,
            'company' => $interview->application?->jobListing?->company?->name,
            'scheduled_at' => $interview->scheduled_at?->format('d M Y H:i'),
            'mode' => $interview->mode,
            'location_url' => $interview->location_url,
            'status' => $interview->status,
        ];
    }

    private function ensureOwnsInterview(Interview $interview, int $candidateId): void
    {
        $interview->loadMissing('application:id,candidate_id');

        abort_unless($interview->application?->candidate_id === $candidateId, 404);
    }
}
