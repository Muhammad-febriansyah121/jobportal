<?php

namespace App\Http\Controllers\Candidate;

use App\Actions\Candidate\CandidateWalletManager;
use App\Actions\Candidate\ResolveCandidateProfile;
use App\Ai\Agents\CvDrafter;
use App\Ai\Agents\CvReviewer;
use App\Http\Controllers\Controller;
use App\Http\Requests\Candidate\GenerateCandidateCvDraftRequest;
use App\Http\Requests\Candidate\ReviewCandidateCvRequest;
use App\Http\Requests\Candidate\SaveCandidateCvBuilderRequest;
use App\Http\Requests\Candidate\UploadCandidateCvRequest;
use App\Jobs\ParseUploadedCvJob;
use App\Models\AiAuditLog;
use App\Models\CandidateCv;
use App\Models\CandidateProfile;
use App\Services\AiService;
use App\Support\SimplePdfDocument;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use JsonException;
use Laravel\Ai\Responses\StreamedAgentResponse;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;
use Throwable;

class CandidateCvController extends Controller
{
    public function __construct(private readonly AiService $ai) {}

    public function index(
        Request $request,
        ResolveCandidateProfile $resolveCandidateProfile,
    ): Response {
        $candidate = $resolveCandidateProfile->handle($request->user());

        return Inertia::render('candidate/cvs/index', [
            'cvs' => $candidate->cvs()
                ->latest('is_primary')
                ->latest('uploaded_at')
                ->get()
                ->map(fn (CandidateCv $cv): array => [
                    'id' => $cv->id,
                    'file_url' => $cv->file_url,
                    'preview_url' => $this->resolveCvPreviewUrl($cv),
                    'source' => $cv->source,
                    'is_pdf' => $this->isPdfUrl($cv->file_url),
                    'is_primary' => $cv->is_primary,
                    'uploaded_at' => $cv->uploaded_at?->format('d M Y H:i'),
                ]),
        ]);
    }

    public function builder(
        Request $request,
        ResolveCandidateProfile $resolveCandidateProfile,
        CandidateWalletManager $walletManager
    ): Response {
        $candidate = $walletManager->ensureFreeQuota(
            $resolveCandidateProfile->handle($request->user())
        )
            ->load(['cvs', 'skills:id,name', 'experiences', 'educations', 'user:id,email']);

        return Inertia::render('candidate/cv', [
            'cvs' => $candidate->cvs()
                ->latest('is_primary')
                ->latest('uploaded_at')
                ->get()
                ->map(fn (CandidateCv $cv): array => [
                    'id' => $cv->id,
                    'file_url' => $cv->file_url,
                    'preview_url' => $this->resolveCvPreviewUrl($cv),
                    'source' => $cv->source,
                    'is_pdf' => $this->isPdfUrl($cv->file_url),
                    'is_primary' => $cv->is_primary,
                    'uploaded_at' => $cv->uploaded_at?->format('d M Y H:i'),
                ]),
            'aiSummary' => $candidate->ai_cv_summary,
            'profileCompletion' => $candidate->profile_completion,
            'builderData' => $this->mergeWithBuilderDefaults(
                is_array($candidate->cv_builder_json) ? $candidate->cv_builder_json : [],
                $candidate
            ),
            'builderUpdatedAt' => $candidate->cv_builder_updated_at?->format('d M Y H:i'),
            'aiEnabled' => $this->ai->isConfigured(),
            'wallet' => [
                'ai_token_balance' => (int) $candidate->ai_token_balance,
                'cv_builder_quota_balance' => (int) $candidate->cv_builder_quota_balance,
                'draft_token_cost' => CandidateWalletManager::CV_BUILDER_DRAFT_TOKEN_COST,
                'draft_quota_cost' => CandidateWalletManager::CV_BUILDER_DRAFT_QUOTA_COST,
                'has_free_draft_available' => $walletManager->canUseFreeBuilderDraft($candidate),
                'pricing_href' => route('candidate.pricing.index'),
            ],
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

        $cv = $candidate->cvs()->create([
            'file_url' => Storage::disk('public')->url($path),
            'source' => 'upload',
            'is_primary' => $isPrimary,
            'uploaded_at' => now(),
        ]);

        $resolveCandidateProfile->refreshCompletion($candidate);

        if ($this->ai->isConfigured()) {
            try {
                ParseUploadedCvJob::dispatchSync($cv, $candidate);
                $resolveCandidateProfile->refreshCompletion($candidate->refresh());

                Inertia::flash('toast', [
                    'type' => 'success',
                    'message' => 'CV berhasil diunggah. Data profil otomatis diisi dari hasil OCR CV.',
                ]);
            } catch (Throwable) {
                ParseUploadedCvJob::dispatch($cv, $candidate);
                Inertia::flash('toast', [
                    'type' => 'success',
                    'message' => 'CV berhasil diunggah. Data profil sedang dianalisis dari CV secara otomatis.',
                ]);
            }
        } else {
            Inertia::flash('toast', [
                'type' => 'warning',
                'message' => 'CV berhasil diunggah, namun auto-fill profil belum aktif karena API key OpenAI belum diisi admin.',
            ]);
        }

        return back();
    }

    public function saveBuilder(
        SaveCandidateCvBuilderRequest $request,
        ResolveCandidateProfile $resolveCandidateProfile
    ): RedirectResponse {
        $candidate = $resolveCandidateProfile->handle($request->user());
        $builderData = $this->mergeWithBuilderDefaults($request->validated(), $candidate);

        $candidate->forceFill([
            'cv_builder_json' => $builderData,
            'cv_builder_updated_at' => now(),
        ])->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'CV builder berhasil disimpan.']);

        return back();
    }

    public function generateAiDraft(
        GenerateCandidateCvDraftRequest $request,
        ResolveCandidateProfile $resolveCandidateProfile,
        CandidateWalletManager $walletManager
    ): RedirectResponse {
        $candidate = $walletManager->ensureFreeQuota(
            $resolveCandidateProfile->handle($request->user())
        );
        $canUseFreeDraft = $walletManager->canUseFreeBuilderDraft($candidate);
        $canUsePaidDraft = $walletManager->canUseBuilderDraft($candidate);

        if (! $canUseFreeDraft && ! $canUsePaidDraft) {
            Inertia::flash('toast', [
                'type' => 'warning',
                'message' => 'Jatah gratis sudah dipakai dan saldo CV Builder tidak cukup. Silakan topup paket kandidat.',
            ]);

            return redirect()->route('candidate.pricing.index');
        }

        if ($canUseFreeDraft) {
            $walletManager->consumeFreeBuilderDraft($candidate);
        } else {
            $walletManager->consumeBuilderDraftQuota($candidate);
        }
        $candidate->refresh();
        $payload = $request->validated();
        $fallback = $this->fallbackDraft($candidate, $payload);
        $output = null;

        $promptPayload = [
            'candidate' => [
                'name' => $candidate->full_name,
                'headline' => $candidate->headline,
                'city' => $candidate->location_city,
                'availability' => $candidate->availability,
                'summary' => $candidate->ai_cv_summary,
            ],
            'request' => $payload,
        ];

        $inputHash = hash('sha256', json_encode($promptPayload, JSON_THROW_ON_ERROR));
        $cached = AiAuditLog::query()
            ->where('user_id', $request->user()->id)
            ->where('feature', 'candidate_cv_builder_draft')
            ->where('input_hash', $inputHash)
            ->where('status', 'success')
            ->latest()
            ->first();

        if (is_array($cached?->output_json)) {
            $output = $cached->output_json;
        } else {
            @set_time_limit(0);

            try {
                $response = (new CvDrafter)->prompt(
                    json_encode($promptPayload, JSON_THROW_ON_ERROR),
                );
                $aiResponse = $response->text;

                if ($aiResponse !== null && $aiResponse !== '') {
                    $output = $this->decodeJsonObject($aiResponse);
                }
            } catch (Throwable) {
                $output = null;
            }
        }

        $builderData = $this->mergeWithBuilderDefaults(
            is_array($output) ? $output : $fallback,
            $candidate
        );

        $candidate->forceFill([
            'cv_builder_json' => $builderData,
            'cv_builder_updated_at' => now(),
        ])->save();

        AiAuditLog::create([
            'user_id' => $request->user()->id,
            'feature' => 'candidate_cv_builder_draft',
            'input_hash' => $inputHash,
            'input_json' => $promptPayload,
            'output_json' => $builderData,
            'model_name' => (string) (config('services.openai.model') ?: 'gpt-5'),
            'status' => is_array($output) ? 'success' : 'fallback',
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => is_array($output)
                ? 'Draft CV berhasil dibuat dengan AI.'
                : 'Draft CV dibuat dari data profil karena AI belum merespons.',
        ]);

        return back();
    }

    public function reviewBuilderStream(
        ReviewCandidateCvRequest $request,
        ResolveCandidateProfile $resolveCandidateProfile,
    ): SymfonyResponse {
        $candidate = $resolveCandidateProfile->handle($request->user());
        $builderData = $this->mergeWithBuilderDefaults($request->validated(), $candidate);
        $targetJob = $request->string('target_job')->toString();
        $payload = [
            'target_job' => $targetJob,
            'builder' => $builderData,
        ];

        @set_time_limit(120);

        $userId = $request->user()?->id;
        $inputHash = hash('sha256', json_encode($payload));
        $inputJson = ['target_job' => $targetJob, 'builder_keys' => array_keys($builderData)];

        try {
            $stream = (new CvReviewer)->stream(
                json_encode($payload, JSON_THROW_ON_ERROR),
            );
        } catch (Throwable $exception) {
            Log::warning('CvReviewer stream failed to start', [
                'user_id' => $userId,
                'message' => $exception->getMessage(),
            ]);

            AiAuditLog::create([
                'user_id' => $userId,
                'feature' => 'candidate.cv.reviewer_stream',
                'input_hash' => $inputHash,
                'input_json' => $inputJson,
                'output_json' => ['error' => $exception->getMessage()],
                'model_name' => 'gpt-5',
                'status' => 'failed',
            ]);

            return response()->json([
                'message' => 'AI tidak dapat memulai review. Coba lagi sebentar.',
            ], 502);
        }

        $stream->then(function (StreamedAgentResponse $response) use ($candidate, $builderData, $userId, $inputHash, $inputJson): void {
            $aiText = $response->text;

            if (! is_string($aiText) || trim($aiText) === '') {
                return;
            }

            $decoded = $this->decodeJsonObject($aiText);

            if (! is_array($decoded)) {
                Log::warning('CvReviewer stream produced invalid JSON', [
                    'user_id' => $candidate->user_id,
                    'preview' => mb_substr($aiText, 0, 200),
                ]);

                return;
            }

            $merged = $this->normalizeReviewData($decoded);

            if ($merged === null) {
                return;
            }

            $builderData['ai_review'] = $merged;
            $builderData = $this->mergeWithBuilderDefaults($builderData, $candidate);

            $candidate->forceFill([
                'cv_builder_json' => $builderData,
                'cv_builder_updated_at' => now(),
                'ai_cv_summary' => $merged['improved_summary'] ?: $merged['summary'],
            ])->save();

            $usage = property_exists($response, 'usage') ? $response->usage : null;
            AiAuditLog::create([
                'user_id' => $userId,
                'feature' => 'candidate.cv.reviewer_stream',
                'input_hash' => $inputHash,
                'input_json' => $inputJson,
                'output_json' => $merged,
                'model_name' => 'gpt-5',
                'prompt_tokens' => (int) ($usage?->inputTokens ?? 0),
                'completion_tokens' => (int) ($usage?->outputTokens ?? 0),
                'reasoning_tokens' => (int) ($usage?->reasoningTokens ?? 0),
                'total_tokens' => (int) (($usage?->inputTokens ?? 0) + ($usage?->outputTokens ?? 0)),
                'status' => 'success',
            ]);
        });

        $response = $stream->toResponse($request);
        $response->headers->set('X-Accel-Buffering', 'no');
        $response->headers->set('Cache-Control', 'no-cache, no-transform');
        $response->headers->set('Connection', 'keep-alive');

        return $response;
    }

    public function reviewBuilder(
        ReviewCandidateCvRequest $request,
        ResolveCandidateProfile $resolveCandidateProfile
    ): RedirectResponse {
        $candidate = $resolveCandidateProfile->handle($request->user());
        $builderData = $this->mergeWithBuilderDefaults($request->validated(), $candidate);
        $payload = [
            'target_job' => $request->string('target_job')->toString(),
            'builder' => $builderData,
        ];
        $fallback = $this->fallbackReview($builderData, $payload['target_job']);
        $reviewData = $fallback;
        $aiSucceeded = false;
        $userId = $request->user()?->id;
        $inputHash = hash('sha256', json_encode($payload));
        $inputJson = ['target_job' => $payload['target_job'], 'builder_keys' => array_keys($builderData)];
        $usage = null;

        @set_time_limit(120);
        try {
            $response = (new CvReviewer)->prompt(
                json_encode($payload, JSON_THROW_ON_ERROR),
            );
            $aiResult = $response->text;
            $usage = property_exists($response, 'usage') ? $response->usage : null;

            if ($aiResult !== null && $aiResult !== '') {
                $decoded = $this->decodeJsonObject($aiResult);

                if (is_array($decoded)) {
                    $merged = $this->normalizeReviewData($decoded);

                    if ($merged !== null) {
                        $reviewData = $merged;
                        $aiSucceeded = true;
                    }
                }
            }
        } catch (Throwable $exception) {
            Log::warning('CvReviewer failed', [
                'user_id' => $userId,
                'target_job' => $payload['target_job'] ?? null,
                'message' => $exception->getMessage(),
            ]);
        }

        AiAuditLog::create([
            'user_id' => $userId,
            'feature' => 'candidate.cv.reviewer',
            'input_hash' => $inputHash,
            'input_json' => $inputJson,
            'output_json' => $reviewData,
            'model_name' => 'gpt-5',
            'prompt_tokens' => (int) ($usage?->inputTokens ?? 0),
            'completion_tokens' => (int) ($usage?->outputTokens ?? 0),
            'reasoning_tokens' => (int) ($usage?->reasoningTokens ?? 0),
            'total_tokens' => (int) (($usage?->inputTokens ?? 0) + ($usage?->outputTokens ?? 0)),
            'status' => $aiSucceeded ? 'success' : 'fallback',
        ]);

        $builderData['ai_review'] = $reviewData;
        $builderData = $this->mergeWithBuilderDefaults($builderData, $candidate);

        $candidate->forceFill([
            'cv_builder_json' => $builderData,
            'cv_builder_updated_at' => now(),
            'ai_cv_summary' => $reviewData['improved_summary'] ?: $reviewData['summary'],
        ])->save();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $aiSucceeded
                ? 'Review CV dari AI berhasil diperbarui.'
                : 'Review CV memakai analisis fallback karena AI belum merespons.',
        ]);

        return back();
    }

    public function downloadBuilderPdf(
        Request $request,
        ResolveCandidateProfile $resolveCandidateProfile
    ): HttpResponse {
        $candidate = $resolveCandidateProfile->handle($request->user());
        $builderData = $this->mergeWithBuilderDefaults(
            is_array($candidate->cv_builder_json) ? $candidate->cv_builder_json : [],
            $candidate
        );

        $pdf = new SimplePdfDocument(
            title: (string) ($builderData['title'] ?? 'CV Kandidat')
        );
        $personal = is_array($builderData['personal'] ?? null) ? $builderData['personal'] : [];

        $fullName = (string) ($personal['full_name'] ?? $builderData['title'] ?? 'CV Kandidat');
        $headline = (string) ($personal['headline'] ?? '');
        $contactLine = collect([
            $personal['city'] ?? null,
            $personal['email'] ?? null,
            $personal['phone'] ?? null,
        ])->filter(fn ($value): bool => is_string($value) && $value !== '')->implode(' | ');
        $profileLinks = collect([
            $personal['linkedin'] ?? null,
            $personal['github'] ?? null,
            $personal['portfolio'] ?? null,
        ])->filter(fn ($value): bool => is_string($value) && $value !== '')->implode(' | ');

        $pdf->addTitle($fullName);
        $pdf->addMeta(collect([$headline, $contactLine])->filter()->implode(' | '));
        $pdf->addMeta($profileLinks);

        if (filled($builderData['summary'] ?? null)) {
            $pdf->addSection('Ringkasan Profil');
            $pdf->addParagraph((string) $builderData['summary']);
        }

        $skills = collect($builderData['skills'] ?? [])
            ->filter(fn ($skill): bool => is_string($skill) && $skill !== '')
            ->values()
            ->all();

        if ($skills !== []) {
            $pdf->addSection('Keahlian');
            $pdf->addBulletList($skills);
        }

        $experiences = collect($builderData['experiences'] ?? [])
            ->filter(fn ($item): bool => is_array($item))
            ->values();

        if ($experiences->isNotEmpty()) {
            $pdf->addSection('Pengalaman Kerja');
            foreach ($experiences as $experience) {
                $companyName = (string) ($experience['company_name'] ?? '');
                $jobTitle = (string) ($experience['job_title'] ?? '');
                $leftTitle = $companyName !== '' ? $companyName : $jobTitle;
                $rightMeta = collect([
                    $experience['location'] ?? null,
                    $this->formatPeriod(
                        (string) ($experience['start_date'] ?? ''),
                        (string) ($experience['end_date'] ?? 'Sekarang')
                    ),
                ])->filter()->implode(' | ');

                $pdf->addEntry($leftTitle, $rightMeta);

                if ($companyName !== '' && $jobTitle !== '') {
                    $pdf->addParagraph($jobTitle);
                }

                $bullets = $this->extractBullets((string) ($experience['description'] ?? ''));
                if ($bullets !== []) {
                    $pdf->addBulletList($bullets);
                }
            }
        }

        $educations = collect($builderData['educations'] ?? [])
            ->filter(fn ($item): bool => is_array($item))
            ->values();

        if ($educations->isNotEmpty()) {
            $pdf->addSection('Pendidikan');
            foreach ($educations as $education) {
                $leftTitle = (string) ($education['school_name'] ?? '');
                $rightMeta = $this->formatPeriod(
                    (string) ($education['start_year'] ?? ''),
                    (string) ($education['end_year'] ?? '')
                );

                $pdf->addEntry($leftTitle, $rightMeta);

                $educationDetail = collect([
                    $education['degree'] ?? null,
                    $education['field_of_study'] ?? null,
                ])->filter(fn ($value): bool => is_string($value) && $value !== '')->implode(' - ');

                if ($educationDetail !== '') {
                    $pdf->addParagraph($educationDetail);
                }

                if (filled($education['description'] ?? null)) {
                    $pdf->addBulletList($this->extractBullets((string) $education['description']));
                }
            }
        }

        $projects = collect($builderData['projects'] ?? [])
            ->filter(fn ($item): bool => is_array($item))
            ->values();

        if ($projects->isNotEmpty()) {
            $pdf->addSection('Proyek');
            foreach ($projects as $project) {
                $projectName = (string) ($project['name'] ?? '');
                $projectRole = (string) ($project['role'] ?? '');
                $leftTitle = $projectName !== '' ? $projectName : $projectRole;

                $pdf->addEntry($leftTitle, '', false);

                if ($projectName !== '' && $projectRole !== '') {
                    $pdf->addParagraph($projectRole);
                }

                if (filled($project['link'] ?? null)) {
                    $pdf->addParagraph((string) $project['link']);
                }

                if (filled($project['description'] ?? null)) {
                    $pdf->addBulletList($this->extractBullets((string) $project['description']));
                }
            }
        }

        $certifications = collect($builderData['certifications'] ?? [])
            ->filter(fn ($item): bool => is_array($item))
            ->values();

        if ($certifications->isNotEmpty()) {
            $pdf->addSection('Sertifikasi');
            foreach ($certifications as $certification) {
                $leftTitle = collect([
                    $certification['name'] ?? null,
                    $certification['issuer'] ?? null,
                ])->filter(fn ($value): bool => is_string($value) && $value !== '')->implode(' - ');

                $pdf->addEntry($leftTitle, (string) ($certification['year'] ?? ''), false);
            }
        }

        $binary = $pdf->binary();
        $filename = 'cv-'.Str::slug((string) ($personal['full_name'] ?? 'kandidat')).'.pdf';
        $disposition = $request->boolean('inline') ? 'inline' : 'attachment';

        return response($binary, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "{$disposition}; filename=\"{$filename}\"",
            'Cache-Control' => 'no-store, no-cache, must-revalidate',
        ]);
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

    private function resolveCvPreviewUrl(CandidateCv $candidateCv): string
    {
        if (! $this->isPdfUrl($candidateCv->file_url)) {
            return $candidateCv->file_url;
        }

        $storagePath = $this->extractPublicStoragePath($candidateCv->file_url);

        if ($storagePath === null || Storage::disk('public')->exists($storagePath)) {
            return $candidateCv->file_url;
        }

        return route('candidate.cvs.builder-pdf', ['inline' => 1]);
    }

    private function isPdfUrl(string $url): bool
    {
        $path = parse_url($url, PHP_URL_PATH);
        $target = is_string($path) && $path !== '' ? $path : $url;

        return str_ends_with(Str::lower($target), '.pdf');
    }

    private function extractPublicStoragePath(string $url): ?string
    {
        $path = parse_url($url, PHP_URL_PATH);
        $target = is_string($path) && $path !== '' ? $path : $url;

        if (! str_starts_with($target, '/storage/')) {
            return null;
        }

        return Str::of($target)->after('/storage/')->toString();
    }

    /**
     * @return array<int, string>
     */
    private function extractBullets(string $description): array
    {
        $cleaned = trim($description);
        if ($cleaned === '') {
            return [];
        }

        $lines = preg_split('/\r\n|\r|\n|•|- /', $cleaned) ?: [];

        $items = collect($lines)
            ->map(fn ($line): string => trim((string) $line))
            ->filter()
            ->values()
            ->all();

        return $items === [] ? [$cleaned] : $items;
    }

    private function formatPeriod(string $start, string $end): string
    {
        $start = trim($start);
        $end = trim($end);

        if ($start === '' && $end === '') {
            return '';
        }

        if ($start === '') {
            return $end;
        }

        if ($end === '') {
            return $start;
        }

        return $start.' - '.$end;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function mergeWithBuilderDefaults(array $data, CandidateProfile $candidate): array
    {
        $personal = is_array($data['personal'] ?? null) ? $data['personal'] : [];
        $skills = collect($data['skills'] ?? [])->filter()->values()->all();
        $experiences = $this->filterNestedEntries($data['experiences'] ?? [], ['job_title', 'company_name', 'description']);
        $educations = $this->filterNestedEntries($data['educations'] ?? [], ['school_name', 'degree', 'field_of_study']);
        $projects = $this->filterNestedEntries($data['projects'] ?? [], ['name', 'role', 'description']);
        $certifications = $this->filterNestedEntries($data['certifications'] ?? [], ['name', 'issuer', 'year']);

        // Auto-populate from profile when builder data is empty (first time open)
        if ($skills === [] && $candidate->relationLoaded('skills')) {
            $skills = $candidate->skills->pluck('name')->filter()->values()->all();
        }

        if ($experiences === [] && $candidate->relationLoaded('experiences')) {
            $experiences = $candidate->experiences
                ->map(fn ($exp): array => [
                    'job_title' => (string) ($exp->job_title ?? ''),
                    'company_name' => (string) ($exp->company_name ?? ''),
                    'start_date' => $exp->start_date?->format('M Y') ?? '',
                    'end_date' => $exp->is_current ? 'Sekarang' : ($exp->end_date?->format('M Y') ?? ''),
                    'is_current' => (bool) $exp->is_current,
                    'location' => (string) ($exp->location ?? ''),
                    'description' => (string) ($exp->description ?? ''),
                ])
                ->filter(fn (array $e): bool => $e['job_title'] !== '' || $e['company_name'] !== '')
                ->values()
                ->all();
        }

        if ($educations === [] && $candidate->relationLoaded('educations')) {
            $educations = $candidate->educations
                ->map(fn ($edu): array => [
                    'school_name' => (string) ($edu->institution ?? ''),
                    'degree' => (string) ($edu->degree ?? ''),
                    'field_of_study' => (string) ($edu->field_of_study ?? ''),
                    'start_year' => (string) ($edu->start_year ?? ''),
                    'end_year' => (string) ($edu->end_year ?? ''),
                    'gpa' => (string) ($edu->gpa ?? ''),
                ])
                ->filter(fn (array $e): bool => $e['school_name'] !== '')
                ->values()
                ->all();
        }

        // Fallback to primary CV parsed_json when profile relations also empty
        if (($skills === [] || $experiences === []) && $candidate->relationLoaded('cvs')) {
            $primaryCv = $candidate->cvs->firstWhere('is_primary', true) ?? $candidate->cvs->first();
            $parsed = is_array($primaryCv?->parsed_json) ? $primaryCv->parsed_json : [];

            if ($skills === [] && isset($parsed['skills']) && is_array($parsed['skills'])) {
                $skills = collect($parsed['skills'])->filter()->values()->all();
            }

            if ($experiences === [] && isset($parsed['experiences']) && is_array($parsed['experiences'])) {
                $experiences = collect($parsed['experiences'])
                    ->map(fn (array $exp): array => [
                        'job_title' => (string) ($exp['job_title'] ?? ''),
                        'company_name' => (string) ($exp['company_name'] ?? ''),
                        'start_date' => (string) ($exp['start_date'] ?? ''),
                        'end_date' => (string) ($exp['end_date'] ?? ''),
                        'is_current' => (bool) ($exp['is_current'] ?? false),
                        'location' => (string) ($exp['location'] ?? ''),
                        'description' => (string) ($exp['description'] ?? ''),
                    ])
                    ->filter(fn (array $e): bool => $e['company_name'] !== '')
                    ->values()
                    ->all();
            }

            if ($educations === [] && isset($parsed['educations']) && is_array($parsed['educations'])) {
                $educations = collect($parsed['educations'])
                    ->map(fn (array $edu): array => [
                        'school_name' => (string) ($edu['institution'] ?? ''),
                        'degree' => (string) ($edu['degree'] ?? ''),
                        'field_of_study' => (string) ($edu['field_of_study'] ?? ''),
                        'start_year' => (string) ($edu['start_year'] ?? ''),
                        'end_year' => (string) ($edu['end_year'] ?? ''),
                        'gpa' => (string) ($edu['gpa'] ?? ''),
                    ])
                    ->filter(fn (array $e): bool => $e['school_name'] !== '')
                    ->values()
                    ->all();
            }
        }

        return [
            'template' => 'ats',
            'title' => (string) ($data['title'] ?? ('CV '.$candidate->full_name)),
            'summary' => (string) ($data['summary'] ?? $candidate->ai_cv_summary ?? ''),
            'personal' => [
                'full_name' => (string) ($personal['full_name'] ?? $candidate->full_name ?? ''),
                'headline' => (string) ($personal['headline'] ?? $candidate->headline ?? ''),
                'email' => (string) ($personal['email'] ?? $candidate->user?->email ?? ''),
                'phone' => (string) ($personal['phone'] ?? ''),
                'city' => (string) ($personal['city'] ?? $candidate->location_city ?? ''),
                'linkedin' => (string) ($personal['linkedin'] ?? $candidate->linkedin_url ?? ''),
                'github' => (string) ($personal['github'] ?? $candidate->github_url ?? ''),
                'portfolio' => (string) ($personal['portfolio'] ?? $candidate->portfolio_url ?? ''),
            ],
            'skills' => $skills,
            'experiences' => $experiences,
            'educations' => $educations,
            'projects' => $projects,
            'certifications' => $certifications,
            'ai_review' => $this->normalizeReviewData($data['ai_review'] ?? null),
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function fallbackDraft(CandidateProfile $candidate, array $payload): array
    {
        $focusSkills = collect($payload['focus_skills'] ?? [])
            ->filter(fn ($skill): bool => is_string($skill) && $skill !== '')
            ->take(10)
            ->values()
            ->all();

        return [
            'template' => 'ats',
            'title' => 'CV '.$candidate->full_name,
            'summary' => collect([
                $candidate->headline ? $candidate->full_name.' adalah '.$candidate->headline.'.' : null,
                filled($payload['target_role'] ?? null) ? 'Berfokus pada peran '.(string) $payload['target_role'].'.' : null,
                filled($payload['achievements'] ?? null) ? (string) $payload['achievements'] : null,
            ])->filter()->implode(' '),
            'personal' => [
                'full_name' => (string) $candidate->full_name,
                'headline' => (string) ($candidate->headline ?? $payload['target_role']),
                'email' => (string) ($candidate->user?->email ?? ''),
                'phone' => '',
                'city' => (string) ($candidate->location_city ?? ''),
                'linkedin' => (string) ($candidate->linkedin_url ?? ''),
                'github' => (string) ($candidate->github_url ?? ''),
                'portfolio' => (string) ($candidate->portfolio_url ?? ''),
            ],
            'skills' => $focusSkills,
            'experiences' => [],
            'educations' => [],
            'projects' => [],
            'certifications' => [],
            'ai_review' => null,
        ];
    }

    /**
     * @param  array<string, mixed>  $builderData
     * @return array<string, mixed>
     */
    private function fallbackReview(array $builderData, string $targetJob): array
    {
        $personal = is_array($builderData['personal'] ?? null) ? $builderData['personal'] : [];
        $skills = collect($builderData['skills'] ?? [])->filter()->values()->all();
        $experiences = collect($builderData['experiences'] ?? [])
            ->filter(fn ($item): bool => is_array($item))
            ->all();
        $educations = collect($builderData['educations'] ?? [])
            ->filter(fn ($item): bool => is_array($item))
            ->all();
        $projects = collect($builderData['projects'] ?? [])
            ->filter(fn ($item): bool => is_array($item))
            ->all();
        $certifications = collect($builderData['certifications'] ?? [])
            ->filter(fn ($item): bool => is_array($item))
            ->all();
        $summary = (string) ($builderData['summary'] ?? '');

        $contactScore = collect([
            $personal['email'] ?? null,
            $personal['phone'] ?? null,
            $personal['city'] ?? null,
            $personal['linkedin'] ?? null,
        ])->filter(fn ($v): bool => is_string($v) && trim($v) !== '')->count() * 25;

        $summaryScore = mb_strlen($summary) >= 80 ? 80 : (mb_strlen($summary) >= 30 ? 55 : 20);
        if (filled($targetJob) && stripos($summary, $targetJob) !== false) {
            $summaryScore = min(100, $summaryScore + 15);
        }

        $experienceScore = count($experiences) === 0 ? 20 : min(100, 50 + count($experiences) * 12);
        $achievementHits = collect($experiences)->reduce(function (int $carry, array $item): int {
            $description = (string) ($item['description'] ?? '');
            if (preg_match('/\d+\s*(%|persen|jam|menit|orang|tim|user|customer|client|juta|ribu|m\b)/i', $description)) {
                return $carry + 1;
            }

            return $carry;
        }, 0);
        $achievementScore = count($experiences) === 0
            ? 15
            : min(100, 30 + ($achievementHits / max(1, count($experiences))) * 70);

        $educationScore = count($educations) > 0 ? 75 : 30;
        if (count($certifications) > 0) {
            $educationScore = min(100, $educationScore + 15);
        }

        $skillsScore = match (true) {
            count($skills) >= 8 => 90,
            count($skills) >= 5 => 70,
            count($skills) >= 1 => 50,
            default => 20,
        };

        $projectScore = count($projects) === 0 ? 30 : min(100, 50 + count($projects) * 15);

        $writingScore = 75;
        $totalDescriptionLength = collect($experiences)
            ->sum(fn (array $item) => mb_strlen((string) ($item['description'] ?? '')));
        if ($totalDescriptionLength < 200) {
            $writingScore = 50;
        }

        $keywordPool = $this->keywordPoolFor($targetJob);
        $haystack = strtolower(implode(' ', [
            $summary,
            implode(' ', $skills),
            collect($experiences)->map(fn (array $i) => (string) ($i['description'] ?? '').' '.(string) ($i['job_title'] ?? ''))->implode(' '),
            collect($projects)->map(fn (array $i) => (string) ($i['description'] ?? '').' '.(string) ($i['name'] ?? ''))->implode(' '),
        ]));
        $matched = collect($keywordPool)
            ->filter(fn (string $kw): bool => str_contains($haystack, strtolower($kw)))
            ->take(12)
            ->values()
            ->all();
        $missing = collect($keywordPool)
            ->reject(fn (string $kw): bool => str_contains($haystack, strtolower($kw)))
            ->take(12)
            ->values()
            ->all();
        $keywordScore = empty($keywordPool) ? 60 : (int) round((count($matched) / count($keywordPool)) * 100);

        $careerScore = filled($targetJob) ? 80 : 50;

        $sections = [
            [
                'id' => 'contact_information',
                'title' => 'Informasi Kontak',
                'score' => (int) $contactScore,
                'status' => $this->statusFromScore((int) $contactScore),
                'analysis' => $contactScore >= 75
                    ? 'Data kontak sudah lengkap dan mudah dihubungi.'
                    : 'Beberapa data kontak penting belum kamu isi sehingga rekruter sulit menghubungi.',
                'why_important' => 'Rekruter butuh akses cepat ke kontak dan profil profesionalmu sebelum lanjut interview.',
                'action_points' => array_values(array_filter([
                    filled($personal['email'] ?? null) ? null : 'Tambahkan email aktif yang profesional.',
                    filled($personal['phone'] ?? null) ? null : 'Tambahkan nomor HP/WhatsApp yang aktif.',
                    filled($personal['linkedin'] ?? null) ? null : 'Cantumkan tautan LinkedIn yang up-to-date.',
                    filled($personal['city'] ?? null) ? null : 'Tambahkan kota domisili supaya filter lokasi kerja gampang.',
                ])) ?: ['Pertahankan kelengkapan kontak yang sudah ada.'],
                'examples' => [],
            ],
            [
                'id' => 'professional_summary',
                'title' => 'Ringkasan Profil',
                'score' => (int) $summaryScore,
                'status' => $this->statusFromScore((int) $summaryScore),
                'analysis' => mb_strlen($summary) === 0
                    ? 'Belum ada ringkasan profil di awal CV.'
                    : (mb_strlen($summary) < 80
                        ? 'Ringkasan masih terlalu pendek untuk menggambarkan keahlianmu.'
                        : 'Ringkasan sudah cukup informatif, tinggal pertajam fokus dampak.'),
                'why_important' => 'Ringkasan adalah 6 detik pertama yang dibaca rekruter — menentukan apakah CV-mu lanjut dibaca.',
                'action_points' => [
                    'Sertakan peran target dan tahun pengalaman di kalimat pertama.',
                    'Tonjolkan 2-3 keahlian inti yang relevan dengan posisi.',
                    'Tutup dengan satu pencapaian yang terukur (angka/persentase).',
                ],
                'examples' => [
                    [
                        'before' => 'Saya seorang frontend developer yang suka belajar hal baru.',
                        'after' => filled($targetJob)
                            ? $targetJob.' dengan 3+ tahun pengalaman membangun web aplikasi React yang dipakai 50K+ user, fokus pada performa dan UX.'
                            : 'Frontend Engineer dengan 3+ tahun pengalaman membangun web aplikasi React yang dipakai 50K+ user, fokus pada performa dan UX.',
                    ],
                ],
            ],
            [
                'id' => 'work_experience',
                'title' => 'Pengalaman Kerja',
                'score' => (int) $experienceScore,
                'status' => $this->statusFromScore((int) $experienceScore),
                'analysis' => count($experiences) === 0
                    ? 'Belum ada pengalaman kerja yang dicantumkan.'
                    : 'Pengalaman kerja sudah ada, fokus berikutnya adalah memperkuat detail per role.',
                'why_important' => 'Rekruter mengevaluasi kemampuanmu lewat tanggung jawab dan dampak nyata di pekerjaan sebelumnya.',
                'action_points' => [
                    'Mulai bullet dengan kata kerja aksi (Membangun, Memimpin, Mengoptimasi).',
                    'Cantumkan periode kerja yang konsisten format-nya (mis. Jan 2023 — Sekarang).',
                    'Tulis 3-5 bullet per role, bukan paragraf panjang.',
                ],
                'examples' => [
                    [
                        'before' => 'Bertanggung jawab atas pengembangan fitur frontend.',
                        'after' => 'Membangun 12 fitur React di dashboard internal yang dipakai 200+ staff, mengurangi waktu input data 35%.',
                    ],
                ],
            ],
            [
                'id' => 'achievement',
                'title' => 'Dampak & Pencapaian',
                'score' => (int) $achievementScore,
                'status' => $this->statusFromScore((int) $achievementScore),
                'analysis' => $achievementHits === 0
                    ? 'Belum ada angka/dampak terukur di pengalaman kerja.'
                    : 'Sudah ada beberapa pencapaian terukur — perkuat lagi di role lainnya.',
                'why_important' => 'Pencapaian terukur (angka, persentase, skala) jadi pembeda CV-mu dari kandidat lain.',
                'action_points' => [
                    'Tambahkan minimal 1 angka di setiap pengalaman: jumlah user, % efisiensi, ukuran tim, dst.',
                    'Pakai pola: "Aksi → Hasil terukur → Konteks" (mis. menurunkan latency 40% di service utama).',
                    'Highlight pencapaian yang relevan dengan posisi yang dituju.',
                ],
                'examples' => [
                    [
                        'before' => 'Membantu meningkatkan performa aplikasi.',
                        'after' => 'Mengoptimasi rendering React lewat code-splitting dan lazy loading; LCP turun dari 4.2s ke 1.8s pada 80% halaman utama.',
                    ],
                ],
            ],
            [
                'id' => 'education_certification',
                'title' => 'Pendidikan & Sertifikasi',
                'score' => (int) $educationScore,
                'status' => $this->statusFromScore((int) $educationScore),
                'analysis' => count($educations) === 0
                    ? 'Belum ada data pendidikan.'
                    : (count($certifications) === 0
                        ? 'Pendidikan sudah ada, sertifikasi profesional bisa ditambahkan untuk nilai plus.'
                        : 'Pendidikan dan sertifikasi sudah seimbang.'),
                'why_important' => 'Banyak HR Indonesia masih memfilter awal berdasarkan jenjang pendidikan dan sertifikasi industri.',
                'action_points' => array_values(array_filter([
                    count($educations) === 0 ? 'Tambahkan minimal pendidikan terakhir.' : null,
                    'Cantumkan IPK kalau di atas 3.25.',
                    count($certifications) === 0 ? 'Tambahkan 1-2 sertifikasi yang relevan (mis. AWS, Google, Dicoding).' : null,
                ])) ?: ['Pertahankan kelengkapan section pendidikan.'],
                'examples' => [],
            ],
            [
                'id' => 'skills',
                'title' => 'Keahlian (Skills)',
                'score' => (int) $skillsScore,
                'status' => $this->statusFromScore((int) $skillsScore),
                'analysis' => count($skills) === 0
                    ? 'Belum ada skill yang dicantumkan.'
                    : (count($skills) < 5
                        ? 'Daftar skill masih sedikit, perlu ditambah dengan tool dan framework relevan.'
                        : 'Skill sudah cukup beragam.'),
                'why_important' => 'ATS umumnya mem-parsing skill sebagai kata kunci utama untuk matching dengan lowongan.',
                'action_points' => [
                    'Pisahkan skill teknis (tools/framework) dari soft skill.',
                    'Sebut skill dengan nama spesifik (React, bukan "frontend framework").',
                    'Hindari mencantumkan skill yang tidak relevan dengan posisi target.',
                ],
                'examples' => [],
            ],
            [
                'id' => 'projects_portfolio',
                'title' => 'Proyek & Portofolio',
                'score' => (int) $projectScore,
                'status' => $this->statusFromScore((int) $projectScore),
                'analysis' => count($projects) === 0
                    ? 'Belum ada proyek/portfolio yang ditampilkan.'
                    : 'Proyek sudah ada, perkuat dengan link demo dan deskripsi dampak.',
                'why_important' => 'Proyek nyata jadi bukti kemampuan terutama untuk fresh graduate atau switch career.',
                'action_points' => [
                    'Sertakan link live demo / repository GitHub.',
                    'Sebutkan tech stack yang dipakai di tiap project.',
                    'Tulis 1-2 kalimat tentang masalah yang dipecahkan dan hasilnya.',
                ],
                'examples' => [],
            ],
            [
                'id' => 'writing_quality',
                'title' => 'Konsistensi & Kualitas Tulisan',
                'score' => (int) $writingScore,
                'status' => $this->statusFromScore((int) $writingScore),
                'analysis' => $writingScore >= 70
                    ? 'Penulisan sudah cukup rapi.'
                    : 'Beberapa deskripsi terlalu pendek atau tidak konsisten.',
                'why_important' => 'Typo, format tidak konsisten, dan tense campur-campur menurunkan kesan profesional.',
                'action_points' => [
                    'Pakai tense konsisten: present untuk role saat ini, past untuk role sebelumnya.',
                    'Format bullet seragam (kapitalisasi, tanda baca akhir).',
                    'Cek typo dengan tool seperti Grammarly atau LanguageTool.',
                ],
                'examples' => [],
            ],
            [
                'id' => 'ats_keywords',
                'title' => 'Kata Kunci ATS',
                'score' => (int) $keywordScore,
                'status' => $this->statusFromScore((int) $keywordScore),
                'analysis' => empty($keywordPool)
                    ? 'Target role belum diisi sehingga sulit mencocokkan kata kunci.'
                    : ($keywordScore >= 70
                        ? 'Kata kunci CV sudah cukup match dengan profil target.'
                        : 'Banyak kata kunci penting yang belum muncul di CV.'),
                'why_important' => 'Sistem ATS otomatis filter CV berdasarkan kemunculan kata kunci dari job description.',
                'action_points' => empty($keywordPool)
                    ? ['Isi field "target_job" lalu jalankan review ulang untuk dapat saran kata kunci.']
                    : [
                        'Sisipkan kata kunci yang missing secara natural di summary, experience, atau skills.',
                        'Hindari keyword stuffing — pastikan tetap konteksnya relevan.',
                        'Sesuaikan kata kunci untuk setiap lowongan yang dilamar.',
                    ],
                'examples' => [],
            ],
            [
                'id' => 'career_recommendation',
                'title' => 'Rekomendasi Karir',
                'score' => (int) $careerScore,
                'status' => $this->statusFromScore((int) $careerScore),
                'analysis' => filled($targetJob)
                    ? 'Target karir sudah jelas, tinggal pertajam positioning di setiap section.'
                    : 'Target karir belum spesifik sehingga CV terkesan generik.',
                'why_important' => 'CV yang difokuskan pada satu peran spesifik 2x lebih efektif dibanding CV serbaguna.',
                'action_points' => [
                    'Tentukan 1 peran target utama dan sesuaikan headline + summary.',
                    'Pilih 1-2 industri prioritas (mis. fintech, e-commerce) untuk positioning lebih kuat.',
                    'Update CV per lamaran agar bullet experience selaras dengan job description.',
                ],
                'examples' => [],
            ],
        ];

        $overall = (int) round(collect($sections)->avg('score'));

        return [
            'score' => $overall,
            'label' => $this->labelFromScore($overall),
            'summary' => 'Struktur CV kamu sudah cukup rapi dan mudah dibaca. Supaya lebih kuat, perkuat dampak terukur dan kata kunci agar lolos filter ATS.',
            'improved_summary' => filled($targetJob)
                ? 'Profesional '.$targetJob.' dengan pengalaman membangun solusi yang berdampak nyata, fokus pada hasil terukur, kolaborasi tim, dan peningkatan performa produk.'
                : 'Profesional dengan pengalaman membangun solusi yang berdampak nyata, fokus pada hasil terukur, kolaborasi tim, dan peningkatan performa produk.',
            'sections' => $sections,
            'keyword_match' => [
                'score' => $keywordScore,
                'matched' => $matched,
                'missing' => $missing,
            ],
            'suggestions' => [
                'Tambahkan angka dampak di pengalaman kerja, misalnya: mempercepat proses 30%.',
                'Gunakan kata kerja aksi di awal kalimat, seperti: membangun, memimpin, mengoptimasi.',
                'Pastikan pengalaman terbaru diletakkan paling atas.',
                'Tampilkan project yang paling relevan dengan posisi target.',
                'Sesuaikan kata kunci skill dengan deskripsi lowongan.',
            ],
        ];
    }

    /**
     * @return array<int, string>
     */
    private function keywordPoolFor(string $targetJob): array
    {
        $job = strtolower(trim($targetJob));

        if ($job === '') {
            return [];
        }

        $generic = ['Komunikasi', 'Kolaborasi tim', 'Problem solving', 'Manajemen waktu', 'Inisiatif', 'Adaptasi'];

        $map = [
            'frontend' => ['React', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Tailwind', 'REST API', 'Git', 'Responsive design', 'Testing'],
            'backend' => ['Node.js', 'PHP', 'Laravel', 'REST API', 'Database', 'PostgreSQL', 'MySQL', 'Redis', 'Microservices', 'Git'],
            'fullstack' => ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'REST API', 'GraphQL', 'Docker', 'Git'],
            'mobile' => ['Flutter', 'React Native', 'Kotlin', 'Swift', 'Firebase', 'REST API', 'State management'],
            'data' => ['Python', 'SQL', 'Pandas', 'ETL', 'Tableau', 'Power BI', 'Statistics', 'A/B testing'],
            'devops' => ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Terraform', 'Linux', 'Monitoring'],
            'designer' => ['Figma', 'User research', 'Wireframing', 'Prototyping', 'Design system', 'Accessibility'],
            'product' => ['Roadmap', 'User research', 'A/B testing', 'OKR', 'Stakeholder management', 'Data analysis'],
            'marketing' => ['SEO', 'SEM', 'Google Analytics', 'Content strategy', 'Email marketing', 'Conversion'],
            'sales' => ['CRM', 'Lead generation', 'Negotiation', 'Pipeline management', 'B2B', 'Customer acquisition'],
            'hr' => ['Recruitment', 'Talent acquisition', 'Onboarding', 'Performance management', 'Compensation'],
        ];

        foreach ($map as $key => $keywords) {
            if (str_contains($job, $key)) {
                return array_merge($keywords, $generic);
            }
        }

        return $generic;
    }

    private function statusFromScore(int $score): string
    {
        if ($score >= 71) {
            return 'good';
        }

        if ($score >= 31) {
            return 'warning';
        }

        return 'missing';
    }

    private function labelFromScore(int $score): string
    {
        if ($score >= 80) {
            return 'Sudah kuat';
        }

        if ($score >= 60) {
            return 'Cukup baik';
        }

        return 'Perlu ditingkatkan';
    }

    /**
     * @param  array<int, mixed>|mixed  $entries
     * @param  array<int, string>  $keys
     * @return array<int, array<string, mixed>>
     */
    private function filterNestedEntries(mixed $entries, array $keys): array
    {
        if (! is_array($entries)) {
            return [];
        }

        return collect($entries)
            ->filter(fn ($entry): bool => is_array($entry))
            ->map(function (array $entry): array {
                return collect($entry)
                    ->map(fn ($value) => is_string($value) ? trim($value) : $value)
                    ->all();
            })
            ->filter(function (array $entry) use ($keys): bool {
                foreach ($keys as $key) {
                    if (filled($entry[$key] ?? null)) {
                        return true;
                    }
                }

                return false;
            })
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>|null
     */
    private function normalizeReviewData(mixed $reviewData): ?array
    {
        if (! is_array($reviewData)) {
            return null;
        }

        $score = min(100, max(0, (int) ($reviewData['score'] ?? 0)));
        $sections = collect($reviewData['sections'] ?? [])
            ->filter(fn ($section): bool => is_array($section))
            ->map(function (array $section): array {
                $sectionScore = min(100, max(0, (int) ($section['score'] ?? 0)));
                $status = (string) ($section['status'] ?? $this->statusFromScore($sectionScore));

                if (! in_array($status, ['good', 'warning', 'missing'], true)) {
                    $status = $this->statusFromScore($sectionScore);
                }

                return [
                    'id' => (string) ($section['id'] ?? ''),
                    'title' => (string) ($section['title'] ?? ''),
                    'score' => $sectionScore,
                    'status' => $status,
                    'analysis' => (string) ($section['analysis'] ?? ''),
                    'why_important' => (string) ($section['why_important'] ?? ''),
                    'action_points' => collect($section['action_points'] ?? [])
                        ->filter(fn ($item): bool => is_string($item) && $item !== '')
                        ->take(8)
                        ->values()
                        ->all(),
                    'examples' => collect($section['examples'] ?? [])
                        ->filter(fn ($item): bool => is_array($item))
                        ->map(fn (array $item): array => [
                            'before' => (string) ($item['before'] ?? ''),
                            'after' => (string) ($item['after'] ?? ''),
                        ])
                        ->filter(fn (array $item): bool => $item['before'] !== '' || $item['after'] !== '')
                        ->take(3)
                        ->values()
                        ->all(),
                ];
            })
            ->filter(fn (array $section): bool => $section['title'] !== '' || $section['analysis'] !== '')
            ->values()
            ->all();

        $keywordMatchRaw = is_array($reviewData['keyword_match'] ?? null)
            ? $reviewData['keyword_match']
            : null;
        $keywordMatch = $keywordMatchRaw === null ? null : [
            'score' => min(100, max(0, (int) ($keywordMatchRaw['score'] ?? 0))),
            'matched' => collect($keywordMatchRaw['matched'] ?? [])
                ->filter(fn ($v): bool => is_string($v) && $v !== '')
                ->take(20)
                ->values()
                ->all(),
            'missing' => collect($keywordMatchRaw['missing'] ?? [])
                ->filter(fn ($v): bool => is_string($v) && $v !== '')
                ->take(20)
                ->values()
                ->all(),
        ];

        return [
            'score' => $score,
            'label' => (string) ($reviewData['label'] ?? $this->labelFromScore($score)),
            'summary' => (string) ($reviewData['summary'] ?? ''),
            'improved_summary' => (string) ($reviewData['improved_summary'] ?? ''),
            'sections' => $sections,
            'keyword_match' => $keywordMatch,
            'suggestions' => collect($reviewData['suggestions'] ?? [])
                ->filter(fn ($item): bool => is_string($item) && $item !== '')
                ->take(8)
                ->values()
                ->all(),
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function decodeJsonObject(string $payload): ?array
    {
        $trimmed = trim($payload);

        $decode = function (string $value): ?array {
            try {
                $decoded = json_decode($value, true, 512, JSON_THROW_ON_ERROR);
            } catch (JsonException) {
                return null;
            }

            return is_array($decoded) ? $decoded : null;
        };

        $decoded = $decode($trimmed);
        if (is_array($decoded)) {
            return $decoded;
        }

        $start = strpos($trimmed, '{');
        $end = strrpos($trimmed, '}');

        if ($start === false || $end === false || $end <= $start) {
            return null;
        }

        return $decode(substr($trimmed, $start, $end - $start + 1));
    }
}
