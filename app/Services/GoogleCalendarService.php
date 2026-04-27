<?php

namespace App\Services;

use App\Models\GoogleCalendarToken;
use App\Models\User;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class GoogleCalendarService
{
    private const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

    private const TOKEN_URL = 'https://oauth2.googleapis.com/token';

    private const USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';

    private const CALENDAR_EVENTS_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

    private const SCOPES = [
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/userinfo.email',
    ];

    public function isConfigured(): bool
    {
        return filled(config('services.google_calendar.client_id'))
            && filled(config('services.google_calendar.client_secret'))
            && filled(config('services.google_calendar.redirect_uri'));
    }

    public function authUrl(string $state): string
    {
        $params = [
            'client_id' => config('services.google_calendar.client_id'),
            'redirect_uri' => config('services.google_calendar.redirect_uri'),
            'response_type' => 'code',
            'scope' => implode(' ', self::SCOPES),
            'access_type' => 'offline',
            'prompt' => 'consent',
            'include_granted_scopes' => 'true',
            'state' => $state,
        ];

        return self::AUTH_URL.'?'.http_build_query($params);
    }

    public function exchangeCodeForToken(string $code): array
    {
        $response = Http::asForm()
            ->post(self::TOKEN_URL, [
                'code' => $code,
                'client_id' => config('services.google_calendar.client_id'),
                'client_secret' => config('services.google_calendar.client_secret'),
                'redirect_uri' => config('services.google_calendar.redirect_uri'),
                'grant_type' => 'authorization_code',
            ])
            ->throw()
            ->json();

        return $response;
    }

    public function fetchUserEmail(string $accessToken): ?string
    {
        try {
            $response = Http::withToken($accessToken)
                ->get(self::USERINFO_URL)
                ->throw()
                ->json();

            return $response['email'] ?? null;
        } catch (RequestException $e) {
            return null;
        }
    }

    public function storeToken(User $user, array $tokenData, ?string $email): GoogleCalendarToken
    {
        $expiresAt = isset($tokenData['expires_in'])
            ? Carbon::now()->addSeconds((int) $tokenData['expires_in'])
            : null;

        return GoogleCalendarToken::updateOrCreate(
            ['user_id' => $user->id],
            [
                'calendar_email' => $email,
                'access_token' => $tokenData['access_token'],
                'refresh_token' => $tokenData['refresh_token'] ?? null,
                'expires_at' => $expiresAt,
                'scopes' => isset($tokenData['scope']) ? explode(' ', $tokenData['scope']) : null,
            ]
        );
    }

    public function refreshTokenIfNeeded(GoogleCalendarToken $token): GoogleCalendarToken
    {
        if (! $token->isExpired()) {
            return $token;
        }

        if (blank($token->refresh_token)) {
            throw new RuntimeException('Google Calendar token expired and no refresh token available. Please reconnect.');
        }

        $response = Http::asForm()
            ->post(self::TOKEN_URL, [
                'client_id' => config('services.google_calendar.client_id'),
                'client_secret' => config('services.google_calendar.client_secret'),
                'refresh_token' => $token->refresh_token,
                'grant_type' => 'refresh_token',
            ])
            ->throw()
            ->json();

        $token->update([
            'access_token' => $response['access_token'],
            'expires_at' => isset($response['expires_in'])
                ? Carbon::now()->addSeconds((int) $response['expires_in'])
                : null,
        ]);

        return $token->fresh();
    }

    /**
     * @param  array{summary: string, description?: string, start: \DateTimeInterface, end: \DateTimeInterface, attendee_email?: string|null}  $payload
     * @return array{event_id: string, meet_url: string, html_link: string}
     */
    public function createMeetEvent(User $user, array $payload): array
    {
        $token = GoogleCalendarToken::where('user_id', $user->id)->first();

        if ($token === null) {
            throw new RuntimeException('User belum terhubung ke Google Calendar.');
        }

        $token = $this->refreshTokenIfNeeded($token);

        $body = [
            'summary' => $payload['summary'],
            'description' => $payload['description'] ?? null,
            'start' => [
                'dateTime' => $payload['start']->format(\DateTimeInterface::RFC3339),
                'timeZone' => config('app.timezone'),
            ],
            'end' => [
                'dateTime' => $payload['end']->format(\DateTimeInterface::RFC3339),
                'timeZone' => config('app.timezone'),
            ],
            'conferenceData' => [
                'createRequest' => [
                    'requestId' => (string) Str::uuid(),
                    'conferenceSolutionKey' => ['type' => 'hangoutsMeet'],
                ],
            ],
        ];

        if (! empty($payload['attendee_email'])) {
            $body['attendees'] = [
                ['email' => $payload['attendee_email']],
            ];
        }

        $response = Http::withToken($token->access_token)
            ->post(self::CALENDAR_EVENTS_URL.'?conferenceDataVersion=1&sendUpdates=all', $body)
            ->throw()
            ->json();

        $meetUrl = $response['hangoutLink']
            ?? collect($response['conferenceData']['entryPoints'] ?? [])
                ->firstWhere('entryPointType', 'video')['uri']
            ?? null;

        if ($meetUrl === null) {
            throw new RuntimeException('Google tidak mengembalikan link Meet. Coba lagi.');
        }

        return [
            'event_id' => $response['id'],
            'meet_url' => $meetUrl,
            'html_link' => $response['htmlLink'] ?? '',
        ];
    }

    public function disconnect(User $user): void
    {
        GoogleCalendarToken::where('user_id', $user->id)->delete();
    }
}
