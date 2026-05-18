<?php

test('home response includes security headers', function () {
    $response = $this->get('/');

    $response->assertOk();
    $response->assertHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    $response->assertHeader('X-Frame-Options', 'SAMEORIGIN');
    $response->assertHeader('X-Content-Type-Options', 'nosniff');
    $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    $response->assertHeader('Cross-Origin-Opener-Policy', 'same-origin');
    $response->assertHeader('Cross-Origin-Resource-Policy', 'same-origin');

    expect($response->headers->get('Permissions-Policy'))->toContain('camera=(self)');
    expect($response->headers->get('Permissions-Policy'))->toContain('microphone=(self)');
    expect($response->headers->get('Permissions-Policy'))->toContain('geolocation=()');
});

test('home response strips x-powered-by header', function () {
    $response = $this->get('/');

    $response->assertHeaderMissing('X-Powered-By');
});
