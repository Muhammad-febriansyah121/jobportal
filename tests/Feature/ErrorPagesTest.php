<?php

use Symfony\Component\HttpKernel\Exception\HttpException;

it('renders custom 404 page for missing routes', function () {
    $response = $this->get('/this-route-does-not-exist-'.uniqid());

    $response->assertStatus(404);
    $response->assertSee('Halaman tidak ditemukan', false);
    $response->assertSee('Error 404', false);
});

dataset('errorCodes', [
    [401, 'Perlu masuk dulu'],
    [402, 'Pembayaran diperlukan'],
    [403, 'Akses ditolak'],
    [404, 'Halaman tidak ditemukan'],
    [405, 'Metode tidak diizinkan'],
    [408, 'Waktu permintaan habis'],
    [419, 'Halaman kedaluwarsa'],
    [422, 'Data tidak valid'],
    [429, 'Terlalu banyak permintaan'],
    [451, 'Tidak tersedia karena alasan hukum'],
    [500, 'Terjadi kesalahan di server'],
    [503, 'Sedang dalam pemeliharaan'],
]);

it('renders custom error view', function (int $code, string $title) {
    $rendered = view("errors.{$code}", ['exception' => new HttpException($code, 'test')])->render();

    expect($rendered)
        ->toContain($title)
        ->toContain((string) $code)
        ->toContain('Kembali ke beranda');
})->with('errorCodes');
