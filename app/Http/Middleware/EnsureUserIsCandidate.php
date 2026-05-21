<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsCandidate
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user?->role !== 'candidate' || ! $user?->is_active) {
            Log::warning('Candidate access denied', [
                'user_id' => $user?->id,
                'email' => $user?->email,
                'role' => $user?->role,
                'is_active' => $user?->is_active,
                'path' => $request->path(),
            ]);

            abort(403);
        }

        return $next($request);
    }
}
