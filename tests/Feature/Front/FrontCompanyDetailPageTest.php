<?php

use App\Models\Company;
use App\Models\Industry;
use App\Models\JobListing;
use App\Models\SalaryInsight;
use App\Models\User;

test('guest can open public company detail page', function () {
    $industry = Industry::factory()->create(['name' => 'Technology']);
    $owner = User::factory()->employer()->create();

    $company = Company::create([
        'owner_id' => $owner->id,
        'industry_id' => $industry->id,
        'name' => 'Karivia Labs',
        'slug' => 'karivia-labs-public',
        'description' => 'Perusahaan teknologi untuk solusi digital Indonesia.',
        'culture' => "- Kolaborasi terbuka\n- Fokus ke customer impact",
        'benefits' => "- Asuransi kesehatan\n- Budget pengembangan skill",
        'is_active' => true,
        'is_verified' => true,
    ]);

    JobListing::create([
        'company_id' => $company->id,
        'created_by' => $owner->id,
        'title' => 'Senior Backend Engineer',
        'slug' => 'senior-backend-engineer-karivia',
        'description' => 'Build scalable systems',
        'work_mode' => 'remote',
        'job_type' => 'full_time',
        'experience_level' => 'senior',
        'salary_min' => 12000000,
        'salary_max' => 18000000,
        'is_salary_visible' => true,
        'status' => 'published',
        'published_at' => now(),
    ]);

    SalaryInsight::factory()->create([
        'company_id' => $company->id,
        'industry_id' => $industry->id,
        'salary_min' => 11000000,
        'salary_median' => 15000000,
        'salary_max' => 20000000,
        'source_count' => 25,
        'published_at' => now(),
    ]);

    $response = $this->get(route('companies.show', $company->slug));

    $response->assertInertia(fn ($page) => $page
        ->component('companies/show')
        ->where('company.slug', 'karivia-labs-public')
        ->where('company.culture', "- Kolaborasi terbuka\n- Fokus ke customer impact")
        ->where('company.benefits', "- Asuransi kesehatan\n- Budget pengembangan skill")
        ->has('jobs', 1)
        ->where('company.review_access.can_submit', false)
        ->where('company.review_access.my_review', null)
        ->where('company.salary_insight.salary_median', 15000000)
    );
});

test('inactive company detail returns not found', function () {
    $industry = Industry::factory()->create();
    $owner = User::factory()->employer()->create();

    $company = Company::create([
        'owner_id' => $owner->id,
        'industry_id' => $industry->id,
        'name' => 'Hidden Company',
        'slug' => 'hidden-company',
        'is_active' => false,
    ]);

    $this->get(route('companies.show', $company->slug))->assertNotFound();
});
