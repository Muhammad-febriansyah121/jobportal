<?php

namespace App\Http\Controllers\Candidate;

use App\Actions\Candidate\ComputeRuleBasedFitScore;
use App\Actions\Candidate\ResolveCandidateProfile;
use App\Http\Controllers\Controller;
use App\Http\Requests\Candidate\ApplyJobRequest;
use App\Jobs\ComputeAiFitScoreJob;
use App\Jobs\ComputeCandidateIntentJob;
use App\Models\AiInterviewSession;
use App\Models\AiMatchScore;
use App\Models\Application;
use App\Models\ApplicationStatusHistory;
use App\Models\JobListing;
use App\Models\JobListingAnalytic;
use App\Models\User;
use App\Services\UserNotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CandidateApplicationController extends Controller
{
    public function index(Request $request, ResolveCandidateProfile $resolveCandidateProfile): Response
    {
        $candidate = $resolveCandidateProfile->handle($request->user());

        return Inertia::render('candidate/applications/index', [
            'filters' => [
                'status' => $request->string('status')->toString(),
            ],
            'applications' => $candidate->applications()
                ->select(['id', 'job_listing_id', 'scraped_job_id', 'status', 'email_status', 'ai_fit_score', 'applied_at', 'updated_at'])
                ->with(['jobListing:id,company_id,title,slug', 'jobListing.company:id,name', 'scrapedJob:id,title,company_name'])
                ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()))
                ->latest('applied_at')
                ->paginate(12)
                ->withQueryString()
                ->through(fn (Application $application): array => [
                    'id' => $application->id,
                    'job_title' => $application->jobListing?->title ?? $application->scrapedJob?->title,
                    'job_slug' => $application->jobListing?->slug,
                    'company' => $application->jobListing?->company?->name ?? $application->scrapedJob?->company_name,
                    'status' => $application->status,
                    'status_label' => $this->statusLabel($application->status),
                    'email_status' => $application->email_status,
                    'email_status_label' => $this->emailStatusLabel($application->email_status),
                    'ai_fit_score' => $application->ai_fit_score,
                    'applied_at' => $application->applied_at?->format('d M Y'),
                    'updated_at' => $application->updated_at?->diffForHumans(),
                ]),
        ]);
    }

    public function store(
        ApplyJobRequest $request,
        JobListing $jobListing,
        ResolveCandidateProfile $resolveCandidateProfile,
        ComputeRuleBasedFitScore $computeRuleBasedFitScore,
    ): RedirectResponse {
        abort_unless($jobListing->isOpen(), 404);

        $candidate = $resolveCandidateProfile->handle($request->user());
        $data = $request->validated();

        $request->user()->update(['phone' => $data['phone']]);

        if ($candidate->applications()->where('job_listing_id', $jobListing->id)->exists()) {
            throw ValidationException::withMessages([
                'job' => 'Kamu sudah melamar lowongan ini.',
            ]);
        }

        $cv = filled($data['candidate_cv_id'] ?? null)
            ? $candidate->cvs()->whereKey($data['candidate_cv_id'])->first()
            : $candidate->primaryCv;

        if ($cv === null) {
            throw ValidationException::withMessages([
                'candidate_cv_id' => 'Pilih CV sebelum mengirim lamaran.',
            ]);
        }

        $screeningAnswers = $data['screening_answers'] ?? [];
        $this->validateScreeningAnswers($jobListing, $screeningAnswers);

        // Cek pre-computed AI match score, fallback ke rule-based (instant)
        $preComputed = AiMatchScore::query()
            ->where('candidate_id', $candidate->id)
            ->where('job_listing_id', $jobListing->id)
            ->first();

        $ruleResult = $computeRuleBasedFitScore->handle($jobListing, $candidate);

        if ($preComputed?->overall_score) {
            $initialScore = (int) $preComputed->overall_score;
            $scoreResult = [
                'matched_skills' => $preComputed->matched_skills ?? [],
                'missing_skills' => $preComputed->missing_skills ?? [],
                'skill_score' => (int) $preComputed->skill_score ?: $ruleResult['skill_score'],
                'experience_score' => (int) $preComputed->experience_score ?: $ruleResult['experience_score'],
                'position_score' => $ruleResult['position_score'],
                'seniority_score' => $ruleResult['seniority_score'],
                'industry_score' => (int) $preComputed->industry_score ?: $ruleResult['industry_score'],
                'work_preference_score' => $ruleResult['work_preference_score'],
            ];
        } else {
            $scoreResult = $ruleResult;
            $initialScore = $scoreResult['fit_score'];
        }

        $application = $candidate->applications()->create([
            'job_listing_id' => $jobListing->id,
            'candidate_cv_id' => $cv->id,
            'status' => 'applied',
            'cover_letter' => $data['cover_letter'] ?? null,
            'screening_answers_json' => $screeningAnswers,
            'ai_fit_score' => $initialScore,
            'ai_skill_match' => [
                'matched_skills' => $scoreResult['matched_skills'],
                'missing_skills' => $scoreResult['missing_skills'],
                'skill_score' => $scoreResult['skill_score'],
                'experience_score' => $scoreResult['experience_score'],
                'position_score' => $scoreResult['position_score'],
                'seniority_score' => $scoreResult['seniority_score'],
                'industry_score' => $scoreResult['industry_score'],
                'work_preference_score' => $scoreResult['work_preference_score'],
            ],
            'applied_at' => now(),
        ]);

        $this->recordStatus($application, null, 'applied', $request->user()->id, 'Lamaran dikirim oleh kandidat.');
        $this->notifyEmployer($jobListing, $application);

        JobListingAnalytic::query()
            ->firstOrCreate(['job_listing_id' => $jobListing->id, 'date' => today()])
            ->increment('apply_clicks_count');

        ComputeCandidateIntentJob::dispatch($candidate);
        ComputeAiFitScoreJob::dispatch($application->id);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Lamaran berhasil dikirim.']);

        return to_route('candidate.applications.show', $application);
    }

    public function show(Request $request, Application $application, ResolveCandidateProfile $resolveCandidateProfile): Response
    {
        $candidate = $resolveCandidateProfile->handle($request->user());
        $this->ensureOwnsApplication($application, $candidate->id);

        $application->load([
            'cv:id,file_url',
            'jobListing:id,company_id,title,slug,description,work_mode,job_type,experience_level,salary_min,salary_max,is_salary_visible',
            'jobListing.company:id,name,is_verified',
            'scrapedJob',
            'statusHistories.changer:id,name',
            'interviews' => fn ($query) => $query->latest('scheduled_at'),
            'aiInterviewSessions' => fn ($query) => $query->latest('scheduled_at'),
        ]);

        $jobListing = $application->jobListing;
        $scrapedJob = $application->scrapedJob;

        return Inertia::render('candidate/applications/show', [
            'application' => [
                'id' => $application->id,
                'status' => $application->status,
                'status_label' => $this->statusLabel($application->status),
                'email_status' => $application->email_status,
                'email_status_label' => $this->emailStatusLabel($application->email_status),
                'email_sent_at' => $application->email_sent_at?->format('d M Y H:i'),
                'cover_letter' => $application->cover_letter,
                'screening_answers' => $application->screening_answers_json ?? [],
                'ai_fit_score' => $application->ai_fit_score,
                'applied_at' => $application->applied_at?->format('d M Y H:i'),
                'cv_url' => $application->cv?->file_url,
                'job' => $scrapedJob !== null
                    ? [
                        'id' => $scrapedJob->id,
                        'slug' => null,
                        'detail_url' => route('jobs.scraped.show', $scrapedJob),
                        'title' => $scrapedJob->title,
                        'company' => $scrapedJob->company_name,
                        'company_verified' => false,
                        'work_mode' => str($scrapedJob->workplace_type)->headline()->toString(),
                        'job_type' => str($scrapedJob->employment_type)->headline()->toString(),
                        'experience_level' => null,
                    ]
                    : [
                        'id' => $jobListing?->id,
                        'slug' => $jobListing?->slug,
                        'detail_url' => null,
                        'title' => $jobListing?->title,
                        'company' => $jobListing?->company?->name,
                        'company_verified' => (bool) $jobListing?->company?->is_verified,
                        'work_mode' => str($jobListing?->work_mode)->headline()->toString(),
                        'job_type' => str($jobListing?->job_type)->headline()->toString(),
                        'experience_level' => str($jobListing?->experience_level)->headline()->toString(),
                    ],
                'histories' => $application->statusHistories
                    ->map(fn (ApplicationStatusHistory $history): array => [
                        'id' => $history->id,
                        'from_status' => $history->from_status,
                        'to_status' => $history->to_status,
                        'to_status_label' => $this->statusLabel($history->to_status),
                        'changed_by' => $history->changer?->name,
                        'note' => $history->note,
                        'created_at' => $history->created_at?->format('d M Y H:i'),
                    ]),
                'interviews' => $application->interviews
                    ->map(fn ($interview): array => [
                        'id' => $interview->id,
                        'scheduled_at' => $interview->scheduled_at?->format('d M Y H:i'),
                        'mode' => $interview->mode,
                        'location_url' => $interview->location_url,
                        'status' => $interview->status,
                    ]),
                'ai_interviews' => $application->aiInterviewSessions
                    ->map(fn (AiInterviewSession $session): array => [
                        'id' => $session->id,
                        'status' => $session->status,
                        'interview_mode' => $session->interview_mode ?? 'voice',
                        'scheduled_at' => $session->scheduled_at?->format('d M Y H:i'),
                        'duration_minutes' => $session->duration_minutes,
                        'meeting_url' => $session->meeting_url,
                        'candidate_confirmed_at' => $session->candidate_confirmed_at?->format('d M Y H:i'),
                        'started_at' => $session->started_at?->format('d M Y H:i'),
                        'completed_at' => $session->completed_at?->format('d M Y H:i'),
                    ]),
            ],
        ]);
    }

    private function validateScreeningAnswers(JobListing $jobListing, array $screeningAnswers): void
    {
        $missingRequiredQuestion = $jobListing->screeningQuestions()
            ->where('is_required', true)
            ->get()
            ->first(fn ($question): bool => blank($screeningAnswers[$question->id] ?? null));

        if ($missingRequiredQuestion !== null) {
            throw ValidationException::withMessages([
                'screening_answers.'.$missingRequiredQuestion->id => 'Pertanyaan screening wajib dijawab.',
            ]);
        }
    }

    private function notifyEmployer(JobListing $jobListing, Application $application): void
    {
        $recipientId = $jobListing->company?->owner_id ?? $jobListing->created_by;
        $recipient = User::query()->find($recipientId);

        if ($recipient === null) {
            return;
        }

        app(UserNotificationService::class)->sendToUser(
            $recipient,
            'application_submitted',
            'Lamaran baru masuk',
            'Ada lamaran baru untuk '.$jobListing->title.'.',
            [
                'application_id' => $application->id,
                'job_listing_id' => $jobListing->id,
            ],
        );
    }

    private function recordStatus(Application $application, ?string $fromStatus, string $toStatus, int $userId, ?string $note = null): void
    {
        $application->statusHistories()->create([
            'from_status' => $fromStatus,
            'to_status' => $toStatus,
            'changed_by' => $userId,
            'note' => $note,
        ]);
    }

    private function ensureOwnsApplication(Application $application, int $candidateId): void
    {
        abort_unless($application->candidate_id === $candidateId, 404);
    }

    private function statusLabel(string $status): string
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

    private function emailStatusLabel(?string $status): ?string
    {
        return match ($status) {
            'queued' => 'Menunggu dikirim',
            'sending' => 'Sedang dikirim',
            'sent' => 'Email terkirim',
            'pending_smtp' => 'Menunggu konfigurasi SMTP',
            'failed' => 'Pengiriman gagal',
            default => null,
        };
    }
}
