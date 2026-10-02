<?php

use App\Models\CandidateProfile;
use App\Models\CandidateWalletTransaction;
use App\Models\ReferralCampaign;
use App\Models\ReferralCode;
use App\Models\ReferralRedemption;
use App\Models\User;

beforeEach(function () {
    $this->candidate = User::factory()->candidate()->create(['onboarding_completed_at' => now()]);
    $this->profile = CandidateProfile::create([
        'user_id' => $this->candidate->id,
        'profile_completion' => 100,
        'full_name' => 'Referral Candidate',
        'work_mode_pref' => 'any',
        'cv_builder_quota_balance' => 0,
        'ai_interview_quota_balance' => 0,
    ]);
    $this->campaign = ReferralCampaign::create([
        'name' => 'October Referral',
        'slug' => 'october-referral-'.uniqid(),
        'ai_token_amount' => 1000,
        'cv_builder_quota' => 1,
        'ai_interview_quota' => 2,
        'validity_days' => 30,
        'is_active' => true,
    ]);
    $this->code = ReferralCode::create([
        'referral_campaign_id' => $this->campaign->id,
        'code' => 'FRIEND-100',
        'max_redemptions' => 2,
        'is_active' => true,
    ]);
});

test('candidate can redeem referral code and receive wallet credit', function () {
    $this->actingAs($this->candidate)
        ->post(route('candidate.pricing.redeem-voucher'), ['code' => ' friend-100 '])
        ->assertRedirect();

    $this->profile->refresh();
    expect((int) $this->profile->ai_token_balance)->toBe(1000)
        ->and((int) $this->profile->cv_builder_quota_balance)->toBe(1)
        ->and((int) $this->profile->ai_interview_quota_balance)->toBe(2);
    expect(ReferralRedemption::count())->toBe(1);
    expect(CandidateWalletTransaction::query()->where('source', 'referral_voucher')->count())->toBe(1);
});

test('candidate cannot redeem same referral campaign twice', function () {
    $this->actingAs($this->candidate)->post(route('candidate.pricing.redeem-voucher'), ['code' => 'FRIEND-100']);
    $this->actingAs($this->candidate)->post(route('candidate.pricing.redeem-voucher'), ['code' => 'FRIEND-100']);

    expect(ReferralRedemption::count())->toBe(1)
        ->and(CandidateWalletTransaction::query()->where('source', 'referral_voucher')->count())->toBe(1);
});

test('inactive referral code is rejected without wallet mutation', function () {
    $this->code->update(['is_active' => false]);

    $this->actingAs($this->candidate)
        ->post(route('candidate.pricing.redeem-voucher'), ['code' => 'FRIEND-100'])
        ->assertSessionHasErrors('code');

    expect(ReferralRedemption::count())->toBe(0)
        ->and(CandidateWalletTransaction::query()->where('source', 'referral_voucher')->count())->toBe(0);
});

test('pricing page renders voucher expiry without a paid topup', function () {
    $this->actingAs($this->candidate)
        ->post(route('candidate.pricing.redeem-voucher'), ['code' => 'FRIEND-100'])
        ->assertRedirect();

    $this->actingAs($this->candidate)
        ->get(route('candidate.pricing.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('candidate/pricing')
            ->where('wallet.cv_builder_quota_expires_at', fn (mixed $value): bool => is_string($value))
            ->etc()
        );
});

test('candidate receives an automatic referral code and can view share link', function () {
    $this->campaign->update(['max_referrals_per_user' => 10]);

    $this->actingAs($this->candidate)
        ->get(route('candidate.referral'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('candidate/referral')
            ->where('referral.campaign', 'October Referral')
            ->where('referral.successful_redemptions', 0)
            ->where('referral.max_redemptions', 10)
            ->where('referral.share_url', fn (mixed $value): bool => is_string($value) && str_contains($value, 'referral_code=KARIVIA-'))
            ->etc()
        );

    expect(ReferralCode::query()
        ->where('referral_campaign_id', $this->campaign->id)
        ->where('owner_user_id', $this->candidate->id)
        ->count())->toBe(1);
});

test('example', function () {
    $response = $this->get('/');

    $response->assertStatus(200);
});
