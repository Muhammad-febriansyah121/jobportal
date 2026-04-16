<?php

use App\Models\User;
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
    User::factory()->candidate()->count(2)->create();

    $this->actingAs($admin)
        ->get(route('admin.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/dashboard')
            ->has('metrics')
            ->where('metrics.total_users', 3)
            ->where('metrics.total_candidates', 2)
        );
});
