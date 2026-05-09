<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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

        $target = $request->session()->pull('url.intended', $this->redirectPath($request));

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
}
