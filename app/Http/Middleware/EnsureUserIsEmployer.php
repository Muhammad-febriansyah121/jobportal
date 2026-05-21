<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsEmployer
{
    /**
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $roleOk = $user?->role === 'employer';
        $activeOk = (bool) $user?->is_active;

        if (! $roleOk || ! $activeOk) {
            Log::warning('Employer access denied', [
                'user_id' => $user?->id,
                'email' => $user?->email,
                'role' => $user?->role,
                'is_active' => $user?->is_active,
                'path' => $request->path(),
            ]);

            abort(Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
