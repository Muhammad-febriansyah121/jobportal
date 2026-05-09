<?php

use App\Models\CompanySize;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('admin can view company sizes index', function () {
    $admin = User::factory()->admin()->create();
    CompanySize::factory()->count(3)->create();

    $this->actingAs($admin)
        ->get(route('admin.company-sizes.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('admin/resources/index'));
});

test('admin can create a company size', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('admin.company-sizes.store'), [
            'label' => '51-200 karyawan',
            'sort_order' => 3,
        ])
        ->assertRedirect();

    expect(CompanySize::where('label', '51-200 karyawan')->where('sort_order', 3)->exists())->toBeTrue();
});

test('admin can update a company size', function () {
    $admin = User::factory()->admin()->create();
    $size = CompanySize::factory()->create(['label' => 'Lama', 'sort_order' => 1]);

    $this->actingAs($admin)
        ->patch(route('admin.company-sizes.update', $size), [
            'label' => 'Baru',
            'sort_order' => 2,
        ])
        ->assertRedirect();

    expect($size->refresh()->label)->toBe('Baru');
    expect($size->sort_order)->toBe(2);
});

test('admin can delete a company size', function () {
    $admin = User::factory()->admin()->create();
    $size = CompanySize::factory()->create();

    $this->actingAs($admin)
        ->delete(route('admin.company-sizes.destroy', $size))
        ->assertRedirect();

    expect(CompanySize::find($size->id))->toBeNull();
});

test('non-admin cannot access company sizes', function () {
    $user = User::factory()->candidate()->create();

    $this->actingAs($user)
        ->get(route('admin.company-sizes.index'))
        ->assertForbidden();
});

test('duplicate label is rejected', function () {
    $admin = User::factory()->admin()->create();
    CompanySize::factory()->create(['label' => '1-10 karyawan']);

    $this->actingAs($admin)
        ->post(route('admin.company-sizes.store'), [
            'label' => '1-10 karyawan',
            'sort_order' => 1,
        ])
        ->assertSessionHasErrors('label');
});
