<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCandidateOnboardingIsComplete
{
    /**
     * @var array<int, string>
     */
    private const EXCEPT_ROUTE_NAMES = [
        'candidate.dashboard',
        'candidate.onboarding.edit',
        'candidate.onboarding.store',
        'candidate.profile.edit',
        'candidate.profile.update',
        'candidate.experiences.index',
        'candidate.experiences.store',
        'candidate.experiences.update',
        'candidate.experiences.destroy',
        'candidate.educations.index',
        'candidate.educations.store',
        'candidate.educations.update',
        'candidate.educations.destroy',
        'candidate.skills.index',
        'candidate.skills.store',
        'candidate.skills.update',
        'candidate.skills.destroy',
        'candidate.cvs.index',
        'candidate.cvs.store',
        'candidate.cvs.destroy',
        'candidate.cvs.primary',
    ];

    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null || $user->role !== 'candidate') {
            return $next($request);
        }

        if ($user->onboarding_completed_at !== null) {
            return $next($request);
        }

        $candidateProfile = $user->candidateProfile;
        if (
            $candidateProfile !== null &&
            (int) ($candidateProfile->profile_completion ?? 0) >= 100
        ) {
            $user->forceFill(['onboarding_completed_at' => now()])->save();

            return $next($request);
        }

        $routeName = (string) optional($request->route())->getName();

        if (in_array($routeName, self::EXCEPT_ROUTE_NAMES, true)) {
            return $next($request);
        }

        return redirect()->route('candidate.onboarding.edit');
    }
}
