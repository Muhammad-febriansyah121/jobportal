<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class AdminWebSettingController extends Controller
{
    private const IMAGE_KEYS = [
        'site_logo_url',
        'site_favicon_url',
        'login_banner_url',
        'about_hero_image',
        'about_office_image',
    ];

    public function edit(): Response
    {
        $settings = Setting::all()->pluck('value', 'key');

        return Inertia::render('admin/settings', [
            'settings' => $settings,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $request->validate([
            'site_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'site_tagline' => ['sometimes', 'nullable', 'string', 'max:255'],
            'site_description' => ['sometimes', 'nullable', 'string'],
            'site_meta_description' => ['sometimes', 'nullable', 'string'],
            'site_meta_keywords' => ['sometimes', 'nullable', 'string'],
            'site_logo_url' => ['sometimes', 'nullable', 'image', 'max:2048'],
            'site_favicon_url' => ['sometimes', 'nullable', 'image', 'max:512'],
            'login_banner_url' => ['sometimes', 'nullable', 'image', 'max:4096'],
            'facebook_url' => ['sometimes', 'nullable', 'url', 'max:255'],
            'instagram_url' => ['sometimes', 'nullable', 'url', 'max:255'],
            'linkedin_url' => ['sometimes', 'nullable', 'url', 'max:255'],
            'twitter_url' => ['sometimes', 'nullable', 'url', 'max:255'],
            'youtube_url' => ['sometimes', 'nullable', 'url', 'max:255'],
            'support_email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'support_phone' => ['sometimes', 'nullable', 'string', 'max:50'],
            'whatsapp_number' => ['sometimes', 'nullable', 'string', 'max:50'],
            'about_title' => ['sometimes', 'nullable', 'string', 'max:255'],
            'about_tagline' => ['sometimes', 'nullable', 'string', 'max:255'],
            'about_description' => ['sometimes', 'nullable', 'string'],
            'about_content' => ['sometimes', 'nullable', 'string'],
            'about_employee_count' => ['sometimes', 'nullable', 'string', 'max:100'],
            'about_founded_year' => ['sometimes', 'nullable', 'string', 'max:20'],
            'about_headquarters' => ['sometimes', 'nullable', 'string', 'max:255'],
            'about_hero_image' => ['sometimes', 'nullable', 'image', 'max:4096'],
            'about_office_image' => ['sometimes', 'nullable', 'image', 'max:4096'],
            'maintenance_mode' => ['sometimes', 'boolean'],
            'maintenance_message' => ['sometimes', 'nullable', 'string'],
            'office_maps_embed_url' => ['sometimes', 'nullable', 'string'],
            'recaptcha_site_key' => ['sometimes', 'nullable', 'string', 'max:255'],
            'recaptcha_secret_key' => ['sometimes', 'nullable', 'string', 'max:255'],
            'privacy_title' => ['sometimes', 'nullable', 'string', 'max:255'],
            'terms_title' => ['sometimes', 'nullable', 'string', 'max:255'],
            'ai_api_key' => ['sometimes', 'nullable', 'string', 'max:500'],
            'pakasir_project' => ['sometimes', 'nullable', 'string', 'max:255'],
            'pakasir_api_key' => ['sometimes', 'nullable', 'string', 'max:500'],
        ]);

        foreach ($request->except('_token', '_method') as $key => $value) {
            if (in_array($key, self::IMAGE_KEYS, true) && $request->hasFile($key)) {
                $existing = Setting::where('key', $key)->first();

                if ($existing && $existing->value) {
                    Storage::disk('public')->delete($existing->value);
                }

                $path = $request->file($key)->store('settings', 'public');

                Setting::updateOrCreate(['key' => $key], ['value' => $path]);

                continue;
            }

            if (! in_array($key, self::IMAGE_KEYS, true)) {
                Setting::updateOrCreate(['key' => $key], ['value' => $value]);
            }
        }

        Cache::forget('site_settings_head');

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pengaturan berhasil disimpan.']);

        return back();
    }
}
