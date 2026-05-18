<?php

use App\Ai\Agents\AdminCompanyInsightWriter;
use App\Models\AiAuditLog;
use App\Models\Company;
use App\Models\User;
use App\Services\AiService;
use Inertia\Testing\AssertableInertia as Assert;

test('admin company detail page shows ai insight section', function () {
    $admin = User::factory()->admin()->create();
    $owner = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $owner->id,
        'name' => 'Karivia Labs',
        'slug' => 'karivia-labs',
        'verification_status' => 'unverified',
    ]);

    AiAuditLog::create([
        'user_id' => $owner->id,
        'feature' => 'admin_company_insight',
        'input_hash' => md5('test'),
        'output_json' => [
            'summary' => 'Perusahaan aktif mempublikasikan lowongan, namun respons terhadap lamaran cukup lambat.',
            'generated_at' => now()->toIso8601String(),
            'company_id' => $company->id,
        ],
        'model_name' => 'gpt-4o-mini',
        'status' => 'success',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.companies.show', $company))
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/resources/show')
            ->has('aiSummary')
            ->where('aiSummary.summary', 'Perusahaan aktif mempublikasikan lowongan, namun respons terhadap lamaran cukup lambat.')
        );
});

test('admin company detail page shows null ai insight when none exists', function () {
    $admin = User::factory()->admin()->create();
    $owner = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $owner->id,
        'name' => 'Karivia Labs',
        'slug' => 'karivia-labs',
        'verification_status' => 'unverified',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.companies.show', $company))
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/resources/show')
            ->where('aiSummary', null)
        );
});

test('admin can generate ai insight for a company', function () {
    $admin = User::factory()->admin()->create();
    $owner = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $owner->id,
        'name' => 'Karivia Labs',
        'slug' => 'karivia-labs',
        'verification_status' => 'unverified',
    ]);

    $mock = Mockery::mock(AiService::class);
    $mock->shouldReceive('isConfigured')->andReturnTrue();
    app()->instance(AiService::class, $mock);

    AdminCompanyInsightWriter::fake(['Perusahaan aktif mempublikasikan lowongan.']);

    $this->actingAs($admin)
        ->post(route('admin.companies.generate-ai-insight', $company))
        ->assertRedirect();

    $log = AiAuditLog::where('feature', 'admin_company_insight')
        ->where('status', 'success')
        ->whereJsonContains('output_json->company_id', $company->id)
        ->firstOrFail();

    expect($log->input_json['company']['id'])->toBe($company->id);
    expect($log->input_json)->toHaveKeys(['job_stats', 'application_stats']);
});

test('generate ai insight handles api failure gracefully', function () {
    $admin = User::factory()->admin()->create();
    $owner = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $owner->id,
        'name' => 'Karivia Labs',
        'slug' => 'karivia-labs',
        'verification_status' => 'unverified',
    ]);

    $mock = Mockery::mock(AiService::class);
    $mock->shouldReceive('isConfigured')->andReturnFalse();
    app()->instance(AiService::class, $mock);

    $this->actingAs($admin)
        ->post(route('admin.companies.generate-ai-insight', $company))
        ->assertRedirect();

    expect(AiAuditLog::where('feature', 'admin_company_insight')
        ->where('status', 'failed')
        ->exists()
    )->toBeTrue();
});
