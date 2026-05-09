<?php

namespace App\Http\Middleware;

use App\Models\AiInterviewSession;
use App\Models\Conversation;
use App\Models\Interview;
use App\Models\Setting;
use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $siteSettings = Cache::remember('site_settings_head', 3600, fn () => Setting::whereIn('key', [
            'site_name', 'site_logo_url', 'site_favicon_url', 'login_banner_url', 'site_meta_description', 'site_meta_keywords',
            'instagram_url', 'linkedin_url', 'twitter_url', 'facebook_url', 'youtube_url', 'whatsapp_number',
        ])->pluck('value', 'key')->toArray());

        $siteName = $siteSettings['site_name'] ?? config('app.name');
        $siteLogoUrl = $this->settingAssetUrl($siteSettings['site_logo_url'] ?? null);
        $siteFaviconUrl = $this->settingAssetUrl($siteSettings['site_favicon_url'] ?? null);
        $loginBannerUrl = $this->settingAssetUrl($siteSettings['login_banner_url'] ?? null);

        return [
            ...parent::share($request),
            'name' => $siteName,
            'branding' => [
                'name' => $siteName,
                'logo_url' => $siteLogoUrl,
                'favicon_url' => $siteFaviconUrl,
                'login_banner_url' => $loginBannerUrl,
                'social' => [
                    'instagram' => $siteSettings['instagram_url'] ?? null,
                    'linkedin' => $siteSettings['linkedin_url'] ?? null,
                    'twitter' => $siteSettings['twitter_url'] ?? null,
                    'facebook' => $siteSettings['facebook_url'] ?? null,
                    'youtube' => $siteSettings['youtube_url'] ?? null,
                ],
                'whatsapp_number' => $siteSettings['whatsapp_number'] ?? null,
            ],
            'auth' => [
                'user' => $user,
                'candidate_profile_completion' => $user?->role === 'candidate'
                    ? ($user->candidateProfile?->profile_completion ?? 0)
                    : null,
                'candidate_profile_counts' => $user?->role === 'candidate'
                    ? fn () => $this->candidateProfileCounts($user)
                    : null,
            ],
            'employer_unread_messages' => $this->employerUnreadMessages($user),
            'header_notifications' => fn () => $this->headerNotifications($user),
            'nav_counts' => $this->navCounts($user),
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'locale' => App::getLocale(),
            'available_locales' => SetLocale::SUPPORTED_LOCALES,
            'translations' => fn () => $this->translations(App::getLocale()),
        ];
    }

    /**
     * @return array<string, string>
     */
    private function translations(string $locale): array
    {
        $path = base_path("lang/{$locale}.json");

        if (! is_file($path)) {
            return [];
        }

        $contents = file_get_contents($path);
        if ($contents === false) {
            return [];
        }

        $decoded = json_decode($contents, true);

        return is_array($decoded) ? $decoded : [];
    }

    private function settingAssetUrl(?string $value): ?string
    {
        if (! is_string($value) || $value === '') {
            return null;
        }

        if (Str::startsWith($value, ['http://', 'https://', '/'])) {
            return $value;
        }

        return Storage::url($value);
    }

    /**
     * @return array{experiences: int, educations: int, skills: int, cvs: int}
     */
    private function candidateProfileCounts(User $user): array
    {
        $profile = $user->candidateProfile;

        if ($profile === null) {
            return ['experiences' => 0, 'educations' => 0, 'skills' => 0, 'cvs' => 0];
        }

        return [
            'experiences' => $profile->experiences()->count(),
            'educations' => $profile->educations()->count(),
            'skills' => $profile->skills()->count(),
            'cvs' => $profile->cvs()->count(),
        ];
    }

    private function employerUnreadMessages(?User $user): int
    {
        if ($user === null || $user->role !== 'employer') {
            return 0;
        }

        $companyIds = $this->employerCompanyIds($user);

        if ($companyIds->isEmpty()) {
            return 0;
        }

        return Conversation::query()
            ->whereIn('company_id', $companyIds)
            ->whereNotNull('application_id')
            ->whereHas('application.jobListing', fn (Builder $query) => $query->whereIn('company_id', $companyIds))
            ->withCount([
                'messages as unread_count' => fn ($query) => $query
                    ->whereNull('read_at')
                    ->where('sender_id', '!=', $user->id),
            ])
            ->get()
            ->sum('unread_count');
    }

    /**
     * @return array{unread_count: int, items: array<int, array<string, mixed>>}
     */
    private function headerNotifications(?User $user): array
    {
        if ($user === null) {
            return [
                'unread_count' => 0,
                'items' => [],
            ];
        }

        $databaseNotifications = UserNotification::query()
            ->where('user_id', $user->id)
            ->latest('id')
            ->limit(8)
            ->get();

        $items = collect();
        $unreadCount = (int) UserNotification::query()
            ->where('user_id', $user->id)
            ->where('is_read', false)
            ->count();

        $unreadMessages = $this->unreadMessages($user);
        if ($unreadMessages > 0) {
            $items->push([
                'id' => 'unread-messages',
                'type' => 'unread_messages',
                'title' => __('notif.unread_messages.title'),
                'message' => __('notif.unread_messages.message', ['count' => $unreadMessages]),
                'href' => $user->role === 'employer' ? route('employer.messages.index') : route('candidate.messages.index'),
                'is_read' => false,
                'created_at' => now()->toIso8601String(),
                'time_label' => __('common.new'),
            ]);
            $unreadCount++;
        }

        $upcomingInterviews = $this->upcomingInterviewsCount($user);
        if ($upcomingInterviews > 0) {
            $items->push([
                'id' => 'upcoming-interviews',
                'type' => 'upcoming_interviews',
                'title' => __('notif.upcoming_interviews.title'),
                'message' => __('notif.upcoming_interviews.message', ['count' => $upcomingInterviews]),
                'href' => $user->role === 'employer' ? route('employer.candidates.index') : route('candidate.interviews.index'),
                'is_read' => false,
                'created_at' => now()->toIso8601String(),
                'time_label' => __('common.new'),
            ]);
            $unreadCount++;
        }

        $databaseItems = $databaseNotifications
            ->map(fn (UserNotification $notification): array => [
                'id' => 'notif-'.$notification->id,
                'type' => $notification->type,
                'title' => $notification->title,
                'message' => $notification->message,
                'href' => $this->notificationHref($user, $notification->type, is_array($notification->data_json) ? $notification->data_json : []),
                'is_read' => (bool) $notification->is_read,
                'created_at' => $notification->created_at?->toIso8601String(),
                'time_label' => $notification->created_at?->diffForHumans(),
            ])
            ->all();

        return [
            'unread_count' => $unreadCount,
            'items' => $items
                ->merge($databaseItems)
                ->take(8)
                ->values()
                ->all(),
        ];
    }

    private function unreadMessages(User $user): int
    {
        if ($user->role === 'employer') {
            return $this->employerUnreadMessages($user);
        }

        if ($user->role !== 'candidate') {
            return 0;
        }

        $candidateId = $user->candidateProfile?->id;
        if (! is_numeric($candidateId)) {
            return 0;
        }

        return Conversation::query()
            ->where('candidate_id', $candidateId)
            ->withCount([
                'messages as unread_count' => fn (Builder $query) => $query
                    ->whereNull('read_at')
                    ->where('sender_id', '!=', $user->id),
            ])
            ->get()
            ->sum('unread_count');
    }

    private function upcomingInterviewsCount(User $user): int
    {
        $counts = $this->interviewCounts($user);

        return $counts['manual'] + $counts['ai'];
    }

    /**
     * @return array{manual: int, ai: int}
     */
    private function interviewCounts(User $user): array
    {
        $manualInterviewQuery = Interview::query()
            ->whereIn('status', ['scheduled', 'confirmed'])
            ->whereNotNull('scheduled_at')
            ->where('scheduled_at', '>=', now()->subDay());

        $aiInterviewQuery = AiInterviewSession::query()
            ->whereIn('status', ['pending', 'scheduled', 'in_progress'])
            ->where(function (Builder $query): void {
                $query
                    ->where(function (Builder $scheduledQuery): void {
                        $scheduledQuery
                            ->whereNotNull('scheduled_at')
                            ->where('scheduled_at', '>=', now()->subDay());
                    })
                    ->orWhere(function (Builder $inProgressQuery): void {
                        $inProgressQuery
                            ->where('status', 'in_progress')
                            ->whereNotNull('started_at')
                            ->where('started_at', '>=', now()->subDay());
                    });
            });

        if ($user->role === 'candidate') {
            $candidateId = $user->candidateProfile?->id;

            if (! is_numeric($candidateId)) {
                return ['manual' => 0, 'ai' => 0];
            }

            return [
                'manual' => (clone $manualInterviewQuery)
                    ->whereHas('application', fn (Builder $applicationQuery) => $applicationQuery->where('candidate_id', $candidateId))
                    ->count(),
                'ai' => (clone $aiInterviewQuery)
                    ->where('candidate_id', $candidateId)
                    ->count(),
            ];
        }

        if ($user->role !== 'employer') {
            return ['manual' => 0, 'ai' => 0];
        }

        $companyIds = $this->employerCompanyIds($user);

        if ($companyIds->isEmpty()) {
            return ['manual' => 0, 'ai' => 0];
        }

        return [
            'manual' => (clone $manualInterviewQuery)
                ->whereHas('application.jobListing', fn (Builder $jobQuery) => $jobQuery->whereIn('company_id', $companyIds))
                ->count(),
            'ai' => (clone $aiInterviewQuery)
                ->whereHas('application.jobListing', fn (Builder $jobQuery) => $jobQuery->whereIn('company_id', $companyIds))
                ->count(),
        ];
    }

    /**
     * @return array{upcoming_interviews: int, pending_ai_interviews: int}
     */
    private function navCounts(?User $user): array
    {
        if ($user === null) {
            return ['upcoming_interviews' => 0, 'pending_ai_interviews' => 0];
        }

        $counts = $this->interviewCounts($user);

        return [
            'upcoming_interviews' => $counts['manual'],
            'pending_ai_interviews' => $counts['ai'],
        ];
    }

    /**
     * @return Collection<int, int>
     */
    private function employerCompanyIds(User $user): Collection
    {
        $ownedCompanyIds = $user->ownedCompanies()->pluck('id');
        $membershipCompanyIds = $user->companyMemberships()
            ->where('is_active', true)
            ->pluck('company_id');

        return $ownedCompanyIds
            ->merge($membershipCompanyIds)
            ->filter()
            ->unique()
            ->values();
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function notificationHref(User $user, string $type, array $payload): string
    {
        if ($type === 'application_submitted') {
            return route('employer.candidates.index');
        }

        if ($type === 'company_verification') {
            return route('employer.verification.index');
        }

        if ($type === 'interview_scheduled' && isset($payload['interview_id']) && is_numeric($payload['interview_id']) && $user->role === 'candidate') {
            return route('candidate.interviews.show', (int) $payload['interview_id']);
        }

        if (
            in_array($type, ['ai_interview_scheduled', 'ai_interview_reschedule_approved', 'ai_interview_reschedule_rejected'], true)
            && isset($payload['ai_interview_session_id'])
            && is_numeric($payload['ai_interview_session_id'])
            && $user->role === 'candidate'
        ) {
            return route('candidate.ai-interviews.show', (int) $payload['ai_interview_session_id']);
        }

        if ($type === 'application_status_changed' && isset($payload['application_id']) && is_numeric($payload['application_id']) && $user->role === 'candidate') {
            return route('candidate.applications.show', (int) $payload['application_id']);
        }

        return match ($user->role) {
            'employer' => route('employer.dashboard'),
            'candidate' => route('candidate.dashboard'),
            'admin' => route('admin.dashboard'),
            default => route('dashboard'),
        };
    }
}
