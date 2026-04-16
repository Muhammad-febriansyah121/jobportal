<?php

namespace App\Http\Controllers\Candidate;

use App\Actions\Candidate\ResolveCandidateProfile;
use App\Http\Controllers\Controller;
use App\Models\AiInterviewQuestion;
use App\Models\AiInterviewResponse;
use App\Models\AiInterviewSession;
use App\Models\Application;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CandidateAiInterviewController extends Controller
{
    public function index(Request $request, ResolveCandidateProfile $resolveCandidateProfile): Response
    {
        $candidate = $resolveCandidateProfile->handle($request->user());

        return Inertia::render('candidate/ai-interviews/index', [
            'applications' => $candidate->applications()
                ->with(['jobListing:id,title,company_id', 'jobListing.company:id,name'])
                ->latest('applied_at')
                ->get(['id', 'job_listing_id', 'status', 'applied_at'])
                ->map(fn (Application $application): array => [
                    'id' => $application->id,
                    'job_title' => $application->jobListing?->title,
                    'company' => $application->jobListing?->company?->name,
                    'status' => $application->status,
                ]),
            'sessions' => $candidate->aiInterviewSessions()
                ->with(['application.jobListing:id,title,company_id', 'application.jobListing.company:id,name'])
                ->latest()
                ->get()
                ->map(fn (AiInterviewSession $session): array => $this->sessionPayload($session)),
        ]);
    }

    public function store(Request $request, ResolveCandidateProfile $resolveCandidateProfile): RedirectResponse
    {
        $data = $request->validate([
            'application_id' => ['required', 'integer', 'exists:applications,id'],
        ]);

        $candidate = $resolveCandidateProfile->handle($request->user());
        $application = $candidate->applications()->whereKey($data['application_id'])->firstOrFail();

        $this->ensureQuestionsExist($application);

        $session = $candidate->aiInterviewSessions()->create([
            'application_id' => $application->id,
            'status' => 'in_progress',
            'started_at' => now(),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Sesi simulasi interview dimulai.']);

        return to_route('candidate.ai-interviews.show', $session);
    }

    public function show(Request $request, AiInterviewSession $aiInterviewSession, ResolveCandidateProfile $resolveCandidateProfile): Response
    {
        $candidate = $resolveCandidateProfile->handle($request->user());
        $this->ensureOwnsSession($aiInterviewSession, $candidate->id);

        $aiInterviewSession->load([
            'application.jobListing:id,title,company_id',
            'application.jobListing.company:id,name',
            'responses.question:id,question,category,order_number',
            'analysis',
        ]);

        $questions = AiInterviewQuestion::query()
            ->where('application_id', $aiInterviewSession->application_id)
            ->orderBy('order_number')
            ->get();

        $responses = $aiInterviewSession->responses->keyBy('question_id');

        return Inertia::render('candidate/ai-interviews/show', [
            'session' => [
                ...$this->sessionPayload($aiInterviewSession),
                'questions' => $questions->map(fn (AiInterviewQuestion $question): array => [
                    'id' => $question->id,
                    'question' => $question->question,
                    'category' => $question->category,
                    'answer_text' => $responses->get($question->id)?->answer_text,
                    'ai_score' => $responses->get($question->id)?->ai_score,
                    'ai_analysis' => $responses->get($question->id)?->ai_analysis,
                ]),
                'analysis' => $aiInterviewSession->analysis ? [
                    'fit_score' => $aiInterviewSession->analysis->fit_score,
                    'recommendation' => $aiInterviewSession->analysis->recommendation,
                    'summary' => $aiInterviewSession->analysis->summary,
                ] : null,
            ],
        ]);
    }

    public function answer(Request $request, AiInterviewSession $aiInterviewSession, ResolveCandidateProfile $resolveCandidateProfile): RedirectResponse
    {
        $candidate = $resolveCandidateProfile->handle($request->user());
        $this->ensureOwnsSession($aiInterviewSession, $candidate->id);

        $data = $request->validate([
            'answers' => ['required', 'array'],
            'answers.*' => ['nullable', 'string', 'max:5000'],
        ]);

        foreach ($data['answers'] as $questionId => $answerText) {
            AiInterviewResponse::updateOrCreate(
                [
                    'session_id' => $aiInterviewSession->id,
                    'question_id' => (int) $questionId,
                ],
                [
                    'answer_text' => $answerText,
                    'ai_score' => filled($answerText) ? 75 : null,
                    'ai_analysis' => filled($answerText) ? 'Jawaban tersimpan untuk evaluasi lanjutan.' : null,
                ]
            );
        }

        $aiInterviewSession->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Jawaban simulasi interview berhasil disimpan.']);

        return back();
    }

    private function ensureQuestionsExist(Application $application): void
    {
        if ($application->aiInterviewSessions()->where('status', 'in_progress')->exists()) {
            throw ValidationException::withMessages([
                'application_id' => 'Masih ada sesi simulasi aktif untuk lamaran ini.',
            ]);
        }

        if (AiInterviewQuestion::query()->where('application_id', $application->id)->exists()) {
            return;
        }

        collect([
            ['question' => 'Ceritakan pengalaman paling relevan untuk posisi ini.', 'category' => 'behavioral'],
            ['question' => 'Skill apa yang paling kuat kamu bawa untuk pekerjaan ini?', 'category' => 'technical'],
            ['question' => 'Apa yang ingin kamu capai dalam 90 hari pertama?', 'category' => 'motivation'],
        ])->each(fn (array $question, int $index) => AiInterviewQuestion::create([
            'application_id' => $application->id,
            'question' => $question['question'],
            'category' => $question['category'],
            'order_number' => $index + 1,
        ]));
    }

    private function sessionPayload(AiInterviewSession $session): array
    {
        return [
            'id' => $session->id,
            'application_id' => $session->application_id,
            'job_title' => $session->application?->jobListing?->title,
            'company' => $session->application?->jobListing?->company?->name,
            'status' => $session->status,
            'started_at' => $session->started_at?->format('d M Y H:i'),
            'completed_at' => $session->completed_at?->format('d M Y H:i'),
        ];
    }

    private function ensureOwnsSession(AiInterviewSession $session, int $candidateId): void
    {
        abort_unless($session->candidate_id === $candidateId, 404);
    }
}
