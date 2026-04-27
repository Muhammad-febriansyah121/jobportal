<?php

namespace App\Http\Controllers\Candidate;

use App\Actions\Candidate\ResolveCandidateProfile;
use App\Http\Controllers\Controller;
use App\Http\Requests\Candidate\SaveCandidateProfileRequest;
use App\Models\Industry;
use App\Models\Skill;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CandidateProfileController extends Controller
{
    public function edit(Request $request, ResolveCandidateProfile $resolveCandidateProfile): Response
    {
        $candidate = $resolveCandidateProfile->refreshCompletion(
            $resolveCandidateProfile->handle($request->user())
        )->load(['skills:id,name']);
        $profileCompletionMissing = collect($resolveCandidateProfile->completionChecklist($candidate))
            ->filter(fn (array $item): bool => ! $item['completed'])
            ->values()
            ->map(fn (array $item): array => [
                'key' => $item['key'],
                'label' => $item['label'],
            ])
            ->all();

        return Inertia::render('candidate/profile', [
            'profile' => [
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
                'linkedin_url' => $candidate->linkedin_url,
                'github_url' => $candidate->github_url,
                'portfolio_url' => $candidate->portfolio_url,
                'profile_completion' => $candidate->profile_completion,
                'profile_completion_missing' => $profileCompletionMissing,
                'ai_cv_summary' => $candidate->ai_cv_summary,
                'skill_ids' => $candidate->skills->pluck('id')->all(),
            ],
            'industries' => $this->industries(),
            'skills' => $this->skills(),
        ]);
    }

    public function update(SaveCandidateProfileRequest $request, ResolveCandidateProfile $resolveCandidateProfile): RedirectResponse
    {
        $candidate = $resolveCandidateProfile->handle($request->user());
        $data = $request->validated();
        $skillIds = $data['skill_ids'] ?? null;
        unset($data['skill_ids']);

        $candidate->update($data);

        if (is_array($skillIds)) {
            $candidate->skills()->syncWithoutDetaching(
                collect($skillIds)->mapWithKeys(fn (int $skillId): array => [
                    $skillId => ['proficiency' => 'intermediate'],
                ])->all()
            );
        }

        $resolveCandidateProfile->refreshCompletion($candidate);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Profil kandidat berhasil diperbarui.']);

        return back();
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
