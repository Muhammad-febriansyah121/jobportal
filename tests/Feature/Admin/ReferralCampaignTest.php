<?php

use App\Models\ReferralCampaign;
use App\Models\ReferralCode;
use App\Models\User;

test('admin can create referral campaign and code', function () {
    $admin = User::factory()->admin()->create();
    $owner = User::factory()->candidate()->create();

    $this->actingAs($admin)
        ->post(route('admin.referral-campaigns.store'), [
            'name' => 'Partner October',
            'slug' => 'partner-october',
            'description' => 'Partner campaign',
            'ai_token_amount' => 500,
            'cv_builder_quota' => 1,
            'ai_interview_quota' => 2,
            'validity_days' => 30,
            'max_redemptions' => 100,
            'is_active' => true,
            'codes' => 'PARTNER-500',
            'owner_email' => $owner->email,
        ])
        ->assertRedirect(route('admin.referral-campaigns.index'));

    expect(ReferralCampaign::where('slug', 'partner-october')->exists())->toBeTrue();
    expect(ReferralCode::where('code', 'PARTNER-500')->value('owner_user_id'))->toBe($owner->id);
});

test('example', function () {
    $response = $this->get('/');

    $response->assertStatus(200);
});
