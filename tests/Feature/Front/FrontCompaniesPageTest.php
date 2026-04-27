<?php

use App\Models\Company;
use App\Models\Industry;
use App\Models\User;

test('guest can open public companies page in home layout', function () {
    $industry = Industry::factory()->create(['name' => 'Technology']);

    $owner = User::factory()->employer()->create();
    Company::create([
        'owner_id' => $owner->id,
        'industry_id' => $industry->id,
        'name' => 'Karivia Labs',
        'slug' => 'karivia-labs',
        'is_active' => true,
        'is_verified' => true,
    ]);

    $response = $this->get(route('companies.index'));

    $response->assertInertia(fn ($page) => $page
        ->component('front/companies/index')
        ->has('companies.data', 1)
        ->where('companies.data.0.slug', 'karivia-labs')
    );
});

test('companies page supports search filter', function () {
    $industry = Industry::factory()->create(['name' => 'Technology']);

    $owner = User::factory()->employer()->create();

    Company::create([
        'owner_id' => $owner->id,
        'industry_id' => $industry->id,
        'name' => 'Karivia Labs',
        'slug' => 'karivia-labs-filter',
        'is_active' => true,
    ]);

    Company::create([
        'owner_id' => $owner->id,
        'industry_id' => $industry->id,
        'name' => 'Nusantara Fintech',
        'slug' => 'nusantara-fintech-filter',
        'is_active' => true,
    ]);

    $response = $this->get(route('companies.index', ['search' => 'karivia']));

    $response->assertInertia(fn ($page) => $page
        ->component('front/companies/index')
        ->has('companies.data', 1)
        ->where('companies.data.0.slug', 'karivia-labs-filter')
    );
});
