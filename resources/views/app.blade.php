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
    $jobTitle = data_get($page, 'props.job.title');
    $jobCompany = data_get($page, 'props.job.company');
    $jobDescription = data_get($page, 'props.job.description');
    $shareTitle = $jobTitle
        ? $jobTitle.' — '.($jobCompany ?: $siteName)
        : $siteName;
    $shareDescription = filled($jobDescription)
        ? \Illuminate\Support\Str::of((string) $jobDescription)
            ->stripTags()
            ->squish()
            ->limit(160)
            ->toString()
        : $metaDescription;
@endphp
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="site-name" content="{{ $siteName }}">

        <!-- Google tag (gtag.js) -->
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-HBDC1R1MD4"></script>
        <script>
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', 'G-HBDC1R1MD4');
        </script>

        <!-- Meta Pixel Code -->
        <script>
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '1760783824917166');
        fbq('track', 'PageView');
        </script>
        <noscript><img height="1" width="1" style="display:none"
        src="https://www.facebook.com/tr?id=1760783824917166&ev=PageView&noscript=1"
        /></noscript>
        <!-- End Meta Pixel Code -->

        @if ($shareDescription)
            <meta name="description" content="{{ $shareDescription }}">
        @endif

        @if ($metaKeywords)
            <meta name="keywords" content="{{ $metaKeywords }}">
        @endif

        {{-- Open Graph --}}
        <meta property="og:type" content="website">
        <meta property="og:site_name" content="{{ $siteName }}">
        <meta property="og:title" content="{{ $shareTitle }}">
        @if ($shareDescription)
            <meta property="og:description" content="{{ $shareDescription }}">
        @endif
        @if ($ogImageUrl)
            <meta property="og:image" content="{{ $ogImageUrl }}">
            <meta property="og:image:width" content="1200">
            <meta property="og:image:height" content="630">
        @endif
        <meta property="og:url" content="{{ url()->current() }}">

        {{-- Twitter Card --}}
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="{{ $shareTitle }}">
        @if ($shareDescription)
            <meta name="twitter:description" content="{{ $shareDescription }}">
        @endif
        @if ($ogImageUrl)
            <meta name="twitter:image" content="{{ $ogImageUrl }}">
        @endif

        {{-- Public and application surfaces use the light theme only. --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }
        </style>

        @if ($faviconUrl)
            <link rel="icon" href="{{ $faviconUrl }}" type="image/png">
            <link rel="apple-touch-icon" href="{{ $faviconUrl }}">
        @else
            <link rel="icon" href="/karivia-favicon.svg" type="image/svg+xml">
            <link rel="apple-touch-icon" href="/karivia-favicon.svg">
        @endif

        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link rel="preload" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
        <noscript><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet"></noscript>

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
