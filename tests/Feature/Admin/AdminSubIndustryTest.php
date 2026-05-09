<?php

use App\Models\Industry;
use App\Models\SalaryInsight;
use App\Models\SubIndustry;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('admin can view sub industries index', function () {
    $admin = User::factory()->admin()->create();
    SubIndustry::factory()->count(3)->create();

    $this->actingAs($admin)
        ->get(route('admin.sub-industries.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('admin/resources/index'));
});

test('admin can create a sub industry', function () {
    $admin = User::factory()->admin()->create();
    $industry = Industry::factory()->create();

    $this->actingAs($admin)
        ->post(route('admin.sub-industries.store'), [
            'industry_id' => $industry->id,
            'name' => 'Banking',
        ])
        ->assertRedirect();

    expect(SubIndustry::where('industry_id', $industry->id)->where('name', 'Banking')->exists())->toBeTrue();
});

test('admin can update a sub industry', function () {
    $admin = User::factory()->admin()->create();
    $subIndustry = SubIndustry::factory()->create(['name' => 'Lama']);

    $this->actingAs($admin)
        ->patch(route('admin.sub-industries.update', $subIndustry), [
            'industry_id' => $subIndustry->industry_id,
            'name' => 'Baru',
        ])
        ->assertRedirect();

    expect($subIndustry->refresh()->name)->toBe('Baru');
});

test('admin can delete a sub industry', function () {
    $admin = User::factory()->admin()->create();
    $subIndustry = SubIndustry::factory()->create();

    $this->actingAs($admin)
        ->delete(route('admin.sub-industries.destroy', $subIndustry))
        ->assertRedirect();

    expect(SubIndustry::find($subIndustry->id))->toBeNull();
});

test('non-admin cannot access sub industries', function () {
    $user = User::factory()->candidate()->create();

    $this->actingAs($user)
        ->get(route('admin.sub-industries.index'))
        ->assertForbidden();
});

test('salary insight requires sub industry to belong to selected industry', function () {
    $admin = User::factory()->admin()->create();
    $industryA = Industry::factory()->create();
    $industryB = Industry::factory()->create();
    $subOfB = SubIndustry::factory()->create(['industry_id' => $industryB->id]);

    $this->actingAs($admin)
        ->post(route('admin.salary-insights.store'), [
            'job_title' => 'Backend Engineer',
            'industry_id' => $industryA->id,
            'sub_industry_id' => $subOfB->id,
            'salary_min' => 0,
            'salary_max' => 0,
        ])
        ->assertSessionHasErrors('sub_industry_id');
});

test('salary insight accepts sub industry that matches industry', function () {
    $admin = User::factory()->admin()->create();
    $industry = Industry::factory()->create();
    $sub = SubIndustry::factory()->create(['industry_id' => $industry->id]);

    $this->actingAs($admin)
        ->post(route('admin.salary-insights.store'), [
            'job_title' => 'Backend Engineer',
            'industry_id' => $industry->id,
            'sub_industry_id' => $sub->id,
            'salary_min' => 0,
            'salary_max' => 0,
        ])
        ->assertRedirect();

    expect(SalaryInsight::where('job_title', 'Backend Engineer')->where('sub_industry_id', $sub->id)->exists())->toBeTrue();
});

test('public salary page passes sub industries prop', function () {
    SubIndustry::factory()->count(2)->create();

    $this->get(route('salary.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('front/salary/index')
            ->has('subIndustries', 2)
        );
});
