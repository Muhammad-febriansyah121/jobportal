<?php

use App\Models\CareerResource;
use Inertia\Testing\AssertableInertia as Assert;

test('public career resources index exposes excerpt and reading time', function () {
    $resource = CareerResource::factory()->create([
        'title' => 'Public Resource Card Payload',
        'slug' => 'public-resource-card-payload',
        'content' => '<p>'.str_repeat('word ', 400).'</p>',
        'published_at' => now(),
    ]);

    $this->get(route('career-resources.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('front/career-resources/index')
            ->where('resources.data.0.id', $resource->id)
            ->where('resources.data.0.reading_time', 2)
            ->where('resources.data.0.excerpt', fn (string $excerpt) => str_word_count($excerpt) <= 25
                && ! str_contains($excerpt, '<'))
            ->etc()
        );
});

test('public career resources show exposes reading time', function () {
    $resource = CareerResource::factory()->create([
        'title' => 'Show Reading Time',
        'slug' => 'show-reading-time',
        'content' => '<p>'.str_repeat('word ', 600).'</p>',
        'published_at' => now(),
    ]);

    $this->get(route('career-resources.show', $resource->slug))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('front/career-resources/show')
            ->where('resource.reading_time', 3)
            ->etc()
        );
});

test('public career resources show 404s for unpublished resource', function () {
    $resource = CareerResource::factory()->create([
        'title' => 'Unpublished Show',
        'slug' => 'unpublished-show',
        'published_at' => null,
    ]);

    $this->get(route('career-resources.show', $resource->slug))
        ->assertNotFound();
});

test('public career resources index hides unpublished resources', function () {
    CareerResource::factory()->create([
        'title' => 'Draft Resource',
        'slug' => 'draft-resource',
        'published_at' => null,
    ]);

    $this->get(route('career-resources.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('front/career-resources/index')
            ->where('resources.total', 0)
            ->etc()
        );
});
