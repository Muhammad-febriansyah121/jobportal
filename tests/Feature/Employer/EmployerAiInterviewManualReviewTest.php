<?php

use App\Models\AiInterviewManualReview;
use App\Models\AiInterviewSession;
use App\Models\Application;
use App\Models\CandidateProfile;
use App\Models\Company;
use App\Models\Industry;
use App\Models\JobListing;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\actingAs;

function manualReviewScenario(): array
{
    $employer = User::factory()->employer()->create();
    $industry = Industry::create([
        'name' => 'Review Industry',
        'slug' => 'review-industry-'.uniqid(),
    ]);
    $company = Company::create([
        'owner_id' => $employer->id,
        'industry_id' => $industry->id,
        'name' => 'Review Co',
        'slug' => 'review-co-'.uniqid(),
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);

    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'industry_id' => $industry->id,
        'title' => 'Review Engineer',
        'slug' => 'review-engineer-'.uniqid(),
        'description' => 'desc',
        'work_mode' => 'remote',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'salary_currency' => 'IDR',
        'is_salary_visible' => true,
        'status' => 'published',
    ]);

    $candidateUser = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);
    $profile = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Candidate Test',
        'work_mode_pref' => 'any',
    ]);

    $application = Application::create([
        'job_listing_id' => $job->id,
        'candidate_id' => $profile->id,
        'status' => 'applied',
        'applied_at' => now(),
    ]);

    $session = AiInterviewSession::create([
        'application_id' => $application->id,
        'candidate_id' => $profile->id,
        'status' => 'completed',
        'interview_mode' => 'voice',
        'interview_language' => 'id',
        'scheduled_at' => now()->subDay(),
        'completed_at' => now(),
        'duration_minutes' => 30,
        'voice' => 'marin',
    ]);

    return [$employer, $session, $company];
}

test('employer can create manual review for own session', function () {
    [$employer, $session] = manualReviewScenario();

    actingAs($employer)
        ->post(route('employer.ai-interviews.manual-review.store', $session), [
            'rating' => 4,
            'decision' => 'hire',
            'notes' => 'Strong technical, good communication.',
        ])
        ->assertRedirect();

    expect(AiInterviewManualReview::count())->toBe(1);

    $review = AiInterviewManualReview::first();
    expect($review->rating)->toBe(4)
        ->and($review->decision)->toBe('hire')
        ->and($review->notes)->toBe('Strong technical, good communication.')
        ->and($review->reviewer_id)->toBe($employer->id)
        ->and($review->ai_interview_session_id)->toBe($session->id);
});

test('employer review is upserted, not duplicated', function () {
    [$employer, $session] = manualReviewScenario();

    actingAs($employer)
        ->post(route('employer.ai-interviews.manual-review.store', $session), [
            'rating' => 3,
            'decision' => 'maybe',
            'notes' => 'Need more probing',
        ])
        ->assertRedirect();

    actingAs($employer)
        ->post(route('employer.ai-interviews.manual-review.store', $session), [
            'rating' => 5,
            'decision' => 'hire',
            'notes' => 'Updated assessment',
        ])
        ->assertRedirect();

    expect(AiInterviewManualReview::count())->toBe(1);
    expect(AiInterviewManualReview::first()->rating)->toBe(5);
    expect(AiInterviewManualReview::first()->decision)->toBe('hire');
});

test('employer cannot review session of another company', function () {
    [, $session] = manualReviewScenario();

    $otherEmployer = User::factory()->employer()->create();

    actingAs($otherEmployer)
        ->post(route('employer.ai-interviews.manual-review.store', $session), [
            'rating' => 5,
            'decision' => 'hire',
        ])
        ->assertNotFound();

    expect(AiInterviewManualReview::count())->toBe(0);
});

test('candidate cannot create manual review', function () {
    [, $session] = manualReviewScenario();

    $candidate = User::factory()->candidate()->create();

    actingAs($candidate)
        ->post(route('employer.ai-interviews.manual-review.store', $session), [
            'rating' => 5,
            'decision' => 'hire',
        ])
        ->assertForbidden();
});

test('employer can delete own review', function () {
    [$employer, $session] = manualReviewScenario();

    $review = AiInterviewManualReview::create([
        'ai_interview_session_id' => $session->id,
        'reviewer_id' => $employer->id,
        'rating' => 4,
        'decision' => 'hire',
    ]);

    actingAs($employer)
        ->delete(route('employer.ai-interviews.manual-review.destroy', [$session, $review]))
        ->assertRedirect();

    expect(AiInterviewManualReview::count())->toBe(0);
});

test('employer cannot delete teammate review', function () {
    [$employer, $session, $company] = manualReviewScenario();

    $teammate = User::factory()->employer()->create();
    $teammateReview = AiInterviewManualReview::create([
        'ai_interview_session_id' => $session->id,
        'reviewer_id' => $teammate->id,
        'rating' => 5,
        'decision' => 'hire',
    ]);

    actingAs($employer)
        ->delete(route('employer.ai-interviews.manual-review.destroy', [$session, $teammateReview]))
        ->assertForbidden();

    expect(AiInterviewManualReview::count())->toBe(1);
});

test('show endpoint exposes manual reviews payload', function () {
    [$employer, $session] = manualReviewScenario();

    AiInterviewManualReview::create([
        'ai_interview_session_id' => $session->id,
        'reviewer_id' => $employer->id,
        'rating' => 5,
        'decision' => 'hire',
        'notes' => 'Excellent candidate',
    ]);

    actingAs($employer)
        ->get(route('employer.ai-interviews.show', $session))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('employer/ai-interviews/show')
            ->has('manual_reviews', 1)
            ->where('manual_reviews.0.rating', 5)
            ->where('manual_reviews.0.decision', 'hire')
            ->where('manual_reviews.0.is_mine', true)
            ->where('manual_reviews.0.notes', 'Excellent candidate')
        );
});

test('rating must be between 1 and 5', function () {
    [$employer, $session] = manualReviewScenario();

    actingAs($employer)
        ->post(route('employer.ai-interviews.manual-review.store', $session), [
            'rating' => 0,
            'decision' => 'hire',
        ])
        ->assertSessionHasErrors('rating');

    actingAs($employer)
        ->post(route('employer.ai-interviews.manual-review.store', $session), [
            'rating' => 6,
            'decision' => 'hire',
        ])
        ->assertSessionHasErrors('rating');

    expect(AiInterviewManualReview::count())->toBe(0);
});

test('decision must be one of hire/maybe/reject', function () {
    [$employer, $session] = manualReviewScenario();

    actingAs($employer)
        ->post(route('employer.ai-interviews.manual-review.store', $session), [
            'rating' => 4,
            'decision' => 'pending',
        ])
        ->assertSessionHasErrors('decision');
});
