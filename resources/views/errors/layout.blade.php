@php
    $siteSettings = \Illuminate\Support\Facades\Cache::remember('site_settings_head', 3600, fn () =>
        \App\Models\Setting::whereIn('key', [
            'site_name', 'site_logo_url', 'site_favicon_url',
        ])->pluck('value', 'key')->toArray()
    );
    $siteName = $siteSettings['site_name'] ?? config('app.name');

    $resolveAsset = function (?string $value): ?string {
        if (! is_string($value) || $value === '') {
            return null;
        }
        if (\Illuminate\Support\Str::startsWith($value, ['http://', 'https://', '/'])) {
            return $value;
        }
        return \Illuminate\Support\Facades\Storage::url($value);
    };

    $logoUrl = $resolveAsset($siteSettings['site_logo_url'] ?? null);
    $faviconUrl = $resolveAsset($siteSettings['site_favicon_url'] ?? null);
@endphp
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('title', 'Error') &middot; {{ $siteName }}</title>

    @if ($faviconUrl)
        <link rel="icon" href="{{ $faviconUrl }}" type="image/png">
    @else
        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    @endif

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />

    @vite(['resources/css/app.css'])

    <style>
        html, body {
            background-color: #ffffff;
        }
    </style>
</head>
<body class="min-h-screen bg-white font-sans text-slate-900 antialiased">
    <main class="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-12">
        {{-- Decorative blurred blobs in primary --}}
        <div aria-hidden="true" class="pointer-events-none absolute -top-32 -left-32 h-72 w-72 rounded-full bg-[var(--primary-100)] opacity-50 blur-3xl"></div>
        <div aria-hidden="true" class="pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-[var(--primary-50)] opacity-70 blur-3xl"></div>

        <div class="relative z-10 flex w-full max-w-xl flex-col items-center text-center">
            {{-- Brand --}}
            <a href="{{ url('/') }}" class="mb-10 inline-flex items-center gap-3 text-[var(--primary)] transition hover:opacity-80">
                @if ($logoUrl)
                    <img src="{{ $logoUrl }}" alt="{{ $siteName }}" class="h-16 w-auto sm:h-20">
                @else
                    <span class="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--primary)] text-white sm:h-20 sm:w-20">
                        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M22 11h-6"/>
                            <path d="M19 8v6"/>
                        </svg>
                    </span>
                    <span class="text-xl font-semibold tracking-tight sm:text-2xl">{{ $siteName }}</span>
                @endif
            </a>

            {{-- Icon --}}
            <div class="mb-7 flex h-24 w-24 items-center justify-center rounded-full bg-[var(--primary-50)] ring-8 ring-[var(--primary-50)]/40">
                <span class="flex h-16 w-16 items-center justify-center rounded-full bg-white text-[var(--primary)] shadow-sm ring-1 ring-[var(--primary-100)]">
                    @yield('icon')
                </span>
            </div>

            {{-- Status code --}}
            <p class="font-sans text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
                Error @yield('code')
            </p>

            {{-- Title --}}
            <h1 class="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                @yield('title')
            </h1>

            {{-- Message --}}
            <p class="mt-4 max-w-md text-base leading-relaxed text-slate-600">
                @yield('message')
            </p>

            {{-- Actions --}}
            <div class="mt-8 flex w-full flex-col items-center gap-4">
                {{-- Primary CTA --}}
                <a href="{{ url('/') }}"
                   class="inline-flex w-full max-w-sm items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--primary-700)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                    Kembali ke beranda
                </a>

                {{-- Secondary actions as subtle text links --}}
                <div class="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
                    <button type="button" onclick="window.history.length > 1 ? window.history.back() : window.location.href='{{ url('/') }}'"
                            class="inline-flex items-center gap-1.5 whitespace-nowrap font-medium text-slate-500 transition hover:text-[var(--primary)] focus-visible:outline-none focus-visible:underline">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="m12 19-7-7 7-7"/>
                            <path d="M19 12H5"/>
                        </svg>
                        Halaman sebelumnya
                    </button>

                    @auth
                        <span class="hidden h-4 w-px bg-slate-200 sm:block" aria-hidden="true"></span>
                        <form method="POST" action="{{ route('logout') }}">
                            @csrf
                            <button type="submit"
                                    class="inline-flex items-center gap-1.5 whitespace-nowrap font-medium text-rose-600 transition hover:text-rose-700 focus-visible:outline-none focus-visible:underline">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                                    <polyline points="16 17 21 12 16 7"/>
                                    <line x1="21" y1="12" x2="9" y2="12"/>
                                </svg>
                                Logout
                            </button>
                        </form>
                    @endauth
                </div>
            </div>

            @hasSection('extra')
                <div class="mt-8 w-full">
                    @yield('extra')
                </div>
            @endif
        </div>

        <footer class="relative z-10 mt-16 text-xs text-slate-400">
            &copy; {{ date('Y') }} {{ $siteName }}. All rights reserved.
        </footer>
    </main>
</body>
</html>
