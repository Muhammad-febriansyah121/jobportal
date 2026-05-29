<?php

use App\Http\Middleware\EnsureCandidateOnboardingIsComplete;
use App\Models\ActivityLog;
use App\Models\Application;
use App\Models\CandidateCv;
use App\Models\CandidateExperience;
use App\Models\CandidateProfile;
use App\Models\Company;
use App\Models\JobListing;
use App\Models\User;

test('candidate can save and apply to a published job', function () {
    $candidateUser = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Kandidat',
        'work_mode_pref' => 'any',
    ]);
    $cv = CandidateCv::create([
        'candidate_id' => $candidate->id,
        'file_url' => '/storage/candidate-cvs/cv.pdf',
        'source' => 'upload',
        'is_primary' => true,
        'uploaded_at' => now(),
    ]);
    $employer = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Karivia Tech',
        'slug' => 'karivia-tech',
        'is_verified' => true,
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'title' => 'Backend Engineer',
        'slug' => 'backend-engineer',
        'description' => 'Build APIs.',
        'work_mode' => 'remote',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'salary_min' => 12000000,
        'salary_max' => 18000000,
        'status' => 'published',
        'published_at' => now(),
    ]);

    $this->actingAs($candidateUser)
        ->post(route('candidate.jobs.save', $job))
        ->assertRedirect();

    $this->assertDatabaseHas('saved_jobs', [
        'candidate_id' => $candidate->id,
        'job_listing_id' => $job->id,
    ]);

    $this->actingAs($candidateUser)
        ->post(route('candidate.jobs.apply', $job), [
            'phone' => '081234567890',
            'candidate_cv_id' => $cv->id,
            'cover_letter' => 'Saya sangat tertarik dengan posisi ini dan merasa kualifikasi saya sesuai dengan kebutuhan perusahaan Anda.',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('applications', [
        'candidate_id' => $candidate->id,
        'job_listing_id' => $job->id,
        'candidate_cv_id' => $cv->id,
        'status' => 'applied',
    ]);

    $this->assertDatabaseHas('users', [
        'id' => $candidateUser->id,
        'phone' => '081234567890',
    ]);

    $this->assertDatabaseHas('application_status_histories', [
        'to_status' => 'applied',
        'changed_by' => $candidateUser->id,
    ]);

    $this->assertDatabaseHas('user_notifications', [
        'user_id' => $employer->id,
        'type' => 'application_submitted',
    ]);

    expect(ActivityLog::where('actor_id', $candidateUser->id)->where('action', 'candidate_jobs_save')->exists())->toBeTrue();
    expect(ActivityLog::where('actor_id', $candidateUser->id)->where('action', 'candidate_jobs_apply')->exists())->toBeTrue();
});

test('candidate sees predicted acceptance percentage for admin background applying to IT job under three years', function () {
    $this->withoutMiddleware(EnsureCandidateOnboardingIsComplete::class);

    $candidateUser = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Admin Kandidat',
        'headline' => 'Admin Operasional',
        'work_mode_pref' => 'any',
    ]);
    CandidateExperience::create([
        'candidate_id' => $candidate->id,
        'company_name' => 'PT Administrasi Nusantara',
        'job_title' => 'Admin Staff',
        'start_date' => now()->subYears(2),
        'end_date' => now()->subMonths(2),
        'is_current' => false,
    ]);
    $cv = CandidateCv::create([
        'candidate_id' => $candidate->id,
        'file_url' => '/storage/candidate-cvs/admin-cv.pdf',
        'source' => 'upload',
        'is_primary' => true,
        'uploaded_at' => now(),
    ]);
    $employer = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Karivia Tech Match',
        'slug' => 'karivia-tech-match',
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'title' => 'Backend IT Support',
        'slug' => 'backend-it-support',
        'description' => 'Posisi IT untuk mendukung pengembangan dan operasional sistem.',
        'work_mode' => 'onsite',
        'job_type' => 'full_time',
        'experience_level' => 'entry',
        'status' => 'published',
        'published_at' => now(),
    ]);

    $this->actingAs($candidateUser)
        ->get(route('candidate.jobs.show', ['jobListing' => $job->slug, 'apply' => 1]))
        ->assertInertia(fn ($page) => $page
            ->component('candidate/jobs/apply')
            ->where('application_chance.percentage', 32)
            ->where('application_chance.total_years_experience', 1.8)
        );

    $this->actingAs($candidateUser)
        ->post(route('candidate.jobs.apply', $job), [
            'phone' => '081234567890',
            'candidate_cv_id' => $cv->id,
            'cover_letter' => 'Saya siap bertransisi ke bidang IT dan yakin pengalaman administrasi saya memberikan nilai lebih bagi perusahaan Anda.',
        ])
        ->assertRedirect();

    // Skor dihitung rule-based (ComputeRuleBasedFitScore), bukan PredictItJobAcceptance
    $application = Application::where('candidate_id', $candidate->id)
        ->where('job_listing_id', $job->id)
        ->first();
    expect($application)->not->toBeNull();
    expect($application->ai_fit_score)->toBeGreaterThan(0)->toBeLessThanOrEqual(100);
    expect($application->ai_skill_match)
        ->toHaveKeys([
            'matched_skills',
            'missing_skills',
            'skill_score',
            'experience_score',
            'position_score',
            'seniority_score',
            'industry_score',
            'work_preference_score',
        ]);
});

test('candidate cannot apply twice to the same job', function () {
    $candidateUser = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Kandidat',
        'work_mode_pref' => 'any',
    ]);
    $cv = CandidateCv::create([
        'candidate_id' => $candidate->id,
        'file_url' => '/storage/candidate-cvs/cv.pdf',
        'source' => 'upload',
        'is_primary' => true,
        'uploaded_at' => now(),
    ]);
    $employer = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Karivia Tech',
        'slug' => 'karivia-tech-dua',
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'title' => 'Product Designer',
        'slug' => 'product-designer',
        'description' => 'Design product.',
        'work_mode' => 'hybrid',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'status' => 'published',
        'published_at' => now(),
    ]);
    $candidate->applications()->create([
        'job_listing_id' => $job->id,
        'candidate_cv_id' => $cv->id,
        'status' => 'applied',
        'applied_at' => now(),
    ]);

    $this->actingAs($candidateUser)
        ->post(route('candidate.jobs.apply', $job), [
            'phone' => '081234567890',
            'candidate_cv_id' => $cv->id,
            'cover_letter' => 'Saya ingin melamar kembali untuk posisi ini karena saya sangat tertarik dan yakin bisa memberikan kontribusi terbaik.',
        ])
        ->assertSessionHasErrors('job');
});

test('candidate cannot apply without a whatsapp number', function () {
    $candidateUser = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
        'phone' => null,
    ]);
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Kandidat',
        'work_mode_pref' => 'any',
    ]);
    $cv = CandidateCv::create([
        'candidate_id' => $candidate->id,
        'file_url' => '/storage/candidate-cvs/cv.pdf',
        'source' => 'upload',
        'is_primary' => true,
        'uploaded_at' => now(),
    ]);
    $employer = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Karivia Tech Wajib WA',
        'slug' => 'karivia-tech-wajib-wa',
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'title' => 'Mobile Engineer',
        'slug' => 'mobile-engineer-wajib-wa',
        'description' => 'Build mobile apps.',
        'work_mode' => 'remote',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'status' => 'published',
        'published_at' => now(),
    ]);

    $this->actingAs($candidateUser)
        ->post(route('candidate.jobs.apply', $job), [
            'candidate_cv_id' => $cv->id,
        ])
        ->assertSessionHasErrors('phone');

    $this->assertDatabaseMissing('applications', [
        'candidate_id' => $candidate->id,
        'job_listing_id' => $job->id,
    ]);
});

test('candidate cannot apply to a non-published job', function () {
    $candidateUser = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Kandidat',
        'work_mode_pref' => 'any',
    ]);
    $cv = CandidateCv::create([
        'candidate_id' => $candidate->id,
        'file_url' => '/storage/candidate-cvs/cv.pdf',
        'source' => 'upload',
        'is_primary' => true,
        'uploaded_at' => now(),
    ]);
    $employer = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Karivia Pending',
        'slug' => 'karivia-pending',
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'title' => 'Draft Backend Engineer',
        'slug' => 'draft-backend-engineer',
        'description' => 'Belum siap ditayangkan.',
        'work_mode' => 'remote',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'status' => 'draft',
    ]);

    $this->actingAs($candidateUser)
        ->post(route('candidate.jobs.apply', $job), [
            'phone' => '081234567890',
            'candidate_cv_id' => $cv->id,
            'cover_letter' => 'Saya tertarik dengan posisi ini dan ingin mengajukan lamaran, tetapi sistem tetap harus menolak karena lowongan belum ditayangkan dan belum boleh menerima kandidat.',
        ])
        ->assertNotFound();

    $this->assertDatabaseMissing('applications', [
        'candidate_id' => $candidate->id,
        'job_listing_id' => $job->id,
    ]);
});

test('candidate can view non-published job detail when they have applied', function () {
    $candidateUser = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Kandidat',
        'work_mode_pref' => 'any',
    ]);

    $cv = CandidateCv::create([
        'candidate_id' => $candidate->id,
        'file_url' => '/storage/candidate-cvs/cv.pdf',
        'source' => 'upload',
        'is_primary' => true,
        'uploaded_at' => now(),
    ]);

    $employer = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Karivia Tech Tiga',
        'slug' => 'karivia-tech-tiga',
    ]);

    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'title' => 'Data Analyst',
        'slug' => 'data-analyst-legacy',
        'description' => 'Analyze business data.',
        'work_mode' => 'hybrid',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'status' => 'closed',
    ]);

    $candidate->applications()->create([
        'job_listing_id' => $job->id,
        'candidate_cv_id' => $cv->id,
        'status' => 'rejected',
        'applied_at' => now(),
    ]);

    $this->actingAs($candidateUser)
        ->get(route('candidate.jobs.show', $job->slug))
        ->assertSuccessful();
});

test('candidate cannot view non-published job detail when they have not applied', function () {
    $candidateUser = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);
    CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Kandidat',
        'work_mode_pref' => 'any',
    ]);

    $employer = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Karivia Tech Empat',
        'slug' => 'karivia-tech-empat',
    ]);

    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'title' => 'Data Scientist',
        'slug' => 'data-scientist-legacy',
        'description' => 'Build data models.',
        'work_mode' => 'remote',
        'job_type' => 'full_time',
        'experience_level' => 'senior',
        'status' => 'closed',
    ]);

    $this->actingAs($candidateUser)
        ->get(route('candidate.jobs.show', $job->slug))
        ->assertNotFound();
});

test('candidate can open job detail from home route', function () {
    $candidateUser = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);
    CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Kandidat',
        'work_mode_pref' => 'any',
    ]);

    $employer = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Karivia Tech Lima',
        'slug' => 'karivia-tech-lima',
    ]);

    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'title' => 'Frontend Engineer',
        'slug' => 'frontend-engineer-home-route',
        'description' => 'Build frontend apps.',
        'work_mode' => 'remote',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'status' => 'published',
        'published_at' => now(),
    ]);

    $this->actingAs($candidateUser)
        ->get(route('jobs.show', $job->slug))
        ->assertInertia(fn ($page) => $page
            ->component('front/jobs/show')
            ->where('job.id', $job->id)
            ->where('job.slug', $job->slug)
            ->where('job.ai_interview_application_id', null)
        );
});

test('candidate home job detail includes ai interview quick-start id when already applied', function () {
    $candidateUser = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Kandidat Home Quick Start',
        'work_mode_pref' => 'any',
    ]);
    $cv = CandidateCv::create([
        'candidate_id' => $candidate->id,
        'file_url' => '/storage/candidate-cvs/cv-home-quick-start.pdf',
        'source' => 'upload',
        'is_primary' => true,
        'uploaded_at' => now(),
    ]);
    $employer = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Karivia Home Quick Start',
        'slug' => 'karivia-home-quick-start',
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'title' => 'Backend Engineer Home Quick Start',
        'slug' => 'backend-engineer-home-quick-start',
        'description' => 'Build APIs from home route.',
        'work_mode' => 'remote',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'status' => 'published',
        'published_at' => now(),
    ]);
    $application = $candidate->applications()->create([
        'job_listing_id' => $job->id,
        'candidate_cv_id' => $cv->id,
        'status' => 'applied',
        'applied_at' => now(),
    ]);

    $this->actingAs($candidateUser)
        ->get(route('jobs.show', $job->slug))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('front/jobs/show')
            ->where('job.id', $job->id)
            ->where('job.ai_interview_application_id', $application->id)
            ->where('job.has_applied', true)
        );
});

test('guest can open published job detail from home route', function () {
    $employer = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Karivia Public',
        'slug' => 'karivia-public',
        'culture' => "- Transparan\n- Saling support",
        'benefits' => "- BPJS + asuransi\n- Flexible hour",
    ]);

    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'title' => 'Public Backend Engineer',
        'slug' => 'public-backend-engineer',
        'description' => 'Build public-facing APIs.',
        'benefits' => "- Bonus kuartalan\n- Work from home hybrid",
        'work_mode' => 'remote',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'status' => 'published',
        'published_at' => now(),
    ]);

    $this->get(route('jobs.show', $job->slug))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('front/jobs/show')
            ->where('job.id', $job->id)
            ->where('job.slug', $job->slug)
            ->where('job.benefits', "- Bonus kuartalan\n- Work from home hybrid")
            ->where('job.company_culture', "- Transparan\n- Saling support")
            ->where('job.company_benefits', "- BPJS + asuransi\n- Flexible hour")
        );
});

test('candidate can open apply page from query flag', function () {
    $this->withoutMiddleware(EnsureCandidateOnboardingIsComplete::class);

    $candidateUser = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);
    CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Kandidat',
        'work_mode_pref' => 'any',
    ]);

    $employer = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Karivia Tech Tujuh',
        'slug' => 'karivia-tech-tujuh',
    ]);

    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'title' => 'UI Engineer',
        'slug' => 'ui-engineer-auto-apply',
        'description' => 'Build UI components.',
        'work_mode' => 'remote',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'status' => 'published',
        'published_at' => now(),
    ]);

    $this->actingAs($candidateUser)
        ->get(route('candidate.jobs.show', ['jobListing' => $job->slug, 'apply' => 1]))
        ->assertInertia(fn ($page) => $page
            ->component('candidate/jobs/apply')
            ->where('job.id', $job->id)
            ->where('job.slug', $job->slug)
        );
});

test('candidate job detail provides ai interview quick-start application id', function () {
    $candidateUser = User::factory()->candidate()->create([
        'onboarding_completed_at' => now(),
    ]);
    $candidate = CandidateProfile::create([
        'user_id' => $candidateUser->id,
        'full_name' => 'Kandidat Quick Start',
        'work_mode_pref' => 'any',
    ]);
    $cv = CandidateCv::create([
        'candidate_id' => $candidate->id,
        'file_url' => '/storage/candidate-cvs/cv-quick-start.pdf',
        'source' => 'upload',
        'is_primary' => true,
        'uploaded_at' => now(),
    ]);
    $employer = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Karivia Quick Start',
        'slug' => 'karivia-quick-start',
    ]);
    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'title' => 'Backend Engineer Quick Start',
        'slug' => 'backend-engineer-quick-start',
        'description' => 'Build APIs quickly.',
        'work_mode' => 'remote',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'status' => 'published',
        'published_at' => now(),
    ]);
    $application = $candidate->applications()->create([
        'job_listing_id' => $job->id,
        'candidate_cv_id' => $cv->id,
        'status' => 'applied',
        'applied_at' => now(),
    ]);

    $this->actingAs($candidateUser)
        ->get(route('candidate.jobs.show', $job->slug))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('candidate/jobs/show')
            ->where('job.ai_interview_application_id', $application->id)
            ->where('job.has_applied', true)
        );
});

test('guest can open home job detail route', function () {
    $employer = User::factory()->employer()->create();
    $company = Company::create([
        'owner_id' => $employer->id,
        'name' => 'Karivia Tech Enam',
        'slug' => 'karivia-tech-enam',
    ]);

    $job = JobListing::create([
        'company_id' => $company->id,
        'created_by' => $employer->id,
        'title' => 'QA Engineer',
        'slug' => 'qa-engineer-home-route',
        'description' => 'Test product quality.',
        'work_mode' => 'hybrid',
        'job_type' => 'full_time',
        'experience_level' => 'mid',
        'status' => 'published',
        'published_at' => now(),
    ]);

    $this->get(route('jobs.show', $job->slug))
        ->assertOk();
});
