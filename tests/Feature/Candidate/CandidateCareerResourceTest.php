<?php

use App\Models\CareerResource;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('candidate career resources index exposes thumbnail as public storage url', function () {
    $candidateUser = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);

    $resource = CareerResource::factory()->create([
        'title' => 'Resource Thumbnail URL',
        'slug' => 'resource-thumbnail-url',
        'thumbnail_path' => 'career-resources/thumbnail.png',
        'published_at' => now(),
    ]);

    $this->actingAs($candidateUser)
        ->get(route('candidate.career-resources.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('candidate/career-resources/index')
            ->where('resources.data.0.id', $resource->id)
            ->where('resources.data.0.thumbnail_path', asset('storage/career-resources/thumbnail.png'))
            ->etc()
        );
});
