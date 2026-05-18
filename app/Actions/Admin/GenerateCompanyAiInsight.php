<?php

namespace App\Actions\Admin;

use App\Ai\Agents\AdminCompanyInsightWriter;
use App\Models\AiAuditLog;
use App\Models\Application;
use App\Models\Company;
use App\Models\JobListing;
use App\Services\AiService;
use Illuminate\Support\Carbon;
use Throwable;

class GenerateCompanyAiInsight
{
    public function __construct(private readonly AiService $ai) {}

    public function handle(Company $company): ?AiAuditLog
    {
        $jobStats = $this->buildJobStats($company);
        $applicationStats = $this->buildApplicationStats($company);

        $companyName = $company->name;
        $activeStatus = $company->is_active ? 'aktif' : 'suspend';
        $verified = $company->is_verified ? 'ya' : 'belum';
        $responseRate = $company->response_rate ? $company->response_rate.'%' : 'tidak ada data';
        $medianResponse = $company->median_response_hours ? $company->median_response_hours.' jam' : 'tidak ada data';
        $trustScore = $company->trust_score ?? 'tidak ada data';
        $input = [
            'company' => [
                'id' => $company->id,
                'owner_id' => $company->owner_id,
                'name' => $company->name,
                'active_status' => $activeStatus,
                'verified' => $verified,
                'response_rate' => $responseRate,
                'median_response_time' => $medianResponse,
                'trust_score' => $trustScore,
            ],
            'job_stats' => $jobStats,
            'application_stats' => $applicationStats,
        ];

        $userPrompt = <<<PROMPT
Data perusahaan:
- Nama: {$companyName}
- Status aktif: {$activeStatus}
- Terverifikasi: {$verified}
- Response rate: {$responseRate}
- Median response time: {$medianResponse}
- Trust score: {$trustScore}

Statistik lowongan:
- Total lowongan pernah dibuat: {$jobStats['total']}
- Lowongan aktif/published saat ini: {$jobStats['active']}
- Lowongan dipublish 30 hari terakhir: {$jobStats['published_last_30_days']}
- Lowongan pernah di-suspend: {$jobStats['suspended']}

Statistik lamaran:
- Total lamaran masuk: {$applicationStats['total']}
- Lamaran sudah direspons (status berubah): {$applicationStats['responded']}
- Lamaran belum direspons (status pending): {$applicationStats['pending']}
- Rata-rata waktu respons pertama: {$applicationStats['avg_response_hours']}

Buat ringkasan singkat perilaku recruiter perusahaan ini untuk keperluan admin.
PROMPT;

        @set_time_limit(0);
        $result = null;

        if ($this->ai->isConfigured()) {
            try {
                $response = (new AdminCompanyInsightWriter)->prompt($userPrompt);
                $result = $response->text;
            } catch (Throwable) {
                $result = null;
            }
        }

        $inputHash = hash('sha256', json_encode($input, JSON_THROW_ON_ERROR));

        return AiAuditLog::create([
            'user_id' => $company->owner_id,
            'feature' => 'admin_company_insight',
            'input_hash' => $inputHash,
            'input_json' => $input,
            'output_json' => [
                'summary' => $result,
                'generated_at' => now()->toIso8601String(),
                'company_id' => $company->id,
            ],
            'model_name' => (string) (config('services.openai.model') ?: 'gpt-5'),
            'status' => $result ? 'success' : 'failed',
        ]);
    }

    /**
     * @return array<string, int>
     */
    private function buildJobStats(Company $company): array
    {
        $thirtyDaysAgo = Carbon::now()->subDays(30)->toDateTimeString();

        $total = JobListing::query()->whereBelongsTo($company)->count();
        $active = JobListing::query()->whereBelongsTo($company)->where('status', 'published')->count();
        $publishedLast30 = JobListing::query()
            ->whereBelongsTo($company)
            ->where('status', 'published')
            ->where('published_at', '>=', $thirtyDaysAgo)
            ->count();
        $suspended = JobListing::query()->whereBelongsTo($company)->where('status', 'suspended')->count();

        return [
            'total' => $total,
            'active' => $active,
            'published_last_30_days' => $publishedLast30,
            'suspended' => $suspended,
        ];
    }

    /**
     * @return array<string, int|string>
     */
    private function buildApplicationStats(Company $company): array
    {
        $jobIds = JobListing::query()
            ->whereBelongsTo($company)
            ->pluck('id');

        if ($jobIds->isEmpty()) {
            return [
                'total' => 0,
                'responded' => 0,
                'pending' => 0,
                'avg_response_hours' => 'tidak ada data',
            ];
        }

        $total = Application::query()->whereIn('job_listing_id', $jobIds)->count();
        $responded = Application::query()->whereIn('job_listing_id', $jobIds)->where('status', '!=', 'pending')->count();
        $pending = Application::query()->whereIn('job_listing_id', $jobIds)->where('status', 'pending')->count();

        $avgHoursRaw = Application::query()
            ->whereIn('job_listing_id', $jobIds)
            ->whereNotNull('first_responded_at')
            ->whereNotNull('applied_at')
            ->get(['applied_at', 'first_responded_at'])
            ->avg(fn (Application $app): float => $app->applied_at->diffInHours($app->first_responded_at));

        $avgHours = $avgHoursRaw !== null
            ? round((float) $avgHoursRaw, 1).' jam'
            : 'tidak ada data';

        return [
            'total' => $total,
            'responded' => $responded,
            'pending' => $pending,
            'avg_response_hours' => $avgHours,
        ];
    }
}
