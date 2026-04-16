# Urutan Pembuatan Fitur Karivia

Dokumen ini mengurutkan fitur Karivia dari yang paling mudah dan paling aman dibuat dulu, lalu bertahap ke fitur yang lebih kompleks. Tujuannya agar development tidak langsung lompat ke AI, pipeline rumit, atau billing sebelum fondasi produk stabil.

Prioritas dibuat berdasarkan:

- Dampak ke produk
- Tingkat kesulitan
- Ketergantungan ke fitur lain
- Risiko bug
- Kebutuhan data dan relasi database

Legenda:

- Mudah: bisa dibuat cepat, dependency rendah.
- Sedang: perlu relasi data, validasi, dan UI lebih matang.
- Sulit: perlu banyak workflow, background job, realtime, billing, atau AI.

## 1. Fondasi UI dan Konfigurasi Dasar

Bagian ini dikerjakan paling awal karena semua halaman akan memakai fondasi yang sama.

### 1.1 Setup Bahasa, Font, dan Theme

Kesulitan: Mudah

Checklist:

- [ ] Set seluruh UI ke Bahasa Indonesia.
- [ ] Tambahkan font Poppins.
- [ ] Gunakan light mode saja.
- [ ] Hilangkan dark mode toggle jika ada.
- [ ] Set primary color `#ED6A2F`.
- [ ] Buat token warna global untuk primary, hover, soft background, border, text, muted.

Output:

- UI konsisten sejak awal.
- Semua halaman baru mengikuti warna dan font yang sama.

### 1.2 Setup Komponen shadcn/ui Dasar

Kesulitan: Mudah

Checklist:

- [ ] Button
- [ ] Card
- [ ] Badge
- [ ] Input
- [ ] Textarea
- [ ] Select
- [ ] Checkbox
- [ ] Tabs
- [ ] Dropdown Menu
- [ ] Dialog
- [ ] Alert Dialog
- [ ] Skeleton
- [ ] Sonner
- [ ] Table
- [ ] DataTable

Output:

- Komponen siap dipakai ulang.
- UI tidak dibuat manual berulang-ulang.

### 1.3 Layout Public, Auth, Dashboard

Kesulitan: Mudah

Checklist:

- [ ] Public layout untuk landing, job search, detail lowongan, pricing.
- [ ] Auth layout untuk login/register.
- [ ] Candidate layout dengan sidebar.
- [ ] Employer layout dengan sidebar.
- [ ] Admin layout dengan sidebar.
- [ ] Mentor layout dengan sidebar.
- [ ] Header profile menu.
- [ ] Notification bell placeholder.

Output:

- Semua role punya kerangka navigasi.

### 1.4 Standar Button Aksi

Kesulitan: Mudah

Checklist:

- [ ] Semua button aksi memakai icon + teks.
- [ ] Buat reusable action button jika perlu.
- [ ] Standarkan label:
  - Cari
  - Simpan
  - Lamar Sekarang
  - Buat Lowongan
  - Publikasikan
  - Edit
  - Hapus
  - Lihat Detail
  - Jadwalkan Interview
  - Shortlist
  - Tolak

Output:

- Aksi lebih jelas dan UI lebih profesional.

### 1.5 Loading Skeleton

Kesulitan: Mudah

Checklist:

- [ ] Job card skeleton.
- [ ] Candidate card skeleton.
- [ ] Dashboard metric skeleton.
- [ ] Table row skeleton.
- [ ] Profile header skeleton.
- [ ] Detail page skeleton.

Output:

- Halaman tidak terlihat kosong saat loading.

## 2. Auth dan Role

Bagian ini dibuat sebelum fitur per role, karena seluruh akses halaman bergantung pada role.

### 2.1 Role User

Kesulitan: Mudah

Checklist:

- [ ] Tambahkan role: `admin`, `employer`, `candidate`, `mentor`.
- [ ] Pastikan register bisa memilih role kandidat atau perusahaan.
- [ ] Admin dibuat lewat seeder.
- [ ] Mentor dibuat lewat admin atau seeder awal.
- [ ] Redirect login berdasarkan role.

Output:

- User masuk ke dashboard sesuai role.

### 2.2 Middleware Role

Kesulitan: Mudah

Checklist:

- [ ] Middleware candidate.
- [ ] Middleware employer.
- [ ] Middleware admin.
- [ ] Middleware mentor.
- [ ] Proteksi route per role.

Output:

- User tidak bisa mengakses dashboard role lain.

### 2.3 Halaman Dashboard Kosong per Role

Kesulitan: Mudah

Checklist:

- [ ] Dashboard Kandidat placeholder.
- [ ] Dashboard Perusahaan placeholder.
- [ ] Dashboard Admin placeholder.
- [ ] Dashboard Mentor placeholder.

Output:

- Struktur aplikasi sudah bisa dinavigasi.

## 3. Master Data Admin

Fitur ini relatif mudah karena mayoritas berupa CRUD dan DataTable.

### 3.1 CRUD Skill

Kesulitan: Mudah

Checklist:

- [ ] List skill dengan DataTable.
- [ ] Tambah skill.
- [ ] Edit skill.
- [ ] Hapus skill dengan Alert Dialog.
- [ ] Sonner untuk sukses/gagal.
- [ ] Cache skill list.

Output:

- Data skill siap dipakai kandidat, lowongan, dan matching.

### 3.2 CRUD Industri

Kesulitan: Mudah

Checklist:

- [ ] List industri dengan DataTable.
- [ ] Tambah industri.
- [ ] Edit industri.
- [ ] Hapus industri dengan Alert Dialog.
- [ ] Cache industri.

Output:

- Data industri siap dipakai perusahaan dan lowongan.

### 3.3 CRUD Pricing Plan

Kesulitan: Mudah

Checklist:

- [ ] List pricing plan dengan DataTable.
- [ ] Tambah plan.
- [ ] Edit plan.
- [ ] Aktif/nonaktif plan.
- [ ] Field limit: jumlah lowongan, recruiter seat, AI quota, talent search quota.

Output:

- Halaman pricing bisa mengambil data dari database.

### 3.4 CRUD Career Resource

Kesulitan: Mudah

Checklist:

- [ ] List artikel/materi karier.
- [ ] Tambah resource.
- [ ] Edit resource.
- [ ] Publish/unpublish.
- [ ] Hapus dengan Alert Dialog.

Output:

- Kandidat dan mentor punya konten karier dasar.

## 4. Public Pages

Public pages dibuat setelah layout dan master data siap.

### 4.1 Landing Page

Kesulitan: Mudah

Checklist:

- [ ] Hero dengan search bar.
- [ ] CTA kandidat.
- [ ] CTA perusahaan.
- [ ] Section perusahaan terverifikasi.
- [ ] Section lowongan unggulan.
- [ ] Section keunggulan Karivia.
- [ ] Cara kerja kandidat.
- [ ] Cara kerja perusahaan.
- [ ] Pricing teaser.
- [ ] Footer lengkap.

Output:

- Produk bisa dipresentasikan secara publik.

### 4.2 Pricing Public

Kesulitan: Mudah

Checklist:

- [ ] Ambil pricing plan aktif dari database.
- [ ] Tampilkan Starter, Growth, Enterprise.
- [ ] CTA daftar perusahaan.
- [ ] Tabel perbandingan fitur.

Output:

- Perusahaan bisa melihat paket.

### 4.3 Halaman Tentang dan Legal

Kesulitan: Mudah

Checklist:

- [ ] Tentang Karivia.
- [ ] Kebijakan Privasi.
- [ ] Syarat dan Ketentuan.
- [ ] Bantuan.

Output:

- Platform terlihat lebih kredibel.

## 5. Profil Kandidat

Profil kandidat dibuat sebelum apply dan AI recommendation.

### 5.1 Candidate Profile Form

Kesulitan: Sedang

Checklist:

- [ ] Data dasar kandidat.
- [ ] Headline profesional.
- [ ] Bio.
- [ ] Lokasi.
- [ ] Preferensi mode kerja.
- [ ] Ekspektasi gaji.
- [ ] Link LinkedIn, GitHub, portfolio.
- [ ] Profile completion meter.

Output:

- Kandidat punya profil dasar.

### 5.2 Candidate Skill

Kesulitan: Sedang

Checklist:

- [ ] Tambah skill kandidat.
- [ ] Pilih skill dari master data.
- [ ] Isi tahun pengalaman.
- [ ] Isi proficiency.
- [ ] Hapus skill.

Output:

- Data skill kandidat siap dipakai matching.

### 5.3 Experience, Education, Certification

Kesulitan: Sedang

Checklist:

- [ ] CRUD pengalaman kerja.
- [ ] CRUD pendidikan.
- [ ] CRUD sertifikasi.
- [ ] Gunakan Dialog untuk form kecil.
- [ ] Gunakan Alert Dialog untuk hapus.

Output:

- Profil kandidat mulai lengkap.

### 5.4 Upload CV

Kesulitan: Sedang

Checklist:

- [ ] Upload PDF/DOC.
- [ ] Simpan file ke storage.
- [ ] Set CV utama.
- [ ] Hapus CV dengan Alert Dialog.
- [ ] Tampilkan CV aktif di dashboard.

Output:

- Kandidat bisa melamar menggunakan CV.

## 6. Profil Perusahaan

Profil perusahaan dibuat sebelum employer bisa publish lowongan.

### 6.1 Company Profile Form

Kesulitan: Sedang

Checklist:

- [ ] Nama perusahaan.
- [ ] Slug perusahaan.
- [ ] Logo.
- [ ] Cover.
- [ ] Deskripsi.
- [ ] Industri.
- [ ] Ukuran perusahaan.
- [ ] Website.
- [ ] Lokasi kantor pusat.

Output:

- Halaman profil perusahaan bisa dibuat.

### 6.2 Company Team Member

Kesulitan: Sedang

Checklist:

- [ ] List anggota dengan DataTable.
- [ ] Invite recruiter.
- [ ] Ubah role internal.
- [ ] Nonaktifkan anggota.
- [ ] Hapus anggota dengan Alert Dialog.

Output:

- Satu perusahaan bisa punya banyak recruiter.

### 6.3 Company Verification

Kesulitan: Sedang

Checklist:

- [ ] Upload dokumen legal.
- [ ] Submit verifikasi.
- [ ] Status pending, approved, rejected, need revision.
- [ ] Admin review submission.
- [ ] Sonner untuk feedback.

Output:

- Badge verified punya dasar data.

## 7. Lowongan

Setelah kandidat dan perusahaan ada, fitur lowongan mulai dibuat.

### 7.1 Employer Job CRUD

Kesulitan: Sedang

Checklist:

- [ ] List lowongan perusahaan dengan DataTable.
- [ ] Buat lowongan.
- [ ] Edit lowongan.
- [ ] Preview lowongan.
- [ ] Publish lowongan.
- [ ] Tutup lowongan dengan Alert Dialog.
- [ ] Hapus draft dengan Alert Dialog.

Output:

- Perusahaan bisa mengelola lowongan.

### 7.2 Job Skill dan Screening Question

Kesulitan: Sedang

Checklist:

- [ ] Tambah skill wajib.
- [ ] Tambah skill tambahan.
- [ ] Tambah minimal tahun pengalaman.
- [ ] Tambah screening question.
- [ ] Tipe pertanyaan: text, multiple choice, yes/no.

Output:

- Lowongan punya data cukup untuk matching dan apply.

### 7.3 Public Job Search

Kesulitan: Sedang

Checklist:

- [ ] Search bar.
- [ ] Filter lokasi.
- [ ] Filter work mode.
- [ ] Filter salary.
- [ ] Filter experience level.
- [ ] Filter job type.
- [ ] Filter industry.
- [ ] Filter company verified.
- [ ] Pagination.
- [ ] Skeleton job card.
- [ ] Eager loading company dan skills.

Output:

- Kandidat bisa mencari lowongan.

### 7.4 Job Detail

Kesulitan: Sedang

Checklist:

- [ ] Header lowongan.
- [ ] Salary range.
- [ ] Badge company verified.
- [ ] Job integrity score.
- [ ] Deskripsi pekerjaan.
- [ ] Tanggung jawab.
- [ ] Kualifikasi wajib.
- [ ] Kualifikasi tambahan.
- [ ] Skill dibutuhkan.
- [ ] Tahapan rekrutmen.
- [ ] Tombol Lamar Sekarang.
- [ ] Tombol Simpan.
- [ ] Lowongan serupa.

Output:

- Lowongan bisa dilihat detail dan siap dilamar.

## 8. Apply, Saved Job, dan Tracker Lamaran

Fitur ini menjadi MVP utama kandidat.

### 8.1 Saved Job

Kesulitan: Mudah

Checklist:

- [ ] Simpan lowongan.
- [ ] Hapus dari simpanan.
- [ ] List lowongan tersimpan.
- [ ] Sonner sukses/gagal.

Output:

- Kandidat bisa menyimpan lowongan.

### 8.2 Apply Job

Kesulitan: Sedang

Checklist:

- [ ] Pilih CV.
- [ ] Isi cover letter opsional.
- [ ] Jawab screening question.
- [ ] Validasi belum pernah apply.
- [ ] Submit lamaran.
- [ ] Sonner berhasil.
- [ ] Notifikasi ke employer.

Output:

- Kandidat bisa melamar.

### 8.3 Application Tracker Kandidat

Kesulitan: Sedang

Checklist:

- [ ] List lamaran kandidat.
- [ ] Status tracker.
- [ ] Detail history status.
- [ ] Filter status.
- [ ] DataTable atau card list.
- [ ] Eager loading job dan company.

Output:

- Kandidat bisa memantau lamaran.

### 8.4 Pipeline Employer Dasar

Kesulitan: Sedang

Checklist:

- [ ] List pelamar per lowongan.
- [ ] Filter status.
- [ ] Pindahkan status kandidat.
- [ ] Reject kandidat dengan Alert Dialog.
- [ ] Shortlist kandidat.
- [ ] Catat status history.
- [ ] Notifikasi ke kandidat.

Output:

- Employer bisa mengelola pelamar.

## 9. Dashboard Ringan

Dashboard dibuat setelah data utama mulai tersedia.

### 9.1 Dashboard Kandidat

Kesulitan: Sedang

Checklist:

- [ ] Greeting personal.
- [ ] Profile completion meter.
- [ ] CV aktif.
- [ ] Ringkasan profil.
- [ ] Rekomendasi lowongan sederhana.
- [ ] Lowongan tersimpan.
- [ ] Lamaran aktif.
- [ ] Jadwal interview placeholder.
- [ ] Tips karier.

Output:

- Kandidat punya home base.

### 9.2 Dashboard Employer

Kesulitan: Sedang

Checklist:

- [ ] Lowongan aktif.
- [ ] Total pelamar.
- [ ] Rata-rata response time.
- [ ] Pipeline ringkas.
- [ ] Kandidat terbaru.
- [ ] Company verification status.
- [ ] Subscription summary placeholder.
- [ ] Quick actions.

Output:

- Employer punya home base.

### 9.3 Dashboard Admin

Kesulitan: Sedang

Checklist:

- [ ] Total user.
- [ ] Total perusahaan.
- [ ] Total lowongan.
- [ ] Total lamaran.
- [ ] Verifikasi pending.
- [ ] Report pending.
- [ ] Subscription aktif.

Output:

- Admin bisa memantau platform.

### 9.4 Dashboard Mentor

Kesulitan: Sedang

Checklist:

- [ ] Kandidat bimbingan.
- [ ] Jadwal sesi placeholder.
- [ ] Catatan terbaru.
- [ ] Career resource terbaru.

Output:

- Mentor punya home base.

## 10. Notifikasi dan Pesan

Dibuat setelah apply dan pipeline berjalan.

### 10.1 Notification Center

Kesulitan: Sedang

Checklist:

- [ ] Simpan notifikasi database.
- [ ] Notification bell.
- [ ] Mark as read.
- [ ] Mark all as read.
- [ ] Sonner untuk event langsung.

Output:

- User tahu perubahan status penting.

### 10.2 Conversation dan Message Dasar

Kesulitan: Sedang

Checklist:

- [ ] Conversation kandidat dan perusahaan.
- [ ] Kirim pesan.
- [ ] List pesan.
- [ ] Read status.
- [ ] Attachment opsional.

Output:

- Kandidat dan recruiter bisa berkomunikasi.

## 11. Admin Trust dan Moderasi

Setelah marketplace dasar jalan, kuatkan trust.

### 11.1 Admin Company Verification

Kesulitan: Sedang

Checklist:

- [ ] DataTable submission.
- [ ] Detail dokumen.
- [ ] Approve.
- [ ] Reject.
- [ ] Need revision.
- [ ] Kirim notifikasi.

Output:

- Perusahaan verified bisa dipercaya.

### 11.2 Admin Job Moderation

Kesulitan: Sedang

Checklist:

- [ ] List lowongan flagged.
- [ ] Review integrity score manual.
- [ ] Suspend lowongan.
- [ ] Reject lowongan.
- [ ] Publish lowongan.

Output:

- Lowongan scam bisa dikontrol.

### 11.3 Report System

Kesulitan: Sedang

Checklist:

- [ ] Kandidat report lowongan.
- [ ] Employer report kandidat.
- [ ] Admin review report.
- [ ] Update status report.
- [ ] Suspend subject jika perlu.

Output:

- Anti scam punya alur operasional.

## 12. Talent Search Employer

Talent search dibuat setelah data kandidat cukup lengkap.

### 12.1 Talent Search Basic

Kesulitan: Sedang

Checklist:

- [ ] Search kandidat.
- [ ] Filter skill.
- [ ] Filter pengalaman.
- [ ] Filter lokasi.
- [ ] Filter expected salary.
- [ ] Filter availability.
- [ ] Candidate card.
- [ ] Pagination.
- [ ] Eager loading skills dan user.

Output:

- Employer bisa mencari kandidat.

### 12.2 Saved Candidate

Kesulitan: Mudah

Checklist:

- [ ] Simpan kandidat.
- [ ] Hapus kandidat tersimpan.
- [ ] List kandidat tersimpan.
- [ ] Sonner.

Output:

- Employer bisa membuat talent pool.

### 12.3 Detail Kandidat untuk Recruiter

Kesulitan: Sedang

Checklist:

- [ ] Header kandidat.
- [ ] Summary profil.
- [ ] Skill.
- [ ] Pengalaman.
- [ ] Pendidikan.
- [ ] Sertifikasi.
- [ ] Link portfolio.
- [ ] Internal note.
- [ ] Action: shortlist, hubungi, jadwalkan interview.

Output:

- Recruiter punya halaman detail kandidat.

## 13. Interview Scheduling

Mulai masuk fitur workflow yang lebih kompleks.

### 13.1 Jadwalkan Interview Manual

Kesulitan: Sedang

Checklist:

- [ ] Pilih kandidat.
- [ ] Pilih lowongan.
- [ ] Pilih tanggal dan jam.
- [ ] Pilih mode interview.
- [ ] Isi link meeting/lokasi.
- [ ] Kirim undangan.
- [ ] Kandidat bisa konfirmasi atau tolak.

Output:

- Interview bisa dijadwalkan manual.

### 13.2 Interview Scorecard

Kesulitan: Sedang

Checklist:

- [ ] Form scorecard.
- [ ] Criteria scores.
- [ ] Overall score.
- [ ] Notes.
- [ ] Simpan scorecard.

Output:

- Recruiter bisa menilai interview.

## 14. AI Ringan

AI dibuat setelah data utama stabil. Mulai dari AI yang tidak terlalu berisiko.

### 14.1 AI CV Summary

Kesulitan: Sedang

Checklist:

- [ ] Ambil data profil dan CV.
- [ ] Generate summary lewat queue.
- [ ] Simpan ke candidate profile.
- [ ] Tampilkan di dashboard kandidat.
- [ ] Tampilkan di detail kandidat recruiter.

Output:

- Profil kandidat terasa lebih pintar.

### 14.2 AI Natural Language Search Parser

Kesulitan: Sedang

Checklist:

- [ ] Parse query lowongan.
- [ ] Parse query talent search.
- [ ] Structured JSON output.
- [ ] Fallback jika AI gagal.
- [ ] Cache hasil parsing.

Output:

- Search natural language mulai berjalan.

### 14.3 AI Job Integrity Score

Kesulitan: Sedang

Checklist:

- [ ] Cek kelengkapan lowongan.
- [ ] Cek salary transparency.
- [ ] Cek keyword mencurigakan.
- [ ] Cek status verified company.
- [ ] Simpan integrity score.
- [ ] Tampilkan score di detail lowongan.

Output:

- Trust lowongan lebih kuat.

## 15. AI Matching dan Recommendation

Fitur ini lebih sulit karena butuh scoring, queue, dan data yang rapi.

### 15.1 Rule-based Match Score

Kesulitan: Sedang

Checklist:

- [ ] Cocokkan skill kandidat dan job.
- [ ] Cocokkan pengalaman.
- [ ] Cocokkan lokasi.
- [ ] Cocokkan mode kerja.
- [ ] Cocokkan salary expectation.
- [ ] Simpan ke `ai_match_scores`.

Output:

- Match score pertama bisa dibuat tanpa semantic search.

### 15.2 Personalized Job Recommendation

Kesulitan: Sedang

Checklist:

- [ ] Ambil top match score kandidat.
- [ ] Filter lowongan aktif.
- [ ] Hindari lowongan yang sudah dilamar.
- [ ] Simpan ke `ai_recommendations`.
- [ ] Tampilkan di dashboard kandidat.

Output:

- Kandidat mendapat lowongan personal.

### 15.3 AI Fit Explanation

Kesulitan: Sulit

Checklist:

- [ ] Generate explanation dari data match.
- [ ] Jelaskan skill cocok.
- [ ] Jelaskan skill kurang.
- [ ] Jelaskan alasan rekomendasi.
- [ ] Simpan explanation.

Output:

- AI score lebih transparan.

### 15.4 Embedding dan Semantic Search

Kesulitan: Sulit

Checklist:

- [ ] Buat tabel embeddings.
- [ ] Generate embedding untuk lowongan.
- [ ] Generate embedding untuk kandidat.
- [ ] Simpan vector.
- [ ] Query semantic similarity.
- [ ] Gabungkan dengan filter biasa.

Output:

- Search dan matching terasa lebih pintar.

## 16. AI Interview

AI interview dibuat belakangan karena workflow panjang dan perlu audit.

### 16.1 Generate Interview Questions

Kesulitan: Sulit

Checklist:

- [ ] Generate pertanyaan dari lowongan dan profil kandidat.
- [ ] Simpan pertanyaan.
- [ ] Queue job.
- [ ] Fallback pertanyaan default.

Output:

- Kandidat bisa mendapat interview simulator.

### 16.2 AI Interview Session

Kesulitan: Sulit

Checklist:

- [ ] Lobby interview.
- [ ] Session start.
- [ ] Tampilkan pertanyaan satu per satu.
- [ ] Simpan jawaban.
- [ ] Complete session.

Output:

- Kandidat bisa menjalankan sesi interview.

### 16.3 AI Interview Analysis

Kesulitan: Sulit

Checklist:

- [ ] Analisis jawaban.
- [ ] Score per kategori.
- [ ] Summary.
- [ ] Strength.
- [ ] Improvement.
- [ ] Recommendation.
- [ ] Tampilkan feedback kandidat.
- [ ] Tampilkan analysis employer.

Output:

- Interview AI punya nilai produk yang kuat.

## 17. Mentor dan Career Coach

Mentor dibuat setelah kandidat punya profil, skill, assessment, dan feedback.

### 17.1 Mentor Candidate List

Kesulitan: Sedang

Checklist:

- [ ] Mentor melihat kandidat bimbingan.
- [ ] Filter kandidat.
- [ ] Detail kandidat.
- [ ] Catatan mentor.

Output:

- Mentor bisa mulai bekerja.

### 17.2 Skill Gap dan Learning Path

Kesulitan: Sulit

Checklist:

- [ ] Hitung skill gap dari target role.
- [ ] Buat learning path.
- [ ] Tambah step belajar.
- [ ] Track progress.

Output:

- Mentor punya bahan coaching.

### 17.3 AI Career Coach

Kesulitan: Sulit

Checklist:

- [ ] Chat career coach.
- [ ] Simpan session.
- [ ] Simpan message.
- [ ] Generate recommendation.
- [ ] Rekomendasi resource.

Output:

- Kandidat mendapat pendampingan karier AI.

## 18. Subscription dan Billing

Billing sebaiknya dibuat setelah employer flow utama jelas.

### 18.1 Subscription Basic

Kesulitan: Sedang

Checklist:

- [ ] Company memilih plan.
- [ ] Simpan subscription.
- [ ] Cek limit lowongan aktif.
- [ ] Cek limit recruiter seat.
- [ ] Cek quota AI screening.
- [ ] Cek quota talent search.

Output:

- Paket SaaS mulai berjalan.

### 18.2 Payment Integration

Kesulitan: Sulit

Checklist:

- [ ] Integrasi payment provider.
- [ ] Checkout.
- [ ] Webhook payment.
- [ ] Update subscription.
- [ ] Invoice/payment history.

Output:

- Monetisasi siap dipakai.

## 19. Analytics dan SLA

Analytics dibuat setelah data transaksi cukup.

### 19.1 Job Analytics

Kesulitan: Sedang

Checklist:

- [ ] View count.
- [ ] Apply clicks.
- [ ] Saves.
- [ ] Conversion rate.
- [ ] Candidate source.

Output:

- Employer bisa melihat performa lowongan.

### 19.2 Response SLA Monitor

Kesulitan: Sedang

Checklist:

- [ ] Hitung first response.
- [ ] Hitung average response time.
- [ ] Tandai lamaran lewat SLA.
- [ ] Dashboard warning.

Output:

- Employer terdorong lebih responsif.

### 19.3 Platform Analytics Admin

Kesulitan: Sedang

Checklist:

- [ ] Growth user.
- [ ] Growth company.
- [ ] Job posted.
- [ ] Application volume.
- [ ] Conversion apply.
- [ ] Report/scam metrics.
- [ ] AI usage.

Output:

- Admin bisa mengambil keputusan produk.

## 20. Realtime

Realtime dibuat setelah notifikasi dan pipeline stabil.

### 20.1 Realtime Notification

Kesulitan: Sulit

Checklist:

- [ ] Setup broadcast.
- [ ] Reverb.
- [ ] Notification event.
- [ ] Update bell realtime.

Output:

- User menerima update tanpa refresh.

### 20.2 Realtime Application Status

Kesulitan: Sulit

Checklist:

- [ ] Broadcast status berubah.
- [ ] Candidate tracker update realtime.
- [ ] Employer pipeline update realtime.

Output:

- Tracker lamaran terasa hidup.

### 20.3 Realtime Chat

Kesulitan: Sulit

Checklist:

- [ ] Message event.
- [ ] Typing indicator opsional.
- [ ] Read receipt.
- [ ] Push notification opsional.

Output:

- Chat lebih responsif.

## 21. Urutan Sprint yang Disarankan

### Sprint 1: Fondasi

- Setup UI theme, Poppins, light mode
- Setup shadcn components
- Layout public/auth/dashboard
- Role dan middleware
- Dashboard kosong 4 role

### Sprint 2: Master Data dan Public Page

- CRUD skill
- CRUD industry
- CRUD pricing plan
- Landing page
- Pricing public
- Halaman legal

### Sprint 3: Profil

- Candidate profile
- Candidate skill
- Experience, education, certification
- Upload CV
- Company profile
- Company member
- Company verification submit

### Sprint 4: Lowongan

- Employer job CRUD
- Job skills
- Screening questions
- Public job search
- Job detail
- Saved job

### Sprint 5: Apply dan Pipeline

- Apply job
- Application tracker kandidat
- Pipeline employer dasar
- Status history
- Notification database

### Sprint 6: Dashboard Real Data

- Dashboard kandidat
- Dashboard employer
- Dashboard admin
- Dashboard mentor
- Skeleton loading
- Eager loading optimization

### Sprint 7: Trust dan Moderasi

- Admin company verification
- Admin job moderation
- Report system
- Company public profile
- Salary insight basic

### Sprint 8: Talent Search

- Talent search basic
- Saved candidate
- Detail kandidat recruiter
- Internal recruiter notes

### Sprint 9: Interview Manual

- Jadwalkan interview
- Candidate interview schedule
- Interview confirmation
- Interview scorecard

### Sprint 10: AI Basic

- AI CV summary
- AI natural language search parser
- AI job integrity score
- Rule-based match score
- Personalized recommendation

### Sprint 11: AI Advanced

- AI fit explanation
- Embedding
- Semantic search
- AI shortlist
- Candidate comparison

### Sprint 12: Mentor dan Career Coach

- Mentor candidate list
- Skill gap
- Learning path
- AI career coach
- Career recommendation

### Sprint 13: Subscription dan Analytics

- Subscription basic
- Billing summary
- Payment integration
- Job analytics
- SLA monitor

### Sprint 14: Realtime

- Realtime notification
- Realtime application tracker
- Realtime pipeline
- Realtime chat

## 22. Fitur yang Jangan Dibuat Terlalu Awal

Jangan dibuat di awal sebelum MVP stabil:

- Payment integration penuh
- AI interview lengkap
- Realtime chat
- Semantic vector search
- Candidate comparison
- Advanced analytics
- AI career coach panjang
- Mobile app
- Multi-language
- Complex permission builder

Alasan:

- Dependency besar
- Mudah berubah setelah user testing
- Butuh data asli agar hasilnya bagus
- Risiko bug lebih tinggi

## 23. MVP Minimum yang Layak Diuji

MVP pertama cukup memiliki:

- Landing page
- Auth kandidat dan perusahaan
- Profil kandidat
- Profil perusahaan
- Company verification basic
- Buat lowongan
- Cari lowongan
- Detail lowongan
- Simpan lowongan
- Lamar lowongan
- Tracker lamaran
- Pipeline employer dasar
- Admin verification
- Notification basic

Dengan MVP ini, Karivia sudah bisa diuji sebagai marketplace kerja sebelum AI dan billing dibuat penuh.

## 24. Definisi Selesai untuk Setiap Fitur

Satu fitur dianggap selesai jika:

- UI Bahasa Indonesia.
- Button aksi memakai icon + teks.
- Loading state memakai Skeleton.
- Aksi sukses/gagal memakai Sonner.
- Aksi destruktif memakai Alert Dialog.
- List table memakai DataTable jika berbentuk tabel.
- Query list memakai pagination.
- Query relasi memakai eager loading.
- Form punya validasi backend.
- Empty state tersedia.
- Error state tersedia.
- Role access sudah diproteksi.

## 25. Catatan Implementasi

- Mulai dari fitur CRUD dan halaman statis agar ritme development cepat.
- Jangan menunggu AI untuk membuat MVP.
- Simpan semua score AI di database agar bisa diaudit.
- Gunakan queue untuk semua proses berat.
- Hindari query N+1 sejak awal.
- Gunakan `select()`, `with()`, `withCount()`, dan `paginate()`.
- Data master sebaiknya dicache.
- Jaga setiap halaman tetap ringan dan spesifik.
