<?php

use App\Models\CandidateProfile;
use App\Models\ReferralCampaign;
use App\Models\ReferralCode;
use App\Models\ReferralRedemption;
use App\Models\User;

test('admin can view referral usage report', function () {
    $admin = User::factory()->admin()->create();
    $candidateUser = User::factory()->candidate()->create();
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => $candidateUser->name,
        'work_mode_pref' => 'any',
    ]);
    $campaign = ReferralCampaign::factory()->create();
    $code = ReferralCode::create([
        'referral_campaign_id' => $campaign->id,
        'owner_user_id' => $admin->id,
        'code' => 'ADMIN-REF-1',
        'is_active' => true,
    ]);
    ReferralRedemption::create([
        'referral_campaign_id' => $campaign->id,
        'referral_code_id' => $code->id,
        'candidate_id' => $candidate->id,
        'status' => 'success',
        'redeemed_at' => now(),
        'expires_at' => now()->addDays(30),
    ]);

    $this->actingAs($admin)
        ->get(route('admin.referral-reports'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/referral-reports')
            ->where('summary.total_redemptions', 1)
            ->where('summary.unique_candidates', 1)
            ->where('codes.0.code', 'ADMIN-REF-1')
            ->where('codes.0.successful_redemptions', 1)
            ->where('recentRedemptions.0.candidate.email', $candidateUser->email)
            ->etc()
        );
});

test('example', function () {
    $response = $this->get('/');

    $response->assertStatus(200);
});
