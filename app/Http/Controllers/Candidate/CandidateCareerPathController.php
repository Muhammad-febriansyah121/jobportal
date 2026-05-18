<?php

namespace App\Http\Controllers\Candidate;

use App\Actions\Candidate\BuildCandidateCvReview;
use App\Actions\Candidate\ResolveCandidateProfile;
use App\Ai\Agents\CareerPathPlanner;
use App\Http\Controllers\Controller;
use App\Http\Requests\Candidate\GenerateCandidateCareerPathRequest;
use App\Models\AiAuditLog;
use App\Models\AiCareerRecommendation;
use App\Models\CandidateProfile;
use App\Models\LearningPathStep;
use App\Services\AiService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use JsonException;
use Throwable;

class CandidateCareerPathController extends Controller
{
    public function __construct(private readonly AiService $ai) {}

    public function index(
        Request $request,
        ResolveCandidateProfile $resolveCandidateProfile,
        BuildCandidateCvReview $buildCandidateCvReview,
    ): Response {
        $candidate = $resolveCandidateProfile->handle($request->user());
        $candidate->loadMissing(['skills', 'experiences', 'preferredIndustry']);
        $cvReview = $buildCandidateCvReview->handle($candidate);

        $paths = AiCareerRecommendation::query()
            ->where('candidate_id', $candidate->id)
            ->with(['learningPathSteps' => fn ($query) => $query->orderBy('order_number')])
            ->orderByDesc('is_primary')
            ->orderByDesc('match_score')
            ->latest()
            ->get();

        $activePath = $paths->first();

        return Inertia::render('candidate/career-paths', [
            'profileSnapshot' => [
                'headline' => $candidate->headline,
                'preferred_role' => $candidate->preferred_role,
                'preferred_industry' => $candidate->preferredIndustry?->name,
                'years_total_experience' => $this->totalYearsOfExperience($candidate),
                'skill_count' => $candidate->skills->count(),
                'top_skills' => $candidate->skills->take(8)->map(fn ($skill) => [
                    'name' => $skill->name,
                    'proficiency' => $skill->pivot->proficiency,
                    'years_exp' => $skill->pivot->years_exp,
                ])->values(),
            ],
            'paths' => $paths->map(fn (AiCareerRecommendation $path) => $this->presentPath($path))->values(),
            'activePath' => $activePath ? $this->presentPath($activePath, withSteps: true) : null,
            'aiEnabled' => $this->ai->isConfigured(),
            'cvReview' => $cvReview,
        ]);
    }

    public function generate(
        GenerateCandidateCareerPathRequest $request,
        ResolveCandidateProfile $resolveCandidateProfile,
        BuildCandidateCvReview $buildCandidateCvReview,
    ): RedirectResponse {
        @set_time_limit(0);

        $candidate = $resolveCandidateProfile->handle($request->user());
        $candidate->loadMissing(['skills', 'experiences', 'educations', 'preferredIndustry']);

        $payload = $request->validated();
        $cvReview = $buildCandidateCvReview->handle($candidate);
        $promptPayload = $this->buildPromptPayload($candidate, $payload);
        $promptPayload['cv_review'] = $cvReview;

        $output = $this->generateFromAi($request->user()->id, $promptPayload)
            ?? $this->fallbackPath($candidate, $payload);

        DB::transaction(function () use ($candidate, $output, $payload): void {
            AiCareerRecommendation::query()
                ->where('candidate_id', $candidate->id)
                ->update(['is_primary' => false]);

            $recommendation = AiCareerRecommendation::create([
                'candidate_id' => $candidate->id,
                'title' => $output['target_role'] ?? $payload['target_role'],
                'target_role' => $output['target_role'] ?? $payload['target_role'],
                'match_score' => isset($output['match_score']) ? (int) $output['match_score'] : null,
                'is_primary' => true,
                'recommendation_json' => $output,
            ]);

            $steps = is_array($output['learning_steps'] ?? null) ? $output['learning_steps'] : [];
            foreach ($steps as $index => $step) {
                if (! is_array($step)) {
                    continue;
                }

                $recommendation->learningPathSteps()->create([
                    'title' => (string) ($step['title'] ?? 'Langkah pembelajaran'),
                    'description' => isset($step['description']) ? (string) $step['description'] : null,
                    'order_number' => $index + 1,
                    'status' => 'not_started',
                ]);
            }
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Jalur karier baru berhasil dibuat.',
        ]);

        return back();
    }

    public function activate(
        Request $request,
        ResolveCandidateProfile $resolveCandidateProfile,
        AiCareerRecommendation $careerPath
    ): RedirectResponse {
        $candidate = $resolveCandidateProfile->handle($request->user());
        abort_unless($careerPath->candidate_id === $candidate->id, 403);

        DB::transaction(function () use ($candidate, $careerPath): void {
            AiCareerRecommendation::query()
                ->where('candidate_id', $candidate->id)
                ->update(['is_primary' => false]);

            $careerPath->forceFill(['is_primary' => true])->save();
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Jalur karier disetel sebagai aktif.',
        ]);

        return back();
    }

    public function destroy(
        Request $request,
        ResolveCandidateProfile $resolveCandidateProfile,
        AiCareerRecommendation $careerPath
    ): RedirectResponse {
        $candidate = $resolveCandidateProfile->handle($request->user());
        abort_unless($careerPath->candidate_id === $candidate->id, 403);

        $careerPath->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Jalur karier dihapus.',
        ]);

        return back();
    }

    public function toggleStep(
        Request $request,
        ResolveCandidateProfile $resolveCandidateProfile,
        LearningPathStep $step
    ): RedirectResponse {
        $candidate = $resolveCandidateProfile->handle($request->user());
        $step->loadMissing('careerRecommendation');
        abort_unless(
            $step->careerRecommendation && $step->careerRecommendation->candidate_id === $candidate->id,
            403
        );

        $step->forceFill([
            'status' => $step->status === 'completed' ? 'not_started' : 'completed',
        ])->save();

        return back();
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function buildPromptPayload(CandidateProfile $candidate, array $payload): array
    {
        return [
            'candidate' => [
                'name' => $candidate->full_name,
                'headline' => $candidate->headline,
                'bio' => $candidate->bio,
                'years_experience' => $this->totalYearsOfExperience($candidate),
                'preferred_role' => $candidate->preferred_role,
                'preferred_industry' => $candidate->preferredIndustry?->name,
                'skills' => $candidate->skills->map(fn ($skill) => [
                    'name' => $skill->name,
                    'proficiency' => $skill->pivot->proficiency,
                    'years_exp' => $skill->pivot->years_exp,
                ])->values(),
                'experiences' => $candidate->experiences->take(5)->map(fn ($exp) => [
                    'title' => $exp->job_title,
                    'company' => $exp->company_name,
                ])->values(),
            ],
            'request' => [
                'target_role' => $payload['target_role'],
                'focus' => $payload['focus'] ?? null,
                'notes' => $payload['notes'] ?? null,
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $promptPayload
     * @return array<string, mixed>|null
     */
    private function generateFromAi(int $userId, array $promptPayload): ?array
    {
        if (! $this->ai->isConfigured()) {
            return null;
        }

        try {
            $inputHash = hash('sha256', json_encode($promptPayload, JSON_THROW_ON_ERROR));
        } catch (JsonException) {
            return null;
        }

        $cached = AiAuditLog::query()
            ->where('user_id', $userId)
            ->where('feature', 'candidate_career_path')
            ->where('input_hash', $inputHash)
            ->where('status', 'success')
            ->latest()
            ->first();

        if (is_array($cached?->output_json)) {
            return $cached->output_json;
        }

        $modelName = (string) (config('services.openai.model') ?: 'gpt-5');
        $output = null;
        $usage = ['prompt_tokens' => null, 'completion_tokens' => null, 'reasoning_tokens' => null, 'total_tokens' => null];

        try {
            $response = (new CareerPathPlanner)->prompt(
                json_encode($promptPayload, JSON_THROW_ON_ERROR),
            );

            $structured = $response->toArray();
            if (is_array($structured)) {
                $output = $structured;
            }

            $promptTokens = $response->usage?->promptTokens;
            $completionTokens = $response->usage?->completionTokens;
            $reasoningTokens = $response->usage?->reasoningTokens;
            $usage = [
                'prompt_tokens' => $promptTokens,
                'completion_tokens' => $completionTokens,
                'reasoning_tokens' => $reasoningTokens,
                'total_tokens' => ($promptTokens ?? 0) + ($completionTokens ?? 0) + ($reasoningTokens ?? 0),
            ];
        } catch (Throwable) {
            // AI call failed; fall back to local recommendation downstream.
        }

        AiAuditLog::create([
            'user_id' => $userId,
            'feature' => 'candidate_career_path',
            'input_hash' => $inputHash,
            'input_json' => $promptPayload,
            'output_json' => $output,
            'model_name' => $modelName,
            'status' => is_array($output) ? 'success' : 'fallback',
            ...$usage,
        ]);

        return is_array($output) ? $output : null;
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function fallbackPath(CandidateProfile $candidate, array $payload): array
    {
        $targetRole = $payload['target_role'];
        $skills = $candidate->skills->pluck('name')->take(4)->values()->all();

        return [
            'target_role' => $targetRole,
            'match_score' => 60,
            'summary' => 'Jalur ini disusun otomatis berdasarkan profilmu. Tambahkan kunci API AI agar rekomendasi lebih presisi.',
            'growth_potential' => '+15% YoY',
            'salary_range' => 'IDR 12 jt - IDR 30 jt',
            'key_gap_insight' => 'Perdalam kompetensi inti yang dibutuhkan untuk peran '.$targetRole.'.',
            'skill_breakdown' => collect($skills)
                ->map(fn (string $skill) => [
                    'name' => $skill,
                    'current_level' => 60,
                    'required_level' => 85,
                    'note' => 'Tingkatkan eksposur proyek nyata yang berhubungan dengan '.$skill.'.',
                ])
                ->all(),
            'learning_steps' => [
                [
                    'title' => 'Pelajari fondasi peran '.$targetRole,
                    'description' => 'Ikuti satu kursus atau bootcamp dasar yang relevan dengan peran target.',
                    'tag' => 'Direkomendasikan AI',
                ],
                [
                    'title' => 'Bangun proyek studi kasus',
                    'description' => 'Buat 1-2 portofolio kasus nyata yang menonjolkan kemampuan inti.',
                    'tag' => 'Strategis',
                ],
                [
                    'title' => 'Cari mentor / komunitas',
                    'description' => 'Gabung komunitas profesional dan minta umpan balik berkala.',
                    'tag' => 'Dampak Tinggi',
                ],
            ],
            'milestones' => [
                ['title' => 'Selesaikan kursus dasar', 'timeframe' => '0-3 bulan'],
                ['title' => 'Publikasikan studi kasus', 'timeframe' => '3-6 bulan'],
                ['title' => 'Lamar peran target', 'timeframe' => '6-12 bulan'],
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function presentPath(AiCareerRecommendation $path, bool $withSteps = false): array
    {
        $data = is_array($path->recommendation_json) ? $path->recommendation_json : [];

        $payload = [
            'id' => $path->id,
            'title' => $path->title,
            'target_role' => $path->target_role ?? ($data['target_role'] ?? $path->title),
            'match_score' => $path->match_score,
            'is_primary' => $path->is_primary,
            'summary' => $data['summary'] ?? null,
            'growth_potential' => $data['growth_potential'] ?? null,
            'salary_range' => $data['salary_range'] ?? null,
            'key_gap_insight' => $data['key_gap_insight'] ?? null,
            'skill_breakdown' => is_array($data['skill_breakdown'] ?? null) ? $data['skill_breakdown'] : [],
            'learning_steps_data' => is_array($data['learning_steps'] ?? null) ? $data['learning_steps'] : [],
            'milestones' => is_array($data['milestones'] ?? null) ? $data['milestones'] : [],
            'created_at' => $path->created_at?->diffForHumans(),
        ];

        if ($withSteps) {
            $steps = $path->relationLoaded('learningPathSteps')
                ? $path->learningPathSteps
                : $path->learningPathSteps()->orderBy('order_number')->get();

            $payload['learning_path_steps'] = $this->presentSteps($steps);
        }

        return $payload;
    }

    /**
     * @param  Collection<int, LearningPathStep>  $steps
     * @return array<int, array<string, mixed>>
     */
    private function presentSteps(Collection $steps): array
    {
        $stepsData = $steps->sortBy('order_number')->values();
        $tags = [];

        return $stepsData->map(function (LearningPathStep $step) use (&$tags) {
            return [
                'id' => $step->id,
                'title' => $step->title,
                'description' => $step->description,
                'order_number' => $step->order_number,
                'status' => $step->status,
                'tag' => $tags[$step->id] ?? null,
            ];
        })->all();
    }

    private function totalYearsOfExperience(CandidateProfile $candidate): int
    {
        $candidate->loadMissing('experiences');

        return (int) $candidate->experiences->sum(function ($experience) {
            $start = $experience->start_date ?? null;
            $end = $experience->end_date ?? now();

            if (! $start) {
                return 0;
            }

            return max(0, (int) $start->diffInYears($end));
        });
    }
}
