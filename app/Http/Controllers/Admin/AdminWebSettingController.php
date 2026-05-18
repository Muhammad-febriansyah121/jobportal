<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\AdminSmtpTestMail;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

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

        $smtpPassword = (string) ($settings['smtp_password'] ?? '');
        $settings['smtp_password'] = '';
        $settings['smtp_password_set'] = $smtpPassword !== '' ? '1' : '';

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
            'site_logo_url' => ['sometimes', 'nullable', 'image', 'max:3072'],
            'site_favicon_url' => ['sometimes', 'nullable', 'image', 'max:3072'],
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
            'google_login_client_id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'google_login_client_secret' => ['sometimes', 'nullable', 'string', 'max:500'],
            'privacy_title' => ['sometimes', 'nullable', 'string', 'max:255'],
            'terms_title' => ['sometimes', 'nullable', 'string', 'max:255'],
            'ai_api_key' => ['sometimes', 'nullable', 'string', 'max:500'],
            'ai_model' => ['sometimes', 'nullable', 'string', 'max:100'],
            'whatsapp_gateway_url' => ['sometimes', 'nullable', 'url', 'max:255'],
            'whatsapp_gateway_api_key' => ['sometimes', 'nullable', 'string', 'max:500'],
            'whatsapp_gateway_default_session_id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'whatsapp_gateway_connect_timeout' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:60'],
            'whatsapp_gateway_timeout' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:120'],
            'pakasir_project' => ['sometimes', 'nullable', 'string', 'max:255'],
            'pakasir_api_key' => ['sometimes', 'nullable', 'string', 'max:500'],
            'smtp_host' => ['sometimes', 'nullable', 'string', 'max:255'],
            'smtp_port' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:65535'],
            'smtp_encryption' => ['sometimes', 'nullable', 'string', 'in:tls,ssl,none'],
            'smtp_auth' => ['sometimes', 'boolean'],
            'smtp_username' => ['sometimes', 'nullable', 'email', 'max:255'],
            'smtp_password' => ['sometimes', 'nullable', 'string', 'max:255'],
            'smtp_from_address' => ['sometimes', 'nullable', 'email', 'max:255'],
            'smtp_from_name' => ['sometimes', 'nullable', 'string', 'max:255'],
        ]);

        foreach ($request->except('_token', '_method', 'smtp_password_set') as $key => $value) {
            if (in_array($key, self::IMAGE_KEYS, true) && $request->hasFile($key)) {
                $existing = Setting::where('key', $key)->first();

                if ($existing && $existing->value) {
                    Storage::disk('public')->delete($existing->value);
                }

                $path = $request->file($key)->store('settings', 'public');

                Setting::updateOrCreate(['key' => $key], ['value' => $path]);

                continue;
            }

            if (in_array($key, self::IMAGE_KEYS, true)) {
                continue;
            }

            if ($key === 'smtp_password') {
                $password = (string) ($value ?? '');

                if ($password === '') {
                    continue;
                }

                Setting::updateOrCreate(['key' => $key], ['value' => Crypt::encryptString($password)]);

                continue;
            }

            Setting::updateOrCreate(['key' => $key], ['value' => $value]);
        }

        Cache::forget('site_settings_head');

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pengaturan berhasil disimpan.']);

        return back();
    }

    public function sendSmtpTest(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'to' => ['required', 'email', 'max:255'],
        ]);

        $host = trim((string) Setting::get('smtp_host', ''));
        $encryptedPassword = (string) Setting::get('smtp_password', '');

        if ($host === '' || $encryptedPassword === '') {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Konfigurasi SMTP belum lengkap. Pastikan host dan password sudah diisi.',
            ]);

            return back();
        }

        $brandName = trim((string) Setting::get('site_name', '')) ?: (string) config('app.name', 'Karivia');

        try {
            Mail::to($data['to'])->send(new AdminSmtpTestMail($brandName));
        } catch (Throwable $exception) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Gagal kirim email tes: '.$exception->getMessage(),
            ]);

            return back();
        }

        Setting::updateOrCreate(['key' => 'smtp_last_tested_at'], ['value' => now()->toDateTimeString()]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Email tes berhasil dikirim ke '.$data['to'].'.',
        ]);

        return back();
    }
}
