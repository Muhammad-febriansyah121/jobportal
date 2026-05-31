@php
    $siteSettings = \Illuminate\Support\Facades\Cache::remember('site_settings_head', 3600, fn () =>
        \App\Models\Setting::whereIn('key', [
            'site_name', 'site_favicon_url', 'site_logo_url', 'site_meta_description', 'site_meta_keywords',
        ])->pluck('value', 'key')->toArray()
    );
    $siteName = $siteSettings['site_name'] ?? config('app.name');
    $faviconPath = $siteSettings['site_favicon_url'] ?? null;
    $faviconUrl = $faviconPath ? \Illuminate\Support\Facades\Storage::url($faviconPath) : null;
    $logoPath = $siteSettings['site_logo_url'] ?? null;
    $ogImageUrl = $logoPath
        ? \Illuminate\Support\Facades\Storage::url($logoPath)
        : ($faviconUrl ?? null);
    $metaDescription = $siteSettings['site_meta_description'] ?? null;
    $metaKeywords = $siteSettings['site_meta_keywords'] ?? null;
@endphp
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="site-name" content="{{ $siteName }}">

        @if ($metaDescription)
            <meta name="description" content="{{ $metaDescription }}">
        @endif

        @if ($metaKeywords)
            <meta name="keywords" content="{{ $metaKeywords }}">
        @endif

        {{-- Open Graph --}}
        <meta property="og:type" content="website">
        <meta property="og:site_name" content="{{ $siteName }}">
        <meta property="og:title" content="{{ $siteName }}">
        @if ($metaDescription)
            <meta property="og:description" content="{{ $metaDescription }}">
        @endif
        @if ($ogImageUrl)
            <meta property="og:image" content="{{ $ogImageUrl }}">
            <meta property="og:image:width" content="1200">
            <meta property="og:image:height" content="630">
        @endif
        <meta property="og:url" content="{{ url()->current() }}">

        {{-- Twitter Card --}}
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="{{ $siteName }}">
        @if ($metaDescription)
            <meta name="twitter:description" content="{{ $metaDescription }}">
        @endif
        @if ($ogImageUrl)
            <meta name="twitter:image" content="{{ $ogImageUrl }}">
        @endif

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>

        @if ($faviconUrl)
            <link rel="icon" href="{{ $faviconUrl }}" type="image/png">
            <link rel="apple-touch-icon" href="{{ $faviconUrl }}">
        @else
            <link rel="icon" href="/favicon.ico" sizes="any">
            <link rel="icon" href="/favicon.svg" type="image/svg+xml">
            <link rel="apple-touch-icon" href="/apple-touch-icon.png">
        @endif

        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link rel="preload" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
        <noscript><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet"></noscript>

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            <title>{{ $siteName }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
    </body>
</html>
