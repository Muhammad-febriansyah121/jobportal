<?php

namespace App\Http\Controllers\Employer;

use App\Actions\Employer\ResolveEmployerCompany;
use App\Http\Controllers\Controller;
use App\Http\Requests\Employer\ScheduleInterviewRequest;
use App\Models\Application;
use App\Models\Interview;
use App\Models\InterviewParticipant;
use App\Models\User;
use App\Services\UserNotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class EmployerInterviewController extends Controller
{
    public function store(
        ScheduleInterviewRequest $request,
        Application $application,
        ResolveEmployerCompany $resolveEmployerCompany,
    ): RedirectResponse {
        $company = $resolveEmployerCompany->handle($request->user());

        abort_if($company === null, 404);

        $application->loadMissing(['jobListing:id,company_id,title', 'candidate.user']);

        abort_unless($application->jobListing?->company_id === $company->id, 404);

        $hasActiveInterview = Interview::query()
            ->where('application_id', $application->id)
            ->whereIn('status', ['scheduled', 'rescheduled'])
            ->exists();

        if ($hasActiveInterview) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Kandidat sudah memiliki jadwal wawancara aktif. Batalkan dulu sebelum membuat jadwal baru.',
            ]);

            return back();
        }

        $data = $request->validated();
        $mode = $data['mode'];
        $locationUrl = $mode === 'online' ? $data['meeting_url'] : ($data['address'] ?? null);

        $interview = DB::transaction(function () use ($request, $application, $data, $mode, $locationUrl): Interview {
            $interview = Interview::create([
                'application_id' => $application->id,
                'scheduled_by' => $request->user()->id,
                'scheduled_at' => Carbon::parse($data['scheduled_at']),
                'duration_minutes' => $data['duration_minutes'],
                'mode' => $mode,
                'location_url' => $locationUrl,
                'notes' => $data['notes'] ?? null,
                'status' => 'scheduled',
            ]);

            InterviewParticipant::create([
                'interview_id' => $interview->id,
                'user_id' => $request->user()->id,
                'role' => 'interviewer',
            ]);

            $candidateUserId = $application->candidate?->user_id;

            if ($candidateUserId !== null) {
                InterviewParticipant::create([
                    'interview_id' => $interview->id,
                    'user_id' => $candidateUserId,
                    'role' => 'candidate',
                ]);
            }

            $application->update([
                'status' => 'interview',
                'first_responded_at' => $application->first_responded_at ?? now(),
            ]);

            return $interview;
        });

        $this->notifyCandidate($application, $interview, $company->name);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Wawancara berhasil dijadwalkan dan undangan terkirim.',
        ]);

        return back();
    }

    private function notifyCandidate(Application $application, Interview $interview, string $companyName): void
    {
        $candidateUserId = $application->candidate?->user_id;

        if ($candidateUserId === null) {
            return;
        }

        $recipient = User::query()->find($candidateUserId);

        if ($recipient === null) {
            return;
        }

        $modeLabel = $interview->mode === 'onsite' ? 'Onsite' : 'Online';

        app(UserNotificationService::class)->sendToUser(
            $recipient,
            'interview_scheduled',
            'Undangan wawancara',
            "Kamu mendapat jadwal wawancara {$modeLabel} dengan {$companyName}. Cek detail jadwal dan persiapan.",
            [
                'interview_id' => $interview->id,
                'application_id' => $application->id,
                'job_listing_id' => $application->job_listing_id,
                'job_title' => $application->jobListing?->title,
                'company_name' => $companyName,
                'mode' => $interview->mode,
                'scheduled_at' => $interview->scheduled_at?->toIso8601String(),
                'duration_minutes' => $interview->duration_minutes,
                'location_url' => $interview->location_url,
                'notes' => $interview->notes,
            ],
        );
    }
}
