<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use function Pest\Laravel\actingAs;

test('candidate messages page is available from candidate menu', function () {
    $candidate = User::factory()->candidate()->create();

    actingAs($candidate)
        ->get(route('candidate.messages.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('candidate/workspace')
            ->where('title', 'Pesan')
            ->has('description')
            ->has('message')
        );
});
