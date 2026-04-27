<?php

use App\Models\CandidateProfile;
use App\Models\Company;
use App\Models\CompanyReview;
use App\Models\User;

use function Pest\Laravel\actingAs;

function reviewReplyScenario(): array
{
    $employer = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Reply Co',
        'slug' => 'reply-co-'.uniqid(),
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
        'rating' => 5,
        'review' => 'Bagus banget.',
        'status' => 'approved',
        'reviewed_at' => now(),
    ]);

    return [$employer, $review, $company];
}

test('employer can reply to an approved review on their company', function () {
    [$employer, $review] = reviewReplyScenario();

    actingAs($employer)
        ->post(route('employer.reviews.reply', $review), [
            'employer_reply' => 'Terima kasih atas ulasannya!',
        ])
        ->assertRedirect();

    $review->refresh();

    expect($review->employer_reply)->toBe('Terima kasih atas ulasannya!')
        ->and($review->employer_replied_by)->toBe($employer->id)
        ->and($review->employer_replied_at)->not->toBeNull();
});

test('employer can flag an abusive review for admin review', function () {
    [$employer, $review] = reviewReplyScenario();

    actingAs($employer)
        ->post(route('employer.reviews.flag', $review), [
            'flag_reason' => 'Bukan eks-karyawan kami, isinya fitnah.',
        ])
        ->assertRedirect();

    $review->refresh();

    expect($review->flag_reason)->toBe('Bukan eks-karyawan kami, isinya fitnah.')
        ->and($review->flagged_by)->toBe($employer->id)
        ->and($review->flagged_at)->not->toBeNull()
        ->and($review->flag_resolved_at)->toBeNull();
});

test('employer from another company cannot reply or flag', function () {
    [, $review] = reviewReplyScenario();

    $stranger = User::factory()->employer()->create();
    Company::create([
        'owner_id' => $stranger->id,
        'name' => 'Other Co',
        'slug' => 'other-co-'.uniqid(),
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);

    actingAs($stranger)
        ->post(route('employer.reviews.reply', $review), [
            'employer_reply' => 'Test',
        ])
        ->assertNotFound();

    actingAs($stranger)
        ->post(route('employer.reviews.flag', $review), [
            'flag_reason' => 'Coba flag walau bukan punya saya.',
        ])
        ->assertNotFound();
});

test('admin approving a flagged review sets flag_resolved_at', function () {
    [$employer, $review] = reviewReplyScenario();

    actingAs($employer)
        ->post(route('employer.reviews.flag', $review), [
            'flag_reason' => 'Tolong ditinjau ulang.',
        ])
        ->assertRedirect();

    $admin = User::factory()->create(['role' => 'admin']);

    actingAs($admin)
        ->patch(route('admin.company-reviews.approve', $review))
        ->assertRedirect();

    $review->refresh();

    expect($review->flag_resolved_at)->not->toBeNull();
});
