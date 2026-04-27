<?php

namespace App\Actions\Candidate;

use App\Models\AiAuditLog;
use App\Models\CandidateProfile;
use App\Models\JobListing;
use App\Services\AiService;
use JsonException;

class GenerateJobAiInsight
{
    public function __construct(private readonly AiService $ai) {}

    /**
     * @return array{recruitment_stages: array<int, string>, application_tip: string}
     */
    public function handle(JobListing $job, CandidateProfile $candidate): array
    {
        $input = [
            'job' => [
                'title' => $job->title,
                'company' => $job->company?->name,
                'experience_level' => $job->experience_level,
                'job_type' => $job->job_type,
                'required_skills' => $job->skills->where('pivot.is_required', true)->pluck('name')->values()->all(),
                'has_screening_questions' => $job->screeningQuestions->isNotEmpty(),
            ],
            'candidate_skills' => $candidate->skills->pluck('name')->values()->all(),
        ];

        $inputHash = hash('sha256', json_encode($input, JSON_THROW_ON_ERROR));

        $cached = AiAuditLog::query()
            ->where('user_id', $candidate->user_id)
            ->where('feature', 'job_ai_insight')
            ->where('input_hash', $inputHash)
            ->where('status', 'success')
            ->latest()
            ->first();

        if ($cached !== null && is_array($cached->output_json)) {
            return $this->normalizeOutput($cached->output_json);
        }

        $fallback = $this->fallbackInsight($job);
        $result = $this->ai->chat([
            ['role' => 'system', 'content' => $this->systemPrompt()],
            ['role' => 'user', 'content' => json_encode($input, JSON_THROW_ON_ERROR)],
        ], maxTokens: 300, temperature: 0.4);

        $output = $result ? $this->decodeOutput($result, $fallback) : $fallback;
        $status = $result ? 'success' : 'fallback';

        AiAuditLog::create([
            'user_id' => $candidate->user_id,
            'feature' => 'job_ai_insight',
            'input_hash' => $inputHash,
            'input_json' => $input,
            'output_json' => $output,
            'model_name' => $this->ai->modelName(),
            'status' => $status,
        ]);

        return $this->normalizeOutput($output);
    }

    private function systemPrompt(): string
    {
        return <<<'PROMPT'
Kamu adalah AI career advisor Karivia untuk job portal Indonesia.
Balas hanya JSON valid tanpa markdown dengan schema:
{
  "recruitment_stages": ["Seleksi Berkas", "Technical Test", "Interview HR", "User Interview", "Offering"],
  "application_tip": "1-2 kalimat tip spesifik untuk kandidat ini berdasarkan skill dan kebutuhan pekerjaan"
}
Buat tahapan rekrutmen realistis (3-6 tahap) sesuai jenis dan level pekerjaan.
Gunakan bahasa Indonesia yang natural.
PROMPT;
    }

    /**
     * @return array{recruitment_stages: array<int, string>, application_tip: string}
     */
    private function fallbackInsight(JobListing $job): array
    {
        $stages = match ($job->experience_level) {
            'entry' => ['Seleksi Berkas', 'Interview HR', 'User Interview', 'Offering'],
            'senior', 'lead', 'manager' => ['Seleksi Berkas', 'Technical Assessment', 'Interview HR', 'User Interview', 'Final Review', 'Offering'],
            default => ['Seleksi Berkas', 'Technical Test', 'Interview HR', 'User Interview', 'Offering'],
        };

        return [
            'recruitment_stages' => $stages,
            'application_tip' => 'Lengkapi cover letter dengan pengalaman relevan dan pastikan CV kamu sudah terkini.',
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
            return $fallback;
        }

        if (! is_array($decoded)) {
            return $fallback;
        }

        return $this->normalizeOutput($decoded + $fallback);
    }

    /**
     * @param  array<string, mixed>  $output
     * @return array{recruitment_stages: array<int, string>, application_tip: string}
     */
    private function normalizeOutput(array $output): array
    {
        return [
            'recruitment_stages' => collect($output['recruitment_stages'] ?? [])->filter()->values()->all(),
            'application_tip' => (string) ($output['application_tip'] ?? ''),
        ];
    }
}
