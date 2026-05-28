<?php

use App\Ai\Agents\TalentReranker;
use App\Models\AiAuditLog;
use App\Models\AiInterviewQuestion;
use App\Models\AiInterviewRescheduleHistory;
use App\Models\AiInterviewResponse;
use App\Models\AiInterviewSession;
use App\Models\AiMatchScore;
use App\Models\Application;
use App\Models\CandidateCv;
use App\Models\CandidateProfile;
use App\Models\Company;
use App\Models\CompanyMember;
use App\Models\CompanyVerification;
use App\Models\Conversation;
use App\Models\EmployerTalentCandidate;
use App\Models\Industry;
use App\Models\JobListing;
use App\Models\Message;
use App\Models\PricingPlan;
use App\Models\Skill;
use App\Models\Subscription;
use App\Models\User;
use App\Models\UserNotification;
use App\Services\AiService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\actingAs;

test('employer is redirected from generic dashboard to employer dashboard', function () {
    $employer = User::factory()->employer()->create();

    actingAs($employer)
        ->get(route('dashboard'))
        ->assertRedirect(route('employer.dashboard'));
});

test('non employer users cannot access employer routes', function () {
    $candidate = User::factory()->candidate()->create();

    actingAs($candidate)
        ->get(route('employer.dashboard'))
        ->assertForbidden();
});

test('employer can create company profile', function () {
    $employer = User::factory()->employer()->create();
    $industry = Industry::create([
        'name' => 'Teknologi',
        'slug' => 'teknologi',
    ]);

    actingAs($employer)
        ->patch(route('employer.company.update'), [
            'name' => 'Karivia Tech',
            'industry_id' => $industry->id,
            'description' => 'Perusahaan teknologi untuk solusi rekrutmen terpercaya.',
            'culture' => "- Kolaboratif\n- Berorientasi hasil",
            'benefits' => "- Asuransi kesehatan\n- Budget belajar",
            'company_size' => '51-200 karyawan',
            'website' => 'https://karivia.id',
            'hq_city' => 'Jakarta Selatan',
            'hq_province' => 'DKI Jakarta',
            'address' => 'Jl. Karivia No. 10',
        ])
        ->assertRedirect(route('employer.company.edit'));

    $company = Company::query()->where('owner_id', $employer->id)->first();

    expect($company)->not->toBeNull();
    expect($company?->name)->toBe('Karivia Tech');
    expect($company?->slug)->toBe('karivia-tech');
    expect($company?->culture)->toContain('Kolaboratif');
    expect($company?->benefits)->toContain('Asuransi kesehatan');
    expect($company?->verification_status)->toBe('unverified');
});

test('employer can create and publish a job listing', function () {
    $employer = User::factory()->employer()->create();
    $industry = Industry::create([
        'name' => 'Teknologi',
        'slug' => 'teknologi',
    ]);
    $company = Company::create([
        'owner_id' => $employer->id,
        'industry_id' => $industry->id,
        'name' => 'Karivia Tech',
        'slug' => 'karivia-tech',
        'description' => 'Perusahaan teknologi.',
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);

    actingAs($employer)
        ->post(route('employer.jobs.store'), [
            'title' => 'Backend Engineer',
            'industry_id' => $industry->id,
            'description' => 'Bangun API Laravel yang aman dan scalable.',
            'responsibilities' => 'Membangun fitur backend dan integrasi sistem.',
            'required_qualifications' => 'Pengalaman Laravel 3 tahun.',
            'preferred_qualifications' => 'Paham queue dan caching.',
            'benefits' => "- Work from home hybrid\n- Bonus performa",
            'location_city' => 'Jakarta Selatan',
            'location_province' => 'DKI Jakarta',
            'work_mode' => 'hybrid',
            'job_type' => 'full_time',
            'experience_level' => 'mid',
            'salary_min' => 12000000,
            'salary_max' => 18000000,
            'salary_currency' => 'IDR',
            'is_salary_visible' => true,
            'response_sla_hours' => 48,
        ])
        ->assertRedirect(route('employer.jobs.index'));

    $job = JobListing::query()->whereBelongsTo($company)->first();

    expect($job)->not->toBeNull();
    expect($job?->slug)->toBe('backend-engineer');
    expect($job?->benefits)->toContain('Bonus performa');
    expect($job?->status)->toBe('draft');

    actingAs($employer)
        ->patch(route('employer.jobs.publish', $job))
        ->assertRedirect(route('employer.jobs.index'));

    $job->refresh();

    expect($job->status)->toBe('published');
    expect($job->published_at)->not->toBeNull();
});

test('employer can save qualification and experience years range on job listing', function () {
    $employer = User::factory()->employer()->create();
    $industry = Industry::create([
        'name' => 'Teknologi Qualification',
        'slug' => 'teknologi-qualification',
    ]);

    Company::create([
        'owner_id' => $employer->id,
        'industry_id' => $industry->id,
        'name' => 'Karivia Qual',
        'slug' => 'karivia-qual',
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);

    actingAs($employer)
        ->post(route('employer.jobs.store'), [
            'title' => 'Senior Backend Engineer',
            'industry_id' => $industry->id,
            'description' => 'Bangun API.',
            'required_qualifications' => 'Laravel 5 tahun.',
            'work_mode' => 'hybrid',
            'job_type' => 'full_time',
            'experience_level' => 'senior',
            'qualification' => 's1',
            'experience_min_years' => 5,
            'experience_max_years' => 7,
            'salary_min' => 25000000,
            'salary_max' => 30000000,
            'salary_currency' => 'IDR',
            'is_salary_visible' => true,
        ])
        ->assertRedirect(route('employer.jobs.index'));

    $job = JobListing::query()->where('title', 'Senior Backend Engineer')->first();

    expect($job)->not->toBeNull();
    expect($job?->qualification)->toBe('s1');
    expect($job?->experience_min_years)->toBe(5);
    expect($job?->experience_max_years)->toBe(7);
});

test('experience max years must be greater than or equal to min', function () {
    $employer = User::factory()->employer()->create();
    $industry = Industry::create([
        'name' => 'Teknologi Exp Validation',
        'slug' => 'teknologi-exp-validation',
    ]);

    Company::create([
        'owner_id' => $employer->id,
        'industry_id' => $industry->id,
        'name' => 'Karivia Exp',
        'slug' => 'karivia-exp',
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);

    actingAs($employer)
        ->post(route('employer.jobs.store'), [
            'title' => 'Bad Range Engineer',
            'industry_id' => $industry->id,
            'work_mode' => 'remote',
            'job_type' => 'full_time',
            'experience_level' => 'mid',
            'experience_min_years' => 5,
            'experience_max_years' => 2,
            'salary_currency' => 'IDR',
            'is_salary_visible' => true,
        ])
        ->assertSessionHasErrors(['experience_max_years']);
});

test('employer can save draft job listing without description', function () {
    $employer = User::factory()->employer()->create();
    $industry = Industry::create([
        'name' => 'Teknologi Draft',
        'slug' => 'teknologi-draft',
    ]);

    Company::create([
        'owner_id' => $employer->id,
        'industry_id' => $industry->id,
        'name' => 'Karivia Draft',
        'slug' => 'karivia-draft',
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);

    actingAs($employer)
        ->post(route('employer.jobs.store'), [
            'title' => 'Backend Engineer Draft',
            'industry_id' => $industry->id,
            'responsibilities' => 'Membangun fitur backend.',
            'required_qualifications' => 'Menguasai Laravel.',
            'preferred_qualifications' => 'Paham queue.',
            'location_city' => 'Jakarta Selatan',
            'location_province' => 'DKI Jakarta',
            'work_mode' => 'hybrid',
            'job_type' => 'full_time',
            'experience_level' => 'mid',
            'salary_min' => 12000000,
            'salary_max' => 18000000,
            'salary_currency' => 'IDR',
            'is_salary_visible' => true,
            'response_sla_hours' => 48,
        ])
        ->assertRedirect(route('employer.jobs.index'));

    $job = JobListing::query()
        ->where('title', 'Backend Engineer Draft')
        ->first();

    expect($job)->not->toBeNull();
    expect($job?->description)->toBe('');
    expect($job?->status)->toBe('draft');
});

test('employer cannot publish new job without mandatory publish fields', function () {
    $employer = User::factory()->employer()->create();
    $industry = Industry::create([
        'name' => 'Teknologi Validasi Publish',
        'slug' => 'teknologi-validasi-publish',
    ]);

    Company::create([
        'owner_id' => $employer->id,
        'industry_id' => $industry->id,
        'name' => 'Karivia Mandatory Publish',
        'slug' => 'karivia-mandatory-publish',
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);

    actingAs($employer)
        ->post(route('employer.jobs.store'), [
            'title' => 'Backend Engineer Publish',
            'industry_id' => $industry->id,
            'work_mode' => 'hybrid',
            'job_type' => 'full_time',
            'experience_level' => 'mid',
            'salary_currency' => 'IDR',
            'is_salary_visible' => true,
            'publish' => true,
        ])
        ->assertSessionHasErrors([
            'description',
            'required_qualifications',
        ]);

    expect(JobListing::query()->where('title', 'Backend Engineer Publish')->exists())
        ->toBeFalse();
});

test('employer can view their job listing detail page', function () {
    $employer = User::factory()->employer()->create();
    $industry = Industry::create([
        'name' => 'Teknologi Detail',
        'slug' => 'teknologi-detail',
    ]);
    $company = Company::create([
        'owner_id' => $employer->id,
        'industry_id' => $industry->id,
        'name' => 'Karivia Detail',
        'slug' => 'karivia-detail',
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'industry_id' => $industry->id,
        'title' => 'Product Engineer',
        'slug' => 'product-engineer-detail',
        'description' => 'Membangun fitur produk end-to-end.',
        'responsibilities' => 'Kolaborasi lintas tim produk dan engineering.',
        'required_qualifications' => 'Pengalaman membangun aplikasi web modern.',
        'work_mode' => 'hybrid',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'salary_min' => 10000000,
        'salary_max' => 15000000,
        'salary_currency' => 'IDR',
        'is_salary_visible' => true,
        'status' => 'published',
        'published_at' => now(),
    ]);

    actingAs($employer)
        ->get(route('employer.jobs.show', $job))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('employer/jobs/show')
            ->where('company.name', 'Karivia Detail')
            ->where('job.id', $job->id)
            ->where('job.title', 'Product Engineer')
            ->where('job.status', 'published')
            ->where('job.applications_count', 0)
            ->etc()
        );
});

test('employer can schedule voice ai interview with controlled questions', function () {
    $employer = User::factory()->employer()->create();
    $candidateUser = User::factory()->candidate()->create();
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Aditya Pratama',
        'headline' => 'Backend Engineer',
        'work_mode_pref' => 'any',
    ]);
    $industry = Industry::create([
        'name' => 'Teknologi Voice',
        'slug' => 'teknologi-voice',
    ]);
    $company = Company::create([
        'owner_id' => $employer->id,
        'industry_id' => $industry->id,
        'name' => 'Karivia Voice',
        'slug' => 'karivia-voice',
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'industry_id' => $industry->id,
        'title' => 'AI Backend Engineer',
        'slug' => 'ai-backend-engineer',
        'description' => 'Membangun layanan AI interview.',
        'work_mode' => 'remote',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'salary_currency' => 'IDR',
        'is_salary_visible' => true,
        'status' => 'published',
    ]);
    $application = Application::create([
        'job_listing_id' => $job->id,
        'candidate_id' => $candidate->id,
        'status' => 'shortlisted',
        'applied_at' => now(),
    ]);

    actingAs($employer)
        ->post(route('employer.jobs.ai-interviews.store', $job), [
            'application_id' => $application->id,
            'interview_mode' => 'voice',
            'scheduled_at' => now()->addDay()->format('Y-m-d H:i:s'),
            'duration_minutes' => 30,
            'meeting_url' => 'https://meet.google.com/karivia-ai',
            'voice' => 'marin',
            'questions' => [
                [
                    'question' => 'Jelaskan pengalaman membangun service backend.',
                    'category' => 'technical',
                    'rubric' => 'Nilai depth teknis dan contoh nyata.',
                    'weight' => 60,
                    'allow_ai_followup' => true,
                ],
                [
                    'question' => 'Bagaimana cara Anda mengelola deadline ketat?',
                    'category' => 'behavioral',
                    'rubric' => 'Nilai komunikasi dan prioritas.',
                    'weight' => 40,
                    'allow_ai_followup' => false,
                ],
            ],
        ])
        ->assertRedirect();

    $session = AiInterviewSession::query()->where('application_id', $application->id)->first();

    expect($session)->not->toBeNull();
    expect($session?->status)->toBe('scheduled');
    expect($session?->interview_mode)->toBe('voice');
    expect($session?->voice)->toBe('marin');
    expect($application->refresh()->status)->toBe('interview');
    expect(AiInterviewQuestion::query()->where('session_id', $session?->id)->count())->toBe(2);
    expect(AiInterviewResponse::query()->where('session_id', $session?->id)->count())->toBe(2);
    expect(
        UserNotification::query()
            ->where('user_id', $candidateUser->id)
            ->where('type', 'ai_interview_scheduled')
            ->where('data_json->ai_interview_session_id', $session?->id)
            ->exists()
    )->toBeTrue();
});

test('employer can schedule text ai interview with controlled questions', function () {
    $employer = User::factory()->employer()->create();
    $candidateUser = User::factory()->candidate()->create();
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Nadia Putri',
        'work_mode_pref' => 'any',
    ]);
    $industry = Industry::create([
        'name' => 'Teknologi Teks',
        'slug' => 'teknologi-teks',
    ]);
    $company = Company::create([
        'owner_id' => $employer->id,
        'industry_id' => $industry->id,
        'name' => 'Karivia Teks',
        'slug' => 'karivia-teks',
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'industry_id' => $industry->id,
        'title' => 'Customer Success AI',
        'slug' => 'customer-success-ai',
        'description' => 'Mengelola proses interview teks.',
        'work_mode' => 'remote',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'salary_currency' => 'IDR',
        'is_salary_visible' => true,
        'status' => 'published',
    ]);
    $application = Application::create([
        'job_listing_id' => $job->id,
        'candidate_id' => $candidate->id,
        'status' => 'shortlisted',
        'applied_at' => now(),
    ]);

    actingAs($employer)
        ->post(route('employer.jobs.ai-interviews.store', $job), [
            'application_id' => $application->id,
            'interview_mode' => 'text',
            'scheduled_at' => now()->addDay()->format('Y-m-d H:i:s'),
            'duration_minutes' => 30,
            'meeting_url' => null,
            'questions' => [
                [
                    'question' => 'Bagaimana cara Anda menangani pelanggan sulit?',
                    'category' => 'behavioral',
                    'rubric' => 'Nilai empati, struktur komunikasi, dan contoh nyata.',
                    'weight' => 100,
                    'allow_ai_followup' => false,
                ],
            ],
        ])
        ->assertRedirect();

    $session = AiInterviewSession::query()->where('application_id', $application->id)->first();

    expect($session)->not->toBeNull();
    expect($session?->interview_mode)->toBe('text');
    expect(AiInterviewQuestion::query()->where('session_id', $session?->id)->value('question'))
        ->toBe('Bagaimana cara Anda menangani pelanggan sulit?');
});

test('employer can schedule ai interview again even when another schedule already exists', function () {
    $employer = User::factory()->employer()->create();
    $candidateUser = User::factory()->candidate()->create();
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Nanda Terjadwal',
        'work_mode_pref' => 'any',
    ]);
    $industry = Industry::create([
        'name' => 'Teknologi Reschedule Guard',
        'slug' => 'teknologi-reschedule-guard',
    ]);
    $company = Company::create([
        'owner_id' => $employer->id,
        'industry_id' => $industry->id,
        'name' => 'Karivia Guard',
        'slug' => 'karivia-guard',
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'industry_id' => $industry->id,
        'title' => 'Backend Guard Engineer',
        'slug' => 'backend-guard-engineer',
        'description' => 'Mencegah jadwal interview ganda.',
        'work_mode' => 'remote',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'salary_currency' => 'IDR',
        'is_salary_visible' => true,
        'status' => 'published',
    ]);
    $application = Application::create([
        'job_listing_id' => $job->id,
        'candidate_id' => $candidate->id,
        'status' => 'interview',
        'applied_at' => now(),
    ]);

    AiInterviewSession::create([
        'application_id' => $application->id,
        'candidate_id' => $candidate->id,
        'status' => 'scheduled',
        'interview_mode' => 'voice',
        'scheduled_at' => now()->addDay(),
        'duration_minutes' => 30,
        'voice' => 'marin',
    ]);

    actingAs($employer)
        ->post(route('employer.jobs.ai-interviews.store', $job), [
            'application_id' => $application->id,
            'interview_mode' => 'voice',
            'scheduled_at' => now()->addDays(2)->format('Y-m-d H:i:s'),
            'duration_minutes' => 30,
            'voice' => 'marin',
            'questions' => [
                [
                    'question' => 'Pertanyaan ulang yang seharusnya ditolak.',
                    'category' => 'technical',
                    'rubric' => 'Guard duplicate.',
                    'weight' => 100,
                    'allow_ai_followup' => true,
                ],
            ],
        ])
        ->assertRedirect();

    expect(AiInterviewSession::query()->where('application_id', $application->id)->count())->toBe(2);
});

test('employer can compare ai interview candidates for a job', function () {
    $employer = User::factory()->employer()->create();
    $candidateUser = User::factory()->candidate()->create();
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Raka Kandidat',
        'headline' => 'Frontend Engineer',
        'work_mode_pref' => 'any',
    ]);
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Karivia Compare',
        'slug' => 'karivia-compare',
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'title' => 'Frontend Engineer AI',
        'slug' => 'frontend-engineer-ai',
        'description' => 'Membandingkan kandidat AI.',
        'work_mode' => 'remote',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'salary_currency' => 'IDR',
        'is_salary_visible' => true,
        'status' => 'published',
    ]);
    $application = Application::create([
        'job_listing_id' => $job->id,
        'candidate_id' => $candidate->id,
        'status' => 'interview',
        'applied_at' => now(),
    ]);
    $session = AiInterviewSession::create([
        'application_id' => $application->id,
        'candidate_id' => $candidate->id,
        'status' => 'completed',
        'interview_mode' => 'voice',
        'completed_at' => now(),
    ]);
    $session->analysis()->create([
        'fit_score' => 88,
        'recommendation' => 'Kandidat unggul',
        'summary' => 'Kandidat kuat untuk tahap user.',
        'strengths' => ['Komunikasi jelas'],
        'weaknesses' => ['Perlu validasi teknis lanjutan'],
        'technical_scorecard' => ['technical_skills' => 88],
    ]);

    actingAs($employer)
        ->get(route('employer.jobs.ai-interviews.compare', $job))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('employer/ai-interviews/compare')
            ->where('job.title', 'Frontend Engineer AI')
            ->where('candidates.0.candidate_name', 'Raka Kandidat')
            ->where('candidates.0.fit_score', 88)
            ->etc()
        );
});

test('employer can download ai interview result as pdf', function () {
    $employer = User::factory()->employer()->create();
    $candidateUser = User::factory()->candidate()->create();
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Dimas Report',
        'headline' => 'Backend Engineer',
    ]);
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Karivia Report',
        'slug' => 'karivia-report',
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'title' => 'Backend Engineer Report',
        'slug' => 'backend-engineer-report',
        'description' => 'Export hasil interview AI.',
        'work_mode' => 'remote',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'salary_currency' => 'IDR',
        'is_salary_visible' => true,
        'status' => 'published',
    ]);
    $application = Application::create([
        'job_listing_id' => $job->id,
        'candidate_id' => $candidate->id,
        'status' => 'interview',
        'applied_at' => now(),
    ]);
    $session = AiInterviewSession::create([
        'application_id' => $application->id,
        'candidate_id' => $candidate->id,
        'status' => 'completed',
        'interview_mode' => 'voice',
        'scheduled_at' => now()->subDay(),
        'completed_at' => now(),
    ]);
    $question = AiInterviewQuestion::create([
        'application_id' => $application->id,
        'session_id' => $session->id,
        'question' => 'Jelaskan pengalaman Laravel Anda.',
        'category' => 'technical',
        'weight' => 100,
        'order_number' => 1,
    ]);
    AiInterviewResponse::create([
        'session_id' => $session->id,
        'question_id' => $question->id,
        'answer_text' => 'Saya membangun API Laravel dan queue worker.',
        'ai_score' => 87,
        'ai_analysis' => 'Jawaban spesifik dan relevan.',
    ]);
    $session->analysis()->create([
        'fit_score' => 89,
        'recommendation' => 'Lanjutkan ke user interview.',
        'summary' => 'Kandidat menunjukkan pengalaman backend yang kuat.',
        'strengths' => ['Pengalaman Laravel kuat'],
        'weaknesses' => ['Perlu validasi architecture depth'],
        'technical_scorecard' => ['laravel' => 89],
    ]);

    $response = actingAs($employer)
        ->get(route('employer.ai-interviews.report-pdf', $session));

    $response->assertOk();
    $response->assertHeader('content-type', 'application/pdf');
    expect((string) $response->headers->get('content-disposition'))
        ->toContain('attachment; filename="ai-interview-dimas-report.pdf"');
    expect($response->getContent())->toStartWith('%PDF-1.4');
});

test('company team member can view ai interview hiring review page', function () {
    $owner = User::factory()->employer()->create();
    $hiringManager = User::factory()->employer()->create();
    $candidateUser = User::factory()->candidate()->create();
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Raka Review',
        'headline' => 'Frontend Engineer',
    ]);
    $company = Company::create([
        'owner_id' => $owner->id,
        'name' => 'Karivia Hiring Review',
        'slug' => 'karivia-hiring-review',
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);
    CompanyMember::create([
        'company_id' => $company->id,
        'user_id' => $hiringManager->id,
        'role' => 'viewer',
        'is_active' => true,
        'invited_at' => now(),
        'joined_at' => now(),
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $owner->id,
        'title' => 'Frontend Engineer Review',
        'slug' => 'frontend-engineer-review',
        'description' => 'Review kandidat untuk user.',
        'work_mode' => 'hybrid',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'salary_currency' => 'IDR',
        'is_salary_visible' => true,
        'status' => 'published',
    ]);
    $application = Application::create([
        'job_listing_id' => $job->id,
        'candidate_id' => $candidate->id,
        'status' => 'offer',
        'applied_at' => now(),
    ]);
    $session = AiInterviewSession::create([
        'application_id' => $application->id,
        'candidate_id' => $candidate->id,
        'status' => 'completed',
        'interview_mode' => 'voice',
        'completed_at' => now(),
    ]);
    $session->analysis()->create([
        'fit_score' => 91,
        'recommendation' => 'Sangat layak untuk interview user.',
        'summary' => 'Kandidat siap dibahas dengan hiring manager.',
        'strengths' => ['Komunikasi kuat'],
        'weaknesses' => ['Perlu validasi system design'],
        'technical_scorecard' => ['frontend' => 91],
    ]);

    actingAs($hiringManager)
        ->get(route('employer.ai-interviews.review', $session))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('employer/ai-interviews/review')
            ->where('company.name', 'Karivia Hiring Review')
            ->where('session.candidate.name', 'Raka Review')
            ->where('session.analysis.fit_score', 91)
            ->etc()
        );
});

test('employer can share ai interview hiring review with company team', function () {
    $owner = User::factory()->employer()->create();
    $hiringManager = User::factory()->employer()->create();
    $candidateUser = User::factory()->candidate()->create();
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Bima Share Review',
    ]);
    $company = Company::create([
        'owner_id' => $owner->id,
        'name' => 'Karivia Share Review',
        'slug' => 'karivia-share-review',
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);
    CompanyMember::create([
        'company_id' => $company->id,
        'user_id' => $hiringManager->id,
        'role' => 'viewer',
        'is_active' => true,
        'invited_at' => now(),
        'joined_at' => now(),
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $owner->id,
        'title' => 'Backend Engineer Share',
        'slug' => 'backend-engineer-share',
        'description' => 'Share review kandidat.',
        'work_mode' => 'remote',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'salary_currency' => 'IDR',
        'is_salary_visible' => true,
        'status' => 'published',
    ]);
    $application = Application::create([
        'job_listing_id' => $job->id,
        'candidate_id' => $candidate->id,
        'status' => 'offer',
        'applied_at' => now(),
    ]);
    $session = AiInterviewSession::create([
        'application_id' => $application->id,
        'candidate_id' => $candidate->id,
        'status' => 'completed',
        'interview_mode' => 'voice',
        'completed_at' => now(),
    ]);

    actingAs($owner)
        ->post(route('employer.ai-interviews.share-review', $session))
        ->assertRedirect();

    $notification = UserNotification::query()
        ->where('user_id', $hiringManager->id)
        ->where('type', 'ai_interview_review_shared')
        ->first();

    expect($notification)->not->toBeNull();
    expect($notification?->data_json['ai_interview_session_id'] ?? null)->toBe($session->id);
    expect($notification?->data_json['review_url'] ?? null)->toBe(route('employer.ai-interviews.review', $session));
});

test('employer cannot view another company ai interview hiring review page', function () {
    $owner = User::factory()->employer()->create();
    $otherEmployer = User::factory()->employer()->create();
    $candidateUser = User::factory()->candidate()->create();
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Nadia Private Review',
    ]);
    $company = Company::create([
        'owner_id' => $owner->id,
        'name' => 'Karivia Private Review',
        'slug' => 'karivia-private-review',
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);
    Company::create([
        'owner_id' => $otherEmployer->id,
        'name' => 'Other Hiring Team',
        'slug' => 'other-hiring-team',
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $owner->id,
        'title' => 'Private Review Role',
        'slug' => 'private-review-role',
        'description' => 'Review internal.',
        'work_mode' => 'remote',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'salary_currency' => 'IDR',
        'is_salary_visible' => true,
        'status' => 'published',
    ]);
    $application = Application::create([
        'job_listing_id' => $job->id,
        'candidate_id' => $candidate->id,
        'status' => 'offer',
        'applied_at' => now(),
    ]);
    $session = AiInterviewSession::create([
        'application_id' => $application->id,
        'candidate_id' => $candidate->id,
        'status' => 'completed',
        'interview_mode' => 'text',
        'completed_at' => now(),
    ]);

    actingAs($otherEmployer)
        ->get(route('employer.ai-interviews.review', $session))
        ->assertNotFound();
});

test('employer can advance ai interview candidate to user and save to talent pool', function () {
    $employer = User::factory()->employer()->create();
    $candidateUser = User::factory()->candidate()->create();
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Dimas Interview',
        'headline' => 'Backend Engineer',
    ]);
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Karivia Recruiter Action',
        'slug' => 'karivia-recruiter-action',
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'title' => 'Backend Engineer Action',
        'slug' => 'backend-engineer-action',
        'description' => 'Review hasil interview AI.',
        'work_mode' => 'remote',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'salary_currency' => 'IDR',
        'is_salary_visible' => true,
        'status' => 'published',
    ]);
    $application = Application::create([
        'job_listing_id' => $job->id,
        'candidate_id' => $candidate->id,
        'status' => 'interview',
        'applied_at' => now(),
    ]);
    $session = AiInterviewSession::create([
        'application_id' => $application->id,
        'candidate_id' => $candidate->id,
        'status' => 'completed',
        'interview_mode' => 'voice',
        'completed_at' => now(),
    ]);

    actingAs($employer)
        ->post(route('employer.ai-interviews.talent-pool', $session))
        ->assertRedirect();

    $talentRecord = EmployerTalentCandidate::query()
        ->where('company_id', $company->id)
        ->where('candidate_id', $candidate->id)
        ->first();

    expect($talentRecord)->not->toBeNull();
    expect($talentRecord?->saved_at)->not->toBeNull();
    expect($talentRecord?->shortlisted_at)->toBeNull();

    actingAs($employer)
        ->patch(route('employer.ai-interviews.advance-to-user', $session))
        ->assertRedirect();

    expect($application->refresh()->status)->toBe('offer');

    $this->assertDatabaseHas('application_status_histories', [
        'application_id' => $application->id,
        'from_status' => 'interview',
        'to_status' => 'offer',
        'changed_by' => $employer->id,
    ]);

    expect(
        UserNotification::query()
            ->where('user_id', $candidateUser->id)
            ->where('type', 'application_advanced_after_ai_interview')
            ->exists()
    )->toBeTrue();
});

test('employer can reject ai interview candidate', function () {
    $employer = User::factory()->employer()->create();
    $candidateUser = User::factory()->candidate()->create();
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Sinta Interview',
        'headline' => 'Product Designer',
    ]);
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Karivia Reject Action',
        'slug' => 'karivia-reject-action',
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'title' => 'Product Designer Action',
        'slug' => 'product-designer-action',
        'description' => 'Review hasil interview AI.',
        'work_mode' => 'hybrid',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'salary_currency' => 'IDR',
        'is_salary_visible' => true,
        'status' => 'published',
    ]);
    $application = Application::create([
        'job_listing_id' => $job->id,
        'candidate_id' => $candidate->id,
        'status' => 'interview',
        'applied_at' => now(),
    ]);
    $session = AiInterviewSession::create([
        'application_id' => $application->id,
        'candidate_id' => $candidate->id,
        'status' => 'completed',
        'interview_mode' => 'text',
        'completed_at' => now(),
    ]);

    actingAs($employer)
        ->patch(route('employer.ai-interviews.reject', $session))
        ->assertRedirect();

    expect($application->refresh()->status)->toBe('rejected');

    $this->assertDatabaseHas('application_status_histories', [
        'application_id' => $application->id,
        'from_status' => 'interview',
        'to_status' => 'rejected',
        'changed_by' => $employer->id,
    ]);

    expect(
        UserNotification::query()
            ->where('user_id', $candidateUser->id)
            ->where('type', 'application_rejected_after_ai_interview')
            ->exists()
    )->toBeTrue();
});

test('employer can approve candidate ai interview reschedule request', function () {
    $employer = User::factory()->employer()->create();
    $candidateUser = User::factory()->candidate()->create();
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Dewi Reschedule',
        'headline' => 'Frontend Engineer',
    ]);
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Karivia Reschedule Approve',
        'slug' => 'karivia-reschedule-approve',
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'title' => 'Frontend Engineer Reschedule',
        'slug' => 'frontend-engineer-reschedule-approve',
        'description' => 'Review permintaan jadwal ulang.',
        'work_mode' => 'remote',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'salary_currency' => 'IDR',
        'is_salary_visible' => true,
        'status' => 'published',
    ]);
    $application = Application::create([
        'job_listing_id' => $job->id,
        'candidate_id' => $candidate->id,
        'status' => 'interview',
        'applied_at' => now(),
    ]);
    $session = AiInterviewSession::create([
        'application_id' => $application->id,
        'candidate_id' => $candidate->id,
        'status' => 'scheduled',
        'interview_mode' => 'voice',
        'scheduled_at' => now()->addDay(),
        'reschedule_requested_at' => now()->subHour(),
        'reschedule_proposed_at' => now()->addDays(2),
        'reschedule_reason' => 'Bentrok jadwal kerja',
        'reschedule_status' => 'pending',
    ]);

    actingAs($employer)
        ->patch(route('employer.ai-interviews.reschedule.approve', $session), [
            'scheduled_at' => now()->addDays(2)->setTime(14, 0)->toDateTimeString(),
        ])
        ->assertRedirect();

    $session->refresh();

    expect($session->reschedule_status)->toBe('approved');
    expect($session->reschedule_reviewed_at)->not->toBeNull();
    expect($session->reschedule_rejected_reason)->toBeNull();
    expect(AiInterviewRescheduleHistory::query()
        ->where('session_id', $session->id)
        ->where('action', 'approved')
        ->exists())->toBeTrue();
    expect(
        UserNotification::query()
            ->where('user_id', $candidateUser->id)
            ->where('type', 'ai_interview_reschedule_approved')
            ->exists()
    )->toBeTrue();
});

test('employer can reject candidate ai interview reschedule request', function () {
    $employer = User::factory()->employer()->create();
    $candidateUser = User::factory()->candidate()->create();
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Rani Reschedule',
        'headline' => 'Backend Engineer',
    ]);
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Karivia Reschedule Reject',
        'slug' => 'karivia-reschedule-reject',
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'title' => 'Backend Engineer Reschedule',
        'slug' => 'backend-engineer-reschedule-reject',
        'description' => 'Review permintaan jadwal ulang.',
        'work_mode' => 'hybrid',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'salary_currency' => 'IDR',
        'is_salary_visible' => true,
        'status' => 'published',
    ]);
    $application = Application::create([
        'job_listing_id' => $job->id,
        'candidate_id' => $candidate->id,
        'status' => 'interview',
        'applied_at' => now(),
    ]);
    $session = AiInterviewSession::create([
        'application_id' => $application->id,
        'candidate_id' => $candidate->id,
        'status' => 'scheduled',
        'interview_mode' => 'text',
        'scheduled_at' => now()->addDay(),
        'reschedule_requested_at' => now()->subHour(),
        'reschedule_proposed_at' => now()->addDays(3),
        'reschedule_reason' => 'Bentrokan dengan jadwal keluarga',
        'reschedule_status' => 'pending',
    ]);

    actingAs($employer)
        ->patch(route('employer.ai-interviews.reschedule.reject', $session), [
            'reason' => 'Slot tersebut sudah penuh di minggu ini.',
        ])
        ->assertRedirect();

    $session->refresh();

    expect($session->reschedule_status)->toBe('rejected');
    expect($session->reschedule_reviewed_at)->not->toBeNull();
    expect($session->reschedule_rejected_reason)->toContain('penuh');
    expect(AiInterviewRescheduleHistory::query()
        ->where('session_id', $session->id)
        ->where('action', 'rejected')
        ->exists())->toBeTrue();
    expect(
        UserNotification::query()
            ->where('user_id', $candidateUser->id)
            ->where('type', 'ai_interview_reschedule_rejected')
            ->exists()
    )->toBeTrue();
});

test('employer cannot view another company job listing detail page', function () {
    $firstEmployer = User::factory()->employer()->create();
    $secondEmployer = User::factory()->employer()->create();
    $industry = Industry::create([
        'name' => 'Teknologi Isolasi',
        'slug' => 'teknologi-isolasi',
    ]);
    $ownerCompany = Company::create([
        'owner_id' => $firstEmployer->id,
        'industry_id' => $industry->id,
        'name' => 'Karivia Owner',
        'slug' => 'karivia-owner',
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);
    Company::create([
        'owner_id' => $secondEmployer->id,
        'industry_id' => $industry->id,
        'name' => 'Karivia Guest',
        'slug' => 'karivia-guest',
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);
    $job = JobListing::create([
        'company_id' => $ownerCompany->id,
        'created_by' => $firstEmployer->id,
        'industry_id' => $industry->id,
        'title' => 'Data Engineer',
        'slug' => 'data-engineer-isolated',
        'description' => 'Membangun pipeline data.',
        'work_mode' => 'onsite',
        'job_type' => 'full_time',
        'experience_level' => 'senior',
        'salary_currency' => 'IDR',
        'is_salary_visible' => true,
        'status' => 'published',
    ]);

    actingAs($secondEmployer)
        ->get(route('employer.jobs.show', $job))
        ->assertNotFound();
});

test('employer can view incoming candidates for their company', function () {
    $employer = User::factory()->employer()->create();
    $candidateUser = User::factory()->candidate()->create();
    $industry = Industry::create([
        'name' => 'Teknologi',
        'slug' => 'teknologi',
    ]);
    $skill = Skill::create([
        'name' => 'Laravel',
        'slug' => 'laravel',
        'category' => 'Backend',
    ]);
    $company = Company::create([
        'owner_id' => $employer->id,
        'industry_id' => $industry->id,
        'name' => 'Karivia Tech',
        'slug' => 'karivia-tech',
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'industry_id' => $industry->id,
        'title' => 'Backend Engineer',
        'slug' => 'backend-engineer',
        'description' => 'Bangun API Laravel yang aman.',
        'responsibilities' => 'Membangun fitur backend.',
        'required_qualifications' => 'Menguasai Laravel.',
        'work_mode' => 'hybrid',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'salary_currency' => 'IDR',
        'is_salary_visible' => true,
        'status' => 'published',
    ]);
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Alya Prameswari',
        'headline' => 'Backend Developer',
        'location_city' => 'Jakarta',
        'location_province' => 'DKI Jakarta',
        'preferred_industry_id' => $industry->id,
        'preferred_role' => 'Software Engineer',
        'profile_completion' => 90,
    ]);
    $candidate->skills()->attach($skill->id, [
        'years_exp' => 3,
        'proficiency' => 'advanced',
    ]);
    $cv = CandidateCv::create([
        'candidate_id' => $candidate->id,
        'file_url' => '/storage/demo/cv.pdf',
        'source' => 'manual',
        'is_primary' => true,
        'uploaded_at' => now(),
    ]);

    Application::create([
        'job_listing_id' => $job->id,
        'candidate_id' => $candidate->id,
        'candidate_cv_id' => $cv->id,
        'status' => 'shortlisted',
        'cover_letter' => 'Saya cocok untuk posisi ini.',
        'ai_fit_score' => 86,
        'ai_skill_match' => [
            'matched' => ['Laravel'],
            'missing' => ['Redis'],
        ],
        'applied_at' => now(),
    ]);

    actingAs($employer)
        ->get(route('employer.candidates.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('employer/candidates')
            ->where('company.name', 'Karivia Tech')
            ->where('metrics.total', 1)
            ->where('applications.data.0.candidate.name', 'Alya Prameswari')
            ->where('applications.data.0.job.title', 'Backend Engineer')
            ->where('applications.data.0.ai_fit_score', 86)
            ->etc()
        );
});

test('employer can search talent from candidate profiles', function () {
    $employer = User::factory()->employer()->create();
    $candidateUser = User::factory()->candidate()->create([
        'email' => 'talent@example.test',
        'avatar_url' => 'https://example.test/avatar.jpg',
    ]);
    $industry = Industry::create([
        'name' => 'Teknologi',
        'slug' => 'teknologi-ai',
    ]);
    $skill = Skill::create([
        'name' => 'Java',
        'slug' => 'java',
        'category' => 'Backend',
    ]);
    $company = Company::create([
        'owner_id' => $employer->id,
        'industry_id' => $industry->id,
        'name' => 'Karivia Tech',
        'slug' => 'karivia-tech-talent',
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'industry_id' => $industry->id,
        'title' => 'Senior Java Developer',
        'slug' => 'senior-java-developer',
        'description' => 'Java backend role.',
        'work_mode' => 'hybrid',
        'job_type' => 'full_time',
        'experience_level' => 'senior',
        'salary_currency' => 'IDR',
        'is_salary_visible' => true,
        'status' => 'published',
    ]);
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Aditya Pratama',
        'headline' => 'Senior Java Backend Developer',
        'location_city' => 'Jakarta Selatan',
        'location_province' => 'DKI Jakarta',
        'expected_salary_min' => 25000000,
        'expected_salary_max' => 35000000,
        'preferred_role' => 'Java Developer',
        'availability' => 'immediate',
        'profile_completion' => 96,
    ]);
    $candidate->skills()->attach($skill->id, [
        'years_exp' => 5,
        'proficiency' => 'advanced',
        'verified_at' => now(),
    ]);

    AiMatchScore::create([
        'job_listing_id' => $job->id,
        'candidate_id' => $candidate->id,
        'overall_score' => 98,
        'skill_score' => 98,
        'experience_score' => 95,
        'location_score' => 90,
        'salary_score' => 88,
        'industry_score' => 90,
        'matched_skills' => ['Java'],
        'missing_skills' => [],
        'explanation' => 'Kandidat sangat cocok.',
        'model_name' => 'demo',
        'scoring_version' => 'v1',
        'computed_at' => now(),
    ]);

    $this->mock(AiService::class, function ($mock): void {
        $mock->shouldReceive('isConfigured')->andReturn(true);
    });

    TalentReranker::fake([
        json_encode([
            'rankings' => [
                [
                    'candidate_id' => $candidate->id,
                    'score' => 97,
                    'reason' => 'Java, pengalaman, dan lokasi kandidat paling cocok dengan kebutuhan pencarian.',
                ],
            ],
        ]),
    ]);

    actingAs($employer)
        ->get(route('employer.talent-search.index', ['q' => 'Java', 'skill_id' => $skill->id]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('employer/talent-search')
            ->where('filters.q', 'Java')
            ->where('recommendationSource', 'ai')
            ->where('candidates.data.0.name', 'Aditya Pratama')
            ->where('candidates.data.0.match_score', 98)
            ->where('candidates.data.0.match_source', 'ai_match_score')
            ->where('candidates.data.0.skills.0.name', 'Java')
            ->where('candidates.data.0.avatar_url', 'https://example.test/avatar.jpg')
            ->where('candidates.data.0.is_saved', false)
            ->where('candidates.data.0.is_shortlisted', false)
            ->etc()
        );

});

test('employer can save and shortlist candidate from talent search', function () {
    $employer = User::factory()->employer()->create();
    $candidateUser = User::factory()->candidate()->create();
    $industry = Industry::create([
        'name' => 'Teknologi Talent Action',
        'slug' => 'teknologi-talent-action',
    ]);
    $company = Company::create([
        'owner_id' => $employer->id,
        'industry_id' => $industry->id,
        'name' => 'Karivia Talent Action',
        'slug' => 'karivia-talent-action',
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Rani Talent',
        'headline' => 'Backend Engineer',
        'profile_completion' => 88,
    ]);

    actingAs($employer)
        ->post(route('employer.talent-search.save', $candidate))
        ->assertRedirect();

    $record = EmployerTalentCandidate::query()
        ->where('company_id', $company->id)
        ->where('candidate_id', $candidate->id)
        ->first();

    expect($record)->not->toBeNull();
    expect($record?->saved_at)->not->toBeNull();
    expect($record?->shortlisted_at)->toBeNull();

    actingAs($employer)
        ->post(route('employer.talent-search.shortlist', $candidate))
        ->assertRedirect();

    $record->refresh();
    expect($record->shortlisted_at)->not->toBeNull();

    $this->mock(AiService::class, function ($mock): void {
        $mock->shouldReceive('isConfigured')->andReturn(false);
    });

    actingAs($employer)
        ->get(route('employer.talent-search.index', ['q' => 'Rani']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('employer/talent-search')
            ->where('candidates.data.0.name', 'Rani Talent')
            ->where('candidates.data.0.is_saved', true)
            ->where('candidates.data.0.is_shortlisted', true)
            ->etc()
        );

    actingAs($employer)
        ->delete(route('employer.talent-search.unsave', $candidate))
        ->assertRedirect();

    $record->refresh();
    expect($record->saved_at)->toBeNull();
    expect($record->shortlisted_at)->not->toBeNull();

    actingAs($employer)
        ->delete(route('employer.talent-search.unshortlist', $candidate))
        ->assertRedirect();

    $this->assertDatabaseMissing('employer_talent_candidates', [
        'company_id' => $company->id,
        'candidate_id' => $candidate->id,
    ]);
});

test('employer can view dedicated talent pool page with saved candidates only', function () {
    $employer = User::factory()->employer()->create();
    $candidateUserSaved = User::factory()->candidate()->create();
    $candidateUserOther = User::factory()->candidate()->create();
    $industry = Industry::create([
        'name' => 'Teknologi Talent Pool',
        'slug' => 'teknologi-talent-pool',
    ]);
    $company = Company::create([
        'owner_id' => $employer->id,
        'industry_id' => $industry->id,
        'name' => 'Karivia Talent Pool',
        'slug' => 'karivia-talent-pool',
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);
    $savedCandidate = CandidateProfile::create([
        'user_id' => $candidateUserSaved->id,
        'full_name' => 'Sinta Talent',
        'headline' => 'Frontend Engineer',
        'profile_completion' => 86,
    ]);
    CandidateProfile::create([
        'user_id' => $candidateUserOther->id,
        'full_name' => 'Raka Non Saved',
        'headline' => 'Backend Engineer',
        'profile_completion' => 80,
    ]);

    EmployerTalentCandidate::create([
        'company_id' => $company->id,
        'candidate_id' => $savedCandidate->id,
        'saved_at' => now(),
    ]);

    $this->mock(AiService::class, function ($mock): void {
        $mock->shouldReceive('isConfigured')->andReturn(false);
    });

    actingAs($employer)
        ->get(route('employer.talent-pool.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('employer/talent-search')
            ->where('filters.saved_only', '1')
            ->where('viewMode', 'saved')
            ->where('savedCandidatesCount', 1)
            ->where('candidates.total', 1)
            ->where('candidates.data.0.name', 'Sinta Talent')
            ->etc()
        );
});

test('employer can contact candidate from talent search and reuses existing conversation', function () {
    $employer = User::factory()->employer()->create();
    $candidateUser = User::factory()->candidate()->create();
    $industry = Industry::create([
        'name' => 'Teknologi Contact',
        'slug' => 'teknologi-contact',
    ]);
    $company = Company::create([
        'owner_id' => $employer->id,
        'industry_id' => $industry->id,
        'name' => 'Karivia Contact',
        'slug' => 'karivia-contact',
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Budi Contact',
        'headline' => 'Data Analyst',
        'profile_completion' => 74,
    ]);

    actingAs($employer)
        ->post(route('employer.talent-search.contact', $candidate))
        ->assertRedirect();

    $conversation = Conversation::query()
        ->where('company_id', $company->id)
        ->where('candidate_id', $candidate->id)
        ->whereNull('application_id')
        ->first();

    expect($conversation)->not->toBeNull();

    actingAs($employer)
        ->post(route('employer.talent-search.contact', $candidate))
        ->assertRedirect(route('employer.messages.show', $conversation));

    expect(
        Conversation::query()
            ->where('company_id', $company->id)
            ->where('candidate_id', $candidate->id)
            ->whereNull('application_id')
            ->count()
    )->toBe(1);
});

test('employer dashboard shows subscription expiry alert and quota usage', function () {
    $employer = User::factory()->employer()->create();
    $member = User::factory()->employer()->create();
    $candidateUser = User::factory()->candidate()->create();
    $industry = Industry::create([
        'name' => 'Teknologi Dashboard Quota',
        'slug' => 'teknologi-dashboard-quota',
    ]);
    $company = Company::create([
        'owner_id' => $employer->id,
        'industry_id' => $industry->id,
        'name' => 'Karivia Quota Labs',
        'slug' => 'karivia-quota-labs',
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);

    $plan = PricingPlan::create([
        'name' => 'Gratis / Trial',
        'slug' => 'gratis-trial-dashboard',
        'price' => 0,
        'duration_days' => 14,
        'active_jobs_limit' => 3,
        'recruiter_seat_limit' => 2,
        'ai_screening_quota' => 1,
        'talent_search_quota' => 1,
        'features_json' => ['14 Hari Masa Aktif'],
        'is_active' => true,
    ]);

    Subscription::create([
        'company_id' => $company->id,
        'pricing_plan_id' => $plan->id,
        'status' => 'active',
        'starts_at' => now()->subDays(10),
        'ends_at' => now()->addDay(),
    ]);

    $company->members()->create([
        'user_id' => $member->id,
        'role' => 'recruiter',
        'is_active' => true,
        'joined_at' => now(),
    ]);

    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'industry_id' => $industry->id,
        'title' => 'Backend Engineer Quota',
        'slug' => 'backend-engineer-quota',
        'description' => 'Role quota test.',
        'work_mode' => 'remote',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'salary_currency' => 'IDR',
        'is_salary_visible' => true,
        'status' => 'published',
        'published_at' => now(),
    ]);

    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Quota Candidate',
        'headline' => 'PHP Developer',
    ]);

    Application::create([
        'job_listing_id' => $job->id,
        'candidate_id' => $candidate->id,
        'status' => 'applied',
        'ai_fit_score' => 90,
        'applied_at' => now(),
    ]);

    EmployerTalentCandidate::create([
        'company_id' => $company->id,
        'candidate_id' => $candidate->id,
        'saved_at' => now(),
    ]);

    actingAs($employer)
        ->get(route('employer.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('employer/dashboard')
            ->where('subscriptionAlert.status', 'critical')
            ->where('quotaUsage.0.key', 'active_jobs')
            ->where('quotaUsage.0.used', 1)
            ->where('quotaUsage.0.limit', 3)
            ->where('quotaUsage.1.key', 'recruiter_seats')
            ->where('quotaUsage.1.used', 2)
            ->where('quotaUsage.1.limit', 2)
            ->where('quotaUsage.2.key', 'talent_search')
            ->where('quotaUsage.2.used', 1)
            ->where('quotaUsage.2.limit', 1)
            ->etc()
        );
});

test('employer unread message badge data comes from unread conversations', function () {
    $employer = User::factory()->employer()->create();
    $candidateUser = User::factory()->candidate()->create();
    $industry = Industry::create([
        'name' => 'Teknologi Pesan',
        'slug' => 'teknologi-pesan',
    ]);
    $company = Company::create([
        'owner_id' => $employer->id,
        'industry_id' => $industry->id,
        'name' => 'Karivia Inbox',
        'slug' => 'karivia-inbox',
        'verification_status' => 'approved',
        'is_verified' => true,
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'industry_id' => $industry->id,
        'title' => 'Support Engineer',
        'slug' => 'support-engineer',
        'description' => 'Support role.',
        'work_mode' => 'remote',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'salary_currency' => 'IDR',
        'is_salary_visible' => true,
        'status' => 'published',
    ]);
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Nadia Inbox',
        'headline' => 'Support Specialist',
    ]);
    $application = Application::create([
        'job_listing_id' => $job->id,
        'candidate_id' => $candidate->id,
        'status' => 'applied',
        'applied_at' => now(),
    ]);
    $conversation = Conversation::create([
        'company_id' => $company->id,
        'candidate_id' => $candidate->id,
        'application_id' => $application->id,
        'last_message_at' => now(),
    ]);

    Message::create([
        'conversation_id' => $conversation->id,
        'sender_id' => $candidateUser->id,
        'body' => 'Halo tim recruiter',
        'read_at' => null,
    ]);
    Message::create([
        'conversation_id' => $conversation->id,
        'sender_id' => $candidateUser->id,
        'body' => 'Saya follow up status lamaran',
        'read_at' => null,
    ]);
    Message::create([
        'conversation_id' => $conversation->id,
        'sender_id' => $employer->id,
        'body' => 'Terima kasih sudah follow up',
        'read_at' => null,
    ]);

    $otherCandidateUser = User::factory()->candidate()->create();
    $otherCandidate = CandidateProfile::create([
        'user_id' => $otherCandidateUser->id,
        'full_name' => 'Rani Talent Pool',
        'headline' => 'Generalist',
    ]);
    $talentPoolConversation = Conversation::create([
        'company_id' => $company->id,
        'candidate_id' => $otherCandidate->id,
        'application_id' => null,
        'last_message_at' => now()->addMinute(),
    ]);

    Message::create([
        'conversation_id' => $talentPoolConversation->id,
        'sender_id' => $otherCandidateUser->id,
        'body' => 'Halo dari talent pool',
        'read_at' => null,
    ]);

    actingAs($employer)
        ->get(route('employer.messages.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('employer/messages')
            ->where('unread_total', 2)
            ->where('employer_unread_messages', 2)
            ->has('conversations.data', 1)
            ->where('conversations.data.0.unread_count', 2)
            ->etc()
        );
});

test('employer can submit company verification', function () {
    Storage::fake('public');
    $employer = User::factory()->employer()->create();
    $industry = Industry::create([
        'name' => 'Teknologi',
        'slug' => 'teknologi',
    ]);
    $company = Company::create([
        'owner_id' => $employer->id,
        'industry_id' => $industry->id,
        'name' => 'Karivia Tech',
        'slug' => 'karivia-tech',
        'description' => 'Perusahaan teknologi.',
        'verification_status' => 'unverified',
        'is_verified' => false,
    ]);

    actingAs($employer)
        ->post(route('employer.verification.store'), [
            'legal_name' => 'PT Karivia Teknologi Indonesia',
            'nib' => '1234567890123',
            'npwp' => '12.345.678.9-012.000',
            'document' => UploadedFile::fake()->create('company.pdf', 512, 'application/pdf'),
        ])
        ->assertRedirect(route('employer.verification.index'));

    $company->refresh();
    $verification = CompanyVerification::query()->whereBelongsTo($company)->first();

    expect($verification)->not->toBeNull();
    expect($verification?->status)->toBe('pending');
    expect($verification?->submitted_by)->toBe($employer->id);
    Storage::disk('public')->assertExists(str_replace('/storage/', '', $verification?->document_url ?? ''));
    expect($company->verification_status)->toBe('pending');
    expect($company->is_verified)->toBeFalse();
});

test('employer sees latest company verification status', function () {
    $employer = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Karivia Tech',
        'slug' => 'karivia-tech',
        'verification_status' => 'need_revision',
        'is_verified' => false,
    ]);

    CompanyVerification::create([
        'company_id' => $company->id,
        'submitted_by' => $employer->id,
        'legal_name' => 'PT Karivia Teknologi Indonesia',
        'document_url' => 'https://karivia.id/legal/company.pdf',
        'status' => 'need_revision',
        'rejection_reason' => 'Dokumen legal belum terbaca jelas.',
    ]);

    actingAs($employer)
        ->get(route('employer.verification.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('employer/verification')
            ->where('company.name', 'Karivia Tech')
            ->where('canSubmit', true)
            ->where('verification.status', 'need_revision')
            ->where('verification.rejection_reason', 'Dokumen legal belum terbaca jelas.')
            ->etc()
        );
});

test('employer cannot resubmit while verification is pending', function () {
    Storage::fake('public');
    $employer = User::factory()->employer()->create();
    Company::create([
        'owner_id' => $employer->id,
        'name' => 'Karivia Tech',
        'slug' => 'karivia-tech',
        'verification_status' => 'pending',
        'is_verified' => false,
    ]);

    actingAs($employer)
        ->post(route('employer.verification.store'), [
            'legal_name' => 'PT Karivia Teknologi Indonesia',
            'document' => UploadedFile::fake()->create('company.pdf', 512, 'application/pdf'),
        ])
        ->assertForbidden();
});
