<?php

namespace App\Jobs;

use App\Ai\Agents\CvUploadParser;
use App\Models\AiAuditLog;
use App\Models\CandidateCv;
use App\Models\CandidateProfile;
use App\Models\Skill;
use App\Services\AiService;
use App\Services\CvTextExtractorService;
use Carbon\Carbon;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class ParseUploadedCvJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 2;

    public int $timeout = 90;

    public function __construct(
        public readonly CandidateCv $cv,
        public readonly CandidateProfile $candidate,
    ) {}

    public function handle(AiService $ai, CvTextExtractorService $extractor): void
    {
        $storagePath = $this->resolveStoragePath($this->cv->file_url);

        if ($storagePath === null) {
            return;
        }

        $absolutePath = Storage::disk('public')->path($storagePath);

        if (! file_exists($absolutePath)) {
            return;
        }

        $mimeType = mime_content_type($absolutePath) ?: '';
        $cvText = $extractor->extractFromPath($absolutePath, $mimeType);

        if (trim($cvText) === '') {
            return;
        }

        if (! $ai->isConfigured()) {
            return;
        }

        $prompt = $this->buildPrompt($cvText);
        $parsed = null;

        try {
            $response = (new CvUploadParser)->prompt($prompt);
            if (isset($response->structured) && is_array($response->structured)) {
                $parsed = $response->structured;
            }
        } catch (Throwable) {
            return;
        }

        if (! is_array($parsed)) {
            return;
        }

        $this->cv->update(['parsed_json' => $parsed]);

        $this->fillProfile($parsed);
        $this->fillExperiences($parsed);
        $this->fillEducations($parsed);
        $this->fillSkills($parsed);

        AiAuditLog::create([
            'user_id' => $this->candidate->user_id,
            'feature' => 'cv_ocr_parse',
            'input_hash' => hash('sha256', $cvText),
            'input_json' => ['cv_text_preview' => mb_substr($cvText, 0, 200)],
            'output_json' => $parsed,
            'model_name' => (string) (config('services.openai.model') ?: 'gpt-5'),
            'status' => 'success',
        ]);
    }

    private function fillProfile(array $parsed): void
    {
        $this->candidate->refresh();
        $this->candidate->loadMissing('user');
        $updates = [];

        $stringFields = [
            'full_name' => 'full_name',
            'headline' => 'headline',
            'summary' => 'bio',
            'location_city' => 'location_city',
            'location_province' => 'location_province',
            'linkedin_url' => 'linkedin_url',
            'github_url' => 'github_url',
            'portfolio_url' => 'portfolio_url',
        ];

        foreach ($stringFields as $parsedKey => $profileField) {
            $value = trim((string) ($parsed[$parsedKey] ?? ''));

            $isDefaultFullName = $profileField === 'full_name'
                && filled($this->candidate->user?->name)
                && $this->candidate->user?->name === $this->candidate->$profileField;

            if ($value !== '' && (blank($this->candidate->$profileField) || $isDefaultFullName)) {
                $updates[$profileField] = $value;
            }
        }

        if ($updates !== []) {
            $this->candidate->update($updates);
        }

        $phone = $this->normalizePhone((string) ($parsed['phone'] ?? ''));
        $user = $this->candidate->user;

        if ($phone !== '' && $user !== null && blank($user->phone)) {
            $user->forceFill(['phone' => $phone])->save();
        }
    }

    private function normalizePhone(string $phone): string
    {
        $digits = preg_replace('/\D+/', '', $phone) ?? '';

        if ($digits === '') {
            return '';
        }

        if (str_starts_with($digits, '0')) {
            $digits = '62'.substr($digits, 1);
        }

        if (strlen($digits) < 8 || strlen($digits) > 16) {
            return '';
        }

        return $digits;
    }

    private function fillExperiences(array $parsed): void
    {
        $experiences = $parsed['experiences'] ?? [];

        if (! is_array($experiences) || $experiences === []) {
            return;
        }

        $existing = $this->candidate->experiences()
            ->get(['company_name', 'job_title', 'start_date'])
            ->map(fn ($exp): string => $this->experienceKey(
                (string) $exp->company_name,
                (string) $exp->job_title,
                $exp->start_date?->format('Y-m-d') ?? '',
            ))
            ->all();
        $existing = array_flip($existing);

        foreach ($experiences as $exp) {
            if (! is_array($exp)) {
                continue;
            }

            $companyName = trim((string) ($exp['company_name'] ?? ''));
            $jobTitle = trim((string) ($exp['job_title'] ?? ''));

            if ($companyName === '' && $jobTitle === '') {
                continue;
            }

            $startDate = $this->parseDate((string) ($exp['start_date'] ?? '')) ?? now()->subYear()->format('Y-m-d');
            $endDate = $this->parseDate((string) ($exp['end_date'] ?? ''));
            $isCurrent = filter_var($exp['is_current'] ?? false, FILTER_VALIDATE_BOOLEAN);
            $resolvedCompany = $companyName !== '' ? $companyName : 'Tidak diketahui';
            $resolvedTitle = $jobTitle !== '' ? $jobTitle : 'Tidak diketahui';
            $key = $this->experienceKey($resolvedCompany, $resolvedTitle, $startDate);

            if (isset($existing[$key])) {
                continue;
            }

            $this->candidate->experiences()->create([
                'company_name' => $resolvedCompany,
                'job_title' => $resolvedTitle,
                'start_date' => $startDate,
                'end_date' => $isCurrent ? null : $endDate,
                'is_current' => $isCurrent,
                'description' => trim((string) ($exp['description'] ?? '')) ?: null,
                'location' => trim((string) ($exp['location'] ?? '')) ?: null,
            ]);

            $existing[$key] = true;
        }
    }

    private function experienceKey(string $company, string $title, string $startDate): string
    {
        return Str::lower(trim($company)).'|'.Str::lower(trim($title)).'|'.$startDate;
    }

    private function fillEducations(array $parsed): void
    {
        $educations = $parsed['educations'] ?? [];

        if (! is_array($educations) || $educations === []) {
            return;
        }

        $existing = $this->candidate->educations()
            ->get(['institution', 'degree', 'start_year'])
            ->map(fn ($edu): string => $this->educationKey(
                (string) $edu->institution,
                (string) $edu->degree,
                $edu->start_year,
            ))
            ->all();
        $existing = array_flip($existing);

        foreach ($educations as $edu) {
            if (! is_array($edu)) {
                continue;
            }

            $institution = trim((string) ($edu['institution'] ?? ''));

            if ($institution === '') {
                continue;
            }

            $degree = trim((string) ($edu['degree'] ?? ''));
            $startYear = $this->parseYear($edu['start_year'] ?? null);
            $key = $this->educationKey($institution, $degree, $startYear);

            if (isset($existing[$key])) {
                continue;
            }

            $this->candidate->educations()->create([
                'institution' => $institution,
                'degree' => $degree !== '' ? $degree : null,
                'field_of_study' => trim((string) ($edu['field_of_study'] ?? '')) ?: null,
                'start_year' => $startYear,
                'end_year' => $this->parseYear($edu['end_year'] ?? null),
                'gpa' => is_numeric($edu['gpa'] ?? null) ? (float) $edu['gpa'] : null,
            ]);

            $existing[$key] = true;
        }
    }

    private function educationKey(string $institution, string $degree, ?int $startYear): string
    {
        return Str::lower(trim($institution)).'|'.Str::lower(trim($degree)).'|'.($startYear ?? '');
    }

    private function fillSkills(array $parsed): void
    {
        $skillNames = $parsed['skills'] ?? [];

        if (! is_array($skillNames) || $skillNames === []) {
            return;
        }

        $names = collect($skillNames)
            ->filter(fn ($s): bool => is_string($s) && trim($s) !== '')
            ->map(fn (string $s): string => Str::lower(trim($s)))
            ->unique()
            ->take(15)
            ->all();

        if ($names === []) {
            return;
        }

        $matchedSkills = Skill::query()
            ->whereIn(DB::raw('LOWER(name)'), $names)
            ->get(['id'])
            ->pluck('id');

        if ($matchedSkills->isEmpty()) {
            return;
        }

        $this->candidate->skills()->syncWithoutDetaching(
            $matchedSkills->mapWithKeys(fn (int $id): array => [
                $id => ['proficiency' => 'intermediate'],
            ])->all()
        );
    }

    private function parseDate(string $value): ?string
    {
        if ($value === '') {
            return null;
        }

        try {
            return Carbon::parse($value)->format('Y-m-d');
        } catch (Throwable) {
            return null;
        }
    }

    private function parseYear(mixed $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        $int = (int) $value;

        return $int >= 1950 && $int <= 2100 ? $int : null;
    }

    private function resolveStoragePath(string $url): ?string
    {
        $path = parse_url($url, PHP_URL_PATH);
        $target = is_string($path) && $path !== '' ? $path : $url;

        if (! str_starts_with($target, '/storage/')) {
            return null;
        }

        return Str::of($target)->after('/storage/')->toString();
    }

    private function buildPrompt(string $cvText): string
    {
        return "Parse the following CV text and extract structured data:\n\n---\n{$cvText}\n---";
    }
}
