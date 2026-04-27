@extends('errors.layout')

@section('title', 'Metode tidak diizinkan')
@section('code', '405')

@section('icon')
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/>
        <path d="m4.9 4.9 14.2 14.2"/>
    </svg>
@endsection

@section('message')
    Aksi yang kamu lakukan tidak diizinkan untuk halaman ini. Silakan kembali dan coba dengan cara lain.
@endsection
