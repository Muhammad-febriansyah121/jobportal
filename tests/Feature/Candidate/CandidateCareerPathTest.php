<?php

use App\Models\AiCareerRecommendation;
use App\Models\CandidateProfile;
use App\Models\LearningPathStep;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->candidate = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);

    $this->profile = CandidateProfile::create([
        'user_id' => $this->candidate->id,
        'profile_completion' => 100,
        'full_name' => 'Sari Dev',
        'headline' => 'Senior UI Designer',
        'work_mode_pref' => 'any',
    ]);
});

test('candidate career paths index renders with empty state', function () {
    $this->actingAs($this->candidate)
        ->get(route('candidate.career-paths.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('candidate/career-paths')
            ->where('paths', [])
            ->where('activePath', null)
            ->etc()
        );
});

test('candidate career paths index lists paths and surfaces the primary one', function () {
    $primary = AiCareerRecommendation::create([
        'candidate_id' => $this->profile->id,
        'title' => 'Product Design Lead',
        'target_role' => 'Product Design Lead (AI Systems)',
        'match_score' => 92,
        'is_primary' => true,
        'recommendation_json' => [
            'target_role' => 'Product Design Lead (AI Systems)',
            'summary' => 'Bridges UI/UX into AI design.',
            'growth_potential' => '+24% YoY',
            'salary_range' => 'IDR 30 jt - 50 jt',
            'key_gap_insight' => 'Prompt engineering depth.',
            'skill_breakdown' => [
                ['name' => 'Product Strategy', 'current_level' => 60, 'required_level' => 90, 'note' => 'Sharpen strategy.'],
            ],
            'learning_steps' => [
                ['title' => 'AI for Designers', 'description' => 'Course on AI for design.', 'tag' => 'Direkomendasikan AI'],
            ],
            'milestones' => [
                ['title' => 'Ship AI prototype', 'timeframe' => '0-3 bulan'],
            ],
        ],
    ]);

    LearningPathStep::create([
        'career_recommendation_id' => $primary->id,
        'title' => 'Belajar prompt engineering',
        'order_number' => 1,
        'status' => 'not_started',
    ]);

    AiCareerRecommendation::create([
        'candidate_id' => $this->profile->id,
        'title' => 'Senior PM',
        'target_role' => 'Senior PM',
        'match_score' => 70,
        'is_primary' => false,
        'recommendation_json' => ['target_role' => 'Senior PM'],
    ]);

    $this->actingAs($this->candidate)
        ->get(route('candidate.career-paths.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('candidate/career-paths')
            ->where('paths.0.id', $primary->id)
            ->where('paths.0.is_primary', true)
            ->where('paths.0.target_role', 'Product Design Lead (AI Systems)')
            ->where('activePath.id', $primary->id)
            ->where('activePath.match_score', 92)
            ->has('activePath.learning_path_steps', 1)
            ->etc()
        );
});

test('candidate can activate another career path', function () {
    $oldPrimary = AiCareerRecommendation::create([
        'candidate_id' => $this->profile->id,
        'title' => 'Old',
        'is_primary' => true,
        'recommendation_json' => [],
    ]);

    $other = AiCareerRecommendation::create([
        'candidate_id' => $this->profile->id,
        'title' => 'New',
        'is_primary' => false,
        'recommendation_json' => [],
    ]);

    $this->actingAs($this->candidate)
        ->patch(route('candidate.career-paths.activate', ['careerPath' => $other->id]))
        ->assertRedirect();

    expect($oldPrimary->fresh()->is_primary)->toBeFalse();
    expect($other->fresh()->is_primary)->toBeTrue();
});

test('candidate cannot activate path belonging to someone else', function () {
    $strangerUser = User::factory()->candidate()->create();
    $stranger = CandidateProfile::create([
        'user_id' => $strangerUser->id,
        'full_name' => 'Stranger',
        'work_mode_pref' => 'any',
    ]);
    $foreign = AiCareerRecommendation::create([
        'candidate_id' => $stranger->id,
        'title' => 'Foreign',
        'is_primary' => false,
        'recommendation_json' => [],
    ]);

    $this->actingAs($this->candidate)
        ->patch(route('candidate.career-paths.activate', ['careerPath' => $foreign->id]))
        ->assertForbidden();
});

test('candidate can toggle a learning step', function () {
    $path = AiCareerRecommendation::create([
        'candidate_id' => $this->profile->id,
        'title' => 'Path',
        'is_primary' => true,
        'recommendation_json' => [],
    ]);

    $step = LearningPathStep::create([
        'career_recommendation_id' => $path->id,
        'title' => 'Belajar',
        'order_number' => 1,
        'status' => 'not_started',
    ]);

    $this->actingAs($this->candidate)
        ->patch(route('candidate.career-paths.steps.toggle', ['step' => $step->id]))
        ->assertRedirect();

    expect($step->fresh()->status)->toBe('completed');

    $this->actingAs($this->candidate)
        ->patch(route('candidate.career-paths.steps.toggle', ['step' => $step->id]))
        ->assertRedirect();

    expect($step->fresh()->status)->toBe('not_started');
});

test('candidate generate falls back when ai is disabled', function () {
    $this->actingAs($this->candidate)
        ->post(route('candidate.career-paths.generate'), [
            'target_role' => 'AI Product Lead',
            'focus' => 'AI Systems',
            'notes' => 'Pindah dari design ke produk AI.',
        ])
        ->assertRedirect();

    $path = AiCareerRecommendation::query()
        ->where('candidate_id', $this->profile->id)
        ->where('is_primary', true)
        ->first();

    expect($path)->not->toBeNull();
    expect($path->target_role)->toBe('AI Product Lead');
    expect($path->learningPathSteps()->count())->toBeGreaterThan(0);
});
