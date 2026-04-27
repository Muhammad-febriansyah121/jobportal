<?php

use App\Models\CandidateProfile;
use App\Models\Company;
use App\Models\CompanyReview;
use App\Models\User;

use function Pest\Laravel\actingAs;

function reviewModerationScenario(): array
{
    $admin = User::factory()->create(['role' => 'admin']);
    $employer = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Mod Co',
        'slug' => 'mod-co-'.uniqid(),
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);

    $candidateUser = User::factory()->candidate()->create();
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Penulis Ulasan',
        'work_mode_pref' => 'any',
    ]);

    $review = CompanyReview::create([
        'company_id' => $company->id,
        'candidate_id' => $candidate->id,
        'rating' => 4,
        'title' => 'Pengalaman bagus',
        'review' => 'Manajemen suportif.',
        'status' => 'pending',
    ]);

    return [$admin, $review, $company];
}

test('admin can approve a pending company review', function () {
    [$admin, $review] = reviewModerationScenario();

    actingAs($admin)
        ->patch(route('admin.company-reviews.approve', $review))
        ->assertRedirect();

    $review->refresh();

    expect($review->status)->toBe('approved')
        ->and($review->reviewed_by)->toBe($admin->id)
        ->and($review->reviewed_at)->not->toBeNull()
        ->and($review->rejection_reason)->toBeNull();
});

test('admin can reject a pending company review with reason', function () {
    [$admin, $review] = reviewModerationScenario();

    actingAs($admin)
        ->patch(route('admin.company-reviews.reject', $review), [
            'rejection_reason' => 'Berisi bahasa kasar.',
        ])
        ->assertRedirect();

    $review->refresh();

    expect($review->status)->toBe('rejected')
        ->and($review->reviewed_by)->toBe($admin->id)
        ->and($review->rejection_reason)->toBe('Berisi bahasa kasar.');
});

test('non-admin cannot access company review moderation', function () {
    [, $review] = reviewModerationScenario();

    $stranger = User::factory()->employer()->create();

    actingAs($stranger)
        ->get(route('admin.company-reviews.index'))
        ->assertForbidden();

    actingAs($stranger)
        ->patch(route('admin.company-reviews.approve', $review))
        ->assertForbidden();
});

test('public company page only shows approved reviews', function () {
    [, $review, $company] = reviewModerationScenario();

    $this->get(route('companies.show', $company->slug))
        ->assertOk();

    expect(CompanyReview::where('company_id', $company->id)->where('status', 'approved')->count())
        ->toBe(0);

    $review->update([
        'status' => 'approved',
        'reviewed_at' => now(),
        'reviewed_by' => User::factory()->create(['role' => 'admin'])->id,
    ]);

    expect(CompanyReview::where('company_id', $company->id)->where('status', 'approved')->count())
        ->toBe(1);
});
