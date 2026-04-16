<?php

namespace App\Http\Controllers\Candidate;

use App\Actions\Candidate\ResolveCandidateProfile;
use App\Http\Controllers\Controller;
use App\Http\Requests\Candidate\SaveCandidateCertificationRequest;
use App\Models\CandidateCertification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CandidateCertificationController extends Controller
{
    public function index(Request $request, ResolveCandidateProfile $resolveCandidateProfile): Response
    {
        $candidate = $resolveCandidateProfile->handle($request->user());

        return Inertia::render('candidate/certifications', [
            'certifications' => $candidate->certifications()
                ->latest('issue_date')
                ->get()
                ->map(fn (CandidateCertification $certification): array => [
                    'id' => $certification->id,
                    'name' => $certification->name,
                    'issuing_org' => $certification->issuing_org,
                    'issue_date' => $certification->issue_date?->toDateString(),
                    'credential_url' => $certification->credential_url,
                ]),
        ]);
    }

    public function store(SaveCandidateCertificationRequest $request, ResolveCandidateProfile $resolveCandidateProfile): RedirectResponse
    {
        $candidate = $resolveCandidateProfile->handle($request->user());
        $candidate->certifications()->create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Sertifikasi berhasil ditambahkan.']);

        return back();
    }

    public function update(SaveCandidateCertificationRequest $request, CandidateCertification $candidateCertification, ResolveCandidateProfile $resolveCandidateProfile): RedirectResponse
    {
        $candidate = $resolveCandidateProfile->handle($request->user());
        $this->ensureOwnsCertification($candidateCertification, $candidate->id);
        $candidateCertification->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Sertifikasi berhasil diperbarui.']);

        return back();
    }

    public function destroy(Request $request, CandidateCertification $candidateCertification, ResolveCandidateProfile $resolveCandidateProfile): RedirectResponse
    {
        $candidate = $resolveCandidateProfile->handle($request->user());
        $this->ensureOwnsCertification($candidateCertification, $candidate->id);
        $candidateCertification->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Sertifikasi berhasil dihapus.']);

        return back();
    }

    private function ensureOwnsCertification(CandidateCertification $candidateCertification, int $candidateId): void
    {
        abort_unless($candidateCertification->candidate_id === $candidateId, 404);
    }
}
