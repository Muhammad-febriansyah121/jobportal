@php
    $brand = \App\Support\MailBranding::current();

    if ($brand !== null) {
        $brandName = $brand['brand_name'] !== '' ? $brand['brand_name'] : (string) config('app.name', 'Karivia');
        $supportEmail = trim((string) ($brand['support_email'] ?? ''));
        $supportPhone = trim((string) ($brand['support_phone'] ?? ''));
        $hq = trim((string) ($brand['address'] ?? ''));
        $tagline = trim((string) ($brand['tagline'] ?? ''));
        $appUrl = rtrim((string) ($brand['site_url'] ?? config('app.url')), '/');
    } else {
        $brandName = trim((string) \App\Models\Setting::get('site_name', '')) ?: (string) config('app.name', 'Karivia');
        $supportEmail = trim((string) \App\Models\Setting::get('support_email', 'support@karivia.id'));
        $supportPhone = trim((string) \App\Models\Setting::get('support_phone', ''));
        $hq = trim((string) \App\Models\Setting::get('about_headquarters', ''));
        $tagline = trim((string) \App\Models\Setting::get('site_tagline', ''));
        $appUrl = rtrim((string) config('app.url'), '/');
    }
@endphp
<tr>
<td>
<table class="footer" align="center" width="570" cellpadding="0" cellspacing="0" role="presentation" style="border-top: 1px solid #e5e7eb;">
<tr>
<td style="padding: 28px 32px 12px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
<p style="margin: 0 0 6px; color: #1E4D96; font-size: 14px; font-weight: 600;">{{ $brandName }}</p>
@if ($tagline)
<p style="margin: 0 0 14px; color: #6b7280; font-size: 12px; line-height: 1.5;">{{ $tagline }}</p>
@endif
<p style="margin: 0 0 4px; color: #4b5563; font-size: 12px; line-height: 1.6;">
@if ($supportEmail)
<a href="mailto:{{ $supportEmail }}" style="color: #1E4D96; text-decoration: none;">{{ $supportEmail }}</a>
@endif
@if ($supportEmail && $supportPhone)
<span style="color: #9ca3af; margin: 0 6px;">|</span>
@endif
@if ($supportPhone){{ $supportPhone }}@endif
</p>
@if ($hq)
<p style="margin: 0 0 14px; color: #6b7280; font-size: 12px; line-height: 1.6;">{{ $hq }}</p>
@endif
</td>
</tr>
<tr>
<td style="padding: 0 32px 24px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
<p style="margin: 12px 0 0; color: #9ca3af; font-size: 11px; line-height: 1.6;">
Email ini dikirim otomatis. Mohon tidak membalas pesan ini.
</p>
<p style="margin: 4px 0 0; color: #9ca3af; font-size: 11px;">
&copy; {{ date('Y') }} {{ $brandName }}. Hak Cipta Dilindungi Undang-Undang.
</p>
@if ($appUrl)
<p style="margin: 8px 0 0; font-size: 11px;">
<a href="{{ $appUrl }}" style="color: #1E4D96; text-decoration: none;">{{ preg_replace('#^https?://#', '', $appUrl) }}</a>
</p>
@endif
</td>
</tr>
</table>
</td>
</tr>
