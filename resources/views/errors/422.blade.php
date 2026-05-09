@extends('errors.layout')

@section('title', 'Data tidak valid')
@section('code', '422')

@section('icon')
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5z"/>
        <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
        <path d="M9 14h6"/>
        <path d="M12 11v6"/>
    </svg>
@endsection

@section('message')
    Data yang dikirim tidak lolos validasi. Periksa kembali isian formulir lalu kirim ulang.
@endsection
