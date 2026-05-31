<?php

use App\Support\OptimizedImageStorage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('it stores resized webp images', function () {
    Storage::fake('public');

    $path = OptimizedImageStorage::store(
        UploadedFile::fake()->image('hero.jpg', 2400, 1200),
        'settings',
        480,
        240,
    );

    [$width, $height, $type] = getimagesize(Storage::disk('public')->path($path));

    expect($path)
        ->toStartWith('settings/')
        ->toEndWith('.webp')
        ->and($width)->toBeLessThanOrEqual(480)
        ->and($height)->toBeLessThanOrEqual(240)
        ->and($type)->toBe(IMAGETYPE_WEBP);
});

test('it resolves public storage paths from generated urls', function () {
    expect(OptimizedImageStorage::publicPathFromUrl('https://karivia.id/storage/companies/logos/logo.webp'))
        ->toBe('companies/logos/logo.webp')
        ->and(OptimizedImageStorage::publicPathFromUrl('/storage/settings/logo.webp'))
        ->toBe('settings/logo.webp')
        ->and(OptimizedImageStorage::publicPathFromUrl('https://example.com/logo.webp'))
        ->toBeNull();
});
