<?php

namespace App\Actions\Employer;

use App\Models\AiAuditLog;
use App\Models\User;
use App\Services\AiService;
use Illuminate\Support\Collection;
use JsonException;

class GenerateTalentSearchRecommendations
{
    public function __construct(private readonly AiService $ai) {}

    /**
     * @param  array<string, mixed>  $filters
     * @param  Collection<int, array<string, mixed>>  $candidates
     * @return Collection<int, array<string, mixed>>
     */
    public function handle(User $user, array $filters, Collection $candidates): Collection
    {
        if ($candidates->isEmpty()) {
            return $candidates;
        }

        $input = [
            'filters' => $filters,
            'candidates' => $candidates
                ->map(fn (array $candidate): array => [
                    'id' => $candidate['id'],
                    'name' => $candidate['name'],
                    'headline' => $candidate['headline'],
                    'location' => $candidate['location'],
                    'salary_range' => $candidate['salary_range'],
                    'max_years_exp' => $candidate['max_years_exp'],
                    'availability' => $candidate['availability'],
                    'skills' => collect($candidate['skills'])->pluck('name')->values()->all(),
                    'base_score' => $candidate['match_score'],
                ])
                ->values()
                ->all(),
        ];
        $inputHash = hash('sha256', json_encode($input, JSON_THROW_ON_ERROR));

        $cached = AiAuditLog::query()
            ->where('user_id', $user->id)
            ->where('feature', 'employer_talent_search_rerank')
            ->where('input_hash', $inputHash)
            ->where('status', 'success')
            ->latest()
            ->first();

        if ($cached !== null && is_array($cached->output_json)) {
            return $this->applyRankings($candidates, $cached->output_json, 'ai');
        }

        $result = $this->ai->chat([
            ['role' => 'system', 'content' => $this->systemPrompt()],
            ['role' => 'user', 'content' => json_encode($input, JSON_THROW_ON_ERROR)],
        ], maxTokens: 700, temperature: 0.2);

        if (! $result) {
            $this->audit($user, $inputHash, $input, [
                'rankings' => [],
                'reason' => 'AI service unavailable; using computed scores.',
            ], 'fallback');

            return $candidates
                ->map(fn (array $candidate): array => $candidate + [
                    'match_source' => $candidate['match_source'] ?? 'computed',
                    'match_reason' => $candidate['match_reason'] ?? null,
                ])
                ->sortByDesc('match_score')
                ->values();
        }

        $output = $this->decodeOutput($result);
        $this->audit($user, $inputHash, $input, $output, $output['rankings'] === [] ? 'failed' : 'success');

        return $this->applyRankings($candidates, $output, $output['rankings'] === [] ? 'computed' : 'ai');
    }

    private function systemPrompt(): string
    {
        return <<<'PROMPT'
Kamu adalah AI talent search Karivia untuk recruiter.
Tugasmu memberi ranking kandidat berdasarkan filter pencarian, skill, lokasi, pengalaman, availability, salary range, dan base_score.
Balas hanya JSON valid tanpa markdown dengan schema:
{
  "rankings": [
    {"candidate_id": 1, "score": 95, "reason": "Alasan ringkas berbasis data"}
  ]
}
Score 0-100. Jangan menambahkan kandidat di luar data. Gunakan bahasa Indonesia natural untuk reason.
PROMPT;
    }

    /**
     * @return array{rankings: array<int, array{candidate_id: int, score: int, reason: string}>}
     */
    private function decodeOutput(string $result): array
    {
        try {
            $decoded = json_decode($result, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            return ['rankings' => []];
        }

        if (! is_array($decoded)) {
            return ['rankings' => []];
        }

        $rankings = collect($decoded['rankings'] ?? [])
            ->filter(fn ($ranking): bool => is_array($ranking) && isset($ranking['candidate_id'], $ranking['score']))
            ->map(fn (array $ranking): array => [
                'candidate_id' => (int) $ranking['candidate_id'],
                'score' => max(0, min(100, (int) $ranking['score'])),
                'reason' => (string) ($ranking['reason'] ?? ''),
            ])
            ->values()
            ->all();

        return ['rankings' => $rankings];
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $candidates
     * @param  array<string, mixed>  $output
     * @return Collection<int, array<string, mixed>>
     */
    private function applyRankings(Collection $candidates, array $output, string $source): Collection
    {
        $rankings = collect($output['rankings'] ?? [])->keyBy('candidate_id');

        return $candidates
            ->map(function (array $candidate) use ($rankings, $source): array {
                $ranking = $rankings->get($candidate['id']);

                if (is_array($ranking)) {
                    $candidate['match_score'] = (int) $ranking['score'];
                    $candidate['match_reason'] = $ranking['reason'] ?: null;
                    $candidate['match_source'] = $source;

                    return $candidate;
                }

                return $candidate + [
                    'match_source' => $candidate['match_source'] ?? 'computed',
                    'match_reason' => $candidate['match_reason'] ?? null,
                ];
            })
            ->sortByDesc('match_score')
            ->values();
    }

    /**
     * @param  array<string, mixed>  $input
     * @param  array<string, mixed>  $output
     */
    private function audit(User $user, string $inputHash, array $input, array $output, string $status): void
    {
        AiAuditLog::create([
            'user_id' => $user->id,
            'feature' => 'employer_talent_search_rerank',
            'input_hash' => $inputHash,
            'input_json' => $input,
            'output_json' => $output,
            'model_name' => $this->ai->modelName(),
            'status' => $status,
        ]);
    }
}
