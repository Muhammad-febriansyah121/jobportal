<?php

use App\Http\Middleware\EnsureCandidateOnboardingIsComplete;
use App\Http\Middleware\EnsureUserIsAdmin;
use App\Http\Middleware\EnsureUserIsCandidate;
use App\Http\Middleware\EnsureUserIsEmployer;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\RecordUserActivity;
use App\Http\Middleware\SecurityHeaders;
use App\Http\Middleware\SetLocale;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state', 'app_locale']);

        $middleware->alias([
            'admin' => EnsureUserIsAdmin::class,
            'candidate' => EnsureUserIsCandidate::class,
            'candidate.onboarded' => EnsureCandidateOnboardingIsComplete::class,
            'employer' => EnsureUserIsEmployer::class,
        ]);

        $middleware->web(append: [
            HandleAppearance::class,
            SetLocale::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            RecordUserActivity::class,
        ]);

        $middleware->append(SecurityHeaders::class);

        $middleware->validateCsrfTokens(except: [
            'webhooks/*',
            'api/*',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
