<?php

namespace App\Http\Controllers\Candidate;

use App\Actions\Candidate\ResolveCandidateProfile;
use App\Http\Controllers\Controller;
use App\Models\AiCareerCoachingMessage;
use App\Models\AiCareerCoachingSession;
use App\Models\AiCareerRecommendation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CandidateCareerCoachController extends Controller
{
    public function index(Request $request, ResolveCandidateProfile $resolveCandidateProfile): Response
    {
        $candidate = $resolveCandidateProfile->handle($request->user());
        $activeSession = $candidate->careerCoachingSessions()
            ->with('messages')
            ->latest()
            ->first();

        return Inertia::render('candidate/career-coach', [
            'sessions' => $candidate->careerCoachingSessions()
                ->latest()
                ->get()
                ->map(fn (AiCareerCoachingSession $session): array => [
                    'id' => $session->id,
                    'title' => $session->title,
                    'status' => $session->status,
                    'updated_at' => $session->updated_at?->diffForHumans(),
                ]),
            'activeSession' => $activeSession ? [
                'id' => $activeSession->id,
                'title' => $activeSession->title,
                'status' => $activeSession->status,
                'messages' => $activeSession->messages
                    ->map(fn (AiCareerCoachingMessage $message): array => [
                        'id' => $message->id,
                        'role' => $message->role,
                        'content' => $message->content,
                        'created_at' => $message->created_at?->format('d M Y H:i'),
                    ]),
            ] : null,
            'recommendations' => $candidate->careerCoachingSessions()->exists()
                ? AiCareerRecommendation::query()
                    ->where('candidate_id', $candidate->id)
                    ->latest()
                    ->limit(6)
                    ->get()
                    ->map(fn (AiCareerRecommendation $recommendation): array => [
                        'id' => $recommendation->id,
                        'title' => $recommendation->title,
                        'match_score' => $recommendation->match_score,
                        'recommendation' => $recommendation->recommendation_json,
                    ])
                : [],
        ]);
    }

    public function start(Request $request, ResolveCandidateProfile $resolveCandidateProfile): RedirectResponse
    {
        $data = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
        ]);

        $candidate = $resolveCandidateProfile->handle($request->user());
        $session = $candidate->careerCoachingSessions()->create([
            'title' => $data['title'] ?? 'Career coaching',
            'status' => 'active',
        ]);

        $session->messages()->create([
            'role' => 'assistant',
            'content' => 'Mulai dari target peran, skill yang ingin kamu kuatkan, atau lowongan yang sedang kamu incar.',
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Sesi career coach dimulai.']);

        return back();
    }

    public function message(Request $request, ResolveCandidateProfile $resolveCandidateProfile): RedirectResponse
    {
        $data = $request->validate([
            'session_id' => ['nullable', 'integer', 'exists:ai_career_coaching_sessions,id'],
            'content' => ['required', 'string', 'max:5000'],
        ]);

        $candidate = $resolveCandidateProfile->handle($request->user());
        $session = filled($data['session_id'] ?? null)
            ? $candidate->careerCoachingSessions()->whereKey($data['session_id'])->firstOrFail()
            : $candidate->careerCoachingSessions()->create(['title' => 'Career coaching', 'status' => 'active']);

        $session->messages()->create([
            'role' => 'user',
            'content' => $data['content'],
        ]);

        $session->messages()->create([
            'role' => 'assistant',
            'content' => 'Saya catat. Gunakan ini sebagai bahan refleksi karier dan lengkapi profil agar rekomendasi berikutnya makin presisi.',
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pesan career coach berhasil dikirim.']);

        return back();
    }
}
