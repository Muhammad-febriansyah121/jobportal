<?php

use App\Models\ActivityLog;
use App\Models\AiAuditLog;
use App\Models\AiMatchScore;
use App\Models\AiRecommendation;
use App\Models\Application;
use App\Models\CandidateCertification;
use App\Models\CandidateEducation;
use App\Models\CandidateExperience;
use App\Models\CandidateJobView;
use App\Models\CandidateProfile;
use App\Models\CareerResource;
use App\Models\Company;
use App\Models\CompanyBadge;
use App\Models\CompanyMember;
use App\Models\CompanyOffice;
use App\Models\CompanyReview;
use App\Models\CompanyVerification;
use App\Models\Conversation;
use App\Models\Industry;
use App\Models\Interview;
use App\Models\InterviewParticipant;
use App\Models\InterviewScorecard;
use App\Models\JobListing;
use App\Models\JobScreeningQuestion;
use App\Models\Payment;
use App\Models\Report;
use App\Models\SavedJob;
use App\Models\Skill;
use App\Models\Subscription;
use App\Models\UserNotification;
use Database\Seeders\DemoDataSeeder;

test('demo data seeder creates the requested minimum dataset', function () {
    $this->seed(DemoDataSeeder::class);

    expect(Industry::count())->toBeGreaterThanOrEqual(10);
    expect(Skill::count())->toBeGreaterThanOrEqual(40);
    expect(Company::count())->toBeGreaterThanOrEqual(5);
    expect(CandidateProfile::count())->toBeGreaterThanOrEqual(10);
    expect(CandidateExperience::count())->toBeGreaterThanOrEqual(10);
    expect(CandidateEducation::count())->toBeGreaterThanOrEqual(10);
    expect(CandidateCertification::count())->toBeGreaterThanOrEqual(10);
    expect(CompanyMember::count())->toBeGreaterThanOrEqual(5);
    expect(CompanyOffice::count())->toBeGreaterThanOrEqual(5);
    expect(CompanyVerification::count())->toBeGreaterThanOrEqual(5);
    expect(CompanyBadge::count())->toBeGreaterThanOrEqual(5);
    expect(CompanyReview::count())->toBeGreaterThanOrEqual(5);
    expect(JobListing::count())->toBeGreaterThanOrEqual(20);
    expect(JobScreeningQuestion::count())->toBeGreaterThanOrEqual(40);
    expect(Application::count())->toBeGreaterThanOrEqual(30);
    expect(SavedJob::count())->toBeGreaterThanOrEqual(10);
    expect(CandidateJobView::count())->toBeGreaterThanOrEqual(40);
    expect(Interview::count())->toBeGreaterThanOrEqual(8);
    expect(InterviewParticipant::count())->toBeGreaterThanOrEqual(16);
    expect(InterviewScorecard::count())->toBeGreaterThanOrEqual(8);
    expect(ActivityLog::count())->toBeGreaterThanOrEqual(50);
    expect(AiAuditLog::where('feature', 'user_activity_risk_detection')->count())->toBeGreaterThanOrEqual(5);
    expect(AiMatchScore::count())->toBeGreaterThanOrEqual(30);
    expect(AiRecommendation::count())->toBeGreaterThanOrEqual(30);
    expect(Conversation::count())->toBeGreaterThanOrEqual(5);
    expect(UserNotification::count())->toBeGreaterThanOrEqual(20);
    expect(Subscription::count())->toBeGreaterThanOrEqual(3);
    expect(Payment::count())->toBeGreaterThanOrEqual(3);
    expect(Report::count())->toBeGreaterThanOrEqual(5);
    expect(CareerResource::count())->toBeGreaterThanOrEqual(8);
});

test('demo data seeder can be rerun without duplicating keyed records', function () {
    $this->seed(DemoDataSeeder::class);

    $counts = [
        'industries' => Industry::count(),
        'skills' => Skill::count(),
        'companies' => Company::count(),
        'candidates' => CandidateProfile::count(),
        'candidate_experiences' => CandidateExperience::count(),
        'candidate_educations' => CandidateEducation::count(),
        'candidate_certifications' => CandidateCertification::count(),
        'company_members' => CompanyMember::count(),
        'company_offices' => CompanyOffice::count(),
        'company_verifications' => CompanyVerification::count(),
        'company_badges' => CompanyBadge::count(),
        'company_reviews' => CompanyReview::count(),
        'jobs' => JobListing::count(),
        'screening_questions' => JobScreeningQuestion::count(),
        'saved_jobs' => SavedJob::count(),
        'job_views' => CandidateJobView::count(),
        'interviews' => Interview::count(),
        'interview_participants' => InterviewParticipant::count(),
        'interview_scorecards' => InterviewScorecard::count(),
        'ai_match_scores' => AiMatchScore::count(),
        'ai_recommendations' => AiRecommendation::count(),
        'notifications' => UserNotification::count(),
        'subscriptions' => Subscription::count(),
        'payments' => Payment::count(),
        'reports' => Report::count(),
        'career_resources' => CareerResource::count(),
    ];

    $this->seed(DemoDataSeeder::class);

    expect(Industry::count())->toBe($counts['industries']);
    expect(Skill::count())->toBe($counts['skills']);
    expect(Company::count())->toBe($counts['companies']);
    expect(CandidateProfile::count())->toBe($counts['candidates']);
    expect(CandidateExperience::count())->toBe($counts['candidate_experiences']);
    expect(CandidateEducation::count())->toBe($counts['candidate_educations']);
    expect(CandidateCertification::count())->toBe($counts['candidate_certifications']);
    expect(CompanyMember::count())->toBe($counts['company_members']);
    expect(CompanyOffice::count())->toBe($counts['company_offices']);
    expect(CompanyVerification::count())->toBe($counts['company_verifications']);
    expect(CompanyBadge::count())->toBe($counts['company_badges']);
    expect(CompanyReview::count())->toBe($counts['company_reviews']);
    expect(JobListing::count())->toBe($counts['jobs']);
    expect(JobScreeningQuestion::count())->toBe($counts['screening_questions']);
    expect(SavedJob::count())->toBe($counts['saved_jobs']);
    expect(CandidateJobView::count())->toBe($counts['job_views']);
    expect(Interview::count())->toBe($counts['interviews']);
    expect(InterviewParticipant::count())->toBe($counts['interview_participants']);
    expect(InterviewScorecard::count())->toBe($counts['interview_scorecards']);
    expect(AiMatchScore::count())->toBe($counts['ai_match_scores']);
    expect(AiRecommendation::count())->toBe($counts['ai_recommendations']);
    expect(UserNotification::count())->toBe($counts['notifications']);
    expect(Subscription::count())->toBe($counts['subscriptions']);
    expect(Payment::count())->toBe($counts['payments']);
    expect(Report::count())->toBe($counts['reports']);
    expect(CareerResource::count())->toBe($counts['career_resources']);
});
