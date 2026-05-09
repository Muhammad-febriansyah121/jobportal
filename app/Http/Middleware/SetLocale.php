<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    public const SUPPORTED_LOCALES = ['id', 'en'];

    public const SESSION_KEY = 'app_locale';

    public function handle(Request $request, Closure $next): Response
    {
        $locale = $this->resolveLocale($request);

        App::setLocale($locale);
        $request->session()->put(self::SESSION_KEY, $locale);

        return $next($request);
    }

    private function resolveLocale(Request $request): string
    {
        $user = $request->user();

        if ($user !== null && in_array($user->locale ?? null, self::SUPPORTED_LOCALES, true)) {
            return $user->locale;
        }

        $sessionLocale = $request->session()->get(self::SESSION_KEY);
        if (in_array($sessionLocale, self::SUPPORTED_LOCALES, true)) {
            return $sessionLocale;
        }

        $cookieLocale = $request->cookie(self::SESSION_KEY);
        if (in_array($cookieLocale, self::SUPPORTED_LOCALES, true)) {
            return $cookieLocale;
        }

        $default = config('app.locale', 'id');

        return in_array($default, self::SUPPORTED_LOCALES, true) ? $default : 'id';
    }
}
