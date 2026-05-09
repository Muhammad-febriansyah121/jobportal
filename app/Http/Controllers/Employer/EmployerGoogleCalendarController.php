<?php

namespace App\Http\Controllers\Employer;

use App\Actions\Employer\ResolveEmployerCompany;
use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Services\GoogleCalendarService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Str;
use Throwable;

class EmployerGoogleCalendarController extends Controller
{
    public function __construct(private readonly GoogleCalendarService $service) {}

    public function connect(Request $request): RedirectResponse
    {
        if (! $this->service->isConfigured()) {
            return back()->with('toast', [
                'type' => 'error',
                'message' => 'Google Calendar belum dikonfigurasi di server.',
            ]);
        }

        $state = Str::random(40);
        Session::put('google_calendar_oauth_state', $state);

        return redirect()->away($this->service->authUrl($state));
    }

    public function callback(Request $request): RedirectResponse
    {
        $expectedState = Session::pull('google_calendar_oauth_state');

        if ($request->query('state') !== $expectedState) {
            return redirect()
                ->route('employer.candidates.index')
                ->with('toast', ['type' => 'error', 'message' => 'State tidak valid. Coba hubungkan ulang.']);
        }

        if (filled($request->query('error'))) {
            return redirect()
                ->route('employer.candidates.index')
                ->with('toast', [
                    'type' => 'error',
                    'message' => 'Otorisasi Google dibatalkan: '.$request->query('error'),
                ]);
        }

        $code = (string) $request->query('code');

        if ($code === '') {
            return redirect()
                ->route('employer.candidates.index')
                ->with('toast', ['type' => 'error', 'message' => 'Tidak ada kode otorisasi dari Google.']);
        }

        try {
            $tokenData = $this->service->exchangeCodeForToken($code);
            $email = $this->service->fetchUserEmail($tokenData['access_token']);
            $this->service->storeToken($request->user(), $tokenData, $email);
        } catch (Throwable $e) {
            return redirect()
                ->route('employer.candidates.index')
                ->with('toast', [
                    'type' => 'error',
                    'message' => 'Gagal menyimpan token Google: '.$e->getMessage(),
                ]);
        }

        return redirect()
            ->route('employer.candidates.index')
            ->with('toast', ['type' => 'success', 'message' => 'Google Calendar berhasil terhubung.']);
    }

    public function disconnect(Request $request): RedirectResponse
    {
        $this->service->disconnect($request->user());

        return back()->with('toast', [
            'type' => 'success',
            'message' => 'Google Calendar telah diputus.',
        ]);
    }

    public function generateMeet(
        Request $request,
        Application $application,
        ResolveEmployerCompany $resolveEmployerCompany,
    ): JsonResponse {
        $validated = $request->validate([
            'scheduled_at' => ['required', 'date'],
            'duration_minutes' => ['required', 'integer', 'min:15', 'max:240'],
        ]);

        $company = $resolveEmployerCompany->handle($request->user());

        abort_unless(
            $company !== null && $application->jobListing?->company_id === $company->id,
            403,
        );

        $start = Carbon::parse($validated['scheduled_at']);
        $end = $start->copy()->addMinutes((int) $validated['duration_minutes']);

        $candidate = $application->candidate;
        $jobTitle = $application->jobListing?->title ?? 'Wawancara';

        try {
            $result = $this->service->createMeetEvent($request->user(), [
                'summary' => 'Wawancara: '.$jobTitle.' - '.($candidate?->full_name ?? 'Kandidat'),
                'description' => 'Sesi wawancara dijadwalkan via Karivia.',
                'start' => $start,
                'end' => $end,
                'attendee_email' => $candidate?->user?->email,
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Gagal membuat link Meet: '.$e->getMessage(),
            ], 422);
        }

        return response()->json([
            'meet_url' => $result['meet_url'],
            'event_id' => $result['event_id'],
        ]);
    }
}
