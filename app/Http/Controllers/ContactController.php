<?php

namespace App\Http\Controllers;

use App\Models\ContactMessage;
use App\Models\Faq;
use App\Models\Setting;
use App\Services\RecaptchaService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ContactController extends Controller
{
    public function __invoke(): Response
    {
        $keys = [
            'site_name',
            'support_email',
            'support_phone',
            'whatsapp_number',
            'about_headquarters',
            'office_maps_embed_url',
            'facebook_url',
            'instagram_url',
            'linkedin_url',
            'twitter_url',
            'youtube_url',
            'recaptcha_site_key',
            'recaptcha_enabled',
        ];

        $settings = Setting::whereIn('key', $keys)->pluck('value', 'key');

        $faqs = Faq::orderBy('id')->get(['id', 'title', 'description']);

        return Inertia::render('front/contact', [
            'faqs' => $faqs,
            'site_name' => $settings->get('site_name', 'Karivia'),
            'support_email' => $settings->get('support_email', ''),
            'support_phone' => $settings->get('support_phone', ''),
            'whatsapp_number' => $settings->get('whatsapp_number', ''),
            'address' => $settings->get('about_headquarters', ''),
            'maps_embed_url' => $settings->get('office_maps_embed_url', ''),
            'facebook_url' => $settings->get('facebook_url', ''),
            'instagram_url' => $settings->get('instagram_url', ''),
            'linkedin_url' => $settings->get('linkedin_url', ''),
            'twitter_url' => $settings->get('twitter_url', ''),
            'youtube_url' => $settings->get('youtube_url', ''),
            'recaptcha_site_key' => $settings->get('recaptcha_site_key', ''),
            'recaptcha_enabled' => $settings->get('recaptcha_enabled', 'false') === 'true',
        ]);
    }

    public function send(Request $request, RecaptchaService $recaptcha): RedirectResponse
    {
        $secretKey = Setting::where('key', 'recaptcha_secret_key')->value('value');
        $enabled = Setting::where('key', 'recaptcha_enabled')->value('value') === 'true';

        if ($enabled && $secretKey) {
            $token = $request->input('recaptcha_token', '');
            if (! $recaptcha->verify($token, $secretKey)) {
                throw ValidationException::withMessages([
                    'recaptcha' => ['Verifikasi reCAPTCHA gagal. Silakan coba lagi.'],
                ]);
            }
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'subject' => ['required', 'string', 'max:200'],
            'message' => ['required', 'string', 'max:2000'],
        ], [
            'name.required' => 'Nama wajib diisi.',
            'email.required' => 'Email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'subject.required' => 'Subjek wajib diisi.',
            'message.required' => 'Pesan wajib diisi.',
            'message.max' => 'Pesan maksimal 2000 karakter.',
        ]);

        ContactMessage::create($validated);

        return back()->with('success', 'Pesan kamu berhasil terkirim! Kami akan menghubungi kamu segera.');
    }
}
