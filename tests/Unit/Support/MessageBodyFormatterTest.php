<?php

use App\Support\MessageBodyFormatter;

test('converts bold and italic to whatsapp markdown', function () {
    $html = '<p>Halo <strong>Budi</strong>, ini <em>penting</em>.</p>';

    expect(MessageBodyFormatter::toWhatsApp($html))
        ->toBe('Halo *Budi*, ini _penting_.');
});

test('converts strikethrough and code', function () {
    $html = '<p><s>lama</s> <code>kode</code></p>';

    expect(MessageBodyFormatter::toWhatsApp($html))
        ->toBe('~lama~ `kode`');
});

test('preserves paragraph breaks as double newlines', function () {
    $html = '<p>Baris satu</p><p>Baris dua</p>';

    expect(MessageBodyFormatter::toWhatsApp($html))
        ->toBe("Baris satu\n\nBaris dua");
});

test('converts bullet list to dash prefixed lines', function () {
    $html = '<p>List:</p><ul><li>Apel</li><li>Jeruk</li></ul>';

    expect(MessageBodyFormatter::toWhatsApp($html))
        ->toBe("List:\n- Apel\n- Jeruk");
});

test('converts links to label and url', function () {
    $html = '<p>Buka <a href="https://example.com">situs kami</a>.</p>';

    expect(MessageBodyFormatter::toWhatsApp($html))
        ->toBe('Buka situs kami (https://example.com).');
});

test('returns plain text url when label equals url', function () {
    $html = '<p>Cek <a href="https://example.com">https://example.com</a></p>';

    expect(MessageBodyFormatter::toWhatsApp($html))
        ->toBe('Cek https://example.com');
});

test('handles plain text input safely', function () {
    expect(MessageBodyFormatter::toWhatsApp('Halo dunia'))
        ->toBe('Halo dunia');
});

test('decodes html entities', function () {
    $html = '<p>P&amp;G &mdash; bagus</p>';

    expect(MessageBodyFormatter::toWhatsApp($html))
        ->toBe('P&G — bagus');
});

test('returns empty string for empty input', function () {
    expect(MessageBodyFormatter::toWhatsApp(''))->toBe('');
});
