<?php

namespace App\Http\Controllers;

use App\Http\Middleware\SetLocale;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LocaleController extends Controller
{
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'locale' => ['required', 'string', Rule::in(SetLocale::SUPPORTED_LOCALES)],
        ]);

        $locale = $validated['locale'];

        $request->session()->put(SetLocale::SESSION_KEY, $locale);

        $user = $request->user();
        if ($user !== null) {
            $user->forceFill(['locale' => $locale])->save();
        }

        $cookie = cookie(SetLocale::SESSION_KEY, $locale, 60 * 24 * 365);

        return redirect()->back()->withCookie($cookie);
    }
}
