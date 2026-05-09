<?php

use App\Models\Company;
use App\Models\Payment;
use App\Models\PricingPlan;
use App\Models\Setting;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Support\Facades\Http;

use function Pest\Laravel\actingAs;

beforeEach(function () {
    Setting::set('pakasir_project', 'test-project');
    Setting::set('pakasir_api_key', 'test-api-key');
});

function createEmployerWithCompany(): array
{
    $employer = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Test Corp',
        'slug' => 'test-corp',
        'description' => 'Test company.',
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);

    return [$employer, $company];
}

function createActivePlan(int $price = 99000, int $durationDays = 30): PricingPlan
{
    return PricingPlan::create([
        'name' => 'Pro Plan',
        'slug' => 'pro-plan-'.uniqid(),
        'price' => $price,
        'duration_days' => $durationDays,
        'is_active' => true,
    ]);
}

test('employer can purchase a paid plan and is redirected to pakasir', function () {
    [$employer, $company] = createEmployerWithCompany();
    $plan = createActivePlan();

    $response = actingAs($employer)
        ->withHeader('X-Inertia', 'true')
        ->post(route('employer.billing.purchase', $plan));

    // Inertia::location() returns 409 with X-Inertia-Location header for Inertia requests
    $response->assertStatus(409);
    $response->assertHeader('X-Inertia-Location');

    $location = $response->headers->get('X-Inertia-Location');
    expect($location)->toContain('app.pakasir.com/pay/test-project/99000');

    $subscription = Subscription::where('company_id', $company->id)->first();
    expect($subscription)->not->toBeNull();
    expect($subscription->status)->toBe('pending');
    expect($subscription->pricing_plan_id)->toBe($plan->id);

    $payment = Payment::where('company_id', $company->id)->first();
    expect($payment)->not->toBeNull();
    expect($payment->status)->toBe('pending');
    expect($payment->amount)->toBe(99000);
    expect($payment->provider)->toBe('pakasir');
    expect($payment->provider_reference)->toStartWith('INV-'.$company->id.'-');
});

test('purchasing a plan cancels any existing pending subscription', function () {
    [$employer, $company] = createEmployerWithCompany();
    $oldPlan = createActivePlan(49000);
    $newPlan = createActivePlan(199000);

    $oldSubscription = $company->subscriptions()->create([
        'pricing_plan_id' => $oldPlan->id,
        'status' => 'pending',
    ]);
    Payment::create([
        'company_id' => $company->id,
        'subscription_id' => $oldSubscription->id,
        'amount' => 49000,
        'status' => 'pending',
        'provider' => 'pakasir',
        'provider_reference' => 'INV-OLD-1',
    ]);

    actingAs($employer)
        ->withHeader('X-Inertia', 'true')
        ->post(route('employer.billing.purchase', $newPlan))
        ->assertStatus(409);

    $oldSubscription->refresh();
    expect($oldSubscription->status)->toBe('cancelled');

    $oldPayment = Payment::where('provider_reference', 'INV-OLD-1')->first();
    expect($oldPayment?->status)->toBe('failed');

    expect(Subscription::where('company_id', $company->id)->where('status', 'pending')->count())->toBe(1);
});

test('employer without company cannot purchase a plan', function () {
    $employer = User::factory()->employer()->create();
    $plan = createActivePlan();

    actingAs($employer)
        ->post(route('employer.billing.purchase', $plan))
        ->assertForbidden();
});

test('inactive plan cannot be purchased', function () {
    [$employer] = createEmployerWithCompany();
    $plan = PricingPlan::create([
        'name' => 'Inactive Plan',
        'slug' => 'inactive-plan-'.uniqid(),
        'price' => 99000,
        'duration_days' => 30,
        'is_active' => false,
    ]);

    actingAs($employer)
        ->post(route('employer.billing.purchase', $plan))
        ->assertNotFound();
});

test('free plan cannot be purchased through payment flow', function () {
    [$employer] = createEmployerWithCompany();
    $plan = PricingPlan::create([
        'name' => 'Free Plan',
        'slug' => 'free-plan-'.uniqid(),
        'price' => 0,
        'duration_days' => 0,
        'is_active' => true,
    ]);

    actingAs($employer)
        ->post(route('employer.billing.purchase', $plan))
        ->assertStatus(422);
});

test('employer can cancel a pending payment', function () {
    Http::fake(['*' => Http::response(['status' => 'cancelled'], 200)]);

    [$employer, $company] = createEmployerWithCompany();
    $plan = createActivePlan();

    $subscription = $company->subscriptions()->create([
        'pricing_plan_id' => $plan->id,
        'status' => 'pending',
    ]);
    $payment = Payment::create([
        'company_id' => $company->id,
        'subscription_id' => $subscription->id,
        'amount' => 99000,
        'status' => 'pending',
        'provider' => 'pakasir',
        'provider_reference' => 'INV-1-1-123',
    ]);

    actingAs($employer)
        ->post(route('employer.billing.payment.cancel', $payment))
        ->assertRedirect(route('employer.billing.index'));

    $payment->refresh();
    $subscription->refresh();

    expect($payment->status)->toBe('failed');
    expect($subscription->status)->toBe('cancelled');
});

test('employer cannot cancel another company payment', function () {
    [$employer] = createEmployerWithCompany();

    $otherEmployer = User::factory()->employer()->create();
    $otherCompany = Company::create([
        'owner_id' => $otherEmployer->id,
        'name' => 'Other Corp',
        'slug' => 'other-corp',
        'description' => 'Other company.',
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);
    $plan = createActivePlan();
    $otherSubscription = $otherCompany->subscriptions()->create([
        'pricing_plan_id' => $plan->id,
        'status' => 'pending',
    ]);
    $otherPayment = Payment::create([
        'company_id' => $otherCompany->id,
        'subscription_id' => $otherSubscription->id,
        'amount' => 99000,
        'status' => 'pending',
        'provider' => 'pakasir',
        'provider_reference' => 'INV-OTHER',
    ]);

    actingAs($employer)
        ->post(route('employer.billing.payment.cancel', $otherPayment))
        ->assertForbidden();
});

test('pakasir webhook activates subscription with correct dates', function () {
    [$employer, $company] = createEmployerWithCompany();
    $plan = createActivePlan(price: 99000, durationDays: 30);

    $subscription = $company->subscriptions()->create([
        'pricing_plan_id' => $plan->id,
        'status' => 'pending',
    ]);
    Payment::create([
        'company_id' => $company->id,
        'subscription_id' => $subscription->id,
        'amount' => 99000,
        'status' => 'pending',
        'provider' => 'pakasir',
        'provider_reference' => 'INV-WH-TEST',
    ]);

    $this->post(route('webhooks.pakasir'), [
        'order_id' => 'INV-WH-TEST',
        'status' => 'completed',
        'amount' => 99000,
        'project' => 'test-project',
        'payment_method' => 'qris',
        'completed_at' => now()->toIso8601String(),
    ])->assertNoContent();

    $payment = Payment::where('provider_reference', 'INV-WH-TEST')->first();
    $subscription->refresh();

    expect($payment->status)->toBe('paid');
    expect($payment->paid_at)->not->toBeNull();
    expect($subscription->status)->toBe('active');
    expect($subscription->starts_at)->not->toBeNull();
    expect($subscription->ends_at)->not->toBeNull();
    expect((int) $subscription->starts_at->diffInDays($subscription->ends_at))->toBe(30);
});
