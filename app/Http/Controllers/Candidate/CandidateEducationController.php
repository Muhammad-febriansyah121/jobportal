<?php

namespace App\Http\Controllers\Candidate;

use App\Actions\Candidate\ResolveCandidateProfile;
use App\Http\Controllers\Controller;
use App\Http\Requests\Candidate\SaveCandidateEducationRequest;
use App\Models\CandidateEducation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CandidateEducationController extends Controller
{
    public function index(Request $request, ResolveCandidateProfile $resolveCandidateProfile): Response
    {
        $candidate = $resolveCandidateProfile->handle($request->user());

        return Inertia::render('candidate/educations', [
            'educations' => $candidate->educations()
                ->latest('end_year')
                ->latest('start_year')
                ->get()
                ->map(fn (CandidateEducation $education): array => [
                    'id' => $education->id,
                    'institution' => $education->institution,
                    'degree' => $education->degree,
                    'field_of_study' => $education->field_of_study,
                    'start_year' => $education->start_year,
                    'end_year' => $education->end_year,
                    'gpa' => $education->gpa,
                ]),
        ]);
    }

    public function store(SaveCandidateEducationRequest $request, ResolveCandidateProfile $resolveCandidateProfile): RedirectResponse
    {
        $candidate = $resolveCandidateProfile->handle($request->user());
        $candidate->educations()->create($request->validated());
        $resolveCandidateProfile->refreshCompletion($candidate);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pendidikan berhasil ditambahkan.']);

        return back();
    }

    public function update(SaveCandidateEducationRequest $request, CandidateEducation $candidateEducation, ResolveCandidateProfile $resolveCandidateProfile): RedirectResponse
    {
        $candidate = $resolveCandidateProfile->handle($request->user());
        $this->ensureOwnsEducation($candidateEducation, $candidate->id);
        $candidateEducation->update($request->validated());
        $resolveCandidateProfile->refreshCompletion($candidate);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pendidikan berhasil diperbarui.']);

        return back();
    }

    public function destroy(Request $request, CandidateEducation $candidateEducation, ResolveCandidateProfile $resolveCandidateProfile): RedirectResponse
    {
        $candidate = $resolveCandidateProfile->handle($request->user());
        $this->ensureOwnsEducation($candidateEducation, $candidate->id);
        $candidateEducation->delete();
        $resolveCandidateProfile->refreshCompletion($candidate);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pendidikan berhasil dihapus.']);

        return back();
    }

    private function ensureOwnsEducation(CandidateEducation $candidateEducation, int $candidateId): void
    {
        abort_unless($candidateEducation->candidate_id === $candidateId, 404);
    }
}
