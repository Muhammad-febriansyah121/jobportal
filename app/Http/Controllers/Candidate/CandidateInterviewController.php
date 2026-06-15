<?php

namespace App\Http\Controllers\Candidate;

use App\Actions\Candidate\ResolveCandidateProfile;
use App\Http\Controllers\Controller;
use App\Models\Interview;
use App\Support\RichText;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Inertia\Inertia;
use Inertia\Response;

class CandidateInterviewController extends Controller
{
    public function index(Request $request, ResolveCandidateProfile $resolveCandidateProfile): Response
    {
        $candidate = $resolveCandidateProfile->handle($request->user());
        $perPage = 12;
        $page = LengthAwarePaginator::resolveCurrentPage();

        $interviews = Interview::query()
            ->with(['application.jobListing:id,title,company_id', 'application.jobListing.company:id,name'])
            ->whereHas('application', fn ($query) => $query->where('candidate_id', $candidate->id))
            ->get()
            ->map(fn (Interview $interview): array => $this->interviewPayload($interview))
            ->sortByDesc(fn (array $item): string => $item['sort_at'] ?? '')
            ->values();

        $paginatedInterviews = new LengthAwarePaginator(
            items: $interviews->forPage($page, $perPage)->values(),
            total: $interviews->count(),
            perPage: $perPage,
            currentPage: $page,
            options: [
                'path' => $request->url(),
                'query' => $request->query(),
            ],
        );

        return Inertia::render('candidate/interviews/index', [
            'interviews' => $paginatedInterviews,
        ]);
    }

    public function show(Request $request, Interview $interview, ResolveCandidateProfile $resolveCandidateProfile): Response
    {
        $candidate = $resolveCandidateProfile->handle($request->user());
        $this->ensureOwnsInterview($interview, $candidate->id);

        $interview->load([
            'application:id,job_listing_id,candidate_id,status,applied_at',
            'application.jobListing:id,title,description,company_id,location_city,location_province,work_mode,job_type,experience_level,salary_min,salary_max,salary_currency',
            'application.jobListing.company:id,name,logo_url,description,hq_city,hq_province,website,is_verified',
            'scheduler:id,name,email',
            'participants.user:id,name,email',
        ]);

        $jobListing = $interview->application?->jobListing;
        $company = $jobListing?->company;
        $scheduledAt = $interview->scheduled_at;

        return Inertia::render('candidate/interviews/show', [
            'interview' => [
                ...$this->interviewPayload($interview),
                'duration_minutes' => $interview->duration_minutes,
                'notes' => $interview->notes,
                'created_at' => $interview->created_at?->format('d M Y H:i'),
                'scheduled_at_iso' => $scheduledAt?->toIso8601String(),
                'scheduler' => $interview->scheduler ? [
                    'name' => $interview->scheduler->name,
                    'email' => $interview->scheduler->email,
                ] : null,
                'participants' => $interview->participants
                    ->map(fn ($participant): array => [
                        'id' => $participant->id,
                        'name' => $participant->user?->name,
                        'email' => $participant->user?->email,
                        'role' => $participant->role,
                    ]),
                'application' => $interview->application ? [
                    'id' => $interview->application->id,
                    'status' => $interview->application->status,
                    'applied_at' => $interview->application->applied_at?->format('d M Y'),
                ] : null,
                'job' => $jobListing ? [
                    'id' => $jobListing->id,
                    'title' => $jobListing->title,
                    'description' => RichText::toPlainText($jobListing->description, ''),
                    'location_city' => $jobListing->location_city,
                    'location_province' => $jobListing->location_province,
                    'work_mode' => $jobListing->work_mode,
                    'job_type' => $jobListing->job_type,
                    'experience_level' => $jobListing->experience_level,
                ] : null,
                'company_detail' => $company ? [
                    'id' => $company->id,
                    'name' => $company->name,
                    'logo_url' => $company->logo_url,
                    'description' => RichText::toPlainText($company->description, ''),
                    'hq_city' => $company->hq_city,
                    'hq_province' => $company->hq_province,
                    'website' => $company->website,
                    'is_verified' => (bool) $company->is_verified,
                ] : null,
            ],
        ]);
    }

    public function confirm(Request $request, Interview $interview, ResolveCandidateProfile $resolveCandidateProfile): RedirectResponse
    {
        $candidate = $resolveCandidateProfile->handle($request->user());
        $this->ensureOwnsInterview($interview, $candidate->id);
        $interview->update(['status' => 'confirmed']);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Jadwal interview berhasil dikonfirmasi.']);

        return back();
    }

    public function decline(Request $request, Interview $interview, ResolveCandidateProfile $resolveCandidateProfile): RedirectResponse
    {
        $candidate = $resolveCandidateProfile->handle($request->user());
        $this->ensureOwnsInterview($interview, $candidate->id);
        $interview->update(['status' => 'cancelled']);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Jadwal interview berhasil ditolak.']);

        return back();
    }

    private function interviewPayload(Interview $interview): array
    {
        $applicationStatus = $interview->application?->status;
        $canOpenMeetingLink = in_array($applicationStatus, ['offer', 'hired'], true);

        return [
            'id' => $interview->id,
            'source' => 'manual',
            'source_label' => 'Interview',
            'application_id' => $interview->application_id,
            'application_status' => $applicationStatus,
            'job_title' => $interview->application?->jobListing?->title,
            'company' => $interview->application?->jobListing?->company?->name,
            'scheduled_at' => $interview->scheduled_at?->format('d M Y H:i'),
            'mode' => $interview->mode,
            'mode_label' => $this->manualModeLabel($interview->mode),
            'location_url' => $interview->location_url,
            'show_meeting_link' => $canOpenMeetingLink,
            'status' => $interview->status,
            'detail_url' => route('candidate.interviews.show', $interview),
            'sort_at' => $interview->scheduled_at?->toIso8601String() ?? $interview->created_at?->toIso8601String() ?? '',
        ];
    }

    private function manualModeLabel(string $mode): string
    {
        return match ($mode) {
            'online' => 'Online',
            'offline' => 'Offline',
            default => $mode,
        };
    }

    private function ensureOwnsInterview(Interview $interview, int $candidateId): void
    {
        $interview->loadMissing('application:id,candidate_id');

        abort_unless($interview->application?->candidate_id === $candidateId, 404);
    }
}
