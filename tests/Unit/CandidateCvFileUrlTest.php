<?php

use App\Models\CandidateCv;

it('keeps relative file_url as-is', function () {
    $cv = new CandidateCv;
    $cv->file_url = '/storage/candidate-cvs/abc.pdf';

    expect($cv->file_url)->toBe('/storage/candidate-cvs/abc.pdf');
});

it('strips host from absolute http file_url', function () {
    $cv = new CandidateCv;
    $cv->file_url = 'http://127.0.0.1:8000/storage/candidate-cvs/abc.pdf';

    expect($cv->file_url)->toBe('/storage/candidate-cvs/abc.pdf');
});

it('strips host from absolute https file_url', function () {
    $cv = new CandidateCv;
    $cv->file_url = 'https://karivia.com/storage/candidate-cvs/abc.pdf';

    expect($cv->file_url)->toBe('/storage/candidate-cvs/abc.pdf');
});

it('strips host from production-style URL with custom domain', function () {
    $cv = new CandidateCv;
    $cv->file_url = 'https://muhammadfebriandev.my.id/storage/candidate-cvs/xyz.pdf';

    expect($cv->file_url)->toBe('/storage/candidate-cvs/xyz.pdf');
});

it('normalizes legacy absolute URL stored directly in attributes (accessor handles raw DB value)', function () {
    $cv = new CandidateCv;
    $cv->setRawAttributes(['file_url' => 'http://127.0.0.1:8000/storage/candidate-cvs/legacy.pdf']);

    expect($cv->file_url)->toBe('/storage/candidate-cvs/legacy.pdf');
});

it('passes null through unchanged', function () {
    $cv = new CandidateCv;
    $cv->file_url = null;

    expect($cv->file_url)->toBeNull();
});

it('passes empty string through unchanged', function () {
    $cv = new CandidateCv;
    $cv->file_url = '';

    expect($cv->file_url)->toBe('');
});
