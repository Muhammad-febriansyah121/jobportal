<?php

namespace App\Actions\Candidate;

use App\Models\AiAuditLog;
use App\Models\CandidateProfile;
use App\Services\AiService;
use Illuminate\Support\Collection;
use JsonException;

class GenerateDashboardAiInsight
{
    public function __construct(private readonly AiService $ai) {}

    /**
     * @param  Collection<int, array<string, mixed>>  $recommendedJobs
     * @param  Collection<int, array<string, mixed>>  $activeApplications
     * @param  Collection<int, array<string, mixed>>  $skills
     * @return array{summary: string, next_action: string, strengths: array<int, string>, gaps: array<int, string>, source: string, generated_at: string|null}
     */
    public function handle(
        CandidateProfile $candidate,
        Collection $recommendedJobs,
        Collection $activeApplications,
        Collection $skills
    ): array {
        $input = [
            'profile' => [
                'name' => $candidate->full_name,
                'headline' => $candidate->headline,
                'location' => collect([$candidate->location_city, $candidate->location_province])->filter()->implode(', '),
                'preferred_role' => $candidate->preferred_role,
                'profile_completion' => $candidate->profile_completion,
                'ai_cv_summary' => $candidate->ai_cv_summary,
            ],
            'skills' => $skills->pluck('name')->values()->all(),
            'recommended_jobs' => $recommendedJobs
                ->map(fn (array $job): array => [
                    'title' => $job['title'] ?? null,
                    'company' => $job['company'] ?? null,
                    'match_score' => $job['match_score'] ?? null,
                    'reason' => $job['match_reason'] ?? null,
                ])
                ->values()
                ->all(),
            'active_applications' => $activeApplications
                ->map(fn (array $application): array => [
                    'job_title' => $application['job_title'] ?? null,
                    'company' => $application['company'] ?? null,
                    'status' => $application['status_label'] ?? null,
                    'ai_fit_score' => $application['ai_fit_score'] ?? null,
                ])
                ->values()
                ->all(),
        ];
        $inputHash = hash('sha256', json_encode($input, JSON_THROW_ON_ERROR));

        $cached = AiAuditLog::query()
            ->where('user_id', $candidate->user_id)
            ->where('feature', 'candidate_dashboard_insight')
            ->where('input_hash', $inputHash)
            ->whereIn('status', ['success', 'fallback'])
            ->where('created_at', '>=', now()->subMinutes(15))
            ->latest()
            ->first();

        if ($cached !== null && is_array($cached->output_json)) {
            $source = $cached->status === 'success' ? 'ai' : 'fallback';

            return $this->normalizeOutput($cached->output_json + ['source' => $source]);
        }

        $fallback = $this->fallbackInsight($candidate, $recommendedJobs, $activeApplications, $skills);
        $result = $this->ai->chat([
            ['role' => 'system', 'content' => $this->systemPrompt()],
            ['role' => 'user', 'content' => json_encode($input, JSON_THROW_ON_ERROR)],
        ], maxTokens: 500, temperature: 0.4);

        $output = $result ? $this->decodeOutput($result, $fallback) : $fallback;
        $status = $result ? 'success' : 'fallback';

        AiAuditLog::create([
            'user_id' => $candidate->user_id,
            'feature' => 'candidate_dashboard_insight',
            'input_hash' => $inputHash,
            'input_json' => $input,
            'output_json' => $output,
            'model_name' => $this->ai->modelName(),
            'status' => $status,
            ...$this->ai->tokenUsage(),
        ]);

        return $this->normalizeOutput($output + ['source' => $status === 'success' ? 'ai' : 'computed']);
    }

    private function systemPrompt(): string
    {
        return <<<'PROMPT'
Kamu adalah AI career coach Karivia untuk kandidat job portal Indonesia.
Balas hanya JSON valid tanpa markdown dengan schema:
{
  "summary": "2 kalimat singkat tentang profil dan peluang kandidat",
  "next_action": "1 aksi paling penting yang sebaiknya dilakukan kandidat hari ini",
  "strengths": ["maksimal 3 kekuatan berbasis data"],
  "gaps": ["maksimal 3 hal yang perlu dilengkapi"]
}
Gunakan bahasa Indonesia yang natural. Jangan menambahkan fakta yang tidak ada di data.
PROMPT;
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $recommendedJobs
     * @param  Collection<int, array<string, mixed>>  $activeApplications
     * @param  Collection<int, array<string, mixed>>  $skills
     * @return array{summary: string, next_action: string, strengths: array<int, string>, gaps: array<int, string>, source: string, generated_at: string}
     */
    private function fallbackInsight(
        CandidateProfile $candidate,
        Collection $recommendedJobs,
        Collection $activeApplications,
        Collection $skills
    ): array {
        $topJob = $recommendedJobs->first();
        $verifiedSkills = $skills->where('verified', true)->count();
        $summary = $candidate->ai_cv_summary
            ?: sprintf(
                '%s punya %d skill tercatat dan %d lamaran aktif. Rekomendasi akan makin presisi setelah profil, CV, dan preferensi karier dilengkapi.',
                $candidate->full_name,
                $skills->count(),
                $activeApplications->count()
            );

        return [
            'summary' => $summary,
            'next_action' => $topJob
                ? 'Review '.$topJob['title'].' karena cocok dengan profil dan aktivitas terbaru kamu.'
                : 'Lengkapi profil dan tambahkan skill utama agar rekomendasi lowongan lebih tajam.',
            'strengths' => array_values(array_filter([
                $candidate->headline ? 'Headline profil sudah menjelaskan arah karier.' : null,
                $verifiedSkills > 0 ? $verifiedSkills.' skill sudah terverifikasi.' : null,
                $activeApplications->count() > 0 ? 'Progres lamaran aktif sudah berjalan.' : null,
            ])),
            'gaps' => array_values(array_filter([
                $candidate->profile_completion < 100 ? 'Kelengkapan profil masih '.$candidate->profile_completion.'%.' : null,
                $skills->isEmpty() ? 'Skill utama belum ditambahkan.' : null,
                $recommendedJobs->isEmpty() ? 'Belum ada rekomendasi lowongan yang kuat.' : null,
            ])),
            'source' => 'computed',
            'generated_at' => now()->toIso8601String(),
        ];
    }

    /**
     * @param  array<string, mixed>  $fallback
     * @return array<string, mixed>
     */
    private function decodeOutput(string $result, array $fallback): array
    {
        try {
            $decoded = json_decode($result, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            return $fallback + ['raw' => $result];
        }

        if (! is_array($decoded)) {
            return $fallback;
        }

        return $this->normalizeOutput($decoded + $fallback);
    }

    /**
     * @param  array<string, mixed>  $output
     * @return array{summary: string, next_action: string, strengths: array<int, string>, gaps: array<int, string>, source: string, generated_at: string|null}
     */
    private function normalizeOutput(array $output): array
    {
        return [
            'summary' => (string) ($output['summary'] ?? ''),
            'next_action' => (string) ($output['next_action'] ?? ''),
            'strengths' => collect($output['strengths'] ?? [])->filter()->take(3)->values()->all(),
            'gaps' => collect($output['gaps'] ?? [])->filter()->take(3)->values()->all(),
            'source' => (string) ($output['source'] ?? 'ai'),
            'generated_at' => $output['generated_at'] ?? now()->toIso8601String(),
        ];
    }
}
