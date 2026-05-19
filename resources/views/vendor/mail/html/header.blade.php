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
<td class="header" style="padding: 36px 0 28px; text-align: center; background-color: #f3f4f6;">
<a href="{{ $url }}" style="display: inline-block; text-decoration: none;">
@if ($logoUrl)
<img src="{{ $logoUrl }}" alt="{{ $brandName }}" style="height: 80px; width: auto; display: block; margin: 0 auto 10px;">
<div style="color: #1E4D96; font-size: 20px; font-weight: 700; letter-spacing: 0.3px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">{{ $brandName }}</div>
@else
<span style="color: #1E4D96; font-size: 24px; font-weight: 700; letter-spacing: 0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">{{ $brandName }}</span>
@endif
</a>
</td>
</tr>
