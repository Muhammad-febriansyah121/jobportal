<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class AdminLegalPageController extends Controller
{
    public function editTerms(): Response
    {
        $settings = Setting::whereIn('key', ['terms_title', 'terms_content'])
            ->pluck('value', 'key');

        return Inertia::render('admin/legal/terms', [
            'terms_title' => $settings->get('terms_title', ''),
            'terms_content' => $settings->get('terms_content', ''),
        ]);
    }

    public function updateTerms(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'terms_title' => ['nullable', 'string', 'max:255'],
            'terms_content' => ['nullable', 'string'],
        ]);

        foreach ($validated as $key => $value) {
            Setting::updateOrCreate(['key' => $key], ['value' => $value]);
        }

        Cache::forget('site_settings_head');

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Syarat & Ketentuan berhasil disimpan.']);

        return back();
    }

    public function editPrivacy(): Response
    {
        $settings = Setting::whereIn('key', ['privacy_title', 'privacy_content'])
            ->pluck('value', 'key');

        return Inertia::render('admin/legal/privacy', [
            'privacy_title' => $settings->get('privacy_title', ''),
            'privacy_content' => $settings->get('privacy_content', ''),
        ]);
    }

    public function updatePrivacy(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'privacy_title' => ['nullable', 'string', 'max:255'],
            'privacy_content' => ['nullable', 'string'],
        ]);

        foreach ($validated as $key => $value) {
            Setting::updateOrCreate(['key' => $key], ['value' => $value]);
        }

        Cache::forget('site_settings_head');

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Kebijakan Privasi berhasil disimpan.']);

        return back();
    }
}
