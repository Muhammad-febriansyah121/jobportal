<?php

namespace App\Http\Controllers\Candidate;

use App\Actions\Candidate\ResolveCandidateProfile;
use App\Http\Controllers\Controller;
use App\Http\Requests\Candidate\SaveCandidateExperienceRequest;
use App\Models\CandidateExperience;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CandidateExperienceController extends Controller
{
    public function index(Request $request, ResolveCandidateProfile $resolveCandidateProfile): Response
    {
        $candidate = $resolveCandidateProfile->handle($request->user());

        return Inertia::render('candidate/experiences', [
            'experiences' => $candidate->experiences()
                ->latest('is_current')
                ->latest('start_date')
                ->get()
                ->map(fn (CandidateExperience $experience): array => [
                    'id' => $experience->id,
                    'company_name' => $experience->company_name,
                    'job_title' => $experience->job_title,
                    'start_date' => $experience->start_date?->toDateString(),
                    'end_date' => $experience->end_date?->toDateString(),
                    'is_current' => $experience->is_current,
                    'description' => $experience->description,
                    'location' => $experience->location,
                    'period' => $experience->start_date?->format('M Y').' - '.($experience->is_current ? 'Sekarang' : $experience->end_date?->format('M Y')),
                ]),
        ]);
    }

    public function store(SaveCandidateExperienceRequest $request, ResolveCandidateProfile $resolveCandidateProfile): RedirectResponse
    {
        $candidate = $resolveCandidateProfile->handle($request->user());
        $candidate->experiences()->create($this->validatedData($request));
        $resolveCandidateProfile->refreshCompletion($candidate);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pengalaman kerja berhasil ditambahkan.']);

        return back();
    }

    public function update(SaveCandidateExperienceRequest $request, CandidateExperience $candidateExperience, ResolveCandidateProfile $resolveCandidateProfile): RedirectResponse
    {
        $candidate = $resolveCandidateProfile->handle($request->user());
        $this->ensureOwnsExperience($candidateExperience, $candidate->id);
        $candidateExperience->update($this->validatedData($request));
        $resolveCandidateProfile->refreshCompletion($candidate);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pengalaman kerja berhasil diperbarui.']);

        return back();
    }

    public function destroy(Request $request, CandidateExperience $candidateExperience, ResolveCandidateProfile $resolveCandidateProfile): RedirectResponse
    {
        $candidate = $resolveCandidateProfile->handle($request->user());
        $this->ensureOwnsExperience($candidateExperience, $candidate->id);
        $candidateExperience->delete();
        $resolveCandidateProfile->refreshCompletion($candidate);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pengalaman kerja berhasil dihapus.']);

        return back();
    }

    private function validatedData(SaveCandidateExperienceRequest $request): array
    {
        $data = $request->validated();
        $data['is_current'] = $request->boolean('is_current');

        if ($data['is_current']) {
            $data['end_date'] = null;
        }

        return $data;
    }

    private function ensureOwnsExperience(CandidateExperience $candidateExperience, int $candidateId): void
    {
        abort_unless($candidateExperience->candidate_id === $candidateId, 404);
    }
}
