@extends('errors.layout')

@section('title', 'Perlu masuk dulu')
@section('code', '401')

@section('icon')
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z"/>
        <circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/>
    </svg>
@endsection

@section('message')
    Halaman ini membutuhkan autentikasi. Silakan masuk terlebih dahulu untuk melanjutkan.
@endsection
