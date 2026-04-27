<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    /**
     * Create an HTTP response that represents the object.
     */
    public function toResponse($request): RedirectResponse|JsonResponse
    {
        if ($request->wantsJson()) {
            return new JsonResponse('', 204);
        }

        return redirect()->intended($this->redirectPath($request));
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
