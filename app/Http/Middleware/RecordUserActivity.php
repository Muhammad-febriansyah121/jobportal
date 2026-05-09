<?php

namespace App\Http\Middleware;

use App\Actions\Admin\RecordActivity;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class RecordUserActivity
{
    public function __construct(private RecordActivity $activity) {}

    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if ($this->shouldRecord($request, $response)) {
            $routeName = $request->route()?->getName();

            $this->activity->handle($request->user(), $this->actionName($request), null, [
                'route' => $routeName,
                'method' => $request->method(),
                'path' => $request->path(),
                'status' => $response->getStatusCode(),
                'ip' => $request->ip(),
                'user_agent' => Str::limit((string) $request->userAgent(), 255, ''),
            ]);
        }

        return $response;
    }

    private function shouldRecord(Request $request, Response $response): bool
    {
        $routeName = (string) $request->route()?->getName();

        return $request->user() !== null
            && ! $request->isMethod('GET')
            && $response->getStatusCode() < 400
            && ! Str::startsWith($routeName, [
                'admin.',
                'login',
                'logout',
                'register',
                'password.',
                'two-factor.',
                'verification.',
            ])
            && ! $request->routeIs('profile.destroy');
    }

    private function actionName(Request $request): string
    {
        $routeName = $request->route()?->getName();

        if (is_string($routeName) && $routeName !== '') {
            return Str::of($routeName)->replace(['.', '-'], '_')->toString();
        }

        return Str::of($request->method().'_'.$request->path())
            ->lower()
            ->replaceMatches('/[^a-z0-9]+/', '_')
            ->trim('_')
            ->toString();
    }
}
