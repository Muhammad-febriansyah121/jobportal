@props(['url'])
@php
    $brand = \App\Support\MailBranding::current();

    if ($brand !== null) {
        $brandName = $brand['brand_name'] !== '' ? $brand['brand_name'] : (string) config('app.name', 'Karivia');
        $logoUrl = $brand['logo_url'] ?: null;
    } else {
        $brandName = trim((string) \App\Models\Setting::get('site_name', '')) ?: (string) config('app.name', 'Karivia');
        $logoPath = \App\Models\Setting::get('site_logo_url');
        $logoUrl = $logoPath ? asset('storage/'.$logoPath) : null;
    }
@endphp
<tr>
<td class="header" style="padding: 32px 0; text-align: center; background-color: #1E4D96;">
<a href="{{ $url }}" style="display: inline-block; text-decoration: none;">
@if ($logoUrl)
<img src="{{ $logoUrl }}" alt="{{ $brandName }}" style="height: 44px; width: auto; display: block; margin: 0 auto;">
@else
<span style="color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">{{ $brandName }}</span>
@endif
</a>
</td>
</tr>
