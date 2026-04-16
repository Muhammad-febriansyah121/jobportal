<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use function Pest\Laravel\actingAs;

test('employer workspace menu pages are available', function (string $routeName, string $title) {
    $employer = User::factory()->employer()->create();

    actingAs($employer)
        ->get(route($routeName))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('employer/workspace')
            ->where('title', $title)
            ->has('description')
            ->has('message')
        );
})->with([
    'candidates' => ['employer.candidates.index', 'Kandidat'],
    'messages' => ['employer.messages.index', 'Pesan'],
    'analytics' => ['employer.analytics.index', 'Analytics'],
    'billing' => ['employer.billing.index', 'Billing'],
    'talent search' => ['employer.talent-search.index', 'Cari Talenta'],
]);
