<?php

namespace App\Http\Controllers\Candidate;

use App\Actions\Candidate\ResolveCandidateProfile;
use App\Http\Controllers\Controller;
use App\Http\Requests\Candidate\SaveCandidateSkillRequest;
use App\Models\Skill;
use App\Support\UniqueSlug;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CandidateSkillController extends Controller
{
    public function index(Request $request, ResolveCandidateProfile $resolveCandidateProfile): Response
    {
        $candidate = $resolveCandidateProfile->handle($request->user())
            ->load('skills:id,name,category');

        return Inertia::render('candidate/skills', [
            'candidateSkills' => $candidate->skills
                ->map(fn (Skill $skill): array => [
                    'id' => $skill->id,
                    'name' => $skill->name,
                    'category' => $skill->category,
                    'years_exp' => $skill->pivot->years_exp,
                    'proficiency' => $skill->pivot->proficiency,
                    'verified_at' => $skill->pivot->verified_at,
                ]),
            'skills' => Skill::query()
                ->select(['id', 'name'])
                ->orderBy('name')
                ->get()
                ->map(fn (Skill $skill): array => [
                    'value' => (string) $skill->id,
                    'label' => $skill->name,
                ]),
        ]);
    }

    public function store(SaveCandidateSkillRequest $request, ResolveCandidateProfile $resolveCandidateProfile): RedirectResponse
    {
        $candidate = $resolveCandidateProfile->handle($request->user());
        $data = $request->validated();
        $skillId = $this->resolveSkillId($data);

        $candidate->skills()->syncWithoutDetaching([
            $skillId => [
                'years_exp' => $data['years_exp'] ?? null,
                'proficiency' => $data['proficiency'] ?? null,
            ],
        ]);

        $resolveCandidateProfile->refreshCompletion($candidate);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Skill berhasil ditambahkan.']);

        return back();
    }

    public function update(SaveCandidateSkillRequest $request, Skill $skill, ResolveCandidateProfile $resolveCandidateProfile): RedirectResponse
    {
        $candidate = $resolveCandidateProfile->handle($request->user());
        abort_unless($candidate->skills()->whereKey($skill->id)->exists(), 404);

        $data = $request->validated();
        $candidate->skills()->updateExistingPivot($skill->id, [
            'years_exp' => $data['years_exp'] ?? null,
            'proficiency' => $data['proficiency'] ?? null,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Skill berhasil diperbarui.']);

        return back();
    }

    public function destroy(Request $request, Skill $skill, ResolveCandidateProfile $resolveCandidateProfile): RedirectResponse
    {
        $candidate = $resolveCandidateProfile->handle($request->user());
        $candidate->skills()->detach($skill->id);
        $resolveCandidateProfile->refreshCompletion($candidate);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Skill berhasil dihapus.']);

        return back();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function resolveSkillId(array $data): int
    {
        if (is_numeric($data['skill_id'] ?? null)) {
            return (int) $data['skill_id'];
        }

        $skillName = trim((string) ($data['skill_name'] ?? ''));
        $existingSkill = Skill::query()
            ->whereRaw('LOWER(name) = ?', [mb_strtolower($skillName)])
            ->first();

        if ($existingSkill !== null) {
            return $existingSkill->id;
        }

        $createdSkill = Skill::query()->create([
            'name' => $skillName,
            'slug' => UniqueSlug::make(Skill::class, $skillName, 'skill'),
        ]);

        return $createdSkill->id;
    }
}
