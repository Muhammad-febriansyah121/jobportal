<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user?->role !== 'admin' || ! $user?->is_active) {
            Log::warning('Admin access denied', [
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
