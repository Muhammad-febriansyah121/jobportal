<?php

namespace App\Http\Controllers\Employer;

use App\Actions\Employer\AiInterviewQuotaTracker;
use App\Actions\Employer\ResolveEmployerCompany;
use App\Http\Controllers\Controller;
use App\Http\Requests\Employer\ApproveAiInterviewRescheduleRequest;
use App\Http\Requests\Employer\BulkScheduleAiInterviewRequest;
use App\Http\Requests\Employer\RejectAiInterviewRescheduleRequest;
use App\Http\Requests\Employer\ScheduleAiInterviewRequest;
use App\Models\AiInterviewAnalysis;
use App\Models\AiInterviewQuestion;
use App\Models\AiInterviewRescheduleHistory;
use App\Models\AiInterviewResponse;
use App\Models\AiInterviewSession;
use App\Models\Application;
use App\Models\Company;
use App\Models\EmployerTalentCandidate;
use App\Models\JobListing;
use App\Models\User;
use App\Services\UserNotificationService;
use App\Support\SimplePdfDocument;
use Carbon\CarbonInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class EmployerAiInterviewController extends Controller
{
    public function store(
        ScheduleAiInterviewRequest $request,
        JobListing $jobListing,
        ResolveEmployerCompany $resolveEmployerCompany,
        AiInterviewQuotaTracker $quotaTracker
    ): RedirectResponse {
        $company = $resolveEmployerCompany->handle($request->user());

        abort_unless($company !== null && $jobListing->company_id === $company->id, 404);

        if (! $quotaTracker->canSchedule($company, 1)) {
            $summary = $quotaTracker->summary($company);
            $limitText = $summary['limit'] === null ? 'tidak tersedia' : (string) $summary['limit'];
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => "Kuota AI Interview pada paket aktif sudah habis (terpakai {$summary['used']} dari {$limitText}). Upgrade paket untuk lanjut menjadwalkan interview.",
            ]);

            return back();
        }

        $data = $request->validated();
        $application = Application::query()
            ->whereBelongsTo($jobListing)
            ->whereKey($data['application_id'])
            ->firstOrFail();

        $session = DB::transaction(function () use ($application, $data): AiInterviewSession {
            $session = AiInterviewSession::create([
                'application_id' => $application->id,
                'candidate_id' => $application->candidate_id,
                'status' => 'scheduled',
            ]);

            $session->update([
                'status' => 'scheduled',
                'interview_mode' => $data['interview_mode'],
                'scheduled_at' => $data['scheduled_at'],
                'duration_minutes' => $data['duration_minutes'],
                'meeting_url' => $data['meeting_url'] ?? null,
                'voice' => $data['voice'] ?? 'marin',
            ]);

            $session->questions()->delete();

            collect($data['questions'])->values()->each(function (array $question, int $index) use ($application, $session): void {
                $createdQuestion = AiInterviewQuestion::create([
                    'application_id' => $application->id,
                    'session_id' => $session->id,
                    'question' => $question['question'],
                    'category' => $question['category'] ?? 'technical',
                    'rubric' => $question['rubric'] ?? null,
                    'weight' => $question['weight'],
                    'allow_ai_followup' => (bool) ($question['allow_ai_followup'] ?? false),
                    'order_number' => $index + 1,
                ]);

                AiInterviewResponse::firstOrCreate([
                    'session_id' => $session->id,
                    'question_id' => $createdQuestion->id,
                ]);
            });

            $application->update([
                'status' => 'interview',
                'first_responded_at' => $application->first_responded_at ?? now(),
            ]);

            return $session;
        });

        $this->notifyCandidate(
            $application,
            'ai_interview_scheduled',
            'Undangan AI interview',
            'Kamu mendapat jadwal AI interview baru. Silakan cek detail jadwal dan konfirmasi kehadiran.',
            [
                'ai_interview_session_id' => $session->id,
                'scheduled_at' => $session->scheduled_at?->toIso8601String(),
                'interview_mode' => $session->interview_mode,
                'company_name' => $company->name,
            ],
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Interview AI berhasil dijadwalkan.']);

        return back();
    }

    public function storeBulk(
        BulkScheduleAiInterviewRequest $request,
        JobListing $jobListing,
        ResolveEmployerCompany $resolveEmployerCompany,
        AiInterviewQuotaTracker $quotaTracker
    ): RedirectResponse {
        $company = $resolveEmployerCompany->handle($request->user());

        abort_unless($company !== null && $jobListing->company_id === $company->id, 404);

        $data = $request->validated();

        $applications = Application::query()
            ->whereBelongsTo($jobListing)
            ->whereIn('id', $data['application_ids'])
            ->get();

        if ($applications->count() !== count($data['application_ids'])) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Beberapa kandidat tidak ditemukan pada lowongan ini.',
            ]);

            return back();
        }

        if (! $quotaTracker->canSchedule($company, $applications->count())) {
            $summary = $quotaTracker->summary($company);
            $remainingText = $summary['remaining'] ?? 0;
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => "Kuota AI Interview tidak cukup. Tersisa {$remainingText} dari {$summary['limit']}, dibutuhkan {$applications->count()}.",
            ]);

            return back();
        }

        $created = 0;
        $skipped = 0;

        $createdSessions = DB::transaction(function () use ($applications, $data, &$created, &$skipped): array {
            $sessions = [];

            foreach ($applications as $application) {
                $hasActive = AiInterviewSession::query()
                    ->where('application_id', $application->id)
                    ->whereIn('status', ['pending', 'scheduled', 'in_progress'])
                    ->exists();

                if ($hasActive) {
                    $skipped++;

                    continue;
                }

                $session = AiInterviewSession::create([
                    'application_id' => $application->id,
                    'candidate_id' => $application->candidate_id,
                    'status' => 'scheduled',
                    'interview_mode' => $data['interview_mode'],
                    'scheduled_at' => $data['scheduled_at'],
                    'duration_minutes' => $data['duration_minutes'],
                    'meeting_url' => $data['meeting_url'] ?? null,
                    'voice' => $data['voice'] ?? 'marin',
                ]);

                collect($data['questions'])->values()->each(function (array $question, int $index) use ($application, $session): void {
                    $createdQuestion = AiInterviewQuestion::create([
                        'application_id' => $application->id,
                        'session_id' => $session->id,
                        'question' => $question['question'],
                        'category' => $question['category'] ?? 'technical',
                        'rubric' => $question['rubric'] ?? null,
                        'weight' => $question['weight'],
                        'allow_ai_followup' => (bool) ($question['allow_ai_followup'] ?? false),
                        'order_number' => $index + 1,
                    ]);

                    AiInterviewResponse::firstOrCreate([
                        'session_id' => $session->id,
                        'question_id' => $createdQuestion->id,
                    ]);
                });

                $application->update([
                    'status' => 'interview',
                    'first_responded_at' => $application->first_responded_at ?? now(),
                ]);

                $sessions[] = ['application' => $application, 'session' => $session];
                $created++;
            }

            return $sessions;
        });

        foreach ($createdSessions as $entry) {
            $this->notifyCandidate(
                $entry['application'],
                'ai_interview_scheduled',
                'Undangan AI interview',
                'Kamu mendapat jadwal AI interview baru. Silakan cek detail jadwal dan konfirmasi kehadiran.',
                [
                    'ai_interview_session_id' => $entry['session']->id,
                    'scheduled_at' => $entry['session']->scheduled_at?->toIso8601String(),
                    'interview_mode' => $entry['session']->interview_mode,
                    'company_name' => $company->name,
                ],
            );
        }

        $message = "Berhasil mengundang {$created} kandidat untuk AI interview.";

        if ($skipped > 0) {
            $message .= " {$skipped} kandidat dilewati karena sudah memiliki jadwal aktif.";
        }

        Inertia::flash('toast', [
            'type' => $created > 0 ? 'success' : 'error',
            'message' => $message,
        ]);

        return back();
    }

    public function show(
        Request $request,
        AiInterviewSession $aiInterviewSession,
        ResolveEmployerCompany $resolveEmployerCompany
    ): Response {
        $company = $resolveEmployerCompany->handle($request->user());

        abort_if($company === null, 404);

        $aiInterviewSession->load([
            'application.jobListing.company',
            'application.candidate.user',
            'responses.question',
            'analysis',
            'rescheduleHistories.actor:id,name',
            'manualReviews.reviewer:id,name',
        ]);

        abort_unless($aiInterviewSession->application?->jobListing?->company_id === $company->id, 404);

        return Inertia::render('employer/ai-interviews/show', [
            'session' => $this->sessionPayload($aiInterviewSession),
            'manual_reviews' => $this->manualReviewsPayload($aiInterviewSession, $request->user()->id),
        ]);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function manualReviewsPayload(AiInterviewSession $session, int $currentUserId): array
    {
        return $session->manualReviews
            ->sortByDesc('updated_at')
            ->values()
            ->map(fn ($review) => [
                'id' => $review->id,
                'rating' => $review->rating,
                'decision' => $review->decision,
                'notes' => $review->notes,
                'reviewer_id' => $review->reviewer_id,
                'reviewer_name' => $review->reviewer?->name ?? '—',
                'is_mine' => $review->reviewer_id === $currentUserId,
                'created_at' => $review->created_at?->format('d M Y H:i'),
                'updated_at' => $review->updated_at?->format('d M Y H:i'),
            ])
            ->all();
    }

    public function compare(
        Request $request,
        JobListing $jobListing,
        ResolveEmployerCompany $resolveEmployerCompany
    ): Response {
        $company = $resolveEmployerCompany->handle($request->user());

        abort_unless($company !== null && $jobListing->company_id === $company->id, 404);

        $applications = Application::query()
            ->whereBelongsTo($jobListing)
            ->with([
                'candidate.user:id,name,email',
                'aiInterviewSessions' => fn ($query) => $query
                    ->with(['analysis', 'responses.question'])
                    ->latest(),
            ])
            ->latest('applied_at')
            ->get()
            ->map(function (Application $application): array {
                $session = $application->aiInterviewSessions->first();
                $analysis = $session?->analysis;

                return [
                    'id' => $application->id,
                    'session_id' => $session?->id,
                    'candidate_name' => $application->candidate?->full_name ?? $application->candidate?->user?->name ?? 'Kandidat',
                    'headline' => $application->candidate?->headline,
                    'email' => $application->candidate?->user?->email,
                    'status' => $application->status,
                    'status_label' => $this->applicationStatusLabel($application->status),
                    'fit_score' => $analysis?->fit_score ?? $application->ai_fit_score,
                    'recommendation' => $analysis?->recommendation,
                    'summary' => $analysis?->summary,
                    'interview_mode' => $session?->interview_mode,
                    'interview_status' => $session?->status,
                    'completed_at' => $session?->completed_at?->format('d M Y H:i'),
                    'completed_at_iso' => $session?->completed_at?->toIso8601String(),
                    'applied_at' => $application->applied_at?->format('d M Y'),
                    'scorecard' => $analysis?->technical_scorecard ?? [],
                    'strengths' => $analysis?->strengths ?? [],
                    'weaknesses' => $analysis?->weaknesses ?? [],
                ];
            })
            ->values();

        return Inertia::render('employer/ai-interviews/compare', [
            'job' => [
                'id' => $jobListing->id,
                'title' => $jobListing->title,
            ],
            'candidates' => $applications,
        ]);
    }

    public function review(
        Request $request,
        AiInterviewSession $aiInterviewSession,
        ResolveEmployerCompany $resolveEmployerCompany
    ): Response {
        $company = $this->authorizedCompany($request, $aiInterviewSession, $resolveEmployerCompany);

        $aiInterviewSession->loadMissing([
            'application.jobListing.company',
            'application.candidate.user',
            'responses.question',
            'analysis',
        ]);

        return Inertia::render('employer/ai-interviews/review', [
            'company' => [
                'id' => $company->id,
                'name' => $company->name,
            ],
            'session' => $this->reviewSessionPayload($aiInterviewSession),
        ]);
    }

    /**
     * Extended session payload for the deep review screen with computed metrics.
     *
     * @return array<string, mixed>
     */
    private function reviewSessionPayload(AiInterviewSession $session): array
    {
        $payload = $this->sessionPayload($session);

        $responses = $session->responses->sortBy(
            fn (AiInterviewResponse $response): int => (int) ($response->question?->order_number ?? 999),
        )->values();

        $totalQuestions = $responses->count();
        $enriched = $responses->map(function (AiInterviewResponse $response, int $index): array {
            $answer = (string) $response->answer_text;
            $words = $answer === '' ? 0 : count(preg_split('/\s+/u', trim($answer)) ?: []);

            return [
                'id' => $response->id,
                'order' => $index + 1,
                'question' => $response->question?->question,
                'category' => $response->question?->category,
                'rubric' => $response->question?->rubric,
                'weight' => $response->question?->weight,
                'answer_text' => $response->answer_text,
                'ai_score' => $response->ai_score,
                'ai_analysis' => $response->ai_analysis,
                'word_count' => $words,
                'is_skipped' => $answer === '',
                'is_short' => $answer !== '' && $words < 25,
                'is_strong' => $words >= 80,
                'answered_at' => $response->updated_at?->format('H:i'),
            ];
        });

        $answered = $enriched->where('is_skipped', false);
        $totalWords = (int) $answered->sum('word_count');
        $avgWords = $answered->isNotEmpty() ? (int) round($totalWords / $answered->count()) : 0;
        $shortest = $answered->min('word_count') ?? 0;
        $longest = $answered->max('word_count') ?? 0;
        $scoredResponses = $enriched->whereNotNull('ai_score');
        $avgResponseScore = $scoredResponses->isNotEmpty()
            ? (int) round((float) $scoredResponses->avg('ai_score'))
            : null;

        $duration = null;
        if ($session->started_at && $session->completed_at) {
            $duration = $session->started_at->diffInSeconds($session->completed_at);
        }

        $categoryGroup = $enriched->groupBy(fn (array $item): string => (string) ($item['category'] ?: 'general'));
        $categoryScores = $categoryGroup
            ->map(function (Collection $items, string $category): array {
                $answered = $items->filter(fn (array $item): bool => $item['is_skipped'] === false);
                $scored = $answered->filter(fn (array $item): bool => $item['ai_score'] !== null);
                $avg = $scored->isNotEmpty()
                    ? (int) round((float) $scored->avg('ai_score'))
                    : null;
                $status = $avg === null
                    ? 'pending'
                    : ($avg >= 80 ? 'good' : ($avg >= 60 ? 'medium' : 'low'));

                return [
                    'category' => $category,
                    'label' => $this->categoryLabel($category),
                    'total' => $items->count(),
                    'answered' => $answered->count(),
                    'avg_score' => $avg,
                    'status' => $status,
                ];
            })
            ->values();

        $flags = [];
        $skippedCount = $enriched->where('is_skipped', true)->count();
        if ($skippedCount > 0) {
            $flags[] = "Kandidat melewati {$skippedCount} dari {$totalQuestions} pertanyaan.";
        }
        $shortAnsweredCount = $enriched->where('is_short', true)->count();
        if ($shortAnsweredCount > 0) {
            $flags[] = "{$shortAnsweredCount} jawaban berisi <25 kata, kemungkinan kurang detail.";
        }
        if ($avgResponseScore !== null && $avgResponseScore < 50 && $totalQuestions > 0) {
            $flags[] = 'Rata-rata skor jawaban di bawah 50 — periksa kualitas konten.';
        }
        if ($avgWords < 30 && $answered->isNotEmpty()) {
            $flags[] = 'Rata-rata panjang jawaban pendek — kandidat cenderung tidak elaboratif.';
        }
        if ($duration !== null && $session->duration_minutes && $duration < ($session->duration_minutes * 60 * 0.4)) {
            $flags[] = 'Sesi selesai jauh lebih cepat dari alokasi waktu.';
        }

        $highlights = [];
        if ($answered->isNotEmpty() && $skippedCount === 0) {
            $highlights[] = 'Menjawab semua pertanyaan tanpa skip.';
        }
        $strongCount = $enriched->where('is_strong', true)->count();
        if ($strongCount > 0) {
            $highlights[] = "{$strongCount} jawaban panjang & elaboratif (≥80 kata).";
        }
        if ($avgResponseScore !== null && $avgResponseScore >= 75) {
            $highlights[] = 'Rata-rata skor jawaban tinggi — konsisten kuat.';
        }

        $payload['responses'] = $enriched->all();
        $payload['metrics'] = [
            'total_questions' => $totalQuestions,
            'answered_count' => $answered->count(),
            'skipped_count' => $skippedCount,
            'response_rate' => $totalQuestions > 0
                ? (int) round(($answered->count() / $totalQuestions) * 100)
                : 0,
            'total_words' => $totalWords,
            'avg_words' => $avgWords,
            'shortest_words' => $shortest,
            'longest_words' => $longest,
            'avg_response_score' => $avgResponseScore,
            'duration_seconds' => $duration,
        ];
        $payload['category_scores'] = $categoryScores->all();
        $payload['flags'] = $flags;
        $payload['highlights'] = $highlights;

        return $payload;
    }

    private function categoryLabel(string $category): string
    {
        return match ($category) {
            'behavioral' => 'Behavioral',
            'technical' => 'Technical',
            'communication' => 'Communication',
            'motivation' => 'Motivation',
            'problem_solving' => 'Problem Solving',
            'case_study' => 'Case Study',
            'general' => 'General',
            default => Str::headline(str_replace('_', ' ', $category)),
        };
    }

    public function deleteRecording(
        Request $request,
        AiInterviewSession $aiInterviewSession,
        ResolveEmployerCompany $resolveEmployerCompany
    ): RedirectResponse {
        $this->authorizedCompany($request, $aiInterviewSession, $resolveEmployerCompany);

        $recordingUrl = (string) $aiInterviewSession->recording_url;

        if ($recordingUrl !== '' && str_starts_with($recordingUrl, '/storage/')) {
            $path = ltrim(substr($recordingUrl, strlen('/storage/')), '/');

            if ($path !== '' && Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
            }
        }

        $aiInterviewSession->update(['recording_url' => null]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Rekaman interview berhasil dihapus.',
        ]);

        return back();
    }

    public function downloadReportPdf(
        Request $request,
        AiInterviewSession $aiInterviewSession,
        ResolveEmployerCompany $resolveEmployerCompany
    ): HttpResponse {
        $this->authorizedCompany($request, $aiInterviewSession, $resolveEmployerCompany);

        $aiInterviewSession->loadMissing([
            'application.jobListing',
            'application.candidate.user',
            'responses.question',
            'analysis',
        ]);

        $application = $aiInterviewSession->application;
        $candidate = $application?->candidate;
        $analysis = $aiInterviewSession->analysis;
        $candidateName = $candidate?->full_name ?? $candidate?->user?->name ?? 'Kandidat';
        $jobTitle = $application?->jobListing?->title ?? 'Lowongan';
        $score = $analysis?->fit_score ?? $application?->ai_fit_score ?? 0;
        $pdf = new SimplePdfDocument(
            title: "AI Interview Report - {$candidateName}"
        );

        $pdf->addStyledHeader('AI Interview Report', $candidateName, $jobTitle);

        $interviewStatus = Str::title(str_replace('_', ' ', $aiInterviewSession->status));
        $applicationStatus = Str::title($application?->status ?? '-');
        $mode = $aiInterviewSession->interview_mode === 'text' ? 'Teks' : 'Voice AI';
        $jadwal = $aiInterviewSession->scheduled_at?->format('d M Y H:i') ?? '-';
        $completedAt = $aiInterviewSession->completed_at?->format('d M Y H:i') ?? '-';

        $pdf->addInfoStrip([
            ['Status Interview', $interviewStatus],
            ['Mode', $mode],
            ['Status Lamaran', $applicationStatus],
            ['Selesai', $completedAt],
        ]);

        $pdf->addSection('Ringkasan Eksekutif');
        $pdf->addScoreBanner($score, $analysis?->recommendation ?? 'Belum tersedia');
        $pdf->addParagraph($analysis?->summary ?? 'Analisis AI belum tersedia untuk sesi interview ini.');

        $this->addPdfList($pdf, 'Kekuatan Kandidat', $analysis?->strengths ?? []);
        $this->addPdfList($pdf, 'Area Pengembangan', $analysis?->weaknesses ?? []);

        $scorecard = $analysis?->technical_scorecard ?? [];
        if ($scorecard !== []) {
            $pdf->addSection('Technical Scorecard');
            foreach ($scorecard as $label => $value) {
                $pdf->addEntry(
                    Str::headline((string) $label),
                    ((int) $value).'/100',
                    false
                );
            }
        }

        $pdf->addSection('Pertanyaan dan Jawaban');
        $aiInterviewSession->responses
            ->sortBy(fn (AiInterviewResponse $response): int => (int) ($response->question?->order_number ?? 999))
            ->values()
            ->each(function (AiInterviewResponse $response, int $index) use ($pdf): void {
                $pdf->addResponseBlock(
                    index: $index + 1,
                    question: $response->question?->question ?? 'Pertanyaan tidak tersedia.',
                    category: $response->question?->category ?? '',
                    score: $response->ai_score,
                    answer: $response->answer_text ?: 'Belum ada jawaban.',
                    analysis: $response->ai_analysis,
                );
            });

        $filename = 'ai-interview-'.Str::slug($candidateName ?: 'kandidat').'.pdf';

        return response($pdf->binary(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Cache-Control' => 'no-store, no-cache, must-revalidate',
        ]);
    }

    public function shareReview(
        Request $request,
        AiInterviewSession $aiInterviewSession,
        ResolveEmployerCompany $resolveEmployerCompany
    ): RedirectResponse {
        $company = $this->authorizedCompany($request, $aiInterviewSession, $resolveEmployerCompany);

        $aiInterviewSession->loadMissing([
            'application.jobListing',
            'application.candidate.user',
        ]);

        $application = $aiInterviewSession->application;
        $candidateName = $application?->candidate?->full_name
            ?? $application?->candidate?->user?->name
            ?? 'Kandidat';
        $reviewUrl = route('employer.ai-interviews.review', $aiInterviewSession);
        $recipientIds = $company->members()
            ->where('is_active', true)
            ->pluck('user_id')
            ->push($company->owner_id)
            ->unique()
            ->reject(fn (int $userId): bool => $userId === $request->user()->id)
            ->values();

        $recipientIds->each(function (int $userId) use ($aiInterviewSession, $application, $candidateName, $reviewUrl): void {
            $recipient = User::query()->find($userId);

            if ($recipient === null) {
                return;
            }

            app(UserNotificationService::class)->sendToUser(
                $recipient,
                'ai_interview_review_shared',
                'Review kandidat siap dibuka',
                "Review AI Interview {$candidateName} sudah siap untuk hiring manager.",
                [
                    'ai_interview_session_id' => $aiInterviewSession->id,
                    'application_id' => $application?->id,
                    'job_listing_id' => $application?->job_listing_id,
                    'review_url' => $reviewUrl,
                ],
            );
        });

        $message = $recipientIds->isEmpty()
            ? 'Belum ada member lain di company. Link review tetap bisa disalin manual.'
            : 'Review kandidat berhasil dibagikan ke tim internal.';

        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return back();
    }

    public function advanceToUser(
        Request $request,
        AiInterviewSession $aiInterviewSession,
        ResolveEmployerCompany $resolveEmployerCompany
    ): RedirectResponse {
        $this->authorizedCompany($request, $aiInterviewSession, $resolveEmployerCompany);
        $application = $aiInterviewSession->application;

        abort_if($application === null, 404);

        $this->transitionApplication(
            application: $application,
            toStatus: 'offer',
            userId: $request->user()->id,
            note: 'Kandidat diloloskan ke tahap user setelah review interview AI.'
        );

        $this->notifyCandidate(
            $application,
            'application_advanced_after_ai_interview',
            'Kamu lanjut ke tahap berikutnya',
            'Hasil interview AI kamu sudah direview dan kamu dilanjutkan ke tahap berikutnya.'
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Kandidat berhasil diloloskan ke tahap user.']);

        return back();
    }

    public function saveToTalentPool(
        Request $request,
        AiInterviewSession $aiInterviewSession,
        ResolveEmployerCompany $resolveEmployerCompany
    ): RedirectResponse {
        $company = $this->authorizedCompany($request, $aiInterviewSession, $resolveEmployerCompany);
        $application = $aiInterviewSession->application;

        abort_if($application === null, 404);

        $record = EmployerTalentCandidate::query()->firstOrCreate([
            'company_id' => $company->id,
            'candidate_id' => $application->candidate_id,
        ]);

        $record->forceFill([
            'saved_at' => $record->saved_at ?? now(),
        ])->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Kandidat tersimpan di talent pool.']);

        return back();
    }

    public function reject(
        Request $request,
        AiInterviewSession $aiInterviewSession,
        ResolveEmployerCompany $resolveEmployerCompany
    ): RedirectResponse {
        $this->authorizedCompany($request, $aiInterviewSession, $resolveEmployerCompany);
        $application = $aiInterviewSession->application;

        abort_if($application === null, 404);

        $this->transitionApplication(
            application: $application,
            toStatus: 'rejected',
            userId: $request->user()->id,
            note: 'Kandidat ditolak setelah review interview AI.'
        );

        $this->notifyCandidate(
            $application,
            'application_rejected_after_ai_interview',
            'Update hasil interview',
            'Terima kasih sudah mengikuti interview. Perusahaan belum melanjutkan lamaranmu untuk posisi ini.'
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Kandidat berhasil ditolak.']);

        return back();
    }

    public function bulkAdvance(Request $request, ResolveEmployerCompany $resolveEmployerCompany): RedirectResponse
    {
        return $this->bulkDecision($request, $resolveEmployerCompany, 'advance');
    }

    public function bulkReject(Request $request, ResolveEmployerCompany $resolveEmployerCompany): RedirectResponse
    {
        return $this->bulkDecision($request, $resolveEmployerCompany, 'reject');
    }

    private function bulkDecision(Request $request, ResolveEmployerCompany $resolveEmployerCompany, string $action): RedirectResponse
    {
        $company = $resolveEmployerCompany->handle($request->user());

        abort_if($company === null, 404);

        $data = $request->validate([
            'session_ids' => ['required', 'array', 'min:1', 'max:50'],
            'session_ids.*' => ['integer', 'exists:ai_interview_sessions,id'],
        ]);

        $sessions = AiInterviewSession::query()
            ->with(['application.jobListing:id,company_id'])
            ->whereIn('id', $data['session_ids'])
            ->get()
            ->filter(fn (AiInterviewSession $session) => $session->application?->jobListing?->company_id === $company->id);

        if ($sessions->isEmpty()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Sesi tidak ditemukan.']);

            return back();
        }

        $processed = 0;

        foreach ($sessions as $session) {
            $application = $session->application;

            if ($application === null) {
                continue;
            }

            if ($action === 'advance') {
                $this->transitionApplication(
                    application: $application,
                    toStatus: 'offer',
                    userId: $request->user()->id,
                    note: 'Kandidat diloloskan ke tahap user setelah review interview AI.',
                );

                $this->notifyCandidate(
                    $application,
                    'application_advanced_after_ai_interview',
                    'Kamu lanjut ke tahap berikutnya',
                    'Hasil interview AI kamu sudah direview dan kamu dilanjutkan ke tahap berikutnya.',
                );
            } else {
                $this->transitionApplication(
                    application: $application,
                    toStatus: 'rejected',
                    userId: $request->user()->id,
                    note: 'Kandidat ditolak setelah review interview AI.',
                );

                $this->notifyCandidate(
                    $application,
                    'application_rejected_after_ai_interview',
                    'Update hasil interview',
                    'Terima kasih sudah mengikuti interview. Perusahaan belum melanjutkan lamaranmu untuk posisi ini.',
                );
            }

            $processed++;
        }

        $message = $action === 'advance'
            ? "{$processed} kandidat diloloskan ke tahap user."
            : "{$processed} kandidat ditolak.";

        Inertia::flash('toast', [
            'type' => $processed > 0 ? 'success' : 'error',
            'message' => $message,
        ]);

        return back();
    }

    public function approveReschedule(
        ApproveAiInterviewRescheduleRequest $request,
        AiInterviewSession $aiInterviewSession,
        ResolveEmployerCompany $resolveEmployerCompany
    ): RedirectResponse {
        $this->authorizedCompany($request, $aiInterviewSession, $resolveEmployerCompany);

        if (
            $aiInterviewSession->reschedule_requested_at === null
            || (($aiInterviewSession->reschedule_status ?? 'pending') !== 'pending')
        ) {
            abort(404);
        }

        $data = $request->validated();
        $approvedAt = isset($data['scheduled_at'])
            ? Carbon::parse($data['scheduled_at'])
            : $aiInterviewSession->reschedule_proposed_at;

        if ($approvedAt === null) {
            abort(404);
        }

        $aiInterviewSession->update([
            'scheduled_at' => $approvedAt,
            'status' => 'scheduled',
            'reschedule_status' => 'approved',
            'reschedule_reviewed_at' => now(),
            'reschedule_rejected_reason' => null,
            'candidate_confirmed_at' => null,
        ]);
        $this->recordRescheduleHistory(
            session: $aiInterviewSession,
            action: 'approved',
            actorUserId: $request->user()->id,
            scheduledAt: $approvedAt,
            reason: null
        );

        $this->notifyCandidate(
            $aiInterviewSession->application,
            'ai_interview_reschedule_approved',
            'Jadwal ulang interview disetujui',
            'Permintaan jadwal ulang interview AI kamu disetujui recruiter. Silakan konfirmasi ulang kehadiran.'
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Permintaan jadwal ulang disetujui.']);

        return back();
    }

    public function rejectReschedule(
        RejectAiInterviewRescheduleRequest $request,
        AiInterviewSession $aiInterviewSession,
        ResolveEmployerCompany $resolveEmployerCompany
    ): RedirectResponse {
        $this->authorizedCompany($request, $aiInterviewSession, $resolveEmployerCompany);

        if (
            $aiInterviewSession->reschedule_requested_at === null
            || (($aiInterviewSession->reschedule_status ?? 'pending') !== 'pending')
        ) {
            abort(404);
        }

        $data = $request->validated();

        $aiInterviewSession->update([
            'reschedule_status' => 'rejected',
            'reschedule_reviewed_at' => now(),
            'reschedule_rejected_reason' => $data['reason'],
        ]);
        $this->recordRescheduleHistory(
            session: $aiInterviewSession,
            action: 'rejected',
            actorUserId: $request->user()->id,
            scheduledAt: $aiInterviewSession->reschedule_proposed_at,
            reason: $data['reason']
        );

        $this->notifyCandidate(
            $aiInterviewSession->application,
            'ai_interview_reschedule_rejected',
            'Permintaan jadwal ulang belum disetujui',
            'Recruiter belum dapat menyetujui jadwal ulang interview AI kamu. Silakan cek detail undangan dan ajukan ulang jika diperlukan.'
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Permintaan jadwal ulang ditolak.']);

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function sessionPayload(AiInterviewSession $session): array
    {
        $application = $session->application;
        $candidate = $application?->candidate;
        $analysis = $session->analysis;

        return [
            'id' => $session->id,
            'status' => $session->status,
            'interview_mode' => $session->interview_mode ?? 'voice',
            'scheduled_at' => $session->scheduled_at?->format('d M Y H:i'),
            'duration_minutes' => $session->duration_minutes,
            'meeting_url' => $session->meeting_url,
            'voice' => $session->voice,
            'started_at' => $session->started_at?->format('d M Y H:i'),
            'completed_at' => $session->completed_at?->format('d M Y H:i'),
            'recording_url' => $session->recording_url,
            'interview_language' => $session->interview_language,
            'live_transcript' => $session->live_transcript,
            'job' => [
                'id' => $application?->jobListing?->id,
                'title' => $application?->jobListing?->title,
            ],
            'application' => [
                'id' => $application?->id,
                'status' => $application?->status,
            ],
            'candidate' => [
                'id' => $candidate?->id,
                'name' => $candidate?->full_name ?? $candidate?->user?->name ?? 'Kandidat',
                'headline' => $candidate?->headline,
                'email' => $candidate?->user?->email,
            ],
            'reschedule' => [
                'requested_at' => $session->reschedule_requested_at?->format('d M Y H:i'),
                'proposed_at' => $session->reschedule_proposed_at?->format('d M Y H:i'),
                'proposed_at_input' => $session->reschedule_proposed_at?->format('Y-m-d\TH:i'),
                'reason' => $session->reschedule_reason,
                'status' => $session->reschedule_status,
                'reviewed_at' => $session->reschedule_reviewed_at?->format('d M Y H:i'),
                'rejected_reason' => $session->reschedule_rejected_reason,
            ],
            'responses' => $session->responses
                ->sortBy(fn (AiInterviewResponse $response): int => (int) ($response->question?->order_number ?? 999))
                ->values()
                ->map(fn (AiInterviewResponse $response): array => [
                    'id' => $response->id,
                    'question' => $response->question?->question,
                    'category' => $response->question?->category,
                    'rubric' => $response->question?->rubric,
                    'weight' => $response->question?->weight,
                    'answer_text' => $response->answer_text,
                    'ai_score' => $response->ai_score,
                    'ai_analysis' => $response->ai_analysis,
                ])
                ->all(),
            'analysis' => $analysis instanceof AiInterviewAnalysis ? [
                'fit_score' => $analysis->fit_score,
                'recommendation' => $analysis->recommendation,
                'summary' => $analysis->summary,
                'strengths' => $analysis->strengths ?? [],
                'weaknesses' => $analysis->weaknesses ?? [],
                'technical_scorecard' => $analysis->technical_scorecard ?? [],
            ] : null,
            'reschedule_timeline' => $this->rescheduleTimeline($session),
        ];
    }

    private function authorizedCompany(
        Request $request,
        AiInterviewSession $session,
        ResolveEmployerCompany $resolveEmployerCompany
    ): Company {
        $company = $resolveEmployerCompany->handle($request->user());

        abort_if($company === null, 404);

        $session->loadMissing([
            'application.jobListing.company',
            'application.candidate.user',
        ]);

        abort_unless($session->application?->jobListing?->company_id === $company->id, 404);

        return $company;
    }

    private function transitionApplication(Application $application, string $toStatus, int $userId, string $note): void
    {
        if ($application->status === $toStatus) {
            return;
        }

        DB::transaction(function () use ($application, $toStatus, $userId, $note): void {
            $fromStatus = $application->status;

            $application->update([
                'status' => $toStatus,
                'first_responded_at' => $application->first_responded_at ?? now(),
            ]);

            $application->statusHistories()->create([
                'from_status' => $fromStatus,
                'to_status' => $toStatus,
                'changed_by' => $userId,
                'note' => $note,
            ]);
        });
    }

    /**
     * @param  array<string, mixed>  $extraData
     */
    private function notifyCandidate(
        Application $application,
        string $type,
        string $title,
        string $message,
        array $extraData = []
    ): void {
        $application->loadMissing(['candidate.user', 'jobListing:id,title']);
        $userId = $application->candidate?->user_id;

        if ($userId === null) {
            return;
        }

        $recipient = User::query()->find($userId);

        if ($recipient === null) {
            return;
        }

        app(UserNotificationService::class)->sendToUser(
            $recipient,
            $type,
            $title,
            $message,
            [
                'application_id' => $application->id,
                'job_listing_id' => $application->job_listing_id,
                'job_title' => $application->jobListing?->title,
                ...$extraData,
            ],
        );
    }

    /**
     * @param  array<int, string>  $items
     */
    private function addPdfList(SimplePdfDocument $pdf, string $title, array $items): void
    {
        $items = collect($items)
            ->filter(fn ($item): bool => is_string($item) && trim($item) !== '')
            ->values()
            ->all();

        if ($items === []) {
            return;
        }

        $pdf->addSection($title);
        $pdf->addBulletList($items);
    }

    /**
     * @return array<int, array<string, string|null>>
     */
    private function rescheduleTimeline(AiInterviewSession $session): array
    {
        if (! $session->relationLoaded('rescheduleHistories')) {
            return [];
        }

        return $session->rescheduleHistories
            ->sortBy('created_at')
            ->values()
            ->map(fn (AiInterviewRescheduleHistory $history): array => [
                'action' => $history->action,
                'actor_name' => $history->actor?->name,
                'scheduled_at' => $history->scheduled_at?->format('d M Y H:i'),
                'reason' => $history->reason,
                'created_at' => $history->created_at?->format('d M Y H:i'),
            ])
            ->all();
    }

    private function recordRescheduleHistory(
        AiInterviewSession $session,
        string $action,
        ?int $actorUserId,
        ?CarbonInterface $scheduledAt,
        ?string $reason
    ): void {
        $session->rescheduleHistories()->create([
            'actor_user_id' => $actorUserId,
            'action' => $action,
            'scheduled_at' => $scheduledAt,
            'reason' => $reason,
        ]);
    }

    private function applicationStatusLabel(string $status): string
    {
        return [
            'applied' => 'Terkirim',
            'screened' => 'Seleksi Awal',
            'shortlisted' => 'Terpilih',
            'interview' => 'Wawancara',
            'offer' => 'Penawaran',
            'hired' => 'Diterima',
            'rejected' => 'Ditolak',
            'withdrawn' => 'Ditarik',
        ][$status] ?? str($status)->headline()->toString();
    }
}
