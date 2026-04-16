# Fitur Karivia Berdasarkan Role

Dokumen ini mengelompokkan fitur Karivia berdasarkan role pengguna agar scope development lebih jelas. Role utama Karivia:

- Admin
- Perusahaan
- Kandidat
- Mentor

Selain 4 role utama, ada juga fitur Public dan Shared yang dipakai sebelum login atau oleh beberapa role sekaligus.

## Legenda Prioritas

- P0: Wajib untuk MVP.
- P1: Penting setelah MVP dasar berjalan.
- P2: Advanced, dibuat setelah data dan workflow stabil.
- P3: Enhancement, bisa dibuat belakangan.

## Legenda Kesulitan

- Mudah: CRUD, halaman statis, atau UI sederhana.
- Sedang: butuh relasi data, validasi, status, dan workflow.
- Sulit: butuh AI, realtime, payment, queue kompleks, atau analytics.

## 1. Public atau Guest

Public adalah fitur yang dapat diakses tanpa login.

### 1.1 Landing Page

Prioritas: P0

Kesulitan: Mudah

Fitur:

- [ ] Headline job portal terpercaya dengan AI matching.
- [ ] Search bar posisi, skill, perusahaan, lokasi.
- [ ] CTA untuk kandidat.
- [ ] CTA untuk perusahaan.
- [ ] Section perusahaan terverifikasi.
- [ ] Section lowongan unggulan.
- [ ] Section keunggulan Karivia.
- [ ] Section cara kerja kandidat.
- [ ] Section cara kerja perusahaan.
- [ ] Pricing teaser.
- [ ] Footer lengkap.

Catatan UI:

- Gunakan Bahasa Indonesia.
- Gunakan font Poppins.
- Gunakan warna utama `#ED6A2F`.
- Light mode saja.

### 1.2 Pencarian Lowongan Public

Prioritas: P0

Kesulitan: Sedang

Fitur:

- [ ] Search lowongan.
- [ ] Filter lokasi.
- [ ] Filter mode kerja.
- [ ] Filter gaji.
- [ ] Filter level pengalaman.
- [ ] Filter jenis pekerjaan.
- [ ] Filter industri.
- [ ] Filter perusahaan terverifikasi.
- [ ] List job card.
- [ ] Pagination.
- [ ] Empty state.
- [ ] Skeleton loading.

Data loading:

- Eager loading `company`.
- Eager loading `skills`.
- Gunakan `paginate()`.
- Gunakan `select()` untuk kolom yang ditampilkan.

### 1.3 Detail Lowongan Public

Prioritas: P0

Kesulitan: Sedang

Fitur:

- [ ] Detail judul pekerjaan.
- [ ] Nama perusahaan.
- [ ] Salary range.
- [ ] Lokasi.
- [ ] Mode kerja.
- [ ] Badge perusahaan terverifikasi.
- [ ] Job integrity score.
- [ ] Deskripsi pekerjaan.
- [ ] Tanggung jawab.
- [ ] Kualifikasi.
- [ ] Skill dibutuhkan.
- [ ] Tahapan rekrutmen.
- [ ] Estimasi waktu proses.
- [ ] CTA Lamar Sekarang.
- [ ] CTA Simpan.
- [ ] Section lowongan serupa.

Rule:

- Jika user belum login dan klik Lamar, arahkan ke login/register.
- Jika user belum login dan klik Simpan, arahkan ke login/register.

### 1.4 Profil Perusahaan Public

Prioritas: P1

Kesulitan: Sedang

Fitur:

- [ ] Logo dan cover perusahaan.
- [ ] Deskripsi perusahaan.
- [ ] Industri.
- [ ] Ukuran perusahaan.
- [ ] Lokasi kantor.
- [ ] Budaya kerja.
- [ ] Benefit.
- [ ] Badge legal terverifikasi.
- [ ] Badge recruiter terverifikasi.
- [ ] Badge salary disclosed.
- [ ] Badge active employer.
- [ ] Badge fast responder.
- [ ] Statistik response rate.
- [ ] Median response time.
- [ ] Jumlah lowongan aktif.
- [ ] Ulasan perusahaan.
- [ ] Salary insight.
- [ ] Daftar lowongan aktif.

### 1.5 Pricing Public

Prioritas: P1

Kesulitan: Mudah

Fitur:

- [ ] Paket Starter.
- [ ] Paket Growth.
- [ ] Paket Enterprise.
- [ ] Jumlah lowongan aktif per paket.
- [ ] Jumlah recruiter seat.
- [ ] AI screening quota.
- [ ] Talent search quota.
- [ ] Interview tools.
- [ ] Analytics.
- [ ] Branding.
- [ ] Tabel perbandingan fitur.
- [ ] CTA daftar perusahaan.

### 1.6 Halaman Informasi

Prioritas: P1

Kesulitan: Mudah

Fitur:

- [ ] Tentang Karivia.
- [ ] Sumber Karier.
- [ ] Blog atau artikel karier.
- [ ] Bantuan.
- [ ] Kebijakan Privasi.
- [ ] Syarat dan Ketentuan.

## 2. Shared Feature untuk Semua Role Login

Shared feature dipakai oleh lebih dari satu role.

### 2.1 Auth

Prioritas: P0

Kesulitan: Mudah

Fitur:

- [ ] Login.
- [ ] Register kandidat.
- [ ] Register perusahaan.
- [ ] Forgot password.
- [ ] Reset password.
- [ ] Verify email.
- [ ] Logout.
- [ ] Redirect dashboard berdasarkan role.

Role redirect:

- Admin -> Dashboard Admin
- Perusahaan -> Dashboard Perusahaan
- Kandidat -> Dashboard Kandidat
- Mentor -> Dashboard Mentor

### 2.2 Profile Account

Prioritas: P0

Kesulitan: Mudah

Fitur:

- [ ] Edit nama.
- [ ] Edit email.
- [ ] Edit nomor telepon.
- [ ] Edit foto profil.
- [ ] Ganti password.
- [ ] Two factor authentication jika dibutuhkan.

### 2.3 Notification

Prioritas: P1

Kesulitan: Sedang

Fitur:

- [ ] Notification bell.
- [ ] List notifikasi.
- [ ] Mark as read.
- [ ] Mark all as read.
- [ ] Sonner untuk feedback langsung.
- [ ] Filter notifikasi belum dibaca.

Event notifikasi:

- Lamaran dikirim.
- Status lamaran berubah.
- Kandidat diundang interview.
- Perusahaan diverifikasi.
- Lowongan dipublikasikan.
- Pesan baru.
- Mentor memberi catatan.

### 2.4 Message

Prioritas: P1

Kesulitan: Sedang

Fitur:

- [ ] List conversation.
- [ ] Detail chat.
- [ ] Kirim pesan.
- [ ] Attachment opsional.
- [ ] Read status.
- [ ] Empty state.

Dipakai oleh:

- Kandidat
- Perusahaan
- Mentor
- Admin opsional untuk support

### 2.5 Settings

Prioritas: P1

Kesulitan: Mudah

Fitur:

- [ ] Profile settings.
- [ ] Security settings.
- [ ] Notification settings.
- [ ] Language settings jika nanti multi bahasa.

Catatan:

- Untuk MVP, cukup Bahasa Indonesia saja.
- Tidak perlu dark mode.

## 3. Role Kandidat

Kandidat adalah pencari kerja.

### 3.1 Dashboard Kandidat

Prioritas: P0

Kesulitan: Sedang

Fitur:

- [ ] Greeting personal.
- [ ] Profile completion meter.
- [ ] CV aktif.
- [ ] AI CV summary.
- [ ] Rekomendasi pekerjaan.
- [ ] Lowongan tersimpan.
- [ ] Lamaran aktif.
- [ ] Live application status tracker.
- [ ] Jadwal interview.
- [ ] Skill badges.
- [ ] Saran assessment.
- [ ] Tips pengembangan karier.

Data loading:

- Eager loading candidate profile.
- Eager loading active CV.
- Eager loading applications dengan job dan company.
- Eager loading recommendations dengan job dan company.
- Gunakan skeleton untuk metric dan card.

### 3.2 Onboarding Kandidat

Prioritas: P0

Kesulitan: Sedang

Fitur:

- [ ] Isi nama lengkap.
- [ ] Isi headline profesional.
- [ ] Pilih lokasi.
- [ ] Pilih mode kerja.
- [ ] Isi ekspektasi gaji.
- [ ] Pilih industri minat.
- [ ] Pilih role minat.
- [ ] Pilih skill utama.
- [ ] Upload CV.
- [ ] Tandai onboarding selesai.

Tujuan:

- Setelah login, kandidat langsung mendapat rekomendasi lowongan yang sesuai.

### 3.3 Profil Kandidat

Prioritas: P0

Kesulitan: Sedang

Fitur:

- [ ] Edit data dasar.
- [ ] Edit headline.
- [ ] Edit bio.
- [ ] Edit lokasi.
- [ ] Edit expected salary.
- [ ] Edit work mode preference.
- [ ] Edit availability.
- [ ] Edit LinkedIn.
- [ ] Edit GitHub.
- [ ] Edit portfolio.
- [ ] Profile completion meter.

### 3.4 CV Kandidat

Prioritas: P0

Kesulitan: Sedang

Fitur:

- [ ] Upload CV.
- [ ] List CV.
- [ ] Set CV utama.
- [ ] Hapus CV dengan Alert Dialog.
- [ ] Preview CV.
- [ ] AI CV summary.

AI:

- P0: upload dan set CV utama.
- P1: AI CV summary.
- P2: AI CV parsing lengkap.

### 3.5 Pengalaman Kerja

Prioritas: P0

Kesulitan: Sedang

Fitur:

- [ ] Tambah pengalaman.
- [ ] Edit pengalaman.
- [ ] Hapus pengalaman.
- [ ] Tandai pekerjaan saat ini.
- [ ] Urutkan berdasarkan tanggal terbaru.

### 3.6 Pendidikan

Prioritas: P0

Kesulitan: Sedang

Fitur:

- [ ] Tambah pendidikan.
- [ ] Edit pendidikan.
- [ ] Hapus pendidikan.
- [ ] Field institusi, gelar, jurusan, tahun mulai, tahun selesai, IPK.

### 3.7 Sertifikasi

Prioritas: P1

Kesulitan: Sedang

Fitur:

- [ ] Tambah sertifikasi.
- [ ] Edit sertifikasi.
- [ ] Hapus sertifikasi.
- [ ] Link credential.

### 3.8 Skill Kandidat

Prioritas: P0

Kesulitan: Sedang

Fitur:

- [ ] Tambah skill dari master data.
- [ ] Isi tahun pengalaman.
- [ ] Isi proficiency.
- [ ] Hapus skill.
- [ ] Badge skill terverifikasi.

### 3.9 Cari Lowongan Kandidat

Prioritas: P0

Kesulitan: Sedang

Fitur:

- [ ] Search lowongan.
- [ ] Filter lengkap.
- [ ] Natural language search.
- [ ] Tab Rekomendasi Untuk Anda.
- [ ] Tab Semua Lowongan.
- [ ] Tab Remote.
- [ ] Tab Gaji Transparan.
- [ ] AI match score di job card.
- [ ] Save job.
- [ ] Apply job.

Rule:

- Setelah login, default halaman lowongan menampilkan lowongan yang cocok dengan profil kandidat.

### 3.10 Detail Lowongan Kandidat

Prioritas: P0

Kesulitan: Sedang

Fitur:

- [ ] Detail lowongan.
- [ ] AI match score.
- [ ] Penjelasan AI match.
- [ ] Skill cocok.
- [ ] Skill kurang.
- [ ] Job integrity score.
- [ ] Salary transparan.
- [ ] Tahapan rekrutmen.
- [ ] Recruiter response SLA.
- [ ] Lamar Sekarang.
- [ ] Simpan.
- [ ] Laporkan lowongan.
- [ ] Lowongan serupa.

### 3.11 Simpan Lowongan

Prioritas: P0

Kesulitan: Mudah

Fitur:

- [ ] Simpan lowongan.
- [ ] Hapus dari simpanan.
- [ ] List lowongan tersimpan.
- [ ] Sonner sukses/gagal.

### 3.12 Lamar Lowongan

Prioritas: P0

Kesulitan: Sedang

Fitur:

- [ ] Pilih CV.
- [ ] Isi cover letter opsional.
- [ ] Jawab screening question.
- [ ] Validasi belum pernah melamar.
- [ ] Submit lamaran.
- [ ] Tampilkan status terkirim.
- [ ] Kirim notifikasi ke perusahaan.

### 3.13 Lamaran Saya

Prioritas: P0

Kesulitan: Sedang

Fitur:

- [ ] List lamaran.
- [ ] Filter status.
- [ ] Detail lamaran.
- [ ] Status tracker.
- [ ] History perubahan status.
- [ ] Jadwal interview terkait.
- [ ] Withdraw lamaran jika dibutuhkan.

### 3.14 Interview Kandidat

Prioritas: P1

Kesulitan: Sedang

Fitur:

- [ ] List undangan interview.
- [ ] Detail interview.
- [ ] Konfirmasi jadwal.
- [ ] Tolak jadwal.
- [ ] Link meeting.
- [ ] Reminder interview.

### 3.15 AI Interview Simulator

Prioritas: P2

Kesulitan: Sulit

Fitur:

- [ ] Lobby AI interview.
- [ ] Mulai sesi.
- [ ] Tampilkan pertanyaan.
- [ ] Simpan jawaban.
- [ ] Selesaikan sesi.
- [ ] AI feedback.
- [ ] Rekomendasi perbaikan.

### 3.16 Assessment Kandidat

Prioritas: P2

Kesulitan: Sulit

Fitur:

- [ ] List assessment.
- [ ] Mulai assessment.
- [ ] Jawab pertanyaan.
- [ ] Submit assessment.
- [ ] Score assessment.
- [ ] Badge skill terverifikasi.

### 3.17 Career Coach

Prioritas: P2

Kesulitan: Sulit

Fitur:

- [ ] Chat career coach.
- [ ] Session history.
- [ ] Rekomendasi karier.
- [ ] Rekomendasi learning path.
- [ ] Rekomendasi artikel atau course.

### 3.18 Report Lowongan

Prioritas: P1

Kesulitan: Mudah

Fitur:

- [ ] Laporkan lowongan.
- [ ] Pilih alasan.
- [ ] Isi catatan.
- [ ] Submit laporan.
- [ ] Admin menerima laporan.

## 4. Role Perusahaan

Perusahaan adalah employer, recruiter, atau HR team.

### 4.1 Dashboard Perusahaan

Prioritas: P0

Kesulitan: Sedang

Fitur:

- [ ] Overview lowongan aktif.
- [ ] Total pelamar masuk.
- [ ] Rata-rata response time.
- [ ] AI shortlist recommendation.
- [ ] Candidate pipeline summary.
- [ ] Recruiter team activity.
- [ ] Response SLA monitor.
- [ ] Analytics lowongan ringkas.
- [ ] Company verification status.
- [ ] Subscription summary.
- [ ] Quick action Buat Lowongan.
- [ ] Quick action Cari Kandidat.
- [ ] Quick action Jadwalkan Interview.

### 4.2 Onboarding Perusahaan

Prioritas: P0

Kesulitan: Sedang

Fitur:

- [ ] Isi nama perusahaan.
- [ ] Pilih industri.
- [ ] Isi ukuran perusahaan.
- [ ] Isi website.
- [ ] Upload logo.
- [ ] Upload cover.
- [ ] Isi deskripsi.
- [ ] Isi lokasi kantor.
- [ ] Submit verifikasi.

### 4.3 Profil Perusahaan

Prioritas: P0

Kesulitan: Sedang

Fitur:

- [ ] Edit logo.
- [ ] Edit cover.
- [ ] Edit deskripsi.
- [ ] Edit industri.
- [ ] Edit ukuran perusahaan.
- [ ] Edit lokasi kantor.
- [ ] Edit budaya kerja.
- [ ] Edit benefit.
- [ ] Preview profil public.

### 4.4 Verifikasi Perusahaan

Prioritas: P0

Kesulitan: Sedang

Fitur:

- [ ] Upload dokumen legal.
- [ ] Isi NIB.
- [ ] Isi NPWP.
- [ ] Submit verifikasi.
- [ ] Lihat status verifikasi.
- [ ] Re-submit jika need revision.

### 4.5 Team Member Recruiter

Prioritas: P1

Kesulitan: Sedang

Fitur:

- [ ] List anggota recruiter.
- [ ] Invite anggota.
- [ ] Ubah role internal.
- [ ] Nonaktifkan anggota.
- [ ] Hapus anggota dengan Alert Dialog.

Role internal:

- Owner
- Admin HR
- Recruiter
- Viewer

### 4.6 Kelola Lowongan

Prioritas: P0

Kesulitan: Sedang

Fitur:

- [ ] List lowongan dengan DataTable.
- [ ] Buat lowongan.
- [ ] Edit lowongan.
- [ ] Preview lowongan.
- [ ] Publish lowongan.
- [ ] Tutup lowongan.
- [ ] Hapus draft.
- [ ] Duplicate lowongan.
- [ ] Filter status lowongan.

Button action:

- `PlusIcon` + `Buat Lowongan`
- `EyeIcon` + `Preview`
- `PencilIcon` + `Edit`
- `SendIcon` + `Publikasikan`
- `ArchiveIcon` + `Tutup Lowongan`
- `TrashIcon` + `Hapus`

### 4.7 Form Buat Lowongan

Prioritas: P0

Kesulitan: Sedang

Fitur:

- [ ] Judul posisi.
- [ ] Deskripsi pekerjaan.
- [ ] Tanggung jawab.
- [ ] Kualifikasi wajib.
- [ ] Kualifikasi tambahan.
- [ ] Skill wajib.
- [ ] Skill tambahan.
- [ ] Level pengalaman.
- [ ] Jenis pekerjaan.
- [ ] Mode kerja.
- [ ] Lokasi.
- [ ] Salary min.
- [ ] Salary max.
- [ ] Salary visible.
- [ ] Response SLA.
- [ ] Screening question.

### 4.8 AI Job Integrity Check

Prioritas: P1

Kesulitan: Sedang

Fitur:

- [ ] Cek kelengkapan lowongan.
- [ ] Cek salary transparency.
- [ ] Cek kata mencurigakan.
- [ ] Cek kontak eksternal mencurigakan.
- [ ] Cek status company verification.
- [ ] Generate integrity score.
- [ ] Tampilkan rekomendasi perbaikan.

### 4.9 Pipeline Kandidat

Prioritas: P0

Kesulitan: Sedang

Fitur:

- [ ] List kandidat per status.
- [ ] Filter berdasarkan lowongan.
- [ ] Filter status.
- [ ] Detail aplikasi.
- [ ] Pindahkan tahap.
- [ ] Shortlist.
- [ ] Reject dengan Alert Dialog.
- [ ] Catat status history.
- [ ] Notifikasi kandidat.

Status:

- Applied
- Screened
- Shortlisted
- Interview
- Offer
- Hired
- Rejected

### 4.10 Detail Aplikasi Kandidat

Prioritas: P0

Kesulitan: Sedang

Fitur:

- [ ] Detail kandidat.
- [ ] CV kandidat.
- [ ] Jawaban screening question.
- [ ] AI fit score.
- [ ] Skill match.
- [ ] Internal note.
- [ ] History status.
- [ ] Action shortlist.
- [ ] Action reject.
- [ ] Action jadwalkan interview.
- [ ] Action kirim pesan.

### 4.11 Talent Search

Prioritas: P1

Kesulitan: Sedang

Fitur:

- [ ] Semantic search kandidat.
- [ ] Natural language search.
- [ ] Filter skill.
- [ ] Filter pengalaman.
- [ ] Filter lokasi.
- [ ] Filter expected salary.
- [ ] Filter industri.
- [ ] Filter pendidikan.
- [ ] Filter availability.
- [ ] Candidate card.
- [ ] AI fit score.
- [ ] Shortlist.
- [ ] Simpan.
- [ ] Hubungi.
- [ ] Invite interview.

### 4.12 Detail Kandidat untuk Recruiter

Prioritas: P1

Kesulitan: Sedang

Fitur:

- [ ] Ringkasan CV AI.
- [ ] AI fit score untuk lowongan tertentu.
- [ ] Alasan kecocokan.
- [ ] Skill gap.
- [ ] Timeline pengalaman kerja.
- [ ] Pendidikan.
- [ ] Sertifikasi.
- [ ] Portfolio.
- [ ] GitHub.
- [ ] LinkedIn.
- [ ] Jawaban screening question.
- [ ] Note internal recruiter.
- [ ] Scorecard interview.
- [ ] Rekomendasi pertanyaan interview.
- [ ] Shortlist.
- [ ] Reject.
- [ ] Request assessment.
- [ ] Schedule interview.

### 4.13 Saved Candidate

Prioritas: P1

Kesulitan: Mudah

Fitur:

- [ ] Simpan kandidat.
- [ ] Hapus kandidat dari simpanan.
- [ ] List kandidat tersimpan.
- [ ] Sonner sukses/gagal.

### 4.14 Interview Scheduling

Prioritas: P1

Kesulitan: Sedang

Fitur:

- [ ] Jadwalkan interview.
- [ ] Pilih kandidat.
- [ ] Pilih lowongan.
- [ ] Pilih tanggal dan jam.
- [ ] Pilih mode interview.
- [ ] Tambah link meeting.
- [ ] Kirim undangan.
- [ ] Kandidat konfirmasi.
- [ ] Kandidat tolak.

### 4.15 Interview Scorecard

Prioritas: P1

Kesulitan: Sedang

Fitur:

- [ ] Input technical score.
- [ ] Input culture fit score.
- [ ] Input communication score.
- [ ] Input problem solving score.
- [ ] Notes reviewer.
- [ ] Overall score.
- [ ] Submit scorecard.

### 4.16 Analytics Lowongan

Prioritas: P2

Kesulitan: Sedang

Fitur:

- [ ] View count.
- [ ] Apply clicks.
- [ ] Saves.
- [ ] Conversion rate.
- [ ] Candidate source.
- [ ] Time to shortlist.
- [ ] Time to hire.

### 4.17 Subscription dan Billing

Prioritas: P2

Kesulitan: Sulit

Fitur:

- [ ] Lihat paket aktif.
- [ ] Lihat limit lowongan.
- [ ] Lihat recruiter seat.
- [ ] Lihat AI screening quota.
- [ ] Lihat talent search quota.
- [ ] Upgrade paket.
- [ ] Payment history.
- [ ] Invoice.

### 4.18 Report Kandidat

Prioritas: P2

Kesulitan: Mudah

Fitur:

- [ ] Report kandidat.
- [ ] Pilih alasan.
- [ ] Isi catatan.
- [ ] Submit ke admin.

## 5. Role Admin

Admin mengelola platform, trust, data master, dan operasional.

### 5.1 Dashboard Admin

Prioritas: P0

Kesulitan: Sedang

Fitur:

- [ ] Total user.
- [ ] Total kandidat.
- [ ] Total perusahaan.
- [ ] Total mentor.
- [ ] Total lowongan aktif.
- [ ] Total lamaran.
- [ ] Perusahaan pending verification.
- [ ] Report pending.
- [ ] Subscription aktif.
- [ ] AI usage.
- [ ] Platform activity.

### 5.2 Kelola User

Prioritas: P0

Kesulitan: Sedang

Fitur:

- [ ] DataTable user.
- [ ] Filter role.
- [ ] Filter status.
- [ ] Detail user.
- [ ] Aktif/nonaktif user.
- [ ] Reset verification jika perlu.
- [ ] Lihat activity user.

### 5.3 Kelola Perusahaan

Prioritas: P0

Kesulitan: Sedang

Fitur:

- [ ] DataTable perusahaan.
- [ ] Filter verification status.
- [ ] Detail perusahaan.
- [ ] Edit data jika diperlukan.
- [ ] Suspend perusahaan.
- [ ] Lihat lowongan perusahaan.
- [ ] Lihat anggota recruiter.

### 5.4 Verifikasi Perusahaan

Prioritas: P0

Kesulitan: Sedang

Fitur:

- [ ] DataTable submission.
- [ ] Detail dokumen legal.
- [ ] Approve.
- [ ] Reject.
- [ ] Need revision.
- [ ] Catatan reviewer.
- [ ] Notifikasi perusahaan.

### 5.5 Kelola Lowongan

Prioritas: P0

Kesulitan: Sedang

Fitur:

- [ ] DataTable lowongan.
- [ ] Filter status.
- [ ] Filter perusahaan.
- [ ] Detail lowongan.
- [ ] Update integrity score manual.
- [ ] Publish.
- [ ] Suspend.
- [ ] Reject.

### 5.6 Moderasi Report

Prioritas: P1

Kesulitan: Sedang

Fitur:

- [ ] DataTable report.
- [ ] Filter status.
- [ ] Detail report.
- [ ] Review subject.
- [ ] Tandai sedang diproses.
- [ ] Tandai selesai.
- [ ] Suspend subject jika perlu.
- [ ] Catatan admin.

Report subject:

- Lowongan
- Perusahaan
- Kandidat
- Pesan

### 5.7 Kelola Skill

Prioritas: P0

Kesulitan: Mudah

Fitur:

- [ ] DataTable skill.
- [ ] Tambah skill.
- [ ] Edit skill.
- [ ] Hapus skill.
- [ ] Kategori skill.
- [ ] Cache skill list.

### 5.8 Kelola Industri

Prioritas: P0

Kesulitan: Mudah

Fitur:

- [ ] DataTable industri.
- [ ] Tambah industri.
- [ ] Edit industri.
- [ ] Hapus industri.
- [ ] Cache industry list.

### 5.9 Kelola Pricing Plan

Prioritas: P1

Kesulitan: Mudah

Fitur:

- [ ] DataTable pricing plan.
- [ ] Tambah paket.
- [ ] Edit paket.
- [ ] Aktif/nonaktif paket.
- [ ] Set active jobs limit.
- [ ] Set recruiter seat limit.
- [ ] Set AI quota.
- [ ] Set talent search quota.
- [ ] Set feature list.

### 5.10 Kelola Subscription

Prioritas: P2

Kesulitan: Sedang

Fitur:

- [ ] DataTable subscription.
- [ ] Filter status.
- [ ] Detail subscription.
- [ ] Extend subscription manual.
- [ ] Cancel subscription manual.
- [ ] Lihat payment history.

### 5.11 Kelola Salary Insight

Prioritas: P1

Kesulitan: Sedang

Fitur:

- [ ] DataTable salary insight.
- [ ] Tambah salary insight.
- [ ] Edit salary insight.
- [ ] Hapus salary insight.
- [ ] Import data opsional.
- [ ] Publish insight.

### 5.12 Kelola Career Resource

Prioritas: P1

Kesulitan: Mudah

Fitur:

- [ ] DataTable resource.
- [ ] Tambah artikel.
- [ ] Edit artikel.
- [ ] Publish/unpublish.
- [ ] Hapus artikel.
- [ ] Kategori resource.

### 5.13 Kelola Mentor

Prioritas: P1

Kesulitan: Sedang

Fitur:

- [ ] DataTable mentor.
- [ ] Detail mentor.
- [ ] Verifikasi mentor.
- [ ] Aktif/nonaktif mentor.
- [ ] Lihat kandidat bimbingan.

### 5.14 AI Audit Log

Prioritas: P2

Kesulitan: Sulit

Fitur:

- [ ] DataTable AI logs.
- [ ] Filter feature.
- [ ] Filter status.
- [ ] Detail input hash.
- [ ] Detail output JSON.
- [ ] Model name.
- [ ] Retry failed AI job jika aman.

### 5.15 Activity Log

Prioritas: P2

Kesulitan: Sedang

Fitur:

- [ ] DataTable activity logs.
- [ ] Filter actor.
- [ ] Filter action.
- [ ] Filter subject.
- [ ] Detail properties.

### 5.16 Platform Analytics

Prioritas: P2

Kesulitan: Sulit

Fitur:

- [ ] Growth user.
- [ ] Growth company.
- [ ] Growth candidate.
- [ ] Job posted.
- [ ] Application volume.
- [ ] Conversion apply.
- [ ] Report metrics.
- [ ] AI usage metrics.
- [ ] Subscription revenue.

## 6. Role Mentor

Mentor membantu kandidat mengembangkan karier.

### 6.1 Dashboard Mentor

Prioritas: P1

Kesulitan: Sedang

Fitur:

- [ ] Greeting mentor.
- [ ] Kandidat bimbingan aktif.
- [ ] Jadwal sesi.
- [ ] Catatan terbaru.
- [ ] Skill gap terbaru.
- [ ] Career resource terbaru.
- [ ] Quick action tambah catatan.

### 6.2 Profil Mentor

Prioritas: P1

Kesulitan: Sedang

Fitur:

- [ ] Edit headline.
- [ ] Edit bio.
- [ ] Edit expertise.
- [ ] Edit availability.
- [ ] Edit rate jika mentoring berbayar.
- [ ] Upload foto.

### 6.3 Kandidat Bimbingan

Prioritas: P1

Kesulitan: Sedang

Fitur:

- [ ] List kandidat bimbingan.
- [ ] Filter status.
- [ ] Detail kandidat.
- [ ] Lihat profil kandidat.
- [ ] Lihat CV summary.
- [ ] Lihat skill kandidat.
- [ ] Lihat progress.

### 6.4 Catatan Mentoring

Prioritas: P1

Kesulitan: Sedang

Fitur:

- [ ] Tambah catatan.
- [ ] Edit catatan.
- [ ] Hapus catatan.
- [ ] Tandai private atau visible to candidate.
- [ ] Kategori catatan.

### 6.5 Skill Gap Kandidat

Prioritas: P2

Kesulitan: Sulit

Fitur:

- [ ] Pilih target role.
- [ ] Bandingkan skill kandidat dengan kebutuhan role.
- [ ] Tampilkan skill cocok.
- [ ] Tampilkan skill kurang.
- [ ] Rekomendasi assessment.
- [ ] Rekomendasi learning path.

### 6.6 Learning Path

Prioritas: P2

Kesulitan: Sedang

Fitur:

- [ ] Buat learning path.
- [ ] Tambah step.
- [ ] Urutkan step.
- [ ] Tandai selesai.
- [ ] Tambah resource.
- [ ] Track progress.

### 6.7 Review CV

Prioritas: P2

Kesulitan: Sedang

Fitur:

- [ ] Lihat CV kandidat.
- [ ] Tambah komentar.
- [ ] Beri rekomendasi perbaikan.
- [ ] Tandai review selesai.

### 6.8 Rekomendasi Karier

Prioritas: P2

Kesulitan: Sulit

Fitur:

- [ ] Generate rekomendasi karier.
- [ ] Pilih career path.
- [ ] Beri alasan rekomendasi.
- [ ] Tambahkan learning path.
- [ ] Hubungkan ke lowongan relevan.

### 6.9 Materi Karier

Prioritas: P1

Kesulitan: Mudah

Fitur:

- [ ] Lihat resource.
- [ ] Filter kategori.
- [ ] Bagikan resource ke kandidat.
- [ ] Simpan resource favorit.

### 6.10 Jadwal Mentoring

Prioritas: P2

Kesulitan: Sedang

Fitur:

- [ ] Buat jadwal sesi.
- [ ] Kandidat konfirmasi.
- [ ] Kandidat batalkan.
- [ ] Link meeting.
- [ ] Reminder.

## 7. Matrix Fitur per Role

| Modul | Public | Kandidat | Perusahaan | Admin | Mentor |
| --- | --- | --- | --- | --- | --- |
| Landing Page | Ya | Tidak | Tidak | Tidak | Tidak |
| Cari Lowongan | Ya | Ya | Tidak | Tidak | Tidak |
| Detail Lowongan | Ya | Ya | Tidak | Ya | Tidak |
| Profil Perusahaan Public | Ya | Ya | Ya | Ya | Tidak |
| Pricing | Ya | Tidak | Ya | Ya | Tidak |
| Dashboard | Tidak | Ya | Ya | Ya | Ya |
| Profil Kandidat | Tidak | Ya | Lihat terbatas | Ya | Lihat kandidat bimbingan |
| Upload CV | Tidak | Ya | Tidak | Tidak | Tidak |
| Lamar Lowongan | Tidak | Ya | Tidak | Tidak | Tidak |
| Pipeline Lamaran | Tidak | Lihat status | Kelola | Lihat | Tidak |
| Talent Search | Tidak | Tidak | Ya | Ya | Tidak |
| Interview | Tidak | Konfirmasi | Kelola | Lihat | Opsional |
| AI Interview | Tidak | Ya | Lihat hasil | Audit | Tidak |
| Career Coach | Tidak | Ya | Tidak | Audit | Ya |
| Skill Gap | Tidak | Ya | Lihat terbatas | Lihat | Ya |
| Mentor Notes | Tidak | Lihat jika diizinkan | Tidak | Lihat | Ya |
| Company Verification | Tidak | Tidak | Submit | Review | Tidak |
| Reports | Tidak | Buat | Buat | Kelola | Tidak |
| Billing | Tidak | Tidak | Ya | Kelola | Tidak |
| Notification | Tidak | Ya | Ya | Ya | Ya |
| Message | Tidak | Ya | Ya | Opsional | Ya |

## 8. Permission Ringkas

### 8.1 Kandidat

Boleh:

- Mengelola profil sendiri.
- Mengelola CV sendiri.
- Melihat lowongan aktif.
- Menyimpan lowongan.
- Melamar lowongan.
- Melihat status lamaran sendiri.
- Melihat jadwal interview sendiri.
- Mengirim pesan pada conversation yang terkait.
- Melaporkan lowongan.

Tidak boleh:

- Membuat lowongan.
- Melihat kandidat lain.
- Melihat data internal perusahaan.
- Mengubah status lamaran.

### 8.2 Perusahaan

Boleh:

- Mengelola profil perusahaan sendiri.
- Mengelola anggota perusahaan sendiri.
- Membuat lowongan untuk perusahaan sendiri.
- Melihat pelamar untuk lowongan perusahaan sendiri.
- Mengubah pipeline pelamar perusahaan sendiri.
- Mencari kandidat jika paket mengizinkan.
- Menjadwalkan interview.
- Mengirim pesan ke kandidat terkait.

Tidak boleh:

- Mengakses data perusahaan lain.
- Mengubah data kandidat di luar proses rekrutmen.
- Melihat admin logs.
- Mengubah pricing plan sendiri tanpa subscription flow.

### 8.3 Admin

Boleh:

- Mengelola seluruh data platform.
- Verifikasi perusahaan.
- Moderasi lowongan.
- Moderasi laporan.
- Mengelola master data.
- Mengelola pricing.
- Mengelola subscription.
- Melihat audit log.

Catatan:

- Aksi destruktif admin wajib memakai Alert Dialog.
- Aksi sensitif admin wajib masuk activity log.

### 8.4 Mentor

Boleh:

- Mengelola profil mentor sendiri.
- Melihat kandidat bimbingan.
- Menambah catatan mentoring.
- Membuat learning path.
- Memberi rekomendasi karier.
- Membagikan resource.

Tidak boleh:

- Melihat semua kandidat bebas seperti recruiter.
- Mengubah status lamaran.
- Mengakses data billing perusahaan.
- Mengelola lowongan.

## 9. Fitur P0 Berdasarkan Role

### Public P0

- Landing page
- Cari lowongan
- Detail lowongan
- Auth login/register

### Kandidat P0

- Dashboard kandidat
- Onboarding kandidat
- Profil kandidat
- Upload CV
- Skill kandidat
- Cari lowongan personal
- Simpan lowongan
- Lamar lowongan
- Lamaran saya

### Perusahaan P0

- Dashboard perusahaan
- Onboarding perusahaan
- Profil perusahaan
- Verifikasi perusahaan
- Kelola lowongan
- Form buat lowongan
- Pipeline kandidat
- Detail aplikasi kandidat

### Admin P0

- Dashboard admin
- Kelola user
- Kelola perusahaan
- Verifikasi perusahaan
- Kelola lowongan
- Kelola skill
- Kelola industri

### Mentor P0

Untuk MVP awal, mentor boleh belum masuk P0 penuh. Minimal:

- Dashboard mentor placeholder
- Profil mentor dasar

Fitur mentor lengkap masuk P1 atau P2 setelah kandidat dan lowongan stabil.

## 10. Urutan Implementasi per Role

### 10.1 Public

1. Landing page
2. Pricing page
3. Cari lowongan
4. Detail lowongan
5. Profil perusahaan public
6. Artikel karier

### 10.2 Kandidat

1. Dashboard placeholder
2. Onboarding
3. Profil kandidat
4. Upload CV
5. Skill kandidat
6. Cari lowongan personal
7. Simpan lowongan
8. Lamar lowongan
9. Lamaran saya
10. Interview schedule
11. AI CV summary
12. AI recommendation
13. AI interview
14. Career coach

### 10.3 Perusahaan

1. Dashboard placeholder
2. Onboarding perusahaan
3. Profil perusahaan
4. Submit verification
5. Kelola lowongan
6. Buat lowongan
7. Pipeline kandidat
8. Detail aplikasi
9. Team member
10. Talent search
11. Interview schedule
12. Scorecard
13. Analytics
14. Billing

### 10.4 Admin

1. Dashboard placeholder
2. Kelola skill
3. Kelola industri
4. Kelola user
5. Kelola perusahaan
6. Review verifikasi perusahaan
7. Kelola lowongan
8. Moderasi report
9. Kelola pricing
10. Kelola salary insight
11. Kelola mentor
12. AI audit log
13. Platform analytics

### 10.5 Mentor

1. Dashboard placeholder
2. Profil mentor
3. List kandidat bimbingan
4. Detail kandidat bimbingan
5. Catatan mentoring
6. Materi karier
7. Skill gap
8. Learning path
9. Review CV
10. Rekomendasi karier
11. Jadwal mentoring

## 11. Catatan UI per Role

### Kandidat

Karakter UI:

- Bersih
- Memotivasi
- Personal
- Mudah dipakai
- Banyak guidance

CTA utama:

- Cari Lowongan
- Lamar Sekarang
- Simpan Lowongan
- Lengkapi Profil
- Upload CV

### Perusahaan

Karakter UI:

- Profesional
- Cepat
- Berbasis data
- Fokus pipeline
- Fokus SLA

CTA utama:

- Buat Lowongan
- Cari Kandidat
- Shortlist
- Jadwalkan Interview
- Upgrade Paket

### Admin

Karakter UI:

- Padat data
- Mudah difilter
- Banyak DataTable
- Audit friendly
- Konfirmasi aksi sensitif

CTA utama:

- Verifikasi
- Tolak
- Suspend
- Edit
- Lihat Detail

### Mentor

Karakter UI:

- Tenang
- Fokus progress kandidat
- Mudah mencatat
- Mudah memberi rekomendasi

CTA utama:

- Tambah Catatan
- Buat Learning Path
- Bagikan Materi
- Review CV

## 12. Standar Teknis Semua Role

Semua role wajib mengikuti standar:

- Bahasa Indonesia.
- Font Poppins.
- Light mode saja.
- Primary color `#ED6A2F`.
- Button aksi memakai icon + teks.
- Loading memakai Skeleton.
- Toast memakai Sonner.
- Konfirmasi aksi penting memakai Alert Dialog.
- List table memakai DataTable.
- Data list memakai pagination.
- Query relasi memakai eager loading.
- Empty state tersedia.
- Error state tersedia.
- Permission dicek di backend.

## 13. Fitur yang Disarankan Ditunda

Fitur berikut jangan dibuat terlalu awal:

- AI interview penuh.
- Semantic vector search.
- Payment integration penuh.
- Realtime chat.
- Candidate comparison.
- AI career coach kompleks.
- Platform analytics lengkap.
- Mobile app.
- Multi-language.
- Custom permission builder.

Alasan:

- Butuh data asli.
- Dependency besar.
- Risiko bug tinggi.
- Mudah berubah setelah MVP diuji.

## 14. MVP Role Scope

MVP pertama cukup menargetkan:

### Public

- Landing
- Cari lowongan
- Detail lowongan
- Pricing teaser

### Kandidat

- Profil
- Upload CV
- Cari lowongan
- Simpan lowongan
- Lamar lowongan
- Tracker lamaran

### Perusahaan

- Profil perusahaan
- Verifikasi basic
- Buat lowongan
- Kelola pelamar
- Pipeline basic

### Admin

- Kelola skill
- Kelola industri
- Kelola perusahaan
- Verifikasi perusahaan
- Kelola lowongan
- Kelola user

### Mentor

- Dashboard placeholder
- Profil mentor dasar

Dengan scope ini, Karivia sudah bisa diuji sebagai marketplace kerja sebelum masuk AI advanced, billing, dan realtime.
