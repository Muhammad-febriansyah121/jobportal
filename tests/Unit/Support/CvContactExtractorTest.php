<?php

use App\Support\CvContactExtractor;

test('extracts indonesian mobile number with dashes', function () {
    expect(CvContactExtractor::phone('Telp: 0812-3456-7890'))->toBe('6281234567890');
});

test('extracts mobile number with spaces and plus country code', function () {
    expect(CvContactExtractor::phone('Kontak +62 812 3456 7890'))->toBe('6281234567890');
});

test('extracts mobile number with dots', function () {
    expect(CvContactExtractor::phone('HP 0812.3456.7890 (WA)'))->toBe('6281234567890');
});

test('does not mistake a year range for a phone number', function () {
    expect(CvContactExtractor::phone('Pengalaman 2018 - 2024 di PT Contoh'))->toBe('');
});

test('returns empty when no phone present', function () {
    expect(CvContactExtractor::phone('Just some resume text'))->toBe('');
});

test('normalizes leading zero to country code', function () {
    expect(CvContactExtractor::normalizePhone('08123456789'))->toBe('628123456789');
});

test('rejects too short digit sequences', function () {
    expect(CvContactExtractor::normalizePhone('123'))->toBe('');
});

test('extracts email lowercased', function () {
    expect(CvContactExtractor::email('Email: Budi.Santoso@Example.COM'))
        ->toBe('budi.santoso@example.com');
});

test('extracts social and portfolio links', function () {
    $text = 'linkedin.com/in/budi github.com/budi https://budi.dev/portfolio';
    $links = CvContactExtractor::links($text);

    expect($links['linkedin_url'])->toBe('https://linkedin.com/in/budi')
        ->and($links['github_url'])->toBe('https://github.com/budi')
        ->and($links['portfolio_url'])->toBe('https://budi.dev/portfolio');
});

test('fromText aggregates all contact fields', function () {
    $hints = CvContactExtractor::fromText('Budi | 0812-3456-7890 | budi@example.com');

    expect($hints['phone'])->toBe('6281234567890')
        ->and($hints['email'])->toBe('budi@example.com');
});
