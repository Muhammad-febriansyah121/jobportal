@extends('errors.layout')

@section('title', 'Terjadi kesalahan di server')
@section('code', '500')

@section('icon')
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M6 10H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/>
        <path d="M6 14H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-2"/>
        <path d="m13 6-4 12"/>
        <path d="M6 6h.01"/>
        <path d="M6 18h.01"/>
    </svg>
@endsection

@section('message')
    Server kami sedang mengalami kendala. Tim teknis sudah diberitahu — silakan coba lagi beberapa saat.
@endsection
