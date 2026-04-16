<?php

use App\Models\ActivityLog;
use App\Models\CareerResource;
use App\Models\Company;
use App\Models\CompanyVerification;
use App\Models\Industry;
use App\Models\JobListing;
use App\Models\PricingPlan;
use App\Models\Skill;
use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

test('admin can activate and deactivate a user with activity logs', function () {
    $admin = User::factory()->admin()->create();
    $user = User::factory()->candidate()->create();

    $this->actingAs($admin)
        ->patch(route('admin.users.deactivate', $user))
        ->assertRedirect();

    expect($user->refresh()->is_active)->toBeFalse();
    expect(ActivityLog::where('action', 'deactivate_user')->where('subject_id', $user->id)->exists())->toBeTrue();

    $this->actingAs($admin)
        ->patch(route('admin.users.activate', $user))
        ->assertRedirect();

    expect($user->refresh()->is_active)->toBeTrue();
    expect(ActivityLog::where('action', 'activate_user')->where('subject_id', $user->id)->exists())->toBeTrue();
});

test('admin can manage skills', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.skills.store'), [
            'name' => 'Laravel',
            'category' => 'Backend',
        ])
        ->assertRedirect();

    $skill = Skill::firstOrFail();

    expect($skill->name)->toBe('Laravel');
    expect($skill->slug)->toBe('laravel');
    expect($skill->category)->toBe('Backend');

    $this->actingAs($admin)
        ->patch(route('admin.skills.update', $skill), [
            'name' => 'Laravel Octane',
            'category' => 'Backend',
        ])
        ->assertRedirect();

    expect($skill->refresh()->name)->toBe('Laravel Octane');
    expect($skill->slug)->toBe('laravel-octane');

    $this->actingAs($admin)
        ->delete(route('admin.skills.destroy', $skill))
        ->assertRedirect();

    expect(Skill::query()->exists())->toBeFalse();
});

test('admin resource slugs are generated from names without manual input', function () {
    $admin = User::factory()->admin()->create();
    Skill::create([
        'name' => 'Product Design',
        'slug' => 'product-design',
        'category' => 'Design',
    ]);

    $this->actingAs($admin)
        ->post(route('admin.industries.store'), [
            'name' => 'Financial Services',
        ])
        ->assertRedirect();

    $this->actingAs($admin)
        ->post(route('admin.skills.store'), [
            'name' => 'Product Design',
            'category' => 'Design',
        ])
        ->assertRedirect();

    expect(Industry::firstWhere('name', 'Financial Services')?->slug)->toBe('financial-services');
    expect(Skill::query()->where('name', 'Product Design')->latest('id')->first()?->slug)->toBe('product-design-1');
});

test('admin can approve company verification and notify the owner', function () {
    $admin = User::factory()->admin()->create();
    $owner = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $owner->id,
        'name' => 'Karivia Labs',
        'slug' => 'karivia-labs',
        'verification_status' => 'pending',
    ]);
    $verification = CompanyVerification::create([
        'company_id' => $company->id,
        'submitted_by' => $owner->id,
        'legal_name' => 'PT Karivia Labs',
        'nib' => '1234567890',
        'npwp' => '09.123.456.7-890.000',
        'status' => 'pending',
    ]);

    $this->actingAs($admin)
        ->patch(route('admin.company-verifications.approve', $verification))
        ->assertRedirect();

    expect($verification->refresh()->status)->toBe('approved');
    expect($company->refresh()->is_verified)->toBeTrue();
    expect($company->verification_status)->toBe('approved');
    expect(UserNotification::where('user_id', $owner->id)->where('type', 'company_verification')->exists())->toBeTrue();
    expect(ActivityLog::where('action', 'approve_company_verification')->where('subject_id', $verification->id)->exists())->toBeTrue();
});

test('admin can update job integrity score and publish a job', function () {
    $admin = User::factory()->admin()->create();
    $owner = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $owner->id,
        'name' => 'Karivia Labs',
        'slug' => 'karivia-labs',
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $owner->id,
        'title' => 'Backend Engineer',
        'slug' => 'backend-engineer',
        'description' => 'Build reliable Laravel systems.',
        'status' => 'pending_review',
    ]);

    $this->actingAs($admin)
        ->patch(route('admin.jobs.integrity-score', $job), [
            'integrity_score' => 92,
        ])
        ->assertRedirect();

    expect($job->refresh()->integrity_score)->toBe(92);

    $this->actingAs($admin)
        ->patch(route('admin.jobs.publish', $job))
        ->assertRedirect();

    expect($job->refresh()->status)->toBe('published');
    expect($job->published_at)->not->toBeNull();
    expect(ActivityLog::where('action', 'publish_job')->where('subject_id', $job->id)->exists())->toBeTrue();
});

test('admin can create a career resource with thumbnail and view its detail page', function () {
    Storage::fake('public');
    $admin = User::factory()->admin()->create();
    $thumbnail = UploadedFile::fake()->image('thumbnail.jpg', 1200, 630);

    $this->actingAs($admin)
        ->get(route('admin.career-resources.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/career-resources/create')
            ->where('title', 'Tambah Career Resource')
        );

    $this->actingAs($admin)
        ->post(route('admin.career-resources.store'), [
            'title' => 'Cara Menjawab Pertanyaan Gaji',
            'type' => 'article',
            'category' => 'Karir Strategi',
            'thumbnail' => $thumbnail,
            'content' => '<p>Siapkan rentang gaji yang realistis.</p>',
        ])
        ->assertRedirect();

    $resource = CareerResource::firstOrFail();

    expect($resource->thumbnail_path)->not->toBeNull();
    expect($resource->slug)->toBe('cara-menjawab-pertanyaan-gaji');
    Storage::disk('public')->assertExists($resource->thumbnail_path);

    $this->actingAs($admin)
        ->get(route('admin.career-resources.show', $resource))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/career-resources/show')
            ->where('resource.title', 'Cara Menjawab Pertanyaan Gaji')
            ->where('resource.thumbnail_url', Storage::disk('public')->url($resource->thumbnail_path))
        );
});

test('admin can replace a career resource thumbnail from the edit page', function () {
    Storage::fake('public');
    $admin = User::factory()->admin()->create();
    $oldThumbnail = 'career-resources/old.jpg';
    Storage::disk('public')->put($oldThumbnail, 'old-thumbnail');
    $resource = CareerResource::create([
        'title' => 'Portfolio UX',
        'slug' => 'portfolio-ux',
        'type' => 'guide',
        'category' => 'Portfolio',
        'thumbnail_path' => $oldThumbnail,
        'content' => '<p>Mulai dari studi kasus terbaik.</p>',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.career-resources.edit', $resource))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/career-resources/edit')
            ->where('resource.title', 'Portfolio UX')
        );

    $this->actingAs($admin)
        ->post(route('admin.career-resources.update', $resource), [
            '_method' => 'patch',
            'title' => 'Portfolio UX Designer',
            'type' => 'guide',
            'category' => 'Portfolio',
            'thumbnail' => UploadedFile::fake()->image('new-thumbnail.png', 1200, 630),
            'content' => '<p>Pilih tiga studi kasus paling kuat.</p>',
        ])
        ->assertRedirect(route('admin.career-resources.show', $resource));

    $resource->refresh();

    expect($resource->title)->toBe('Portfolio UX Designer');
    expect($resource->slug)->toBe('portfolio-ux-designer');
    expect($resource->thumbnail_path)->not->toBe($oldThumbnail);
    Storage::disk('public')->assertMissing($oldThumbnail);
    Storage::disk('public')->assertExists($resource->thumbnail_path);
});

test('admin can create and view a pricing plan through dedicated pages', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.pricing-plans.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/pricing-plans/create')
            ->where('title', 'Tambah Pricing Plan')
        );

    $this->actingAs($admin)
        ->post(route('admin.pricing-plans.store'), [
            'name' => 'Growth',
            'price' => 499000,
            'duration_days' => 30,
            'active_jobs_limit' => 10,
            'recruiter_seat_limit' => 3,
            'ai_screening_quota' => 100,
            'talent_search_quota' => 50,
            'features' => "AI screening kandidat\nTalent search\nDashboard analytics",
            'is_active' => true,
        ])
        ->assertRedirect();

    $plan = PricingPlan::firstOrFail();

    expect($plan->slug)->toBe('growth');
    expect($plan->features_json)->toBe([
        'AI screening kandidat',
        'Talent search',
        'Dashboard analytics',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.pricing-plans.show', $plan))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/pricing-plans/show')
            ->where('plan.name', 'Growth')
            ->where('plan.price_label', 'Rp 499.000')
            ->where('plan.duration_label', '1 Bulan Masa Aktif')
            ->where('plan.active_jobs_limit', 10)
        );
});

test('admin can update a pricing plan from the edit page', function () {
    $admin = User::factory()->admin()->create();
    $plan = PricingPlan::create([
        'name' => 'Starter',
        'slug' => 'starter',
        'price' => 99000,
        'duration_days' => 14,
        'active_jobs_limit' => 3,
        'recruiter_seat_limit' => 1,
        'ai_screening_quota' => 20,
        'talent_search_quota' => 10,
        'features_json' => ['Basic analytics'],
        'is_active' => true,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.pricing-plans.edit', $plan))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/pricing-plans/edit')
            ->where('plan.name', 'Starter')
        );

    $this->actingAs($admin)
        ->patch(route('admin.pricing-plans.update', $plan), [
            'name' => 'Starter Plus',
            'price' => 149000,
            'duration_days' => 14,
            'active_jobs_limit' => 5,
            'recruiter_seat_limit' => 2,
            'ai_screening_quota' => 35,
            'talent_search_quota' => 15,
            'features' => "Basic analytics\nPriority support",
            'is_active' => false,
        ])
        ->assertRedirect(route('admin.pricing-plans.show', $plan));

    $plan->refresh();

    expect($plan->name)->toBe('Starter Plus');
    expect($plan->slug)->toBe('starter-plus');
    expect($plan->price)->toBe(149000);
    expect($plan->duration_days)->toBe(14);
    expect($plan->is_active)->toBeFalse();
    expect($plan->features_json)->toBe(['Basic analytics', 'Priority support']);
});
