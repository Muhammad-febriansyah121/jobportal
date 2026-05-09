@extends('errors.layout')

@section('title', 'Terlalu banyak permintaan')
@section('code', '429')

@section('icon')
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="m12 14 4-4"/>
        <path d="M3.34 19a10 10 0 1 1 17.32 0"/>
    </svg>
@endsection

@section('message')
    Kamu mengirim permintaan terlalu cepat. Tunggu beberapa saat lalu coba kembali.
@endsection
