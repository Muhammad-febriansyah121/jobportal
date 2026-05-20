<?php

namespace App\Http\Controllers\Candidate;

use App\Actions\Candidate\ResolveCandidateProfile;
use App\Ai\Agents\CvParser;
use App\Http\Controllers\Controller;
use App\Http\Requests\Candidate\SaveCandidateProfileRequest;
use App\Models\CandidateProfile;
use App\Models\Industry;
use App\Models\Skill;
use App\Services\AiService;
use App\Services\CvTextExtractorService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class CandidateOnboardingController extends Controller
{
    public function edit(Request $request, ResolveCandidateProfile $resolveCandidateProfile): Response
    {
        $candidate = $resolveCandidateProfile->handle($request->user())
            ->load(['skills:id,name', 'primaryCv']);

        return Inertia::render('candidate/onboarding', [
            'profile' => $this->profilePayload($candidate),
            'industries' => $this->industries(),
            'skills' => $this->skills(),
        ]);
    }

    public function store(SaveCandidateProfileRequest $request, ResolveCandidateProfile $resolveCandidateProfile): RedirectResponse
    {
        $candidate = $resolveCandidateProfile->handle($request->user());
        $data = $request->validated();
        $skillIds = $data['skill_ids'] ?? [];
        $firstExperience = [
            'company_name' => $data['first_experience_company_name'] ?? null,
            'job_title' => $data['first_experience_job_title'] ?? null,
            'start_date' => $data['first_experience_start_date'] ?? null,
            'end_date' => $data['first_experience_end_date'] ?? null,
            'is_current' => (bool) ($data['first_experience_is_current'] ?? false),
            'location' => $data['first_experience_location'] ?? null,
            'description' => $data['first_experience_description'] ?? null,
        ];
        $firstEducation = [
            'institution' => $data['first_education_institution'] ?? null,
            'degree' => $data['first_education_degree'] ?? null,
            'field_of_study' => $data['first_education_field_of_study'] ?? null,
            'start_year' => $data['first_education_start_year'] ?? null,
            'end_year' => $data['first_education_end_year'] ?? null,
            'gpa' => $data['first_education_gpa'] ?? null,
        ];
        unset($data['skill_ids']);
        unset(
            $data['first_experience_company_name'],
            $data['first_experience_job_title'],
            $data['first_experience_start_date'],
            $data['first_experience_end_date'],
            $data['first_experience_is_current'],
            $data['first_experience_location'],
            $data['first_experience_description'],
            $data['first_education_institution'],
            $data['first_education_degree'],
            $data['first_education_field_of_study'],
            $data['first_education_start_year'],
            $data['first_education_end_year'],
            $data['first_education_gpa'],
        );

        $candidate->update($data);

        if ($skillIds !== []) {
            $candidate->skills()->syncWithoutDetaching(
                collect($skillIds)->mapWithKeys(fn (int $skillId): array => [
                    $skillId => ['proficiency' => 'intermediate'],
                ])->all()
            );
        }
        if ($candidate->experiences()->doesntExist() && filled($firstExperience['company_name'])) {
            if ($firstExperience['is_current']) {
                $firstExperience['end_date'] = null;
            }

            $candidate->experiences()->create([
                'company_name' => $firstExperience['company_name'],
                'job_title' => $firstExperience['job_title'] ?? 'Tidak diketahui',
                'start_date' => $firstExperience['start_date'] ?? now()->toDateString(),
                'end_date' => $firstExperience['end_date'],
                'is_current' => $firstExperience['is_current'],
                'location' => $firstExperience['location'],
                'description' => $firstExperience['description'],
            ]);
        }

        if ($candidate->educations()->doesntExist() && filled($firstEducation['institution'])) {
            $candidate->educations()->create([
                'institution' => $firstEducation['institution'],
                'degree' => $firstEducation['degree'],
                'field_of_study' => $firstEducation['field_of_study'],
                'start_year' => $firstEducation['start_year'],
                'end_year' => $firstEducation['end_year'],
                'gpa' => $firstEducation['gpa'],
            ]);
        }

        $resolveCandidateProfile->refreshCompletion($candidate);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Onboarding kandidat berhasil disimpan.']);

        return to_route('candidate.dashboard');
    }

    public function parseCv(Request $request, CvTextExtractorService $extractor, AiService $ai): JsonResponse
    {
        $request->validate([
            'cv_file' => ['required', 'file', 'mimes:pdf,doc,docx', 'max:10240'],
        ]);

        @set_time_limit(120);

        $file = $request->file('cv_file');
        $cvText = $extractor->extractFromPath($file->getPathname(), (string) $file->getMimeType());

        if (trim($cvText) === '') {
            return response()->json(['error' => 'Teks tidak dapat diekstrak dari file ini. Coba file lain atau isi form manual.'], 422);
        }

        if (! $ai->isConfigured()) {
            return response()->json(['error' => 'AI belum dikonfigurasi. Isi form manual.'], 422);
        }

        $parsed = null;
        try {
            $response = (new CvParser)->prompt("Parse the following CV text:\n\n---\n{$cvText}\n---");
            $parsed = $response->toArray();
        } catch (Throwable $exception) {
            Log::warning('CvParser failed', [
                'user_id' => $request->user()?->id,
                'file_name' => $file->getClientOriginalName(),
                'cv_text_length' => mb_strlen($cvText),
                'message' => $exception->getMessage(),
            ]);
        }

        if (! is_array($parsed)) {
            return response()->json(['error' => 'AI tidak dapat memproses CV ini. Coba lagi atau isi form manual.'], 422);
        }

        $skillNames = collect($parsed['skills'] ?? [])
            ->filter(fn ($s): bool => is_string($s) && trim($s) !== '')
            ->map(fn (string $s): string => Str::lower(trim($s)))
            ->unique()
            ->take(15)
            ->all();

        $matchedSkillIds = Skill::query()
            ->whereIn(DB::raw('LOWER(name)'), $skillNames)
            ->pluck('id')
            ->all();

        $firstExp = isset($parsed['experiences'][0]) && is_array($parsed['experiences'][0])
            ? $parsed['experiences'][0]
            : null;

        $firstEdu = isset($parsed['educations'][0]) && is_array($parsed['educations'][0])
            ? $parsed['educations'][0]
            : null;

        return response()->json([
            'full_name' => trim((string) ($parsed['full_name'] ?? '')),
            'headline' => trim((string) ($parsed['headline'] ?? '')),
            'bio' => trim((string) ($parsed['summary'] ?? '')),
            'location_city' => trim((string) ($parsed['location_city'] ?? '')),
            'location_province' => trim((string) ($parsed['location_province'] ?? '')),
            'matched_skill_ids' => $matchedSkillIds,
            'first_experience' => $firstExp ? [
                'company_name' => trim((string) ($firstExp['company_name'] ?? '')),
                'job_title' => trim((string) ($firstExp['job_title'] ?? '')),
                'start_date' => $this->parseDate((string) ($firstExp['start_date'] ?? '')),
                'end_date' => $this->parseDate((string) ($firstExp['end_date'] ?? '')),
                'is_current' => (bool) ($firstExp['is_current'] ?? false),
            ] : null,
            'first_education' => $firstEdu ? [
                'institution' => trim((string) ($firstEdu['institution'] ?? '')),
                'degree' => trim((string) ($firstEdu['degree'] ?? '')),
                'field_of_study' => trim((string) ($firstEdu['field_of_study'] ?? '')),
                'start_year' => (string) ($firstEdu['start_year'] ?? ''),
                'end_year' => (string) ($firstEdu['end_year'] ?? ''),
                'gpa' => (string) ($firstEdu['gpa'] ?? ''),
            ] : null,
        ]);
    }

    private function parseDate(string $value): string
    {
        if ($value === '') {
            return '';
        }

        try {
            return Carbon::parse($value)->format('Y-m-d');
        } catch (Throwable) {
            return '';
        }
    }

    private function profilePayload(CandidateProfile $candidate): array
    {
        return [
            'full_name' => $candidate->full_name,
            'headline' => $candidate->headline,
            'bio' => $candidate->bio,
            'location_city' => $candidate->location_city,
            'location_province' => $candidate->location_province,
            'expected_salary_min' => $candidate->expected_salary_min,
            'expected_salary_max' => $candidate->expected_salary_max,
            'work_mode_pref' => $candidate->work_mode_pref,
            'availability' => $candidate->availability,
            'preferred_industry_id' => $candidate->preferred_industry_id,
            'preferred_role' => $candidate->preferred_role,
            'skill_ids' => $candidate->skills->pluck('id')->all(),
            'primary_cv' => $candidate->primaryCv ? [
                'id' => $candidate->primaryCv->id,
                'file_url' => $candidate->primaryCv->file_url,
            ] : null,
        ];
    }

    private function industries(): array
    {
        return Industry::query()
            ->select(['id', 'name'])
            ->orderBy('name')
            ->get()
            ->map(fn (Industry $industry): array => [
                'value' => (string) $industry->id,
                'label' => $industry->name,
            ])
            ->all();
    }

    private function skills(): array
    {
        return Skill::query()
            ->select(['id', 'name'])
            ->orderBy('name')
            ->get()
            ->map(fn (Skill $skill): array => [
                'value' => (string) $skill->id,
                'label' => $skill->name,
            ])
            ->all();
    }
}
