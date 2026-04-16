<?php

namespace App\Http\Controllers\Candidate;

use App\Actions\Candidate\ResolveCandidateProfile;
use App\Http\Controllers\Controller;
use App\Http\Requests\Candidate\UploadCandidateCvRequest;
use App\Models\CandidateCv;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CandidateCvController extends Controller
{
    public function index(Request $request, ResolveCandidateProfile $resolveCandidateProfile): Response
    {
        $candidate = $resolveCandidateProfile->handle($request->user());

        return Inertia::render('candidate/cv', [
            'cvs' => $candidate->cvs()
                ->latest('is_primary')
                ->latest('uploaded_at')
                ->get()
                ->map(fn (CandidateCv $cv): array => [
                    'id' => $cv->id,
                    'file_url' => $cv->file_url,
                    'source' => $cv->source,
                    'is_primary' => $cv->is_primary,
                    'uploaded_at' => $cv->uploaded_at?->format('d M Y H:i'),
                ]),
            'aiSummary' => $candidate->ai_cv_summary,
            'profileCompletion' => $candidate->profile_completion,
        ]);
    }

    public function store(UploadCandidateCvRequest $request, ResolveCandidateProfile $resolveCandidateProfile): RedirectResponse
    {
        $candidate = $resolveCandidateProfile->handle($request->user());
        $path = $request->file('cv_file')->store('candidate-cvs', 'public');
        $isPrimary = $request->boolean('is_primary') || ! $candidate->cvs()->exists();

        if ($isPrimary) {
            $candidate->cvs()->update(['is_primary' => false]);
        }

        $candidate->cvs()->create([
            'file_url' => Storage::disk('public')->url($path),
            'source' => 'upload',
            'is_primary' => $isPrimary,
            'uploaded_at' => now(),
        ]);

        $resolveCandidateProfile->refreshCompletion($candidate);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'CV berhasil diunggah.']);

        return back();
    }

    public function setPrimary(Request $request, CandidateCv $candidateCv, ResolveCandidateProfile $resolveCandidateProfile): RedirectResponse
    {
        $candidate = $resolveCandidateProfile->handle($request->user());
        $this->ensureOwnsCv($candidateCv, $candidate->id);

        $candidate->cvs()->update(['is_primary' => false]);
        $candidateCv->update(['is_primary' => true]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'CV utama berhasil dipilih.']);

        return back();
    }

    public function destroy(Request $request, CandidateCv $candidateCv, ResolveCandidateProfile $resolveCandidateProfile): RedirectResponse
    {
        $candidate = $resolveCandidateProfile->handle($request->user());
        $this->ensureOwnsCv($candidateCv, $candidate->id);
        $wasPrimary = $candidateCv->is_primary;

        if (str_starts_with($candidateCv->file_url, '/storage/')) {
            Storage::disk('public')->delete(str($candidateCv->file_url)->after('/storage/')->toString());
        }

        $candidateCv->delete();

        if ($wasPrimary) {
            $candidate->cvs()->latest('uploaded_at')->first()?->update(['is_primary' => true]);
        }

        $resolveCandidateProfile->refreshCompletion($candidate);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'CV berhasil dihapus.']);

        return back();
    }

    private function ensureOwnsCv(CandidateCv $candidateCv, int $candidateId): void
    {
        abort_unless($candidateCv->candidate_id === $candidateId, 404);
    }
}
