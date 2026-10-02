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

test('campaign slug is generated and made unique automatically', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->post(route('admin.referral-campaigns.store'), [
        'name' => 'Referral Otomatis',
        'description' => 'Campaign pertama',
        'ai_token_amount' => 0,
        'cv_builder_quota' => 1,
        'ai_interview_quota' => 1,
        'validity_days' => 30,
        'is_active' => true,
    ])->assertRedirect();

    $this->actingAs($admin)->post(route('admin.referral-campaigns.store'), [
        'name' => 'Referral Otomatis',
        'description' => 'Campaign kedua',
        'ai_token_amount' => 0,
        'cv_builder_quota' => 1,
        'ai_interview_quota' => 1,
        'validity_days' => 30,
        'is_active' => true,
    ])->assertRedirect();

    expect(ReferralCampaign::query()->whereIn('slug', ['referral-otomatis', 'referral-otomatis-2'])->count())->toBe(2);
});

test('example', function () {
    $response = $this->get('/');

    $response->assertStatus(200);
});
