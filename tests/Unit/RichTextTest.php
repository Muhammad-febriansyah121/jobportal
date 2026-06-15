<?php

use App\Support\RichText;

it('strips draftjs markup and decodes entities', function () {
    $html = '<div class="" data-block="true" data-editor="5c9d0" style="color: rgb(45, 45, 45); font-family: &quot;Noto Sans&quot;, sans-serif;"><span>1. Pendidikan minimal D3 Teknik Industri</span></div>';

    expect(RichText::toPlainText($html))
        ->toBe('1. Pendidikan minimal D3 Teknik Industri')
        ->not->toContain('<div')
        ->not->toContain('&quot;')
        ->not->toContain('data-block');
});

it('keeps line breaks between blocks', function () {
    $html = '<div data-block="true"><span>Baris satu</span></div><div data-block="true"><span>Baris dua</span></div>';

    expect(RichText::toPlainText($html))->toBe("Baris satu\nBaris dua");
});

it('leaves plain text untouched', function () {
    expect(RichText::toPlainText('Teks biasa tanpa html'))->toBe('Teks biasa tanpa html');
});

it('returns the default for empty or null value', function () {
    expect(RichText::toPlainText(null))->toBe('-');
    expect(RichText::toPlainText(''))->toBe('-');
    expect(RichText::toPlainText('<div></div>'))->toBe('-');
    expect(RichText::toPlainText(null, ''))->toBe('');
});
