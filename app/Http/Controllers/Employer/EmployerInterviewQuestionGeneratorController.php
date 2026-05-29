<?php

namespace App\Http\Controllers\Employer;

use App\Ai\Agents\EmployerInterviewQuestionGenerator;
use App\Http\Controllers\Controller;
use App\Models\JobListing;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EmployerInterviewQuestionGeneratorController extends Controller
{
    public function __invoke(Request $request, JobListing $jobListing): JsonResponse
    {
        $data = $request->validate([
            'interview_mode' => ['required', Rule::in(['voice', 'text'])],
        ]);

        $skills = $jobListing->skills()->pluck('name')->implode(', ');
        $prompt = "Posisi: {$jobListing->title}\nSkill yang dibutuhkan: {$skills}";

        $response = (new EmployerInterviewQuestionGenerator($data['interview_mode']))
            ->prompt($prompt);

        return response()->json([
            'questions' => collect($response['questions'])->map(fn ($q) => [
                'question' => $q['question'],
                'category' => $q['category'],
                'rubric' => $q['rubric'],
                'weight' => $q['weight'],
                'allow_ai_followup' => $q['allow_ai_followup'],
                'question_type' => $q['question_type'],
                'options' => $q['options'] ?? [],
            ])->values()->all(),
        ]);
    }
}
