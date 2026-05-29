<?php

namespace App\Http\Controllers\Employer;

use App\Actions\Employer\ResolveEmployerCompany;
use App\Http\Controllers\Controller;
use App\Models\AiInterviewSession;
use App\Models\Application;
use App\Models\CandidateCertification;
use App\Models\CandidateEducation;
use App\Models\CandidateExperience;
use App\Models\Skill;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmployerApplicationController extends Controller
{
    public function show(
        Request $request,
        Application $application,
        ResolveEmployerCompany $resolveEmployerCompany,
    ): Response|RedirectResponse {
        $company = $resolveEmployerCompany->handle($request->user());

        if ($company === null) {
            Inertia::flash('toast', ['type' => 'warning', 'message' => 'Lengkapi profil perusahaan terlebih dahulu.']);

            return to_route('employer.company.edit');
        }

        $application->loadMissing([
            'jobListing:id,title,company_id,status,location_city,location_province,work_mode,job_type,experience_level',
            'jobListing.company:id,name',
            'candidate:id,user_id,full_name,headline,preferred_role,location_city,location_province,expected_salary_min,expected_salary_max,work_mode_pref,availability,profile_completion,linkedin_url,github_url,portfolio_url,bio',
            'candidate.user:id,name,email,phone,avatar_url',
            'candidate.experiences:id,candidate_id,company_name,job_title,location,start_date,end_date,is_current,description',
            'candidate.educations:id,candidate_id,institution,degree,field_of_study,start_year,end_year,gpa',
            'candidate.certifications:id,candidate_id,name,issuing_org,issue_date,credential_url',
            'candidate.skills:id,name',
            'cv:id,candidate_id,file_url,is_primary,uploaded_at',
            'latestStatusHistory',
            'statusHistories.changer:id,name',
            'interviews:id,application_id,scheduled_at,duration_minutes,mode,status,location_url,notes',
            'aiInterviewSessions' => fn ($query) => $query->latest('created_at'),
            'aiInterviewSessions.analysis:id,session_id,fit_score,recommendation',
        ]);

        abort_unless(
            $application->jobListing?->company_id === $company->id,
            404,
        );

        $candidate = $application->candidate;

        $allCandidateApplications = $candidate
            ? $candidate->applications()
                ->with(['jobListing:id,title,company_id,status', 'jobListing.company:id,name'])
                ->whereHas('jobListing', fn ($query) => $query->where('company_id', $company->id))
                ->latest('applied_at')
                ->get()
                ->map(fn (Application $item): array => [
                    'id' => $item->id,
                    'status' => $item->status,
                    'job_title' => $item->jobListing?->title,
                    'job_id' => $item->jobListing?->id,
                    'applied_at' => $item->applied_at?->format('d M Y'),
                    'is_current' => $item->id === $application->id,
                ])
            : collect();

        return Inertia::render('employer/candidates/show', [
            'company' => [
                'id' => $company->id,
                'name' => $company->name,
            ],
            'application' => [
                'id' => $application->id,
                'status' => $application->status,
                'applied_at' => $application->applied_at?->format('d M Y'),
                'first_responded_at' => $application->first_responded_at?->format('d M Y'),
                'cover_letter' => $application->cover_letter,
                'screening_answers' => $this->normalizeScreeningAnswers($application->screening_answers_json),
                'ai_fit_score' => $application->ai_fit_score,
                'ai_skill_match' => [
                    'matched' => $application->ai_skill_match['matched_skills'] ?? $application->ai_skill_match['matched'] ?? [],
                    'missing' => $application->ai_skill_match['missing_skills'] ?? $application->ai_skill_match['missing'] ?? [],
                ],
                'job' => [
                    'id' => $application->jobListing?->id,
                    'title' => $application->jobListing?->title,
                    'location_city' => $application->jobListing?->location_city,
                    'location_province' => $application->jobListing?->location_province,
                    'work_mode' => $application->jobListing?->work_mode,
                    'job_type' => $application->jobListing?->job_type,
                    'experience_level' => $application->jobListing?->experience_level,
                ],
                'cv' => $application->cv ? [
                    'file_url' => $application->cv->file_url,
                    'uploaded_at' => $application->cv->uploaded_at?->format('d M Y'),
                ] : null,
                'latest_history' => $application->latestStatusHistory ? [
                    'to_status' => $application->latestStatusHistory->to_status,
                    'note' => $application->latestStatusHistory->note,
                    'created_at' => $application->latestStatusHistory->created_at?->format('d M Y H:i'),
                ] : null,
                'history_timeline' => $application->statusHistories
                    ->sortByDesc('created_at')
                    ->values()
                    ->map(fn ($entry): array => [
                        'id' => $entry->id,
                        'from_status' => $entry->from_status,
                        'to_status' => $entry->to_status,
                        'note' => $entry->note,
                        'changed_by' => $entry->changer?->name,
                        'created_at' => $entry->created_at?->format('d M Y H:i'),
                    ])
                    ->all(),
                'interviews' => $application->interviews
                    ->sortByDesc('scheduled_at')
                    ->values()
                    ->map(fn ($interview): array => [
                        'id' => $interview->id,
                        'mode' => $interview->mode,
                        'status' => $interview->status,
                        'scheduled_at' => $interview->scheduled_at?->format('d M Y H:i'),
                        'duration_minutes' => $interview->duration_minutes,
                        'location_url' => $interview->location_url,
                    ])
                    ->all(),
                'ai_sessions' => $application->aiInterviewSessions
                    ->whereNotNull('scheduled_at')
                    ->values()
                    ->map(fn (AiInterviewSession $session): array => [
                        'id' => $session->id,
                        'status' => $session->status,
                        'interview_mode' => $session->interview_mode,
                        'completed_at' => $session->completed_at?->format('d M Y H:i'),
                        'fit_score' => $session->analysis?->fit_score,
                        'recommendation' => $session->analysis?->recommendation,
                    ])
                    ->all(),
            ],
            'candidate' => $candidate ? [
                'id' => $candidate->id,
                'name' => $candidate->full_name ?? $candidate->user?->name ?? 'Kandidat',
                'email' => $candidate->user?->email,
                'phone' => $candidate->user?->phone,
                'whatsapp_phone' => $this->normalizeWhatsappPhone($candidate->user?->phone),
                'avatar_url' => $candidate->user?->avatar_url,
                'headline' => $candidate->headline,
                'preferred_role' => $candidate->preferred_role,
                'location' => collect([
                    $candidate->location_city,
                    $candidate->location_province,
                ])->filter()->join(', '),
                'expected_salary' => $this->salaryRange(
                    $candidate->expected_salary_min,
                    $candidate->expected_salary_max,
                ),
                'work_mode_pref' => $candidate->work_mode_pref
                    ? str($candidate->work_mode_pref)->headline()->toString()
                    : null,
                'availability' => $candidate->availability,
                'profile_completion' => (int) ($candidate->profile_completion ?? 0),
                'bio' => $candidate->bio,
                'linkedin_url' => $candidate->linkedin_url,
                'github_url' => $candidate->github_url,
                'portfolio_url' => $candidate->portfolio_url,
                'skills' => $candidate->skills
                    ->map(fn (Skill $skill): array => [
                        'id' => $skill->id,
                        'name' => $skill->name,
                        'years_exp' => $skill->pivot->years_exp ?? null,
                        'proficiency' => $skill->pivot->proficiency ?? null,
                        'verified_at' => $skill->pivot->verified_at,
                    ])
                    ->values()
                    ->all(),
                'experiences' => $candidate->experiences
                    ->sortByDesc(fn (CandidateExperience $exp) => $exp->start_date ?? $exp->id)
                    ->values()
                    ->map(fn (CandidateExperience $exp): array => [
                        'id' => $exp->id,
                        'company_name' => $exp->company_name,
                        'job_title' => $exp->job_title,
                        'location' => $exp->location,
                        'start_date' => $exp->start_date?->format('M Y'),
                        'end_date' => $exp->is_current
                            ? 'Sekarang'
                            : $exp->end_date?->format('M Y'),
                        'is_current' => (bool) $exp->is_current,
                        'description' => $exp->description,
                    ])
                    ->all(),
                'educations' => $candidate->educations
                    ->sortByDesc(fn (CandidateEducation $edu) => $edu->end_year ?? $edu->id)
                    ->values()
                    ->map(fn (CandidateEducation $edu): array => [
                        'id' => $edu->id,
                        'institution' => $edu->institution,
                        'degree' => $edu->degree,
                        'field_of_study' => $edu->field_of_study,
                        'start_year' => $edu->start_year,
                        'end_year' => $edu->end_year,
                        'gpa' => $edu->gpa,
                    ])
                    ->all(),
                'certifications' => $candidate->certifications
                    ->sortByDesc(fn (CandidateCertification $cert) => $cert->issue_date ?? $cert->id)
                    ->values()
                    ->map(fn (CandidateCertification $cert): array => [
                        'id' => $cert->id,
                        'name' => $cert->name,
                        'issuing_org' => $cert->issuing_org,
                        'issue_date' => $cert->issue_date?->format('M Y'),
                        'credential_url' => $cert->credential_url,
                    ])
                    ->all(),
            ] : null,
            'company_applications' => $allCandidateApplications->all(),
        ]);
    }

    /**
     * @param  array<string, mixed>|null  $payload
     * @return array<int, array{question: string, answer: string}>
     */
    private function normalizeScreeningAnswers(?array $payload): array
    {
        if ($payload === null) {
            return [];
        }

        return collect($payload)
            ->map(function ($item, $key): array {
                if (is_array($item)) {
                    return [
                        'question' => (string) ($item['question'] ?? $key),
                        'answer' => (string) ($item['answer'] ?? ''),
                    ];
                }

                return [
                    'question' => (string) $key,
                    'answer' => (string) $item,
                ];
            })
            ->values()
            ->all();
    }

    private function salaryRange(?int $min, ?int $max): ?string
    {
        if (! $min && ! $max) {
            return null;
        }

        $format = fn (?int $value): string => $value
            ? number_format($value, 0, ',', '.')
            : '—';

        if ($min && $max) {
            return 'IDR '.$format($min).' – '.$format($max);
        }

        return 'IDR '.$format($min ?: $max);
    }

    private function normalizeWhatsappPhone(?string $phone): ?string
    {
        if ($phone === null) {
            return null;
        }
        $digits = preg_replace('/\D/', '', $phone);

        if ($digits === null || $digits === '') {
            return null;
        }

        if (str_starts_with($digits, '0')) {
            return '62'.substr($digits, 1);
        }

        if (str_starts_with($digits, '62')) {
            return $digits;
        }

        return $digits;
    }
}
