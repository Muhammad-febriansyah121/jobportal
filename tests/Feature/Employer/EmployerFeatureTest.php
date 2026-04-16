<?php

use App\Models\Company;
use App\Models\CompanyVerification;
use App\Models\Industry;
use App\Models\JobListing;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use function Pest\Laravel\actingAs;

test('employer is redirected from generic dashboard to employer dashboard', function () {
    $employer = User::factory()->employer()->create();

    actingAs($employer)
        ->get(route('dashboard'))
        ->assertRedirect(route('employer.dashboard'));
});

test('non employer users cannot access employer routes', function () {
    $candidate = User::factory()->candidate()->create();

    actingAs($candidate)
        ->get(route('employer.dashboard'))
        ->assertForbidden();
});

test('employer can create company profile', function () {
    $employer = User::factory()->employer()->create();
    $industry = Industry::create([
        'name' => 'Teknologi',
        'slug' => 'teknologi',
    ]);

    actingAs($employer)
        ->patch(route('employer.company.update'), [
            'name' => 'Karivia Tech',
            'slug' => 'karivia-tech',
            'industry_id' => $industry->id,
            'description' => 'Perusahaan teknologi untuk solusi rekrutmen terpercaya.',
            'company_size' => '51-200 karyawan',
            'website' => 'https://karivia.id',
            'hq_city' => 'Jakarta Selatan',
            'hq_province' => 'DKI Jakarta',
            'address' => 'Jl. Karivia No. 10',
        ])
        ->assertRedirect(route('employer.company.edit'));

    $company = Company::query()->where('owner_id', $employer->id)->first();

    expect($company)->not->toBeNull();
    expect($company?->name)->toBe('Karivia Tech');
    expect($company?->verification_status)->toBe('unverified');
});

test('employer can create and publish a job listing', function () {
    $employer = User::factory()->employer()->create();
    $industry = Industry::create([
        'name' => 'Teknologi',
        'slug' => 'teknologi',
    ]);
    $company = Company::create([
        'owner_id' => $employer->id,
        'industry_id' => $industry->id,
        'name' => 'Karivia Tech',
        'slug' => 'karivia-tech',
        'description' => 'Perusahaan teknologi.',
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);

    actingAs($employer)
        ->post(route('employer.jobs.store'), [
            'title' => 'Backend Engineer',
            'slug' => 'backend-engineer',
            'industry_id' => $industry->id,
            'description' => 'Bangun API Laravel yang aman dan scalable.',
            'responsibilities' => 'Membangun fitur backend dan integrasi sistem.',
            'required_qualifications' => 'Pengalaman Laravel 3 tahun.',
            'preferred_qualifications' => 'Paham queue dan caching.',
            'location_city' => 'Jakarta Selatan',
            'location_province' => 'DKI Jakarta',
            'work_mode' => 'hybrid',
            'job_type' => 'full_time',
            'experience_level' => 'mid',
            'salary_min' => 12000000,
            'salary_max' => 18000000,
            'salary_currency' => 'IDR',
            'is_salary_visible' => true,
            'response_sla_hours' => 48,
        ])
        ->assertRedirect(route('employer.jobs.index'));

    $job = JobListing::query()->whereBelongsTo($company)->first();

    expect($job)->not->toBeNull();
    expect($job?->status)->toBe('draft');

    actingAs($employer)
        ->patch(route('employer.jobs.publish', $job))
        ->assertRedirect(route('employer.jobs.index'));

    $job->refresh();

    expect($job->status)->toBe('published');
    expect($job->published_at)->not->toBeNull();
});

test('employer can submit company verification', function () {
    $employer = User::factory()->employer()->create();
    $industry = Industry::create([
        'name' => 'Teknologi',
        'slug' => 'teknologi',
    ]);
    $company = Company::create([
        'owner_id' => $employer->id,
        'industry_id' => $industry->id,
        'name' => 'Karivia Tech',
        'slug' => 'karivia-tech',
        'description' => 'Perusahaan teknologi.',
        'verification_status' => 'unverified',
        'is_verified' => false,
    ]);

    actingAs($employer)
        ->post(route('employer.verification.store'), [
            'legal_name' => 'PT Karivia Teknologi Indonesia',
            'nib' => '1234567890123',
            'npwp' => '12.345.678.9-012.000',
            'document_url' => 'https://karivia.id/legal/company.pdf',
        ])
        ->assertRedirect(route('employer.verification.index'));

    $company->refresh();
    $verification = CompanyVerification::query()->whereBelongsTo($company)->first();

    expect($verification)->not->toBeNull();
    expect($verification?->status)->toBe('pending');
    expect($verification?->submitted_by)->toBe($employer->id);
    expect($company->verification_status)->toBe('pending');
    expect($company->is_verified)->toBeFalse();
});

test('employer sees latest company verification status', function () {
    $employer = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Karivia Tech',
        'slug' => 'karivia-tech',
        'verification_status' => 'need_revision',
        'is_verified' => false,
    ]);

    CompanyVerification::create([
        'company_id' => $company->id,
        'submitted_by' => $employer->id,
        'legal_name' => 'PT Karivia Teknologi Indonesia',
        'document_url' => 'https://karivia.id/legal/company.pdf',
        'status' => 'need_revision',
        'rejection_reason' => 'Dokumen legal belum terbaca jelas.',
    ]);

    actingAs($employer)
        ->get(route('employer.verification.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('employer/verification')
            ->where('company.name', 'Karivia Tech')
            ->where('canSubmit', true)
            ->where('verification.status', 'need_revision')
            ->where('verification.rejection_reason', 'Dokumen legal belum terbaca jelas.')
            ->etc()
        );
});

test('employer cannot resubmit while verification is pending', function () {
    $employer = User::factory()->employer()->create();
    Company::create([
        'owner_id' => $employer->id,
        'name' => 'Karivia Tech',
        'slug' => 'karivia-tech',
        'verification_status' => 'pending',
        'is_verified' => false,
    ]);

    actingAs($employer)
        ->post(route('employer.verification.store'), [
            'legal_name' => 'PT Karivia Teknologi Indonesia',
            'document_url' => 'https://karivia.id/legal/company.pdf',
        ])
        ->assertForbidden();
});
