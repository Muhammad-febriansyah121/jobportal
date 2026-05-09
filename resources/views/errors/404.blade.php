@extends('errors.layout')

@section('title', 'Halaman tidak ditemukan')
@section('code', '404')

@section('icon')
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.3-4.3"/>
        <path d="m8 11 6 0"/>
        <path d="m11 8 0 6"/>
        <path d="m8 14 6-6"/>
    </svg>
@endsection

@section('message')
    Halaman yang kamu cari tidak tersedia, sudah dipindahkan, atau tautannya salah.
    Coba periksa kembali alamat URL-nya.
@endsection
