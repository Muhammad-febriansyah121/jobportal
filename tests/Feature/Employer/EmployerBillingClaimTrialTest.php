<?php

use App\Models\Company;
use App\Models\PricingPlan;
use App\Models\Subscription;
use App\Models\User;

beforeEach(function () {
    $this->employer = User::factory()->employer()->create();

    $this->company = Company::create([
        'owner_id' => $this->employer->id,
        'name' => 'Trial Co',
        'slug' => 'trial-co-'.uniqid(),
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);

    $this->trialPlan = PricingPlan::create([
        'name' => 'Trial',
        'slug' => 'trial-'.uniqid(),
        'price' => 0,
        'duration_days' => 14,
        'active_jobs_limit' => 2,
        'recruiter_seat_limit' => 1,
        'ai_screening_quota' => 0,
        'ai_interview_quota' => 5,
        'talent_search_quota' => 3,
        'features_json' => [],
        'is_active' => true,
        'is_trial' => true,
    ]);
});

test('employer can claim trial once and gets active subscription', function () {
    $this->actingAs($this->employer)
        ->post(route('employer.billing.claim-trial', ['pricingPlan' => $this->trialPlan->id]))
        ->assertRedirect(route('employer.billing.index'));

    $subscription = Subscription::query()
        ->where('company_id', $this->company->id)
        ->where('pricing_plan_id', $this->trialPlan->id)
        ->where('status', 'active')
        ->first();

    expect($subscription)->not->toBeNull();
    expect($subscription->starts_at)->not->toBeNull();
    expect($subscription->ends_at)->not->toBeNull();
    expect((int) $subscription->starts_at->diffInDays($subscription->ends_at))->toBe(14);
});

test('employer cannot claim trial twice', function () {
    Subscription::create([
        'company_id' => $this->company->id,
        'pricing_plan_id' => $this->trialPlan->id,
        'status' => 'expired',
        'starts_at' => now()->subDays(30),
        'ends_at' => now()->subDays(16),
    ]);

    $this->actingAs($this->employer)
        ->post(route('employer.billing.claim-trial', ['pricingPlan' => $this->trialPlan->id]))
        ->assertRedirect();

    $activeCount = Subscription::query()
        ->where('company_id', $this->company->id)
        ->where('pricing_plan_id', $this->trialPlan->id)
        ->where('status', 'active')
        ->count();

    expect($activeCount)->toBe(0);
});

test('claim-trial endpoint rejects non-trial plans', function () {
    $paid = PricingPlan::create([
        'name' => 'Paid',
        'slug' => 'paid-'.uniqid(),
        'price' => 100000,
        'duration_days' => 30,
        'active_jobs_limit' => 5,
        'recruiter_seat_limit' => 1,
        'ai_screening_quota' => 0,
        'ai_interview_quota' => 5,
        'talent_search_quota' => 5,
        'features_json' => [],
        'is_active' => true,
        'is_trial' => false,
    ]);

    $this->actingAs($this->employer)
        ->post(route('employer.billing.claim-trial', ['pricingPlan' => $paid->id]))
        ->assertStatus(422);
});

test('billing page exposes hasClaimedTrial and trial_claimable flags', function () {
    $this->actingAs($this->employer)
        ->get(route('employer.billing.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('employer/billing')
            ->where('hasClaimedTrial', false)
            ->etc()
        );

    Subscription::create([
        'company_id' => $this->company->id,
        'pricing_plan_id' => $this->trialPlan->id,
        'status' => 'active',
        'starts_at' => now(),
        'ends_at' => now()->addDays(14),
    ]);

    $this->actingAs($this->employer)
        ->get(route('employer.billing.index'))
        ->assertInertia(fn ($page) => $page
            ->component('employer/billing')
            ->where('hasClaimedTrial', true)
            ->etc()
        );
});
