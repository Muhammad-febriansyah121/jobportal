<?php

namespace App\Http\Controllers\Settings;

use App\Actions\Candidate\ResolveCandidateProfile;
use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();
        $user->loadMissing('candidateProfile:id,user_id,full_name');
        $profileName = $user->role === 'candidate'
            ? ($user->candidateProfile?->full_name ?? $user->name)
            : $user->name;

        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
            'profile' => [
                'name' => $profileName,
                'email' => $user->email,
                'phone' => $user->phone,
                'address' => $user->address,
                'avatar_url' => $user->avatar_url,
            ],
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request, ResolveCandidateProfile $resolveCandidateProfile): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->safe()->except(['avatar', 'remove_avatar']);

        $user->fill($validated);

        if ($request->boolean('remove_avatar')) {
            $this->deleteStoredAvatar($user->avatar_url);
            $user->avatar_url = null;
        }

        if ($request->hasFile('avatar')) {
            $this->deleteStoredAvatar($user->avatar_url);

            $path = $request->file('avatar')->store('avatars', 'public');
            $user->avatar_url = Storage::disk('public')->url($path);
        }

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        if ($user->role === 'candidate') {
            $candidateProfile = $user->candidateProfile()->updateOrCreate(
                ['user_id' => $user->id],
                ['full_name' => $user->name]
            );

            $resolveCandidateProfile->refreshCompletion($candidateProfile);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Profile updated.')]);

        return to_route('profile.edit');
    }

    /**
     * Delete the user's profile.
     */
    public function destroy(ProfileDeleteRequest $request): RedirectResponse
    {
        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }

    private function deleteStoredAvatar(?string $avatarUrl): void
    {
        if (! is_string($avatarUrl) || $avatarUrl === '' || ! Str::startsWith($avatarUrl, '/storage/')) {
            return;
        }

        $path = Str::of($avatarUrl)->after('/storage/')->toString();
        Storage::disk('public')->delete($path);
    }
}
