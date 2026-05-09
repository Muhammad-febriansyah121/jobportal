<?php

namespace App\Http\Controllers;

use App\Models\Faq;
use App\Models\Setting;
use Inertia\Inertia;
use Inertia\Response;

class LegalPageController extends Controller
{
    public function terms(): Response
    {
        $settings = Setting::whereIn('key', ['terms_title', 'terms_content'])
            ->pluck('value', 'key');

        return Inertia::render('front/legal/terms', [
            'terms_title' => $settings->get('terms_title', 'Syarat & Ketentuan'),
            'terms_content' => $settings->get('terms_content', ''),
        ]);
    }

    public function privacy(): Response
    {
        $settings = Setting::whereIn('key', ['privacy_title', 'privacy_content'])
            ->pluck('value', 'key');

        return Inertia::render('front/legal/privacy', [
            'privacy_title' => $settings->get('privacy_title', 'Kebijakan Privasi'),
            'privacy_content' => $settings->get('privacy_content', ''),
        ]);
    }

    public function about(): Response
    {
        $keys = [
            'about_title', 'about_tagline', 'about_description',
            'about_founded_year', 'about_employee_count', 'about_headquarters',
            'about_hero_image', 'about_office_image',
            'about_vision', 'about_mission', 'about_story', 'about_values',
        ];

        $settings = Setting::whereIn('key', $keys)->pluck('value', 'key');

        $faqs = Faq::orderBy('id')->get(['id', 'title', 'description']);

        return Inertia::render('front/legal/about', [
            'about_title' => $settings->get('about_title', 'Tentang Kami'),
            'about_tagline' => $settings->get('about_tagline', ''),
            'about_description' => $settings->get('about_description', ''),
            'about_founded_year' => $settings->get('about_founded_year', ''),
            'about_employee_count' => $settings->get('about_employee_count', ''),
            'about_headquarters' => $settings->get('about_headquarters', ''),
            'about_hero_image' => $settings->get('about_hero_image', ''),
            'about_office_image' => $settings->get('about_office_image', ''),
            'about_vision' => $settings->get('about_vision', ''),
            'about_mission' => $settings->get('about_mission', ''),
            'about_story' => $settings->get('about_story', ''),
            'about_values' => $settings->get('about_values', ''),
            'faqs' => $faqs,
        ]);
    }
}
