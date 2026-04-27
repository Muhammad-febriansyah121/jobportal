<?php

use App\Actions\Candidate\CandidateWalletManager;
use App\Actions\Candidate\ResolveCandidateProfile;
use App\Models\CandidateCv;
use App\Models\CandidatePricingMenu;
use App\Models\CandidateWalletTransaction;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;

function markCandidateOnboarded(User $user): void
{
    $user->forceFill(['onboarding_completed_at' => now()])->save();
}

test('candidate can save cv builder data', function () {
    $user = User::factory()->candidate()->create();
    markCandidateOnboarded($user);
    $this->actingAs($user);

    $response = $this->post(route('candidate.cvs.builder-save'), [
        'template' => 'ats',
        'title' => 'CV Product Engineer',
        'summary' => 'Product engineer with strong backend focus.',
        'personal' => [
            'full_name' => 'Raka Pratama',
            'headline' => 'Product Engineer',
            'email' => 'raka@example.com',
            'phone' => '08123456789',
            'city' => 'Jakarta',
            'linkedin' => 'https://linkedin.com/in/raka',
            'github' => 'https://github.com/raka',
            'portfolio' => 'https://raka.dev',
        ],
        'skills' => ['Laravel', 'React', 'System Design'],
        'experiences' => [
            [
                'job_title' => 'Software Engineer',
                'company_name' => 'Karivia Labs',
                'location' => 'Jakarta',
                'start_date' => 'Jan 2023',
                'end_date' => 'Sekarang',
                'is_current' => true,
                'description' => 'Meningkatkan conversion funnel 18%.',
            ],
        ],
        'educations' => [],
        'projects' => [],
        'certifications' => [],
    ]);

    $response->assertRedirect();

    $candidate = app(ResolveCandidateProfile::class)->handle($user)->refresh();
    expect($candidate->cv_builder_json)->toBeArray();
    expect($candidate->cv_builder_json['template'])->toBe('ats');
    expect($candidate->cv_builder_json['title'])->toBe('CV Product Engineer');
    expect($candidate->cv_builder_json['personal']['full_name'])->toBe('Raka Pratama');
    expect($candidate->cv_builder_updated_at)->not->toBeNull();
});

test('candidate cannot save non ats template', function () {
    $user = User::factory()->candidate()->create();
    markCandidateOnboarded($user);

    $response = $this->actingAs($user)->post(route('candidate.cvs.builder-save'), [
        'template' => 'modern',
        'title' => 'CV Product Engineer',
        'summary' => 'Product engineer with strong backend focus.',
        'personal' => [
            'full_name' => 'Raka Pratama',
            'headline' => 'Product Engineer',
            'email' => 'raka@example.com',
            'phone' => '08123456789',
            'city' => 'Jakarta',
            'linkedin' => 'https://linkedin.com/in/raka',
            'github' => 'https://github.com/raka',
            'portfolio' => 'https://raka.dev',
        ],
        'skills' => ['Laravel', 'React', 'System Design'],
        'experiences' => [],
        'educations' => [],
        'projects' => [],
        'certifications' => [],
    ]);

    $response->assertSessionHasErrors(['template']);
});

test('candidate can download cv builder as pdf', function () {
    $user = User::factory()->candidate()->create();
    markCandidateOnboarded($user);
    $candidate = app(ResolveCandidateProfile::class)->handle($user);
    $candidate->forceFill([
        'cv_builder_json' => [
            'title' => 'CV QA Engineer',
            'summary' => 'QA engineer dengan fokus automation testing.',
            'template' => 'ats',
            'personal' => [
                'full_name' => 'Dina Putri',
                'headline' => 'QA Engineer',
                'email' => 'dina@example.com',
                'phone' => '08123456789',
                'city' => 'Bandung',
                'linkedin' => '',
                'github' => '',
                'portfolio' => '',
            ],
            'skills' => ['Testing', 'Playwright'],
            'experiences' => [],
            'educations' => [],
            'projects' => [],
            'certifications' => [],
        ],
        'cv_builder_updated_at' => now(),
    ])->save();

    $response = $this->actingAs($user)->get(route('candidate.cvs.builder-pdf'));

    $response->assertOk();
    $response->assertHeader('content-type', 'application/pdf');
    expect($response->getContent())->toStartWith('%PDF-1.4');
});

test('candidate can review cv by uploading file', function () {
    $user = User::factory()->candidate()->create();
    markCandidateOnboarded($user);
    $candidate = app(ResolveCandidateProfile::class)->handle($user);

    $response = $this->actingAs($user)->post(route('candidate.cvs.builder-review'), [
        'template' => 'ats',
        'title' => 'CV Frontend Engineer',
        'summary' => 'Frontend engineer dengan pengalaman web app.',
        'personal' => [
            'full_name' => 'Bima Santoso',
            'headline' => 'Frontend Engineer',
            'email' => 'bima@example.com',
            'phone' => '08123456789',
            'city' => 'Bandung',
            'linkedin' => 'https://linkedin.com/in/bima',
            'github' => 'https://github.com/bima',
            'portfolio' => 'https://bima.dev',
        ],
        'skills' => ['Laravel', 'React'],
        'experiences' => [],
        'educations' => [],
        'projects' => [],
        'certifications' => [],
        'cv_file' => UploadedFile::fake()->create('cv-bima.pdf', 120, 'application/pdf'),
    ]);

    $response->assertRedirect();

    $candidate->refresh();
    expect($candidate->cv_builder_json)->toBeArray();
    expect($candidate->cv_builder_json['ai_review'])->toBeArray();
    expect($candidate->cv_builder_json['ai_review']['score'])->toBeInt();
});

test('candidate cvs page falls back to builder pdf preview when storage file is missing', function () {
    $user = User::factory()->candidate()->create();
    markCandidateOnboarded($user);
    $candidate = app(ResolveCandidateProfile::class)->handle($user);

    CandidateCv::create([
        'candidate_id' => $candidate->id,
        'file_url' => '/storage/demo/cvs/missing-cv.pdf',
        'source' => 'demo',
        'is_primary' => true,
        'uploaded_at' => now(),
    ]);

    $response = $this->actingAs($user)->get(route('candidate.cvs.index'));

    $response->assertInertia(fn ($page) => $page
        ->component('candidate/cvs/index')
        ->where('cvs.0.is_pdf', true)
        ->where('cvs.0.preview_url', route('candidate.cvs.builder-pdf', ['inline' => 1]))
    );
});

test('candidate can request inline builder pdf response', function () {
    $user = User::factory()->candidate()->create();
    markCandidateOnboarded($user);
    $candidate = app(ResolveCandidateProfile::class)->handle($user);
    $candidate->forceFill([
        'cv_builder_json' => [
            'title' => 'CV Frontend Engineer',
            'summary' => 'Ringkasan singkat kandidat.',
            'template' => 'ats',
            'personal' => [
                'full_name' => 'Bima Santoso',
                'headline' => 'Frontend Engineer',
                'email' => 'bima@example.com',
                'phone' => '08123456789',
                'city' => 'Bandung',
                'linkedin' => '',
                'github' => '',
                'portfolio' => '',
            ],
            'skills' => [],
            'experiences' => [],
            'educations' => [],
            'projects' => [],
            'certifications' => [],
        ],
        'cv_builder_updated_at' => now(),
    ])->save();

    $response = $this->actingAs($user)->get(route('candidate.cvs.builder-pdf', ['inline' => 1]));

    $response->assertOk();
    $response->assertHeader('content-type', 'application/pdf');
    expect((string) $response->headers->get('content-disposition'))->toContain('inline;');
});

test('candidate pricing page grants default free quota once', function () {
    $user = User::factory()->candidate()->create();
    markCandidateOnboarded($user);

    CandidatePricingMenu::query()->updateOrCreate(
        ['slug' => 'gratis-cv-builder'],
        [
            'name' => 'Gratis CV Builder',
            'slug' => 'gratis-cv-builder',
            'description' => 'Jatah gratis sekali.',
            'price' => 0,
            'ai_token_amount' => 0,
            'cv_builder_quota' => 1,
            'features_json' => ['1x gratis'],
            'is_default_free' => true,
            'is_active' => true,
        ],
    );

    $response = $this->actingAs($user)->get(route('candidate.pricing.index'));
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('candidate/pricing'));

    $candidate = app(ResolveCandidateProfile::class)->handle($user)->refresh();
    expect($candidate->cv_builder_quota_balance)->toBe(0);
    expect($candidate->ai_token_balance)->toBe(0);
    expect($candidate->free_cv_builder_granted_at)->not->toBeNull();
    expect(
        CandidateWalletTransaction::query()
            ->where('candidate_id', $candidate->id)
            ->where('source', 'free_grant')
            ->exists()
    )->toBeTrue();
});

test('candidate can generate first ai draft for free when wallet is empty', function () {
    $user = User::factory()->candidate()->create();
    markCandidateOnboarded($user);
    $candidate = app(ResolveCandidateProfile::class)->handle($user);
    $candidate->forceFill([
        'ai_token_balance' => 0,
        'cv_builder_quota_balance' => 0,
        'free_cv_builder_granted_at' => null,
    ])->save();

    $response = $this->actingAs($user)->post(route('candidate.cvs.builder-draft'), [
        'target_role' => 'Backend Engineer',
        'years_experience' => 2,
        'focus_skills' => ['Laravel'],
        'achievements' => 'Meningkatkan performa API.',
        'language' => 'id',
    ]);

    $response->assertRedirect();
    expect(
        CandidateWalletTransaction::query()
            ->where('candidate_id', $candidate->id)
            ->where('source', CandidateWalletManager::FREE_FIRST_DRAFT_SOURCE)
            ->exists()
    )->toBeTrue();
});

test('candidate cannot generate ai draft when free draft already used and wallet is insufficient', function () {
    $user = User::factory()->candidate()->create();
    markCandidateOnboarded($user);
    $candidate = app(ResolveCandidateProfile::class)->handle($user);
    $candidate->forceFill([
        'ai_token_balance' => 0,
        'cv_builder_quota_balance' => 0,
        'free_cv_builder_granted_at' => now(),
    ])->save();

    CandidateWalletTransaction::query()->create([
        'candidate_id' => $candidate->id,
        'type' => 'debit',
        'source' => CandidateWalletManager::FREE_FIRST_DRAFT_SOURCE,
        'ai_token_delta' => 0,
        'cv_builder_quota_delta' => 0,
        'amount' => 0,
        'status' => 'success',
        'meta_json' => ['label' => 'Gratis 1x generate draft'],
        'paid_at' => now(),
    ]);

    $response = $this->actingAs($user)->post(route('candidate.cvs.builder-draft'), [
        'target_role' => 'Backend Engineer',
        'years_experience' => 2,
        'focus_skills' => ['Laravel'],
        'achievements' => 'Meningkatkan performa API.',
        'language' => 'id',
    ]);

    $response->assertRedirect(route('candidate.pricing.index'));
});

test('candidate can create pending topup transaction from pricing page', function () {
    $user = User::factory()->candidate()->create();
    markCandidateOnboarded($user);
    $menu = CandidatePricingMenu::query()->create([
        'name' => 'Topup AI 5.000 Token',
        'slug' => 'topup-ai-5000-token',
        'description' => 'Topup kandidat.',
        'price' => 5000,
        'ai_token_amount' => 5000,
        'cv_builder_quota' => 1,
        'features_json' => ['Topup token'],
        'is_default_free' => false,
        'is_active' => true,
    ]);

    $response = $this->actingAs($user)->post(route('candidate.pricing.purchase', $menu));
    $response->assertRedirect();
    expect((string) $response->headers->get('Location'))->toContain('/pay/');

    $candidate = app(ResolveCandidateProfile::class)->handle($user)->refresh();
    expect(
        CandidateWalletTransaction::query()
            ->where('candidate_id', $candidate->id)
            ->where('candidate_pricing_menu_id', $menu->id)
            ->where('status', 'pending')
            ->exists()
    )->toBeTrue();
});

test('pakasir webhook can settle candidate topup transaction', function () {
    $user = User::factory()->candidate()->create();
    markCandidateOnboarded($user);
    $candidate = app(ResolveCandidateProfile::class)->handle($user);
    $candidate->forceFill([
        'ai_token_balance' => 100,
        'cv_builder_quota_balance' => 0,
        'free_cv_builder_granted_at' => now(),
    ])->save();

    $transaction = CandidateWalletTransaction::query()->create([
        'candidate_id' => $candidate->id,
        'order_id' => 'CND-TEST-ORDER-001',
        'type' => 'credit',
        'source' => 'purchase',
        'ai_token_delta' => 5000,
        'cv_builder_quota_delta' => 1,
        'amount' => 5000,
        'status' => 'pending',
    ]);

    $this->post(route('webhooks.pakasir'), [
        'order_id' => 'CND-TEST-ORDER-001',
        'status' => 'completed',
    ])->assertNoContent();

    $transaction->refresh();
    $candidate->refresh();

    expect($transaction->status)->toBe('paid');
    expect($candidate->ai_token_balance)->toBe(5100);
    expect($candidate->cv_builder_quota_balance)->toBe(1);
});

test('candidate can check pending topup status manually', function () {
    $user = User::factory()->candidate()->create();
    markCandidateOnboarded($user);
    $candidate = app(ResolveCandidateProfile::class)->handle($user);
    $candidate->forceFill([
        'ai_token_balance' => 100,
        'cv_builder_quota_balance' => 0,
        'free_cv_builder_granted_at' => now(),
    ])->save();

    $transaction = CandidateWalletTransaction::query()->create([
        'candidate_id' => $candidate->id,
        'order_id' => 'CND-TEST-CHECK-001',
        'type' => 'credit',
        'source' => 'purchase',
        'ai_token_delta' => 5000,
        'cv_builder_quota_delta' => 1,
        'amount' => 5000,
        'status' => 'pending',
    ]);

    Http::fake([
        'https://app.pakasir.com/api/transactiondetail*' => Http::response([
            'status' => 'completed',
        ], 200),
    ]);

    $this->actingAs($user)
        ->post(route('candidate.pricing.check', $transaction))
        ->assertRedirect();

    $transaction->refresh();
    $candidate->refresh();

    expect($transaction->status)->toBe('paid');
    expect($candidate->ai_token_balance)->toBe(5100);
    expect($candidate->cv_builder_quota_balance)->toBe(1);
});
