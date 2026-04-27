@extends('errors.layout')

@section('title', 'Pembayaran diperlukan')
@section('code', '402')

@section('icon')
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect width="20" height="14" x="2" y="5" rx="2"/>
        <line x1="2" x2="22" y1="10" y2="10"/>
        <path d="M6 15h2"/>
    </svg>
@endsection

@section('message')
    Akses ke halaman ini memerlukan pembayaran atau langganan aktif. Selesaikan pembayaran terlebih dahulu untuk melanjutkan.
@endsection
