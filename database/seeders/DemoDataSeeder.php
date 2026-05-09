<?php

namespace Database\Seeders;

use App\Models\ActivityLog;
use App\Models\AiAuditLog;
use App\Models\AiMatchScore;
use App\Models\AiRecommendation;
use App\Models\Application;
use App\Models\ApplicationStatusHistory;
use App\Models\CandidateCertification;
use App\Models\CandidateCv;
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
use App\Models\Message;
use App\Models\Payment;
use App\Models\PricingPlan;
use App\Models\Report;
use App\Models\SavedJob;
use App\Models\Skill;
use App\Models\Subscription;
use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DemoDataSeeder extends Seeder
{
    private const TARGET_INDUSTRIES = 10;

    private const TARGET_SKILLS = 40;

    private const TARGET_COMPANIES = 5;

    private const TARGET_CANDIDATES = 10;

    private const TARGET_JOBS = 20;

    private const TARGET_APPLICATIONS = 30;

    private const TARGET_SAVED_JOBS = 10;

    private const TARGET_ACTIVITY_LOGS = 50;

    private const TARGET_RISK_DETECTIONS = 5;

    private const TARGET_CONVERSATIONS = 5;

    private const TARGET_SUBSCRIPTIONS = 3;

    private const TARGET_REPORTS = 5;

    private const TARGET_JOB_SCREENING_QUESTIONS = 40;

    private const TARGET_JOB_VIEWS = 40;

    private const TARGET_INTERVIEWS = 8;

    private const TARGET_AI_MATCH_SCORES = 30;

    private const TARGET_AI_RECOMMENDATIONS = 30;

    private const TARGET_NOTIFICATIONS = 20;

    private const TARGET_PAYMENTS = 3;

    private const TARGET_CAREER_RESOURCES = 8;

    public function run(): void
    {
        $industries = $this->seedIndustries();
        $skills = $this->seedSkills();
        $candidates = $this->seedCandidates($industries, $skills);
        $this->seedAdditionalUsers();
        $this->seedCandidateDetails($candidates);
        $companies = $this->seedCompanies($industries);
        $this->seedCompanyDetails($companies, $candidates);
        $jobs = $this->seedJobs($companies, $industries, $skills);
        $this->seedScreeningQuestions($jobs);

        $this->seedApplications($candidates, $jobs);
        $this->seedSavedJobs($candidates, $jobs);
        $this->seedJobViews($candidates, $jobs);
        $this->seedInterviews();
        $this->seedActivityLogs($candidates, $companies, $jobs);
        $this->seedRiskDetections($candidates);
        $this->seedAiSignals($candidates, $jobs);
        $this->seedConversations();
        $this->seedNotifications($candidates, $companies);
        $this->seedSubscriptions($companies);
        $this->seedPayments();
        $this->seedReports($candidates, $jobs, $companies);
        $this->seedCareerResources();
    }

    /**
     * @return Collection<int, Industry>
     */
    private function seedIndustries(): Collection
    {
        $items = [
            'Technology',
            'Financial Services',
            'Healthcare',
            'Education',
            'Retail',
            'Logistics',
            'Creative Agency',
            'Manufacturing',
            'Hospitality',
            'Energy',
        ];

        foreach ($items as $name) {
            Industry::firstOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name],
            );
        }

        return Industry::query()->orderBy('id')->limit(self::TARGET_INDUSTRIES)->get();
    }

    /**
     * @return Collection<int, Skill>
     */
    private function seedSkills(): Collection
    {
        $items = [
            ['Laravel', 'Backend'],
            ['PHP', 'Backend'],
            ['Node.js', 'Backend'],
            ['Go', 'Backend'],
            ['Python', 'Backend'],
            ['REST API', 'Backend'],
            ['GraphQL', 'Backend'],
            ['MySQL', 'Database'],
            ['PostgreSQL', 'Database'],
            ['Redis', 'Database'],
            ['React', 'Frontend'],
            ['Vue.js', 'Frontend'],
            ['TypeScript', 'Frontend'],
            ['Tailwind CSS', 'Frontend'],
            ['Inertia.js', 'Frontend'],
            ['UI/UX Design', 'Design'],
            ['Figma', 'Design'],
            ['Design System', 'Design'],
            ['Product Management', 'Product'],
            ['Agile Scrum', 'Product'],
            ['Data Analysis', 'Data'],
            ['SQL Analytics', 'Data'],
            ['Machine Learning', 'Data'],
            ['Prompt Engineering', 'AI'],
            ['AI Evaluation', 'AI'],
            ['DevOps', 'Infrastructure'],
            ['Docker', 'Infrastructure'],
            ['Kubernetes', 'Infrastructure'],
            ['AWS', 'Infrastructure'],
            ['CI/CD', 'Infrastructure'],
            ['QA Automation', 'Quality'],
            ['Manual Testing', 'Quality'],
            ['Security Review', 'Security'],
            ['SEO', 'Marketing'],
            ['Content Strategy', 'Marketing'],
            ['Digital Marketing', 'Marketing'],
            ['Sales Operations', 'Business'],
            ['Customer Success', 'Business'],
            ['Recruitment', 'HR'],
            ['People Analytics', 'HR'],
        ];

        foreach ($items as [$name, $category]) {
            Skill::firstOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name, 'category' => $category],
            );
        }

        return Skill::query()->orderBy('id')->limit(self::TARGET_SKILLS)->get();
    }

    /**
     * @param  Collection<int, Industry>  $industries
     * @param  Collection<int, Skill>  $skills
     * @return Collection<int, CandidateProfile>
     */
    private function seedCandidates(Collection $industries, Collection $skills): Collection
    {
        $names = [
            'Alya Prameswari',
            'Bima Santoso',
            'Citra Lestari',
            'Dimas Aditya',
            'Eka Wulandari',
            'Fajar Nugroho',
            'Gita Maharani',
            'Hendra Saputra',
            'Intan Permata',
            'Joko Pratama',
        ];

        foreach ($names as $index => $name) {
            if (CandidateProfile::count() >= self::TARGET_CANDIDATES) {
                break;
            }

            $email = 'candidate'.($index + 1).'@karivia.test';
            $user = User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'role' => 'candidate',
                    'is_active' => true,
                    'email_verified_at' => now(),
                    'password' => Hash::make('password'),
                    'phone' => '+62812'.fake()->numerify('########'),
                ],
            );

            if ($user->phone === null) {
                $user->forceFill(['phone' => '+62812'.fake()->numerify('########')])->save();
            }

            CandidateProfile::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'full_name' => $name,
                    'headline' => collect(['Backend Developer', 'Frontend Engineer', 'Product Designer', 'Data Analyst'])->get($index % 4),
                    'bio' => 'Demo candidate with realistic profile data for Karivia testing.',
                    'location_city' => collect(['Jakarta', 'Bandung', 'Surabaya', 'Yogyakarta'])->get($index % 4),
                    'location_province' => collect(['DKI Jakarta', 'Jawa Barat', 'Jawa Timur', 'DI Yogyakarta'])->get($index % 4),
                    'expected_salary_min' => 8000000 + ($index * 500000),
                    'expected_salary_max' => 14000000 + ($index * 750000),
                    'work_mode_pref' => collect(['remote', 'hybrid', 'onsite', 'any'])->get($index % 4),
                    'preferred_industry_id' => $industries->get($index % $industries->count())?->id,
                    'preferred_role' => collect(['Software Engineer', 'Product Designer', 'Data Analyst', 'QA Engineer'])->get($index % 4),
                    'availability' => collect(['immediate', '2 weeks notice', '1 month notice'])->get($index % 3),
                    'profile_completion' => 78 + ($index % 20),
                    'ai_cv_summary' => 'Strong demo profile with relevant project experience and growth potential.',
                    'linkedin_url' => 'https://linkedin.com/in/'.Str::slug($name),
                    'github_url' => 'https://github.com/'.Str::slug($name),
                    'portfolio_url' => 'https://portfolio.karivia.test/'.Str::slug($name),
                ],
            );
        }

        $candidates = CandidateProfile::query()->with('user')->orderBy('id')->limit(self::TARGET_CANDIDATES)->get();

        $candidates->each(function (CandidateProfile $candidate, int $index) use ($skills): void {
            $this->ensureDemoCandidateCvExists($candidate);

            CandidateCv::firstOrCreate(
                ['candidate_id' => $candidate->id, 'file_url' => "/storage/demo/cvs/candidate-{$candidate->id}.pdf"],
                [
                    'parsed_json' => [
                        'summary' => $candidate->ai_cv_summary,
                        'skills' => $skills->slice($index, 6)->pluck('name')->values()->all(),
                    ],
                    'source' => 'demo',
                    'is_primary' => true,
                    'uploaded_at' => now()->subDays($index + 1),
                ],
            );

            $skillPayload = $skills
                ->slice($index, 6)
                ->mapWithKeys(fn (Skill $skill, int $skillIndex): array => [
                    $skill->id => [
                        'years_exp' => ($skillIndex % 5) + 1,
                        'proficiency' => collect(['beginner', 'intermediate', 'advanced'])->get($skillIndex % 3),
                        'verified_at' => $skillIndex % 2 === 0 ? now()->subDays($skillIndex + 1) : null,
                    ],
                ])
                ->all();

            $candidate->skills()->syncWithoutDetaching($skillPayload);
        });

        return $candidates;
    }

    private function ensureDemoCandidateCvExists(CandidateProfile $candidate): void
    {
        $path = "demo/cvs/candidate-{$candidate->id}.pdf";

        if (Storage::disk('public')->exists($path)) {
            return;
        }

        Storage::disk('public')->put($path, $this->demoCandidateCvPdfContent());
    }

    private function demoCandidateCvPdfContent(): string
    {
        // Keep PDF payload deterministic so generated files are always valid.
        return base64_decode(
            'JVBERi0xLjQKJUNWQlVJTERFUgoxIDAgb2JqCjw8IC9UeXBlIC9Gb250IC9TdWJ0eXBlIC9UeXBlMSAvQmFzZUZvbnQgL1RpbWVzLVJvbWFuID4+CmVuZG9iagoyIDAgb2JqCjw8IC9UeXBlIC9Gb250IC9TdWJ0eXBlIC9UeXBlMSAvQmFzZUZvbnQgL1RpbWVzLUJvbGQgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL0xlbmd0aCAyOTAgPj4Kc3RyZWFtCkJUIC9GMiAxOC4wMCBUZiAyMjIuNjIgODAwLjAwIFRkIChERU1PIENWIEtBTkRJREFUKSBUaiBFVApCVCAvRjEgMTAuNTAgVGYgMjU2LjU1IDc3Ny4wMCBUZCAoQ2FuZGlkYXRlIElEOiAxKSBUaiBFVApCVCAvRjIgMTIuMDAgVGYgNDguMDAgNzUxLjUwIFRkIChSSU5HS0FTQU4pIFRqIEVUCjAuNiB3IDQ4LjAwIDc0Mi41MCBtIDU0Ny4wMCA3NDIuNTAgbCBTCkJUIC9GMSAxMC41MCBUZiA0OC4wMCA3MjguNTAgVGQgKERva3VtZW4gZGVtbyB1bnR1ayBwZW5ndWppYW4gYXBsaWthc2kgS2FyaXZpYS4pIFRqIEVUCmVuZHN0cmVhbQplbmRvYmoKNCAwIG9iago8PCAvVHlwZSAvUGFnZXMgL0NvdW50IDEgL0tpZHMgWyA2IDAgUiBdID4+CmVuZG9iago1IDAgb2JqCjw8IC9UeXBlIC9DYXRhbG9nIC9QYWdlcyA0IDAgUiA+PgplbmRvYmoKNiAwIG9iago8PCAvVHlwZSAvUGFnZSAvUGFyZW50IDQgMCBSIC9NZWRpYUJveCBbMCAwIDU5NSA4NDJdIC9SZXNvdXJjZXMgPDwgL0ZvbnQgPDwgL0YxIDEgMCBSIC9GMiAyIDAgUiA+PiA+PiAvQ29udGVudHMgMyAwIFIgPj4KZW5kb2JqCnhyZWYKMCA3CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAyMCAwMDAwMCBuIAowMDAwMDAwMDkyIDAwMDAwIG4gCjAwMDAwMDAxNjMgMDAwMDAgbiAKMDAwMDAwMDUwNCAwMDAwMCBuIAowMDAwMDAwNTYzIDAwMDAwIG4gCjAwMDAwMDA2MTIgMDAwMDAgbiAKdHJhaWxlcgo8PCAvU2l6ZSA3IC9Sb290IDUgMCBSIC9JbmZvIDw8IC9UaXRsZSAoRGVtbyBDVikgPj4gPj4Kc3RhcnR4cmVmCjc0OAolJUVPRg==',
            true,
        ) ?: '';
    }

    private function seedAdditionalUsers(): void
    {
        foreach ([
            ['Demo Admin', 'admin', 'admin.demo@karivia.test'],
            ['Mentor Produk', 'mentor', 'mentor.produk@karivia.test'],
            ['Mentor Engineering', 'mentor', 'mentor.engineering@karivia.test'],
            ['Recruiter Cadangan', 'employer', 'recruiter.backup@karivia.test'],
            ['Candidate Cadangan', 'candidate', 'candidate.backup@karivia.test'],
        ] as [$name, $role, $email]) {
            User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'role' => $role,
                    'phone' => '+62812'.fake()->numerify('########'),
                    'avatar_url' => 'https://placehold.co/160x160?text='.urlencode(Str::substr($name, 0, 2)),
                    'is_active' => true,
                    'onboarding_completed_at' => now()->subDays(7),
                    'email_verified_at' => now(),
                    'password' => Hash::make('password'),
                    'notification_settings' => json_encode(['email' => true, 'in_app' => true], JSON_THROW_ON_ERROR),
                ],
            );
        }
    }

    /**
     * @param  Collection<int, CandidateProfile>  $candidates
     */
    private function seedCandidateDetails(Collection $candidates): void
    {
        $institutions = ['Universitas Indonesia', 'Institut Teknologi Bandung', 'Universitas Gadjah Mada', 'Binus University'];

        $candidates->each(function (CandidateProfile $candidate, int $index) use ($institutions): void {
            $preferredRole = $candidate->preferred_role ?: collect(['Software Engineer', 'Product Designer', 'Data Analyst', 'QA Engineer'])->get($index % 4);
            $city = $candidate->location_city ?: collect(['Jakarta', 'Bandung', 'Surabaya', 'Yogyakarta'])->get($index % 4);
            $province = $candidate->location_province ?: collect(['DKI Jakarta', 'Jawa Barat', 'Jawa Timur', 'DI Yogyakarta'])->get($index % 4);

            CandidateExperience::firstOrCreate(
                ['candidate_id' => $candidate->id, 'company_name' => 'Demo Studio '.($index + 1), 'job_title' => $preferredRole],
                [
                    'start_date' => now()->subYears(3)->subMonths($index)->toDateString(),
                    'end_date' => $index % 3 === 0 ? null : now()->subMonths(3)->toDateString(),
                    'is_current' => $index % 3 === 0,
                    'description' => 'Mengerjakan proyek produk digital, kolaborasi lintas fungsi, dan peningkatan kualitas delivery.',
                    'location' => $city.', '.$province,
                ],
            );

            CandidateEducation::firstOrCreate(
                ['candidate_id' => $candidate->id, 'institution' => $institutions[$index % count($institutions)]],
                [
                    'degree' => collect(['S1', 'D4', 'S2'])->get($index % 3),
                    'field_of_study' => collect(['Computer Science', 'Information System', 'Design', 'Business'])->get($index % 4),
                    'start_year' => 2015 + ($index % 4),
                    'end_year' => 2019 + ($index % 4),
                    'gpa' => 3.25 + (($index % 6) / 10),
                ],
            );

            CandidateCertification::firstOrCreate(
                ['candidate_id' => $candidate->id, 'name' => collect(['Laravel Foundations', 'Product Analytics', 'UX Research', 'Cloud Practitioner'])->get($index % 4)],
                [
                    'issuing_org' => collect(['Karivia Academy', 'Dicoding', 'Google', 'AWS'])->get($index % 4),
                    'issue_date' => now()->subMonths($index + 2)->toDateString(),
                    'credential_url' => 'https://certs.karivia.test/candidate-'.$candidate->id,
                ],
            );
        });
    }

    /**
     * @param  Collection<int, Industry>  $industries
     * @return Collection<int, Company>
     */
    private function seedCompanies(Collection $industries): Collection
    {
        $items = [
            ['Karivia Labs', 'approved', true, true],
            ['Nusantara Fintech', 'pending', false, true],
            ['SehatLink Indonesia', 'need_revision', false, true],
            ['RantaiKirim Logistics', 'approved', true, true],
            ['Pixel Maju Studio', 'rejected', false, false],
        ];

        foreach ($items as $index => [$name, $verificationStatus, $isVerified, $isActive]) {
            if (Company::count() >= self::TARGET_COMPANIES) {
                break;
            }

            $owner = User::firstOrCreate(
                ['email' => 'employer'.($index + 1).'@karivia.test'],
                [
                    'name' => $name.' Recruiter',
                    'role' => 'employer',
                    'is_active' => true,
                    'email_verified_at' => now(),
                    'password' => Hash::make('password'),
                ],
            );

            Company::firstOrCreate(
                ['slug' => Str::slug($name)],
                [
                    'owner_id' => $owner->id,
                    'industry_id' => $industries->get($index % $industries->count())?->id,
                    'name' => $name,
                    'logo_url' => 'https://placehold.co/256x256?text='.urlencode(Str::substr($name, 0, 2)),
                    'cover_url' => 'https://placehold.co/1200x400?text='.urlencode($name),
                    'description' => $name.' is a demo employer for Karivia job portal flows.',
                    'company_size' => collect(['11-50', '51-200', '201-500', '501-1000'])->get($index % 4),
                    'website' => 'https://'.Str::slug($name).'.test',
                    'hq_city' => collect(['Jakarta', 'Bandung', 'Surabaya', 'Semarang', 'Denpasar'])->get($index),
                    'hq_province' => collect(['DKI Jakarta', 'Jawa Barat', 'Jawa Timur', 'Jawa Tengah', 'Bali'])->get($index),
                    'address' => 'Jl. Demo Karivia No. '.($index + 10),
                    'is_verified' => $isVerified,
                    'verification_status' => $verificationStatus,
                    'is_active' => $isActive,
                    'suspended_at' => $isActive ? null : now()->subDays(2),
                    'suspension_reason' => $isActive ? null : 'Demo suspended company for moderation flow.',
                    'response_rate' => 55 + ($index * 8),
                    'median_response_hours' => 12 + ($index * 6),
                    'trust_score' => $isActive ? 70 + ($index * 4) : 45,
                ],
            );
        }

        return Company::query()->with('owner')->orderBy('id')->limit(self::TARGET_COMPANIES)->get();
    }

    /**
     * @param  Collection<int, Company>  $companies
     * @param  Collection<int, CandidateProfile>  $candidates
     */
    private function seedCompanyDetails(Collection $companies, Collection $candidates): void
    {
        $admin = User::query()->where('role', 'admin')->first();

        $companies->each(function (Company $company, int $index) use ($admin, $candidates): void {
            CompanyMember::firstOrCreate(
                ['company_id' => $company->id, 'user_id' => $company->owner_id],
                [
                    'role' => 'owner',
                    'is_active' => true,
                    'invited_at' => now()->subDays(30 + $index),
                    'joined_at' => now()->subDays(29 + $index),
                ],
            );

            CompanyOffice::firstOrCreate(
                ['company_id' => $company->id, 'city' => $company->hq_city],
                [
                    'province' => $company->hq_province,
                    'address' => $company->address,
                    'lat' => -6.2000000 + ($index / 100),
                    'lng' => 106.8166660 + ($index / 100),
                ],
            );

            CompanyVerification::firstOrCreate(
                ['company_id' => $company->id, 'legal_name' => 'PT '.$company->name],
                [
                    'submitted_by' => $company->owner_id,
                    'nib' => '9120'.str_pad((string) $company->id, 9, '0', STR_PAD_LEFT),
                    'npwp' => '09.'.str_pad((string) $company->id, 3, '0', STR_PAD_LEFT).'.123.4-567.000',
                    'document_url' => '/storage/demo/company-verifications/'.$company->id.'.pdf',
                    'status' => $company->verification_status,
                    'reviewed_by' => in_array($company->verification_status, ['approved', 'rejected', 'need_revision'], true) ? $admin?->id : null,
                    'reviewed_at' => in_array($company->verification_status, ['approved', 'rejected', 'need_revision'], true) ? now()->subDays($index + 1) : null,
                    'rejection_reason' => $company->verification_status === 'rejected' ? 'Dokumen demo belum valid.' : null,
                ],
            );

            CompanyBadge::firstOrCreate(
                ['company_id' => $company->id, 'type' => $company->is_verified ? 'verified' : 'profile'],
                [
                    'label' => $company->is_verified ? 'Verified Employer' : 'Profile Reviewed',
                    'issued_at' => now()->subDays($index + 5),
                ],
            );

            CompanyReview::firstOrCreate(
                ['company_id' => $company->id, 'candidate_id' => $candidates->get($index % $candidates->count())?->id],
                [
                    'rating' => 4 + ($index % 2),
                    'title' => 'Proses rekrutmen responsif',
                    'review' => 'Review demo untuk menguji tampilan reputasi perusahaan.',
                    'status' => $index % 4 === 0 ? 'pending' : 'approved',
                ],
            );
        });
    }

    /**
     * @param  Collection<int, Company>  $companies
     * @param  Collection<int, Industry>  $industries
     * @param  Collection<int, Skill>  $skills
     * @return Collection<int, JobListing>
     */
    private function seedJobs(Collection $companies, Collection $industries, Collection $skills): Collection
    {
        $titles = [
            'Backend Engineer',
            'Frontend Engineer',
            'Full Stack Developer',
            'Product Designer',
            'Data Analyst',
            'QA Automation Engineer',
            'DevOps Engineer',
            'Product Manager',
            'Digital Marketing Specialist',
            'Customer Success Associate',
            'Mobile Developer',
            'AI Product Analyst',
            'Security Engineer',
            'HR Recruiter',
            'Content Strategist',
            'Finance Operations Analyst',
            'Logistics Coordinator',
            'UI Engineer',
            'Machine Learning Engineer',
            'Technical Writer',
        ];
        $statuses = ['published', 'published', 'published', 'published', 'draft', 'pending_review', 'closed', 'suspended', 'rejected'];

        foreach ($titles as $index => $title) {
            if (JobListing::count() >= self::TARGET_JOBS) {
                break;
            }

            $company = $companies->get($index % $companies->count());
            $status = $statuses[$index % count($statuses)];
            $job = JobListing::firstOrCreate(
                ['slug' => Str::slug($company->name.' '.$title)],
                [
                    'company_id' => $company->id,
                    'created_by' => $company->owner_id,
                    'industry_id' => $industries->get($index % $industries->count())?->id,
                    'title' => $title,
                    'description' => 'Demo role for testing candidate discovery, applications, analytics, and AI matching.',
                    'responsibilities' => 'Own product delivery, collaborate with cross-functional teams, and improve platform quality.',
                    'required_qualifications' => 'Relevant experience, strong communication, and practical portfolio or project history.',
                    'preferred_qualifications' => 'Experience in high-growth teams and comfort working with data-informed decisions.',
                    'location_city' => collect(['Jakarta', 'Bandung', 'Surabaya', 'Yogyakarta', 'Remote'])->get($index % 5),
                    'location_province' => collect(['DKI Jakarta', 'Jawa Barat', 'Jawa Timur', 'DI Yogyakarta', 'Remote'])->get($index % 5),
                    'work_mode' => collect(['remote', 'hybrid', 'onsite'])->get($index % 3),
                    'job_type' => collect(['full_time', 'contract', 'internship', 'freelance'])->get($index % 4),
                    'experience_level' => collect(['entry', 'mid', 'senior', 'lead'])->get($index % 4),
                    'salary_min' => 7000000 + ($index * 500000),
                    'salary_max' => 13000000 + ($index * 800000),
                    'salary_currency' => 'IDR',
                    'is_salary_visible' => $index % 4 !== 0,
                    'status' => $status,
                    'integrity_score' => 68 + ($index % 30),
                    'response_sla_hours' => 24 + ($index % 5) * 12,
                    'published_at' => $status === 'published' ? now()->subDays($index + 1) : null,
                    'closes_at' => in_array($status, ['published', 'pending_review'], true) ? now()->addDays(20 + $index) : null,
                ],
            );

            $skillPayload = $skills
                ->slice($index, 5)
                ->mapWithKeys(fn (Skill $skill, int $skillIndex): array => [
                    $skill->id => [
                        'is_required' => $skillIndex < 3,
                        'min_years' => ($skillIndex % 4) + 1,
                    ],
                ])
                ->all();

            $job->skills()->syncWithoutDetaching($skillPayload);
        }

        return JobListing::query()->with('company')->orderBy('id')->limit(self::TARGET_JOBS)->get();
    }

    /**
     * @param  Collection<int, JobListing>  $jobs
     */
    private function seedScreeningQuestions(Collection $jobs): void
    {
        foreach ($jobs as $index => $job) {
            foreach ([
                ['availability', 'Kapan Anda bisa mulai bekerja?', 'text', null],
                ['work_mode', 'Mode kerja apa yang paling Anda nyaman?', 'select', ['remote', 'hybrid', 'onsite']],
            ] as [$key, $question, $type, $options]) {
                if (JobScreeningQuestion::count() >= self::TARGET_JOB_SCREENING_QUESTIONS) {
                    return;
                }

                JobScreeningQuestion::firstOrCreate(
                    ['job_listing_id' => $job->id, 'question' => $question],
                    [
                        'type' => $type,
                        'options_json' => $options,
                        'is_required' => $key === 'availability' || $index % 2 === 0,
                    ],
                );
            }
        }
    }

    /**
     * @param  Collection<int, CandidateProfile>  $candidates
     * @param  Collection<int, JobListing>  $jobs
     */
    private function seedApplications(Collection $candidates, Collection $jobs): void
    {
        $statuses = ['applied', 'screened', 'shortlisted', 'interview', 'offer', 'hired', 'rejected', 'withdrawn'];
        $created = 0;

        foreach ($jobs as $jobIndex => $job) {
            foreach ($candidates as $candidateIndex => $candidate) {
                if (Application::count() >= self::TARGET_APPLICATIONS || $created >= self::TARGET_APPLICATIONS) {
                    return;
                }

                if (($jobIndex + $candidateIndex) % 3 !== 0) {
                    continue;
                }

                $status = $statuses[($jobIndex + $candidateIndex) % count($statuses)];
                $cv = $candidate->primaryCv ?? $candidate->cvs()->first();
                $application = Application::firstOrCreate(
                    ['job_listing_id' => $job->id, 'candidate_id' => $candidate->id],
                    [
                        'candidate_cv_id' => $cv?->id,
                        'status' => $status,
                        'cover_letter' => 'Saya tertarik dengan posisi ini karena pengalaman saya relevan dengan kebutuhan tim.',
                        'screening_answers_json' => [
                            'availability' => $candidate->availability,
                            'expected_salary' => $candidate->expected_salary_min,
                        ],
                        'ai_fit_score' => 55 + (($jobIndex + $candidateIndex) % 40),
                        'ai_skill_match' => [
                            'matched' => ['Laravel', 'React', 'SQL'],
                            'missing' => ['Kubernetes'],
                        ],
                        'applied_at' => now()->subDays($jobIndex + $candidateIndex + 1),
                        'first_responded_at' => $status === 'applied' ? null : now()->subDays($jobIndex + 1),
                    ],
                );

                ApplicationStatusHistory::firstOrCreate(
                    ['application_id' => $application->id, 'to_status' => $status],
                    [
                        'from_status' => $status === 'applied' ? null : 'applied',
                        'changed_by' => $job->created_by,
                        'note' => 'Demo application pipeline status.',
                    ],
                );

                $created++;
            }
        }
    }

    /**
     * @param  Collection<int, CandidateProfile>  $candidates
     * @param  Collection<int, JobListing>  $jobs
     */
    private function seedSavedJobs(Collection $candidates, Collection $jobs): void
    {
        foreach ($candidates as $candidateIndex => $candidate) {
            foreach ($jobs as $jobIndex => $job) {
                if (SavedJob::count() >= self::TARGET_SAVED_JOBS) {
                    return;
                }

                if (($candidateIndex + $jobIndex) % 4 !== 0) {
                    continue;
                }

                SavedJob::firstOrCreate([
                    'candidate_id' => $candidate->id,
                    'job_listing_id' => $job->id,
                ]);
            }
        }
    }

    /**
     * @param  Collection<int, CandidateProfile>  $candidates
     * @param  Collection<int, JobListing>  $jobs
     */
    private function seedJobViews(Collection $candidates, Collection $jobs): void
    {
        $created = 0;

        foreach ($candidates as $candidateIndex => $candidate) {
            foreach ($jobs as $jobIndex => $job) {
                if (CandidateJobView::count() >= self::TARGET_JOB_VIEWS || $created >= self::TARGET_JOB_VIEWS) {
                    return;
                }

                CandidateJobView::firstOrCreate(
                    ['candidate_id' => $candidate->id, 'job_listing_id' => $job->id],
                    [
                        'view_count' => ($candidateIndex + $jobIndex) % 5 + 1,
                        'first_viewed_at' => now()->subDays($candidateIndex + $jobIndex + 3),
                        'last_viewed_at' => now()->subHours($candidateIndex + $jobIndex + 1),
                    ],
                );

                $created++;
            }
        }
    }

    private function seedInterviews(): void
    {
        $applications = Application::query()
            ->with(['jobListing.company.owner', 'candidate.user'])
            ->whereIn('status', ['shortlisted', 'interview', 'offer', 'hired'])
            ->limit(self::TARGET_INTERVIEWS)
            ->get();

        foreach ($applications as $index => $application) {
            $company = $application->jobListing?->company;
            $candidate = $application->candidate;

            if (! $company || ! $candidate) {
                continue;
            }

            $interview = Interview::firstOrCreate(
                ['application_id' => $application->id],
                [
                    'scheduled_by' => $company->owner_id,
                    'scheduled_at' => now()->addDays($index + 2)->setTime(10 + ($index % 5), 0),
                    'mode' => collect(['online', 'onsite', 'phone'])->get($index % 3),
                    'location_url' => $index % 3 === 1 ? $company->address : 'https://meet.karivia.test/interview-'.$application->id,
                    'status' => collect(['scheduled', 'completed', 'rescheduled'])->get($index % 3),
                ],
            );

            InterviewParticipant::firstOrCreate(
                ['interview_id' => $interview->id, 'user_id' => $candidate->user_id],
                ['role' => 'candidate'],
            );

            InterviewParticipant::firstOrCreate(
                ['interview_id' => $interview->id, 'user_id' => $company->owner_id],
                ['role' => 'interviewer'],
            );

            InterviewScorecard::firstOrCreate(
                ['interview_id' => $interview->id, 'reviewer_id' => $company->owner_id],
                [
                    'overall_score' => 68 + ($index % 25),
                    'criteria_scores' => [
                        'communication' => 70 + ($index % 20),
                        'technical' => 65 + ($index % 25),
                        'culture_fit' => 72 + ($index % 18),
                    ],
                    'notes' => 'Scorecard demo untuk alur interview kandidat.',
                ],
            );
        }
    }

    /**
     * @param  Collection<int, CandidateProfile>  $candidates
     * @param  Collection<int, Company>  $companies
     * @param  Collection<int, JobListing>  $jobs
     */
    private function seedActivityLogs(Collection $candidates, Collection $companies, Collection $jobs): void
    {
        $actions = [
            'login_user',
            'candidate_jobs_save',
            'candidate_jobs_apply',
            'candidate_jobs_apply',
            'candidate_jobs_apply',
            'failed_login',
            'failed_login',
            'candidate_applications_withdraw',
            'employer_jobs_publish',
            'employer_jobs_close',
        ];

        $i = 0;
        while (ActivityLog::count() < self::TARGET_ACTIVITY_LOGS) {
            $action = $actions[$i % count($actions)];
            $candidate = $candidates->get($i % $candidates->count());
            $job = $jobs->get($i % $jobs->count());
            $actor = Str::startsWith($action, 'employer')
                ? $companies->get($i % $companies->count())?->owner
                : $candidate->user;

            ActivityLog::create([
                'actor_id' => $actor?->id,
                'action' => $action,
                'subject_type' => Str::contains($action, 'jobs') ? JobListing::class : null,
                'subject_id' => Str::contains($action, 'jobs') ? $job?->id : null,
                'properties_json' => [
                    'route' => str_replace('_', '.', $action),
                    'method' => Str::contains($action, ['save', 'apply', 'publish']) ? 'POST' : 'PATCH',
                    'path' => '/demo/activity/'.$i,
                    'status' => 302,
                    'ip' => '10.20.'.($i % 10).'.'.(($i % 200) + 10),
                    'user_agent' => 'Karivia Demo Seeder',
                ],
                'created_at' => now()->subHours($i + 1),
                'updated_at' => now()->subHours($i + 1),
            ]);

            $i++;
        }
    }

    /**
     * @param  Collection<int, CandidateProfile>  $candidates
     */
    private function seedRiskDetections(Collection $candidates): void
    {
        foreach ($candidates->take(self::TARGET_RISK_DETECTIONS) as $index => $candidate) {
            if (AiAuditLog::query()
                ->where('feature', 'user_activity_risk_detection')
                ->where('user_id', $candidate->user_id)
                ->exists()) {
                continue;
            }

            $level = collect(['high', 'medium', 'medium', 'low', 'low'])->get($index, 'low');
            $score = ['high' => 88, 'medium' => 58, 'low' => 18][$level];
            $input = [
                'user' => [
                    'id' => $candidate->user_id,
                    'role' => 'candidate',
                    'email_domain' => Str::after($candidate->user->email, '@'),
                ],
                'window' => ['days' => 7, 'since' => now()->subDays(7)->toIso8601String()],
                'signals' => [
                    'apply_count' => $level === 'high' ? 24 : ($level === 'medium' ? 11 : 2),
                    'failed_login_count' => $level === 'high' ? 7 : ($level === 'medium' ? 3 : 0),
                    'destructive_action_count' => $level === 'high' ? 2 : 0,
                    'unique_ip_count' => $level === 'high' ? 8 : 2,
                    'heuristic_level' => $level,
                ],
            ];

            AiAuditLog::create([
                'user_id' => $candidate->user_id,
                'feature' => 'user_activity_risk_detection',
                'input_hash' => hash('sha256', json_encode($input, JSON_THROW_ON_ERROR)),
                'input_json' => $input,
                'output_json' => [
                    'risk_level' => $level,
                    'risk_score' => $score,
                    'reasons' => $level === 'high'
                        ? ['Apply sangat tinggi dalam 7 hari.', 'Login gagal dari beberapa IP.']
                        : ['Aktivitas masih dalam batas demo monitoring.'],
                    'recommended_actions' => $level === 'high'
                        ? ['Review akun kandidat.', 'Validasi pola apply dan login gagal.']
                        : ['Pantau aktivitas berikutnya.'],
                    'confidence' => $level === 'high' ? 'high' : 'medium',
                    'analysis_source' => 'demo_seed',
                    'generated_at' => now()->toIso8601String(),
                ],
                'model_name' => 'demo-risk-engine',
                'status' => 'success',
            ]);
        }
    }

    /**
     * @param  Collection<int, CandidateProfile>  $candidates
     * @param  Collection<int, JobListing>  $jobs
     */
    private function seedAiSignals(Collection $candidates, Collection $jobs): void
    {
        $created = 0;

        foreach ($jobs as $jobIndex => $job) {
            foreach ($candidates as $candidateIndex => $candidate) {
                if (AiMatchScore::count() >= self::TARGET_AI_MATCH_SCORES || $created >= self::TARGET_AI_MATCH_SCORES) {
                    break 2;
                }

                $score = 58 + (($jobIndex + $candidateIndex) % 38);

                AiMatchScore::firstOrCreate(
                    ['job_listing_id' => $job->id, 'candidate_id' => $candidate->id],
                    [
                        'overall_score' => $score,
                        'skill_score' => min(100, $score + 4),
                        'experience_score' => max(40, $score - 6),
                        'location_score' => 70 + (($jobIndex + $candidateIndex) % 20),
                        'salary_score' => 66 + (($jobIndex + $candidateIndex) % 18),
                        'industry_score' => 62 + (($jobIndex + $candidateIndex) % 25),
                        'matched_skills' => ['Laravel', 'React', 'SQL'],
                        'missing_skills' => ['Kubernetes', 'Security Review'],
                        'explanation' => 'Demo AI match score berdasarkan skill, lokasi, salary, dan industri.',
                        'model_name' => 'demo-match-engine',
                        'scoring_version' => 'demo-v1',
                        'computed_at' => now()->subHours($created + 1),
                    ],
                );

                $created++;
            }
        }

        $created = 0;

        foreach ($candidates as $candidateIndex => $candidate) {
            foreach ($jobs as $jobIndex => $job) {
                if (AiRecommendation::count() >= self::TARGET_AI_RECOMMENDATIONS || $created >= self::TARGET_AI_RECOMMENDATIONS) {
                    return;
                }

                AiRecommendation::firstOrCreate(
                    ['candidate_id' => $candidate->id, 'job_listing_id' => $job->id],
                    [
                        'score' => 60 + (($candidateIndex + $jobIndex) % 35),
                        'reason' => 'Rekomendasi demo karena skill dan preferensi kandidat cukup cocok dengan kebutuhan lowongan.',
                        'was_clicked' => ($candidateIndex + $jobIndex) % 3 === 0,
                        'was_applied' => Application::query()
                            ->where('candidate_id', $candidate->id)
                            ->where('job_listing_id', $job->id)
                            ->exists(),
                    ],
                );

                $created++;
            }
        }
    }

    private function seedConversations(): void
    {
        $applications = Application::query()->with(['jobListing.company.owner', 'candidate.user'])->limit(self::TARGET_CONVERSATIONS)->get();

        foreach ($applications as $index => $application) {
            $company = $application->jobListing?->company;
            $candidate = $application->candidate;

            if (! $company || ! $candidate) {
                continue;
            }

            $conversation = Conversation::firstOrCreate(
                [
                    'company_id' => $company->id,
                    'candidate_id' => $candidate->id,
                    'application_id' => $application->id,
                ],
                ['last_message_at' => now()->subHours($index + 1)],
            );

            Message::firstOrCreate(
                ['conversation_id' => $conversation->id, 'sender_id' => $candidate->user_id, 'body' => 'Halo, saya ingin menanyakan update proses lamaran saya.'],
                ['created_at' => now()->subHours($index + 3), 'updated_at' => now()->subHours($index + 3)],
            );

            Message::firstOrCreate(
                ['conversation_id' => $conversation->id, 'sender_id' => $company->owner_id, 'body' => 'Terima kasih, tim kami sedang meninjau lamaran Anda.'],
                ['read_at' => now()->subHours($index + 1), 'created_at' => now()->subHours($index + 2), 'updated_at' => now()->subHours($index + 2)],
            );
        }
    }

    /**
     * @param  Collection<int, CandidateProfile>  $candidates
     * @param  Collection<int, Company>  $companies
     */
    private function seedNotifications(Collection $candidates, Collection $companies): void
    {
        $users = $candidates
            ->map(fn (CandidateProfile $candidate): User => $candidate->user)
            ->merge($companies->map(fn (Company $company): User => $company->owner))
            ->values();

        $types = ['application_update', 'job_recommendation', 'message_received', 'billing_notice'];
        $i = 0;

        while (UserNotification::count() < self::TARGET_NOTIFICATIONS) {
            $user = $users->get($i % $users->count());
            $type = $types[$i % count($types)];

            UserNotification::firstOrCreate(
                ['user_id' => $user->id, 'type' => $type, 'title' => 'Demo '.Str::headline($type).' #'.($i + 1)],
                [
                    'message' => 'Notifikasi demo untuk menguji inbox dan badge status.',
                    'data_json' => ['demo' => true, 'sequence' => $i + 1],
                    'is_read' => $i % 3 === 0,
                    'created_at' => now()->subHours($i + 1),
                    'updated_at' => now()->subHours($i + 1),
                ],
            );

            $i++;
        }
    }

    /**
     * @param  Collection<int, Company>  $companies
     */
    private function seedSubscriptions(Collection $companies): void
    {
        $plans = PricingPlan::query()->orderBy('id')->get();

        if ($plans->isEmpty()) {
            foreach ([
                ['Demo Starter', 'demo-starter', 0, 30],
                ['Demo Growth', 'demo-growth', 499000, 30],
                ['Demo Scale', 'demo-scale', 1499000, 30],
            ] as [$name, $slug, $price, $durationDays]) {
                PricingPlan::firstOrCreate(
                    ['slug' => $slug],
                    [
                        'name' => $name,
                        'price' => $price,
                        'duration_days' => $durationDays,
                        'active_jobs_limit' => 5,
                        'recruiter_seat_limit' => 2,
                        'ai_screening_quota' => 100,
                        'talent_search_quota' => 50,
                        'features_json' => ['demo data', 'ai screening', 'talent search'],
                        'is_active' => true,
                    ],
                );
            }

            $plans = PricingPlan::query()->orderBy('id')->get();
        }

        foreach ($companies->take(self::TARGET_SUBSCRIPTIONS) as $index => $company) {
            if (Subscription::count() >= self::TARGET_SUBSCRIPTIONS) {
                return;
            }

            Subscription::firstOrCreate(
                ['company_id' => $company->id, 'pricing_plan_id' => $plans->get($index % $plans->count())->id],
                [
                    'status' => collect(['active', 'past_due', 'cancelled'])->get($index),
                    'starts_at' => now()->subDays(20 + $index),
                    'ends_at' => now()->addDays(10 + ($index * 15)),
                    'renews_at' => $index === 0 ? now()->addDays(10) : null,
                ],
            );
        }
    }

    private function seedPayments(): void
    {
        $subscriptions = Subscription::query()->with(['company', 'plan'])->orderBy('id')->limit(self::TARGET_PAYMENTS)->get();

        foreach ($subscriptions as $index => $subscription) {
            Payment::firstOrCreate(
                ['provider_reference' => 'DEMO-PAY-'.$subscription->id],
                [
                    'company_id' => $subscription->company_id,
                    'subscription_id' => $subscription->id,
                    'amount' => $subscription->plan?->price ?? 499000,
                    'status' => collect(['paid', 'paid', 'pending'])->get($index, 'paid'),
                    'provider' => collect(['midtrans', 'xendit', 'manual'])->get($index % 3),
                    'paid_at' => $index < 2 ? now()->subDays($index + 1) : null,
                ],
            );
        }
    }

    /**
     * @param  Collection<int, CandidateProfile>  $candidates
     * @param  Collection<int, JobListing>  $jobs
     * @param  Collection<int, Company>  $companies
     */
    private function seedReports(Collection $candidates, Collection $jobs, Collection $companies): void
    {
        $statuses = ['open', 'under_review', 'resolved', 'dismissed', 'open'];
        $admin = User::query()->where('role', 'admin')->first();

        for ($i = 0; $i < self::TARGET_REPORTS; $i++) {
            if (Report::count() >= self::TARGET_REPORTS) {
                return;
            }

            $reportable = $i % 2 === 0 ? $jobs->get($i % $jobs->count()) : $companies->get($i % $companies->count());
            $reporter = $candidates->get($i % $candidates->count())?->user;

            if (! $reportable || ! $reporter) {
                continue;
            }

            Report::firstOrCreate(
                [
                    'reporter_id' => $reporter->id,
                    'reportable_type' => $reportable::class,
                    'reportable_id' => $reportable->id,
                    'reason' => collect(['spam', 'misleading_salary', 'suspicious_company', 'duplicate_job', 'inappropriate_content'])->get($i),
                ],
                [
                    'reporter_note' => 'Demo report for moderation workflow.',
                    'status' => $statuses[$i],
                    'reviewed_by' => in_array($statuses[$i], ['resolved', 'dismissed'], true) ? $admin?->id : null,
                    'reviewed_at' => in_array($statuses[$i], ['resolved', 'dismissed'], true) ? now()->subDays($i + 1) : null,
                    'admin_note' => in_array($statuses[$i], ['resolved', 'dismissed'], true) ? 'Demo moderation decision.' : null,
                ],
            );
        }
    }

    private function seedCareerResources(): void
    {
        foreach ([
            ['Cara Membuat CV ATS Friendly', 'article', 'CV & Portfolio'],
            ['Checklist Interview Pertama', 'checklist', 'Interview'],
            ['Negosiasi Gaji untuk Kandidat Tech', 'article', 'Salary'],
            ['Belajar Dasar Product Thinking', 'guide', 'Career Growth'],
            ['Template Follow Up Setelah Interview', 'template', 'Interview'],
            ['Panduan Remote Work untuk Fresh Graduate', 'guide', 'Work Mode'],
            ['Portofolio Data Analyst yang Menarik', 'article', 'Portfolio'],
            ['Menjawab Pertanyaan Behavioral', 'video', 'Interview'],
        ] as $index => [$title, $type, $category]) {
            if (CareerResource::count() >= self::TARGET_CAREER_RESOURCES) {
                return;
            }

            CareerResource::firstOrCreate(
                ['slug' => Str::slug($title)],
                [
                    'title' => $title,
                    'type' => $type,
                    'category' => $category,
                    'thumbnail_path' => '/storage/demo/career-resources/resource-'.($index + 1).'.jpg',
                    'content' => 'Konten demo Karivia untuk membantu kandidat mempersiapkan karier dan proses rekrutmen.',
                    'published_at' => now()->subDays($index + 1),
                ],
            );
        }
    }
}
