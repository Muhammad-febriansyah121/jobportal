<?php

namespace App\Listeners;

use App\Actions\Admin\RecordActivity;
use App\Models\User;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Events\Verified;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Str;

class RecordAuthenticationActivity
{
    public function __construct(private RecordActivity $activity) {}

    /**
     * Handle the event.
     */
    public function handle(Registered|Login|Logout|Failed|Verified|PasswordReset $event): void
    {
        $user = $this->userFromEvent($event);

        if (! $user instanceof User) {
            return;
        }

        $this->activity->handle($user, $this->actionFor($event), null, [
            'source' => 'auth',
            'guard' => property_exists($event, 'guard') ? $event->guard : null,
            'email' => $event instanceof Failed ? (string) ($event->credentials['email'] ?? '') : $user->email,
            'remember' => $event instanceof Login ? $event->remember : null,
            'ip' => request()->ip(),
            'user_agent' => Str::limit((string) request()->userAgent(), 255, ''),
        ]);
    }

    private function userFromEvent(Registered|Login|Logout|Failed|Verified|PasswordReset $event): ?Authenticatable
    {
        return $event->user ?? null;
    }

    private function actionFor(Registered|Login|Logout|Failed|Verified|PasswordReset $event): string
    {
        return match (true) {
            $event instanceof Registered => 'register_user',
            $event instanceof Login => 'login_user',
            $event instanceof Logout => 'logout_user',
            $event instanceof Failed => 'failed_login',
            $event instanceof Verified => 'verify_email',
            $event instanceof PasswordReset => 'reset_password',
        };
    }
}
