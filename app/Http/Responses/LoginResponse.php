<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Symfony\Component\HttpFoundation\Response;

class LoginResponse implements LoginResponseContract
{
    /**
     * Create an HTTP response that represents the object.
     */
    public function toResponse($request): Response|RedirectResponse|JsonResponse
    {
        if ($request->wantsJson()) {
            return new JsonResponse('', 204);
        }

        $intended = $request->session()->pull('url.intended');
        $target = is_string($intended) && $this->canAccessIntendedPath($request, $intended)
            ? $intended
            : $this->redirectPath($request);

        if ($request->header('X-Inertia')) {
            return Inertia::location($target);
        }

        return redirect($target);
    }

    private function redirectPath(Request $request): string
    {
        return match ($request->user()?->role) {
            'admin' => route('admin.dashboard'),
            'candidate' => route('candidate.dashboard'),
            'employer' => route('employer.dashboard'),
            default => route('dashboard'),
        };
    }

    private function canAccessIntendedPath(Request $request, string $target): bool
    {
        $path = trim((string) parse_url($target, PHP_URL_PATH), '/');

        if ($path === '') {
            return true;
        }

        return match ($request->user()?->role) {
            'admin' => true,
            'candidate' => ! Str::startsWith($path, ['admin/', 'employer/']) && $path !== 'admin' && $path !== 'employer',
            'employer' => ! Str::startsWith($path, ['admin/', 'candidate/']) && $path !== 'admin' && $path !== 'candidate',
            default => ! Str::startsWith($path, ['admin/', 'candidate/', 'employer/']) && ! in_array($path, ['admin', 'candidate', 'employer'], true),
        };
    }
}
