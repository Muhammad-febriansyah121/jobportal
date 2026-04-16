# Blueprint Flow dan Database Karivia Job Portal

Dokumen ini menjadi acuan awal untuk membangun aplikasi web job portal Karivia dengan 4 role utama:

- Admin
- Perusahaan
- Kandidat
- Mentor

Fokus produk Karivia adalah job portal terpercaya dengan AI matching, perusahaan terverifikasi, salary transparan, anti scam, tracker lamaran realtime, talent search, dan dukungan mentor karier.

## 1. Prinsip Produk

Karivia sebaiknya diposisikan sebagai trusted AI job marketplace dan lightweight ATS, bukan hanya list lowongan.

Untuk kandidat, Karivia harus terasa seperti tempat mencari kerja yang aman, personal, dan transparan.

Untuk perusahaan, Karivia harus terasa seperti alat rekrutmen yang membantu membuat lowongan, menyeleksi kandidat, mengelola pipeline, dan mengukur SLA recruiter.

Untuk mentor, Karivia menjadi ruang pendampingan karier berbasis data profil, skill gap, interview feedback, dan rekomendasi learning path.

Untuk admin, Karivia menjadi pusat kontrol trust, quality, subscription, verification, report, dan audit AI.

## 2. Role dan Hak Akses

### 2.1 Admin

Admin adalah tim internal platform.

Fitur utama:

- Dashboard platform
- Kelola user
- Kelola perusahaan
- Verifikasi perusahaan
- Verifikasi recruiter
- Moderasi lowongan
- Kelola laporan scam
- Kelola skill taxonomy
- Kelola industri
- Kelola salary insight
- Kelola pricing plan
- Kelola subscription
- Kelola mentor
- Audit output AI
- Lihat activity log
- Lihat analytics platform

### 2.2 Perusahaan

Perusahaan adalah employer atau recruiter.

Fitur utama:

- Dashboard employer
- Profil perusahaan
- Company verification
- Team member recruiter
- Buat dan kelola lowongan
- AI job integrity check
- Candidate pipeline
- AI shortlist recommendation
- Talent search
- Detail kandidat
- Internal recruiter notes
- Interview schedule
- Interview scorecard
- Subscription dan billing
- Analytics lowongan
- Response SLA monitor

Catatan penting:

Role perusahaan sebaiknya tidak hanya satu user. Gunakan struktur:

- `users.role = employer`
- `companies` untuk data perusahaan
- `company_members` untuk menghubungkan banyak user recruiter ke satu perusahaan
- role internal perusahaan: `owner`, `admin_hr`, `recruiter`, `viewer`

### 2.3 Kandidat

Kandidat adalah pencari kerja.

Fitur utama:

- Dashboard kandidat
- Profile completion meter
- Upload CV
- CV builder
- AI CV summary
- Rekomendasi lowongan personal
- Pencarian lowongan
- Detail lowongan
- Simpan lowongan
- Lamar lowongan
- Tracker status lamaran
- Jadwal interview
- AI interview simulator
- AI interview feedback
- Skill assessment
- Skill badges
- Career coach
- Rekomendasi karier
- Tips pengembangan karier

### 2.4 Mentor

Mentor adalah pembimbing karier.

Fitur utama:

- Dashboard mentor
- Daftar kandidat bimbingan
- Detail profil kandidat
- Skill gap kandidat
- Rekomendasi learning path
- Review CV
- Catatan mentoring
- Materi karier
- Progress kandidat
- Rekomendasi karier berbasis AI

## 3. Flow Public

### 3.1 Landing Page

Urutan section:

1. Top navigation
   - Lowongan
   - Perusahaan
   - Gaji
   - Sumber Karier
   - Pricing
   - Masuk
   - Daftar

2. Hero
   - Headline kuat tentang job portal terpercaya dengan AI matching
   - Search bar utama: posisi, skill, perusahaan, lokasi
   - CTA kandidat: Cari Kerja Sekarang
   - CTA perusahaan: Pasang Lowongan

3. Company terverifikasi
   - Logo perusahaan terverifikasi
   - Badge trust

4. Lowongan unggulan
   - Job card
   - Salary range
   - AI match teaser
   - Verified company badge

5. Keunggulan Karivia
   - Company terverifikasi
   - Salary transparan
   - AI matching
   - Anti scam
   - Status lamaran realtime

6. Cara kerja kandidat
   - Buat profil
   - Upload CV
   - Dapat rekomendasi AI
   - Lamar dan pantau status

7. Cara kerja perusahaan
   - Verifikasi perusahaan
   - Buat lowongan
   - Terima AI shortlist
   - Kelola pipeline

8. Pricing teaser
   - Starter
   - Growth
   - Enterprise

9. Footer lengkap
   - Produk
   - Untuk kandidat
   - Untuk perusahaan
   - Bantuan
   - Legal
   - Kontak

### 3.2 Flow Public ke Apply

Landing Page -> Cari Lowongan -> Halaman Pencarian Lowongan -> Detail Lowongan -> Masuk/Daftar -> Lamar Sekarang -> Tracker Lamaran

### 3.3 Flow Public ke Employer

Landing Page -> Pricing -> Daftar Perusahaan -> Buat Profil Perusahaan -> Verifikasi -> Pilih Paket -> Buat Lowongan

## 4. Flow Kandidat

### 4.1 Onboarding Kandidat

Daftar -> Pilih role Kandidat -> Isi profil dasar -> Pilih minat pekerjaan -> Pilih lokasi dan mode kerja -> Isi ekspektasi gaji -> Upload CV -> AI parsing CV -> Review hasil parsing -> Dashboard Kandidat

Data yang dikumpulkan:

- Nama lengkap
- Headline profesional
- Lokasi
- Mode kerja pilihan
- Ekspektasi gaji
- Industri minat
- Role minat
- Skill utama
- CV
- Link portfolio, GitHub, LinkedIn

### 4.2 Dashboard Kandidat

Komponen:

- Greeting personal
- Profile completion meter
- CV yang sudah diupload
- AI CV summary
- AI rekomendasi pekerjaan
- Lowongan tersimpan
- Lamaran saya
- Live application status tracker
- Jadwal interview
- Skill badges
- Saran assessment
- Tips pengembangan karier

### 4.3 Pencarian Lowongan Kandidat

Flow:

Dashboard Kandidat -> Rekomendasi Untuk Anda -> Cari Lowongan -> Filter -> Detail Lowongan -> Lamar/Simpan

Default setelah login:

- Tampilkan lowongan yang cocok dengan profil kandidat
- Sediakan tab "Semua Lowongan"
- Sediakan tab "Rekomendasi AI"
- Sediakan tab "Remote"
- Sediakan tab "Gaji Transparan"

Filter:

- Kata kunci
- Lokasi
- Remote, hybrid, onsite
- Kisaran gaji
- Level pengalaman
- Jenis pekerjaan
- Industri
- Company terverifikasi
- Skill match

AI natural language search:

Contoh input:

```text
backend developer Laravel remote gaji 15 juta
```

Output parser:

- role: Backend Developer
- skills: Laravel
- work_mode: remote
- salary_min: 15000000

### 4.4 Detail Lowongan Kandidat

Komponen:

- Judul posisi
- Nama perusahaan
- Salary range yang jelas
- Lokasi dan mode kerja
- Badge verifikasi perusahaan
- Job integrity score
- AI match score
- Penjelasan singkat AI match
- AI simulator interview
- Deskripsi pekerjaan
- Tanggung jawab
- Kualifikasi wajib
- Kualifikasi tambahan
- Daftar skill dibutuhkan
- Skill cocok
- Skill kurang
- Tahapan rekrutmen
- Estimasi waktu proses
- Recruiter response SLA
- Tombol Lamar Sekarang
- Tombol Simpan
- Lowongan serupa
- Rekomendasi karier

### 4.5 Lamaran Kandidat

Detail Lowongan -> Lamar Sekarang -> Pilih CV -> Jawab screening question -> Konfirmasi -> Submit -> Status "Terkirim"

Status:

- Terkirim
- Screening
- Shortlisted
- Interview
- Offering
- Diterima
- Ditolak
- Dibatalkan

### 4.6 AI Interview Kandidat

Undangan Interview -> Lobby AI Interview -> Sesi Wawancara AI -> Submit Jawaban -> AI Analysis -> Feedback -> Rekomendasi Belajar -> Career Coach

## 5. Flow Perusahaan

### 5.1 Onboarding Perusahaan

Daftar -> Pilih role Perusahaan -> Buat profil perusahaan -> Tambah legal document -> Verifikasi admin -> Pilih paket -> Dashboard Employer

Data yang dikumpulkan:

- Nama perusahaan
- Industri
- Ukuran perusahaan
- Website
- Deskripsi
- Logo
- Cover
- Kantor pusat
- Dokumen legal
- Data recruiter

### 5.2 Dashboard Employer

Komponen:

- Overview lowongan aktif
- Total pelamar masuk
- AI shortlist recommendation
- Candidate pipeline
- Applied
- Screened
- Shortlisted
- Interview
- Offer
- Hired
- Rejected
- Recruiter team activity
- Response SLA monitor
- Analytics lowongan
- Company verification status
- Subscription dan billing summary
- Tombol cepat:
  - Buat Lowongan
  - Cari Kandidat
  - Jadwalkan Interview

### 5.3 Buat Lowongan

Dashboard Employer -> Buat Lowongan -> Isi detail -> Tambah skill -> Tambah screening question -> AI integrity check -> Preview -> Publish

AI integrity check:

- Cek salary visible
- Cek deskripsi terlalu pendek
- Cek potensi scam keyword
- Cek perusahaan terverifikasi
- Cek kontak eksternal mencurigakan
- Cek kejelasan lokasi dan mode kerja

### 5.4 Pipeline Kandidat

Dashboard Employer -> Pipeline -> Pilih lowongan -> Lihat kandidat per status -> Buka detail kandidat -> Shortlist/Reject/Jadwalkan Interview

Status pipeline:

- Applied
- Screened
- Shortlisted
- Interview
- Offer
- Hired
- Rejected

### 5.5 Talent Search

Flow:

Dashboard Employer -> Cari Kandidat -> Semantic search -> Filter -> Candidate card -> Detail Kandidat -> Hubungi/Shortlist/Invite Interview

Filter:

- Skill
- Pengalaman
- Lokasi
- Ekspektasi gaji
- Industri
- Pendidikan
- Availability

Candidate card:

- Nama
- Headline profesional
- Skill utama
- Pengalaman
- Lokasi
- Expected salary
- AI fit score
- Badge skill terverifikasi
- Action:
  - Shortlist
  - Simpan
  - Hubungi
  - Invite Interview

### 5.6 Detail Kandidat untuk Recruiter

Komponen:

- Ringkasan CV hasil parsing AI
- AI fit score untuk lowongan tertentu
- Alasan kecocokan
- Skill gap
- Timeline pengalaman kerja
- Pendidikan
- Sertifikasi
- Portfolio, GitHub, LinkedIn
- Jawaban screening question
- Note internal recruiter
- Scorecard interview
- Rekomendasi pertanyaan interview
- Tombol aksi:
  - Shortlist
  - Reject
  - Request Assessment
  - Schedule Interview

## 6. Flow Admin

### 6.1 Dashboard Admin

Komponen:

- Total user
- Total perusahaan
- Total lowongan aktif
- Total lamaran
- Perusahaan menunggu verifikasi
- Lowongan perlu moderasi
- Laporan scam
- Subscription aktif
- AI usage
- Platform health

### 6.2 Verifikasi Perusahaan

Admin -> Verifikasi Perusahaan -> Detail submission -> Review dokumen -> Approve/Reject -> Kirim notifikasi

Keputusan:

- Approved
- Rejected
- Need revision

### 6.3 Moderasi Lowongan

Admin -> Lowongan -> Filter flagged -> Review job integrity score -> Publish/Suspend/Reject

### 6.4 Laporan Scam

Admin -> Reports -> Detail report -> Investigasi -> Suspend company/job/user -> Tutup laporan

## 7. Flow Mentor

### 7.1 Dashboard Mentor

Komponen:

- Kandidat bimbingan aktif
- Jadwal sesi
- Skill gap terbaru
- Rekomendasi learning path
- Materi karier
- Catatan terakhir

### 7.2 Detail Kandidat Mentor

Mentor -> Kandidat -> Detail profil -> Lihat CV summary -> Lihat skill gap -> Tambah catatan -> Rekomendasikan materi -> Update progress

## 8. Standar UI

### 8.1 Bahasa dan Visual

- Seluruh UI menggunakan Bahasa Indonesia.
- Font utama: Poppins.
- Light mode saja.
- Tidak perlu dark mode.
- Primary color: `#ED6A2F`.
- Desain bersih, kredibel, dan fokus ke trust.

### 8.2 Token Warna

```css
:root {
    --karivia-primary: #ED6A2F;
    --karivia-primary-hover: #d95b24;
    --karivia-primary-soft: #fff1eb;
    --karivia-ink: #111827;
    --karivia-muted: #64748b;
    --karivia-border: #e2e8f0;
    --karivia-background: #ffffff;
    --karivia-surface: #f8fafc;
}
```

### 8.3 Button Aksi

Semua button aksi wajib memakai icon dan teks.

Contoh:

- `PlusIcon` + `Buat Lowongan`
- `SearchIcon` + `Cari Kandidat`
- `SendIcon` + `Lamar Sekarang`
- `BookmarkIcon` + `Simpan`
- `CalendarIcon` + `Jadwalkan Interview`
- `CheckIcon` + `Shortlist`
- `XIcon` + `Tolak`
- `TrashIcon` + `Hapus`
- `EyeIcon` + `Lihat Detail`

### 8.4 Komponen shadcn/ui

Gunakan komponen:

- Button
- Card
- Badge
- Input
- Textarea
- Select
- Checkbox
- Radio Group
- Tabs
- Dialog
- Alert Dialog
- Dropdown Menu
- Table
- DataTable
- Skeleton
- Sonner
- Avatar
- Tooltip
- Progress
- Separator

### 8.5 Loading State

Gunakan Skeleton untuk:

- Job card loading
- Candidate card loading
- Table row loading
- Dashboard metric loading
- Profile header loading
- Detail page loading

Jangan gunakan halaman kosong saat data sedang load.

Contoh pola:

```tsx
import { Skeleton } from "@/components/ui/skeleton";

export function JobCardSkeleton() {
    return (
        <div className="rounded-lg border p-5">
            <div className="flex items-start gap-4">
                <Skeleton className="h-12 w-12 rounded-md" />
                <div className="flex-1 space-y-3">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-9 w-32 rounded-md" />
            </div>
        </div>
    );
}
```

### 8.6 DataTable

Semua list table menggunakan DataTable shadcn/ui dan TanStack Table.

Halaman yang wajib DataTable:

- Admin users
- Admin companies
- Admin jobs
- Admin reports
- Admin pricing
- Employer jobs
- Employer pipeline table
- Employer team members
- Employer billing
- Mentor candidates
- Candidate applications
- Candidate saved jobs jika mode table

Fitur DataTable:

- Server-side pagination
- Search
- Sort
- Filter
- Row action dropdown
- Empty state
- Skeleton rows

### 8.7 Sonner Notification

Gunakan Sonner untuk:

- Berhasil simpan data
- Berhasil publish lowongan
- Berhasil lamar kerja
- Gagal submit
- Berhasil shortlist kandidat
- Berhasil jadwalkan interview

Contoh pesan:

- "Lowongan berhasil dipublikasikan."
- "Lamaran berhasil dikirim."
- "Kandidat berhasil dipindahkan ke tahap interview."
- "Perusahaan berhasil diverifikasi."

### 8.8 Alert Dialog

Gunakan Alert Dialog untuk aksi penting:

- Hapus lowongan
- Tutup lowongan
- Reject kandidat
- Batalkan interview
- Hapus anggota recruiter
- Suspend perusahaan
- Hapus CV

Copy dialog harus jelas.

Contoh:

Judul: `Tutup lowongan ini?`

Deskripsi: `Lowongan tidak akan tampil lagi untuk kandidat. Data pelamar tetap tersimpan di pipeline.`

Button:

- Batal
- Ya, Tutup Lowongan

## 9. Strategi Data Loading Agar Tidak Lemot

### 9.1 Aturan Umum

- Semua halaman list wajib memakai pagination.
- Hindari `get()` untuk data besar.
- Gunakan `select()` untuk kolom yang dibutuhkan.
- Gunakan eager loading `with()`.
- Gunakan `withCount()` untuk jumlah data relasi.
- Gunakan `withExists()` untuk status boolean seperti saved/shortlisted.
- Gunakan `loadMissing()` di halaman detail.
- Gunakan cache untuk data master.
- Gunakan queue untuk proses berat.
- Gunakan search engine untuk pencarian kompleks.

### 9.2 Eager Loading Lowongan

```php
JobListing::query()
    ->select([
        'id',
        'company_id',
        'title',
        'slug',
        'location_city',
        'location_province',
        'work_mode',
        'job_type',
        'experience_level',
        'salary_min',
        'salary_max',
        'salary_currency',
        'is_salary_visible',
        'published_at',
    ])
    ->with([
        'company:id,name,slug,logo_url,is_verified,hq_city',
        'skills:id,name',
    ])
    ->withCount('applications')
    ->where('status', 'published')
    ->latest('published_at')
    ->paginate(15);
```

### 9.3 Eager Loading Detail Lowongan

```php
$job->loadMissing([
    'company:id,name,slug,logo_url,cover_url,description,is_verified,hq_city,industry_id',
    'company.industry:id,name',
    'skills:id,name,category',
    'screeningQuestions:id,job_listing_id,question,type,options_json,is_required',
]);
```

### 9.4 Eager Loading Dashboard Kandidat

```php
$candidate->loadMissing([
    'user:id,name,email',
    'skills:id,name,category',
    'primaryCv:id,candidate_id,file_url,is_primary,uploaded_at',
    'applications.jobListing:id,title,slug,company_id,work_mode,location_city',
    'applications.jobListing.company:id,name,logo_url,is_verified',
    'applications.latestStatusHistory',
    'recommendations.jobListing:id,title,slug,company_id,salary_min,salary_max,work_mode',
    'recommendations.jobListing.company:id,name,logo_url,is_verified',
]);
```

### 9.5 Eager Loading Pipeline Employer

```php
Application::query()
    ->select([
        'id',
        'job_listing_id',
        'candidate_id',
        'status',
        'ai_fit_score',
        'applied_at',
        'first_responded_at',
    ])
    ->with([
        'candidate:id,user_id,full_name,headline,profile_photo_url,location_city',
        'candidate.skills:id,name',
        'jobListing:id,title,company_id',
        'latestStatusHistory',
    ])
    ->whereHas('jobListing', fn ($query) => $query->where('company_id', $companyId))
    ->latest('applied_at')
    ->paginate(20);
```

### 9.6 Data Master Cache

Cache data:

- Skills
- Industries
- Pricing plans
- Work modes
- Job types
- Experience levels
- City list

Contoh:

```php
$skills = Cache::remember('skills:all', now()->addHours(12), function () {
    return Skill::query()
        ->select(['id', 'name', 'category'])
        ->orderBy('name')
        ->get();
});
```

### 9.7 Queue untuk Proses Berat

Gunakan queue untuk:

- Parse CV
- Generate AI CV summary
- Generate AI match score
- Generate recommendation
- Generate interview questions
- Generate interview analysis
- Update embedding
- Send notification
- Send email

Queue yang disarankan:

- `high`: notification, application status
- `ai`: AI jobs
- `default`: proses umum
- `low`: analytics aggregation

## 10. Rancangan Database

### 10.1 Auth dan Role

#### users

- id
- name
- email
- password
- role: admin, employer, candidate, mentor
- phone
- avatar_url
- is_active
- onboarding_completed_at
- email_verified_at
- remember_token
- created_at
- updated_at

#### admin_profiles

- id
- user_id
- name
- position
- created_at
- updated_at

#### mentor_profiles

- id
- user_id
- headline
- bio
- expertise_json
- rate
- availability_json
- is_verified
- created_at
- updated_at

### 10.2 Perusahaan

#### companies

- id
- owner_id
- industry_id
- name
- slug
- logo_url
- cover_url
- description
- company_size
- website
- hq_city
- hq_province
- address
- is_verified
- verification_status
- response_rate
- median_response_hours
- trust_score
- created_at
- updated_at

#### company_members

- id
- company_id
- user_id
- role: owner, admin_hr, recruiter, viewer
- is_active
- invited_at
- joined_at
- created_at
- updated_at

#### company_verifications

- id
- company_id
- submitted_by
- legal_name
- nib
- npwp
- document_url
- status: pending, approved, rejected, need_revision
- reviewed_by
- reviewed_at
- rejection_reason
- created_at
- updated_at

#### company_badges

- id
- company_id
- type
- label
- issued_at
- created_at
- updated_at

#### company_offices

- id
- company_id
- city
- province
- address
- lat
- lng
- created_at
- updated_at

#### company_reviews

- id
- company_id
- candidate_id
- rating
- title
- review
- status
- created_at
- updated_at

#### salary_insights

- id
- company_id
- industry_id
- job_title
- salary_min
- salary_median
- salary_max
- source_count
- created_at
- updated_at

### 10.3 Kandidat

#### candidate_profiles

- id
- user_id
- full_name
- headline
- bio
- location_city
- location_province
- expected_salary_min
- expected_salary_max
- work_mode_pref
- availability
- profile_completion
- ai_cv_summary
- linkedin_url
- github_url
- portfolio_url
- created_at
- updated_at

#### candidate_cvs

- id
- candidate_id
- file_url
- parsed_json
- source
- is_primary
- uploaded_at
- created_at
- updated_at

#### candidate_experiences

- id
- candidate_id
- company_name
- job_title
- start_date
- end_date
- is_current
- description
- location
- created_at
- updated_at

#### candidate_educations

- id
- candidate_id
- institution
- degree
- field_of_study
- start_year
- end_year
- gpa
- created_at
- updated_at

#### candidate_certifications

- id
- candidate_id
- name
- issuing_org
- issue_date
- credential_url
- created_at
- updated_at

#### skills

- id
- name
- slug
- category
- created_at
- updated_at

#### candidate_skill

- candidate_id
- skill_id
- years_exp
- proficiency
- verified_at
- created_at
- updated_at

#### skill_assessments

- id
- candidate_id
- skill_id
- score
- max_score
- passed
- questions_json
- completed_at
- created_at
- updated_at

### 10.4 Lowongan

#### industries

- id
- name
- slug
- created_at
- updated_at

#### job_listings

- id
- company_id
- created_by
- industry_id
- title
- slug
- description
- responsibilities
- required_qualifications
- preferred_qualifications
- location_city
- location_province
- work_mode: remote, hybrid, onsite
- job_type: full_time, part_time, contract, internship, freelance
- experience_level: entry, mid, senior, lead, manager
- salary_min
- salary_max
- salary_currency
- is_salary_visible
- status: draft, pending_review, published, closed, suspended, rejected
- integrity_score
- response_sla_hours
- published_at
- closes_at
- created_at
- updated_at

#### job_listing_skill

- job_listing_id
- skill_id
- is_required
- min_years
- created_at
- updated_at

#### job_screening_questions

- id
- job_listing_id
- question
- type
- options_json
- is_required
- created_at
- updated_at

#### saved_jobs

- id
- candidate_id
- job_listing_id
- created_at
- updated_at

#### job_listing_analytics

- id
- job_listing_id
- views_count
- apply_clicks_count
- saves_count
- date
- created_at
- updated_at

### 10.5 Lamaran dan Pipeline

#### applications

- id
- job_listing_id
- candidate_id
- candidate_cv_id
- status: applied, screened, shortlisted, interview, offer, hired, rejected, withdrawn
- cover_letter
- ai_fit_score
- ai_skill_match
- applied_at
- first_responded_at
- created_at
- updated_at

#### application_status_histories

- id
- application_id
- from_status
- to_status
- changed_by
- note
- created_at
- updated_at

### 10.6 AI dan Matching

#### ai_match_scores

- id
- job_listing_id
- candidate_id
- overall_score
- skill_score
- experience_score
- location_score
- salary_score
- industry_score
- matched_skills
- missing_skills
- explanation
- model_name
- scoring_version
- computed_at
- created_at
- updated_at

#### ai_recommendations

- id
- candidate_id
- job_listing_id
- score
- reason
- was_clicked
- was_applied
- created_at
- updated_at

#### embeddings

- id
- owner_type
- owner_id
- content_type
- embedding
- model_name
- updated_at
- created_at

#### ai_audit_logs

- id
- user_id
- feature
- input_hash
- output_json
- model_name
- status
- created_at
- updated_at

### 10.7 Interview

#### interviews

- id
- application_id
- scheduled_by
- scheduled_at
- mode
- location_url
- status
- created_at
- updated_at

#### interview_participants

- id
- interview_id
- user_id
- role
- created_at
- updated_at

#### interview_scorecards

- id
- interview_id
- reviewer_id
- overall_score
- criteria_scores
- notes
- created_at
- updated_at

#### ai_interview_sessions

- id
- application_id
- candidate_id
- status
- started_at
- completed_at
- created_at
- updated_at

#### ai_interview_questions

- id
- application_id
- question
- category
- order_number
- created_at
- updated_at

#### ai_interview_responses

- id
- session_id
- question_id
- answer_text
- ai_score
- ai_analysis
- created_at
- updated_at

#### ai_interview_analyses

- id
- session_id
- fit_score
- recommendation
- summary
- strengths
- weaknesses
- technical_scorecard
- created_at
- updated_at

### 10.8 Mentor dan Karier

#### mentor_mentees

- id
- mentor_id
- candidate_id
- status
- started_at
- ended_at
- created_at
- updated_at

#### ai_career_coaching_sessions

- id
- candidate_id
- title
- status
- created_at
- updated_at

#### ai_career_coaching_messages

- id
- session_id
- role
- content
- created_at
- updated_at

#### ai_career_recommendations

- id
- candidate_id
- coaching_session_id
- title
- match_score
- recommendation_json
- created_at
- updated_at

#### learning_path_steps

- id
- career_recommendation_id
- title
- description
- order_number
- status
- created_at
- updated_at

#### career_resources

- id
- title
- slug
- type
- category
- content
- published_at
- created_at
- updated_at

### 10.9 Billing, Notifikasi, Chat, Report

#### pricing_plans

- id
- name
- slug
- price
- active_jobs_limit
- recruiter_seat_limit
- ai_screening_quota
- talent_search_quota
- features_json
- is_active
- created_at
- updated_at

#### subscriptions

- id
- company_id
- pricing_plan_id
- status
- starts_at
- ends_at
- renews_at
- created_at
- updated_at

#### payments

- id
- company_id
- subscription_id
- amount
- status
- provider
- provider_reference
- paid_at
- created_at
- updated_at

#### conversations

- id
- company_id
- candidate_id
- application_id
- last_message_at
- created_at
- updated_at

#### messages

- id
- conversation_id
- sender_id
- body
- attachment_url
- read_at
- created_at
- updated_at

#### notifications

- id
- user_id
- type
- title
- message
- data_json
- is_read
- created_at
- updated_at

#### reports

- id
- reporter_id
- reportable_type
- reportable_id
- reason
- status
- reviewed_by
- reviewed_at
- created_at
- updated_at

#### activity_logs

- id
- actor_id
- action
- subject_type
- subject_id
- properties_json
- created_at
- updated_at

## 11. Index Database Penting

Tambahkan index untuk performa:

```text
users(role)
users(email)
companies(slug)
companies(verification_status)
companies(is_verified)
company_members(user_id, company_id)
job_listings(status, published_at)
job_listings(company_id, status)
job_listings(industry_id, work_mode, job_type)
applications(job_listing_id, status)
applications(candidate_id, status)
ai_match_scores(candidate_id, overall_score)
ai_match_scores(job_listing_id, overall_score)
saved_jobs(candidate_id, job_listing_id) unique
embeddings(owner_type, owner_id, content_type)
notifications(user_id, is_read)
reports(status)
```

Jika memakai PostgreSQL dan pgvector:

```text
embeddings(embedding) vector index
```

## 12. Stack yang Disarankan

Core:

- Laravel
- Inertia.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- PostgreSQL
- Redis
- Laravel Queue
- Laravel Horizon
- Laravel Reverb

Search:

- Laravel Scout
- Meilisearch
- PostgreSQL pgvector untuk semantic search

AI:

- AI service abstraction
- Structured output untuk parser JSON
- Embedding untuk matching
- Queue untuk semua proses AI berat
- Audit log untuk output AI

Storage:

- S3 compatible storage untuk CV, logo, cover, dokumen legal

Notification:

- Database notification
- Email notification
- Realtime notification via Reverb
- Sonner untuk toast di frontend

## 13. Prioritas Implementasi

### Phase 1: MVP Marketplace

- Auth 4 role
- Landing page
- Job search
- Job detail
- Company profile
- Candidate profile
- Upload CV
- Apply job
- Saved jobs
- Application tracker
- Employer job CRUD
- Basic pipeline
- Admin verification

### Phase 2: AI Matching

- AI CV summary
- AI natural language search parser
- AI match score
- Personalized job recommendation
- AI shortlist
- Skill gap

### Phase 3: SaaS Employer

- Pricing plan
- Subscription
- Billing summary
- Recruiter team
- Talent search
- Analytics lowongan
- Response SLA monitor

### Phase 4: Advanced AI dan Mentor

- AI interview simulator
- AI interview analysis
- Career coach
- Mentor dashboard
- Learning path
- Assessment
- Candidate comparison

## 14. Aturan Copywriting UI

Gunakan bahasa Indonesia yang jelas dan profesional.

Contoh label:

- Cari Lowongan
- Cari Kandidat
- Lamar Sekarang
- Simpan Lowongan
- Buat Lowongan
- Publikasikan
- Tutup Lowongan
- Jadwalkan Interview
- Pindahkan Tahap
- Tolak Kandidat
- Shortlist
- Hubungi Kandidat
- Verifikasi Perusahaan
- Setujui
- Minta Revisi

Hindari istilah terlalu teknis untuk kandidat. Gunakan istilah teknis hanya di dashboard employer/admin jika memang perlu.

## 15. Catatan Penting

- Semua fitur trust seperti verified company, salary disclosed, anti scam, dan job integrity score harus punya data pendukung di database.
- AI score harus selalu punya explanation agar user percaya.
- Semua proses AI yang berat harus asynchronous lewat queue.
- Semua list besar harus pagination dan eager loading.
- Semua aksi destruktif harus memakai Alert Dialog.
- Semua feedback sukses/gagal harus memakai Sonner.
- Semua list table admin dan employer harus memakai DataTable.
- Semua loading state harus memakai Skeleton.
- UI hanya light mode dengan warna utama `#ED6A2F`.
