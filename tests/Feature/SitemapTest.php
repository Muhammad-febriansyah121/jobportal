<?php

use App\Models\CareerResource;

it('renders a valid xml sitemap with static public routes', function () {
    $response = $this->get('/sitemap.xml');

    $response->assertOk();
    $response->assertHeader('Content-Type', 'application/xml');

    $body = $response->getContent();

    expect($body)->toContain('<?xml version="1.0" encoding="UTF-8"?>')
        ->toContain('<urlset')
        ->toContain(route('home'))
        ->toContain(route('jobs.index'))
        ->toContain(route('companies.index'))
        ->toContain(route('pricing'));
});

it('includes published career resources and excludes unpublished ones', function () {
    $published = CareerResource::factory()->create([
        'published_at' => now()->subDay(),
    ]);

    $future = CareerResource::factory()->create([
        'published_at' => now()->addWeek(),
    ]);

    $body = $this->get('/sitemap.xml')->getContent();

    expect($body)->toContain(route('career-resources.show', $published->slug))
        ->not->toContain(route('career-resources.show', $future->slug));
});
