<?php

use Illuminate\Support\Facades\Validator;

test('validation messages use user-friendly indonesian text', function () {
    app()->setLocale('id');

    $validator = Validator::make(
        ['password' => 'abc'],
        ['password' => ['required', 'string', 'min:8']]
    );

    expect($validator->errors()->first('password'))
        ->toBe('Password minimal 8 karakter.');
});

test('validation attributes are translated to readable labels', function () {
    app()->setLocale('id');

    $validator = Validator::make(
        [],
        ['name' => ['required']]
    );

    expect($validator->errors()->first('name'))
        ->toBe('nama wajib diisi.');
});

test('new laravel validation keys are translated in indonesian', function () {
    app()->setLocale('id');

    expect(__('validation.any_of', ['attribute' => 'status']))
        ->toBe('Pilihan untuk status tidak valid.');
});
