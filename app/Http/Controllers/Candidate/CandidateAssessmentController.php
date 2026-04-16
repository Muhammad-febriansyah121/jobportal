<?php

namespace App\Http\Controllers\Candidate;

use App\Actions\Candidate\ResolveCandidateProfile;
use App\Http\Controllers\Controller;
use App\Models\Skill;
use App\Models\SkillAssessment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CandidateAssessmentController extends Controller
{
    public function __invoke(Request $request, ResolveCandidateProfile $resolveCandidateProfile): Response
    {
        $candidate = $resolveCandidateProfile->handle($request->user());
        $assessedSkillIds = $candidate->skillAssessments()->pluck('skill_id');

        return Inertia::render('candidate/assessments', [
            'assessments' => $candidate->skillAssessments()
                ->with('skill:id,name')
                ->latest('completed_at')
                ->get()
                ->map(fn (SkillAssessment $assessment): array => [
                    'id' => $assessment->id,
                    'skill' => $assessment->skill?->name,
                    'score' => $assessment->score,
                    'max_score' => $assessment->max_score,
                    'passed' => $assessment->passed,
                    'completed_at' => $assessment->completed_at?->format('d M Y'),
                ]),
            'suggestedSkills' => Skill::query()
                ->select(['id', 'name', 'category'])
                ->whereNotIn('id', $assessedSkillIds)
                ->orderBy('name')
                ->limit(8)
                ->get()
                ->map(fn (Skill $skill): array => [
                    'id' => $skill->id,
                    'name' => $skill->name,
                    'category' => $skill->category,
                ]),
        ]);
    }
}
