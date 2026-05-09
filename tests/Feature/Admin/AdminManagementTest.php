<?php

use App\Models\ActivityLog;
use App\Models\AssessmentQuestion;
use App\Models\CandidatePricingMenu;
use App\Models\CareerResource;
use App\Models\Company;
use App\Models\CompanyVerification;
use App\Models\Industry;
use App\Models\JobListing;
use App\Models\PricingPlan;
use App\Models\Skill;
use App\Models\Subscription;
use App\Models\User;
use App\Models\UserNotification;
use App\Services\AiService;
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

test('admin can manage assessment question bank and generate ai questions', function () {
    $admin = User::factory()->admin()->create();
    $skill = Skill::create([
        'name' => 'TypeScript',
        'slug' => 'typescript',
        'category' => 'Frontend',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.assessment-questions.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/assessment-questions/create')
            ->where('title', 'Tambah Bank Soal')
            ->etc()
        );

    $this->actingAs($admin)
        ->post(route('admin.assessment-questions.store'), [
            'mode' => 'manual',
            'skill_id' => $skill->id,
            'difficulty' => 'medium',
            'manual_questions' => [
                [
                    'question' => 'Apa manfaat type inference di TypeScript?',
                    'option_a' => 'Mengurangi kebutuhan anotasi tipe eksplisit',
                    'option_b' => 'Menghapus compile step',
                    'option_c' => 'Membuat JS jadi strongly typed saat runtime',
                    'option_d' => 'Menghilangkan error handling',
                    'correct_option_index' => 0,
                ],
                [
                    'question' => 'Apa peran interface di TypeScript?',
                    'option_a' => 'Menentukan kontrak bentuk object',
                    'option_b' => 'Menjalankan unit test',
                    'option_c' => 'Menghapus compile warning',
                    'option_d' => 'Membuat CSS module',
                    'correct_option_index' => 0,
                ],
            ],
            'is_active' => 1,
        ])
        ->assertRedirect();

    $question = AssessmentQuestion::firstOrFail();

    expect($question->source)->toBe('admin');
    expect($question->question)->toContain('type inference');
    expect(AssessmentQuestion::query()->where('source', 'admin')->count())->toBe(2);

    $this->actingAs($admin)
        ->get(route('admin.assessment-questions.edit', $question))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/assessment-questions/edit')
            ->where('question.id', $question->id)
            ->etc()
        );

    $this->actingAs($admin)
        ->patch(route('admin.assessment-questions.update', $question), [
            'skill_id' => $skill->id,
            'difficulty' => 'hard',
            'question' => 'Apa fungsi discriminated union di TypeScript?',
            'option_a' => 'Validasi schema DB',
            'option_b' => 'Narrowing tipe berbasis field pembeda',
            'option_c' => 'Rendering React otomatis',
            'option_d' => 'Transpile ke Python',
            'correct_option_index' => 1,
            'is_active' => 1,
        ])
        ->assertRedirect();

    expect($question->refresh()->difficulty)->toBe('hard');
    expect($question->question)->toContain('discriminated union');

    $this->mock(AiService::class, function ($mock): void {
        $mock->shouldReceive('chat')
            ->once()
            ->andReturn(json_encode([
                'questions' => [
                    [
                        'question' => 'Apa tujuan generic di TypeScript?',
                        'options' => ['Reusable type-safe code', 'Mempercepat CSS', 'Menggantikan HTML', 'Menghapus runtime'],
                        'answer_index' => 0,
                    ],
                    [
                        'question' => 'Kapan union type dipakai?',
                        'options' => ['Saat nilai bisa beberapa tipe', 'Hanya untuk angka', 'Hanya untuk interface', 'Tidak pernah'],
                        'answer_index' => 0,
                    ],
                ],
            ]));
    });

    $this->actingAs($admin)
        ->post(route('admin.assessment-questions.store'), [
            'mode' => 'ai',
            'skill_id' => $skill->id,
            'difficulty' => 'easy',
            'total_questions' => 2,
        ])
        ->assertRedirect();

    expect(
        AssessmentQuestion::query()
            ->where('skill_id', $skill->id)
            ->where('source', 'ai')
            ->count()
    )->toBe(2);

    $this->actingAs($admin)
        ->delete(route('admin.assessment-questions.destroy', $question))
        ->assertRedirect();

    expect(AssessmentQuestion::query()->whereKey($question->id)->exists())->toBeFalse();
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
    $trialPlan = PricingPlan::updateOrCreate(
        ['slug' => 'gratis-trial'],
        [
            'name' => 'Gratis / Trial',
            'price' => 0,
            'duration_days' => 14,
            'active_jobs_limit' => 3,
            'recruiter_seat_limit' => 1,
            'ai_screening_quota' => 0,
            'talent_search_quota' => 1,
            'features_json' => ['14 Hari Masa Aktif'],
            'is_active' => true,
        ]
    );
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
    $trialSubscription = Subscription::query()
        ->where('company_id', $company->id)
        ->where('status', 'active')
        ->first();
    expect($trialSubscription)->not->toBeNull();
    expect($trialSubscription?->pricing_plan_id)->toBe($trialPlan->id);
    expect($trialSubscription?->starts_at)->not->toBeNull();
    expect($trialSubscription?->ends_at)->not->toBeNull();
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

    $plan = PricingPlan::where('slug', 'growth')->firstOrFail();

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

test('admin can create and view candidate pricing menu through dedicated pages', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.candidate-pricing-menus.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/candidate-pricing-menus/create')
            ->where('title', 'Tambah Pricing Kandidat')
        );

    $this->actingAs($admin)
        ->post(route('admin.candidate-pricing-menus.store'), [
            'name' => 'Paket Premium Kandidat',
            'description' => 'Paket lengkap kandidat.',
            'price' => 45000,
            'ai_interview_quota' => 5,
            'cv_builder_quota' => 1,
            'validity_days' => 30,
            'features' => "Simulasi AI Interview\nPembuatan CV ATS",
            'is_default_free' => false,
            'is_active' => true,
        ])
        ->assertRedirect();

    $menu = CandidatePricingMenu::where('slug', 'paket-premium-kandidat')->firstOrFail();

    expect($menu->slug)->toBe('paket-premium-kandidat');
    expect($menu->features_json)->toBe([
        'Simulasi AI Interview',
        'Pembuatan CV ATS',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.candidate-pricing-menus.show', $menu))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/candidate-pricing-menus/show')
            ->where('menu.name', 'Paket Premium Kandidat')
            ->where('menu.price_label', 'Rp 45.000')
            ->where('menu.ai_interview_quota', 5)
            ->where('menu.cv_builder_quota', 1)
        );
});

test('admin can update candidate pricing menu from the edit page', function () {
    $admin = User::factory()->admin()->create();
    $menu = CandidatePricingMenu::create([
        'name' => 'Gratis CV Builder',
        'slug' => 'gratis-cv-builder',
        'description' => 'Akses awal kandidat.',
        'price' => 0,
        'ai_token_amount' => 0,
        'cv_builder_quota' => 1,
        'features_json' => ['1x CV Builder'],
        'is_default_free' => true,
        'is_active' => true,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.candidate-pricing-menus.edit', $menu))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/candidate-pricing-menus/edit')
            ->where('menu.name', 'Gratis CV Builder')
        );

    $this->actingAs($admin)
        ->patch(route('admin.candidate-pricing-menus.update', $menu), [
            'name' => 'Paket Career Bundle',
            'description' => 'Paket bundling kandidat.',
            'price' => 75000,
            'ai_interview_quota' => 10,
            'cv_builder_quota' => 5,
            'validity_days' => 60,
            'features' => "Simulasi AI Interview 10x\nCV Builder",
            'is_default_free' => false,
            'is_active' => true,
        ])
        ->assertRedirect(route('admin.candidate-pricing-menus.show', $menu));

    $menu->refresh();

    expect($menu->name)->toBe('Paket Career Bundle');
    expect($menu->slug)->toBe('paket-career-bundle');
    expect($menu->price)->toBe(75000);
    expect($menu->ai_interview_quota)->toBe(10);
    expect($menu->cv_builder_quota)->toBe(5);
    expect($menu->validity_days)->toBe(60);
    expect($menu->is_default_free)->toBeFalse();
    expect($menu->features_json)->toBe([
        'Simulasi AI Interview 10x',
        'CV Builder',
    ]);
});
