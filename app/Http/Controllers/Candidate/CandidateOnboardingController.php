<?php

namespace App\Http\Controllers\Candidate;

use App\Actions\Candidate\ResolveCandidateProfile;
use App\Http\Controllers\Controller;
use App\Http\Requests\Candidate\SaveCandidateProfileRequest;
use App\Models\CandidateProfile;
use App\Models\Industry;
use App\Models\Skill;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

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
        unset($data['skill_ids']);

        $candidate->update($data);

        if ($skillIds !== []) {
            $candidate->skills()->syncWithoutDetaching(
                collect($skillIds)->mapWithKeys(fn (int $skillId): array => [
                    $skillId => ['proficiency' => 'intermediate'],
                ])->all()
            );
        }

        $request->user()->forceFill(['onboarding_completed_at' => now()])->save();
        $resolveCandidateProfile->refreshCompletion($candidate);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Onboarding kandidat berhasil disimpan.']);

        return to_route('candidate.dashboard');
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
