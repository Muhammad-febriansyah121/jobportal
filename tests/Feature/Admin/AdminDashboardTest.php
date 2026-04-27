<?php

use App\Models\Company;
use App\Models\Payment;
use App\Models\PricingPlan;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected away from the admin dashboard', function () {
    $this->get(route('admin.dashboard'))
        ->assertRedirect(route('login'));
});

test('non admin users cannot access the admin dashboard', function () {
    $user = User::factory()->candidate()->create();

    $this->actingAs($user)
        ->get(route('admin.dashboard'))
        ->assertForbidden();
});

test('admin users can view the admin dashboard metrics', function () {
    $admin = User::factory()->admin()->create();
    $employer = User::factory()->employer()->create();
    User::factory()->candidate()->count(2)->create();

    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'PT Langganan Maju',
        'slug' => 'pt-langganan-maju',
        'description' => 'Perusahaan uji dashboard.',
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);

    $plan = PricingPlan::create([
        'name' => 'Business',
        'slug' => 'business-'.uniqid(),
        'price' => 150000,
        'duration_days' => 30,
        'is_active' => true,
    ]);

    $subscription = Subscription::create([
        'company_id' => $company->id,
        'pricing_plan_id' => $plan->id,
        'status' => 'active',
    ]);

    Payment::create([
        'company_id' => $company->id,
        'subscription_id' => $subscription->id,
        'amount' => 150000,
        'status' => 'paid',
        'provider' => 'pakasir',
        'provider_reference' => 'INV-PAID-1',
        'paid_at' => now(),
    ]);

    Payment::create([
        'company_id' => $company->id,
        'subscription_id' => $subscription->id,
        'amount' => 200000,
        'status' => 'pending',
        'provider' => 'pakasir',
        'provider_reference' => 'INV-PENDING-1',
    ]);

    Payment::create([
        'company_id' => $company->id,
        'subscription_id' => null,
        'amount' => 99000,
        'status' => 'paid',
        'provider' => 'pakasir',
        'provider_reference' => 'INV-NON-SUB-1',
        'paid_at' => now(),
    ]);

    Cache::forget('admin.dashboard.metrics');

    $this->actingAs($admin)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/dashboard')
            ->has('metrics')
            ->where('metrics.total_users', 4)
            ->where('metrics.total_candidates', 2)
            ->where('metrics.subscription_revenue_total', 150000)
            ->where('metrics.subscription_revenue_month', 150000)
        );
});
