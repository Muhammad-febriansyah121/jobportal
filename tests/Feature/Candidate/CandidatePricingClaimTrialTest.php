<?php

use App\Models\CandidatePricingMenu;
use App\Models\CandidateProfile;
use App\Models\CandidateWalletTransaction;
use App\Models\User;

beforeEach(function () {
    $this->candidate = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);

    $this->profile = CandidateProfile::create([
        'user_id' => $this->candidate->id,
        'profile_completion' => 100,
        'full_name' => 'Sari Dev',
        'work_mode_pref' => 'any',
        'cv_builder_quota_balance' => 0,
        'ai_interview_quota_balance' => 0,
    ]);

    $this->trialMenu = CandidatePricingMenu::create([
        'name' => 'Trial Jobseeker',
        'slug' => 'trial-jobseeker-'.uniqid(),
        'description' => 'Trial 7 hari',
        'price' => 0,
        'ai_token_amount' => 0,
        'cv_builder_quota' => 1,
        'ai_interview_quota' => 2,
        'validity_days' => 7,
        'features_json' => [],
        'is_default_free' => false,
        'is_active' => true,
        'is_trial' => true,
    ]);
});

test('candidate can claim trial once and gets quota credited', function () {
    $this->actingAs($this->candidate)
        ->post(route('candidate.pricing.claim-trial', ['candidatePricingMenu' => $this->trialMenu->id]))
        ->assertRedirect();

    $this->profile->refresh();

    expect((int) $this->profile->cv_builder_quota_balance)->toBe(1);
    expect((int) $this->profile->ai_interview_quota_balance)->toBe(2);
    expect($this->profile->ai_interview_quota_expires_at)->not->toBeNull();

    $transaction = CandidateWalletTransaction::query()
        ->where('candidate_id', $this->profile->id)
        ->where('source', 'trial')
        ->first();

    expect($transaction)->not->toBeNull();
    expect($transaction->status)->toBe('paid');
    expect((int) $transaction->cv_builder_quota_delta)->toBe(1);
    expect((int) $transaction->ai_interview_quota_delta)->toBe(2);
    expect((int) $transaction->amount)->toBe(0);
    expect($transaction->expires_at)->not->toBeNull();
});

test('candidate cannot claim trial twice', function () {
    CandidateWalletTransaction::create([
        'candidate_id' => $this->profile->id,
        'candidate_pricing_menu_id' => $this->trialMenu->id,
        'order_id' => 'TRIAL-OLD-1',
        'type' => 'credit',
        'source' => 'trial',
        'ai_token_delta' => 0,
        'cv_builder_quota_delta' => 1,
        'ai_interview_quota_delta' => 2,
        'amount' => 0,
        'status' => 'paid',
        'paid_at' => now()->subDays(30),
        'expires_at' => now()->subDays(23),
    ]);

    $this->actingAs($this->candidate)
        ->post(route('candidate.pricing.claim-trial', ['candidatePricingMenu' => $this->trialMenu->id]))
        ->assertRedirect();

    $this->profile->refresh();

    // No additional credit applied
    expect((int) $this->profile->cv_builder_quota_balance)->toBe(0);
    expect((int) $this->profile->ai_interview_quota_balance)->toBe(0);

    expect(CandidateWalletTransaction::query()->where('source', 'trial')->count())->toBe(1);
});

test('claim-trial endpoint rejects non-trial menus', function () {
    $paid = CandidatePricingMenu::create([
        'name' => 'Paid',
        'slug' => 'paid-'.uniqid(),
        'description' => 'Paid menu',
        'price' => 45000,
        'ai_token_amount' => 0,
        'cv_builder_quota' => 1,
        'ai_interview_quota' => 5,
        'validity_days' => 30,
        'features_json' => [],
        'is_default_free' => false,
        'is_active' => true,
        'is_trial' => false,
    ]);

    $this->actingAs($this->candidate)
        ->post(route('candidate.pricing.claim-trial', ['candidatePricingMenu' => $paid->id]))
        ->assertStatus(422);
});

test('pricing index exposes hasClaimedTrial and trial_claimable flags', function () {
    $this->actingAs($this->candidate)
        ->get(route('candidate.pricing.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('candidate/pricing')
            ->where('hasClaimedTrial', false)
            ->etc()
        );

    CandidateWalletTransaction::create([
        'candidate_id' => $this->profile->id,
        'candidate_pricing_menu_id' => $this->trialMenu->id,
        'order_id' => 'TRIAL-1',
        'type' => 'credit',
        'source' => 'trial',
        'ai_token_delta' => 0,
        'cv_builder_quota_delta' => 1,
        'ai_interview_quota_delta' => 2,
        'amount' => 0,
        'status' => 'paid',
        'paid_at' => now(),
        'expires_at' => now()->addDays(7),
    ]);

    $this->actingAs($this->candidate)
        ->get(route('candidate.pricing.index'))
        ->assertInertia(fn ($page) => $page
            ->component('candidate/pricing')
            ->where('hasClaimedTrial', true)
            ->etc()
        );
});
