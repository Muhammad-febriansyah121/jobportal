<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\RecordActivity;
use App\Actions\Candidate\GenerateSkillAssessmentQuiz;
use App\Http\Controllers\Admin\Concerns\BuildsAdminPages;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SaveAssessmentQuestionRequest;
use App\Http\Requests\Admin\UpdateAssessmentQuestionRequest;
use App\Models\AssessmentQuestion;
use App\Models\Skill;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class AdminAssessmentQuestionController extends Controller
{
    use BuildsAdminPages;

    public function index(): Response
    {
        $skills = Skill::query()
            ->select(['id', 'name'])
            ->withCount([
                'assessmentQuestions as total_questions',
                'assessmentQuestions as easy_count' => fn ($q) => $q->where('difficulty', 'easy'),
                'assessmentQuestions as medium_count' => fn ($q) => $q->where('difficulty', 'medium'),
                'assessmentQuestions as hard_count' => fn ($q) => $q->where('difficulty', 'hard'),
                'assessmentQuestions as active_count' => fn ($q) => $q->where('is_active', true),
            ])
            ->orderBy('name')
            ->get();

        return Inertia::render('admin/assessment-questions/index', [
            'skills' => $skills->map(fn (Skill $skill): array => [
                'id' => $skill->id,
                'name' => $skill->name,
                'total_questions' => $skill->total_questions,
                'easy_count' => $skill->easy_count,
                'medium_count' => $skill->medium_count,
                'hard_count' => $skill->hard_count,
                'active_count' => $skill->active_count,
                'detail_url' => route('admin.assessment-questions.by-skill', $skill),
                'create_url' => route('admin.assessment-questions.create', ['skill_id' => $skill->id]),
            ]),
            'create_url' => route('admin.assessment-questions.create'),
        ]);
    }

    public function bySkill(Request $request, Skill $skill): Response
    {
        $questions = AssessmentQuestion::query()
            ->select(['id', 'skill_id', 'question', 'options_json', 'correct_option_index', 'difficulty', 'source', 'is_active', 'created_at'])
            ->where('skill_id', $skill->id)
            ->when($request->filled('search'), fn ($q) => $q->where('question', 'like', '%'.$request->string('search')->toString().'%'))
            ->when($request->filled('difficulty'), fn ($q) => $q->where('difficulty', $request->string('difficulty')->toString()))
            ->when($request->filled('status'), fn ($q) => $q->where('is_active', $request->string('status')->toString() === 'active'))
            ->latest()
            ->paginate(20)
            ->withQueryString()
            ->through(fn (AssessmentQuestion $q): array => [
                'id' => $q->id,
                'question' => $q->question,
                'options' => is_array($q->options_json) ? array_values($q->options_json) : [],
                'correct_option_index' => $q->correct_option_index,
                'difficulty' => $q->difficulty,
                'source' => $q->source,
                'is_active' => $q->is_active,
                'created_at' => $q->created_at?->format('d M Y'),
                'edit_url' => route('admin.assessment-questions.edit', $q),
                'delete_url' => route('admin.assessment-questions.destroy', $q),
            ]);

        return Inertia::render('admin/assessment-questions/show', [
            'skill' => [
                'id' => $skill->id,
                'name' => $skill->name,
            ],
            'questions' => $questions,
            'filters' => [
                'search' => $request->string('search')->toString(),
                'difficulty' => $request->string('difficulty')->toString(),
                'status' => $request->string('status')->toString(),
            ],
            'index_url' => route('admin.assessment-questions.index'),
            'create_url' => route('admin.assessment-questions.create', ['skill_id' => $skill->id]),
        ]);
    }

    public function create(Request $request): Response
    {
        $skill = $request->filled('skill_id')
            ? Skill::query()->find($request->integer('skill_id'))
            : null;

        return Inertia::render('admin/assessment-questions/create', [
            'title' => 'Tambah Bank Soal',
            'description' => 'Mode manual untuk satu soal, mode AI untuk generate batch soal otomatis.',
            'backHref' => $skill
                ? route('admin.assessment-questions.by-skill', $skill)
                : route('admin.assessment-questions.index'),
            'storeAction' => route('admin.assessment-questions.store'),
            'skillOptions' => $this->skillOptions(),
            'difficultyOptions' => $this->difficultyFormOptions(),
            'defaultSkillId' => $skill ? (string) $skill->id : null,
        ]);
    }

    public function store(
        SaveAssessmentQuestionRequest $request,
        GenerateSkillAssessmentQuiz $generateSkillAssessmentQuiz,
        RecordActivity $activity
    ): RedirectResponse {
        $validated = $request->validated();
        $skill = Skill::query()->findOrFail($validated['skill_id']);
        $difficulty = $validated['difficulty'];

        if ($validated['mode'] === 'ai') {
            $questions = $generateSkillAssessmentQuiz->handle(
                $skill,
                (int) $validated['total_questions'],
                $difficulty,
            );

            $created = 0;

            foreach ($questions as $question) {
                AssessmentQuestion::query()->create([
                    'skill_id' => $skill->id,
                    'question' => $question['question'],
                    'options_json' => $question['options'],
                    'correct_option_index' => $question['answer_index'],
                    'difficulty' => $difficulty,
                    'source' => 'ai',
                    'is_active' => true,
                    'created_by' => $request->user()?->id,
                ]);
                $created++;
            }

            $activity->handle($request->user(), 'generate_assessment_questions_ai', $skill, [
                'skill' => $skill->name,
                'total' => $created,
                'difficulty' => $difficulty,
            ]);

            $this->flash("{$created} soal berhasil digenerate AI.");

            return to_route('admin.assessment-questions.index');
        }

        $created = 0;

        foreach ($validated['manual_questions'] as $question) {
            $assessmentQuestion = AssessmentQuestion::query()->create([
                'skill_id' => $skill->id,
                'question' => $question['question'],
                'options_json' => [
                    $question['option_a'],
                    $question['option_b'],
                    $question['option_c'],
                    $question['option_d'],
                ],
                'correct_option_index' => (int) $question['correct_option_index'],
                'difficulty' => $difficulty,
                'source' => 'admin',
                'is_active' => (bool) ($validated['is_active'] ?? false),
                'created_by' => $request->user()?->id,
            ]);

            $activity->handle($request->user(), 'create_assessment_question', $assessmentQuestion);
            $created++;
        }

        $this->flash("{$created} soal manual berhasil ditambahkan.");

        return to_route('admin.assessment-questions.index');
    }

    public function edit(AssessmentQuestion $assessmentQuestion): Response
    {
        $options = is_array($assessmentQuestion->options_json)
            ? array_values($assessmentQuestion->options_json)
            : ['', '', '', ''];

        return Inertia::render('admin/assessment-questions/edit', [
            'title' => 'Edit Bank Soal',
            'description' => 'Perbarui pertanyaan, opsi jawaban, dan status publikasi soal.',
            'backHref' => route('admin.assessment-questions.index'),
            'updateAction' => route('admin.assessment-questions.update', $assessmentQuestion),
            'skillOptions' => $this->skillOptions(),
            'difficultyOptions' => $this->difficultyFormOptions(),
            'question' => [
                'id' => $assessmentQuestion->id,
                'skill_id' => (string) $assessmentQuestion->skill_id,
                'difficulty' => $assessmentQuestion->difficulty,
                'question' => $assessmentQuestion->question,
                'option_a' => $options[0] ?? '',
                'option_b' => $options[1] ?? '',
                'option_c' => $options[2] ?? '',
                'option_d' => $options[3] ?? '',
                'correct_option_index' => (string) $assessmentQuestion->correct_option_index,
                'is_active' => $assessmentQuestion->is_active,
            ],
        ]);
    }

    public function update(
        UpdateAssessmentQuestionRequest $request,
        AssessmentQuestion $assessmentQuestion,
        RecordActivity $activity
    ): RedirectResponse {
        $validated = $request->validated();

        $assessmentQuestion->update([
            'skill_id' => (int) $validated['skill_id'],
            'question' => $validated['question'],
            'options_json' => [
                $validated['option_a'],
                $validated['option_b'],
                $validated['option_c'],
                $validated['option_d'],
            ],
            'correct_option_index' => (int) $validated['correct_option_index'],
            'difficulty' => $validated['difficulty'],
            'is_active' => (bool) ($validated['is_active'] ?? false),
        ]);

        $activity->handle($request->user(), 'update_assessment_question', $assessmentQuestion);
        $this->flash('Soal berhasil diperbarui.');

        return to_route('admin.assessment-questions.index');
    }

    public function destroy(
        Request $request,
        AssessmentQuestion $assessmentQuestion,
        RecordActivity $activity
    ): RedirectResponse {
        $activity->handle($request->user(), 'delete_assessment_question', $assessmentQuestion);
        $assessmentQuestion->delete();

        $this->flash('Soal berhasil dihapus.');

        return back();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function rowActions(AssessmentQuestion $question): array
    {
        return [
            $this->action(
                'Edit',
                route('admin.assessment-questions.edit', $question),
                'Pencil',
                'get',
                'outline',
            ),
            $this->action(
                'Hapus',
                route('admin.assessment-questions.destroy', $question),
                'Trash',
                'delete',
                'destructive',
                'Hapus soal?',
                'Soal akan dihapus permanen dari bank soal.'
            ),
        ];
    }

    /**
     * @param  Collection<int, Skill>|null  $skills
     * @return array<int, array<string, string>>
     */
    private function skillOptions(?Collection $skills = null): array
    {
        $skills ??= Skill::query()->select(['id', 'name'])->orderBy('name')->get();

        return $skills
            ->map(fn (Skill $skill): array => ['value' => (string) $skill->id, 'label' => $skill->name])
            ->values()
            ->all();
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function difficultyFilterOptions(): array
    {
        return [
            ['value' => '', 'label' => 'Semua level'],
            ...$this->difficultyFormOptions(),
        ];
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function difficultyFormOptions(): array
    {
        return [
            ['value' => 'easy', 'label' => 'Easy'],
            ['value' => 'medium', 'label' => 'Medium'],
            ['value' => 'hard', 'label' => 'Hard'],
        ];
    }
}
