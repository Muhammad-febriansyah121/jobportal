# Fitur Karivia - Role Kandidat

Dokumen ini berisi fitur khusus untuk role Kandidat. Kandidat memakai Karivia untuk membangun profil, mencari lowongan, menerima rekomendasi AI, melamar pekerjaan, memantau status lamaran, mengikuti interview, dan mengembangkan karier.

## Standar UI Kandidat

- Bahasa UI: Indonesia.
- Font: Poppins.
- Mode: light mode saja.
- Primary color: `#ED6A2F`.
- Button aksi memakai icon + teks.
- Loading memakai Skeleton.
- Feedback sukses/gagal memakai Sonner.
- Konfirmasi aksi penting memakai Alert Dialog.

Karakter UI:

- Bersih.
- Memotivasi.
- Personal.
- Mudah dipakai.
- Banyak guidance.

## Prioritas

- P0: Wajib untuk MVP.
- P1: Penting setelah MVP stabil.
- P2: Advanced.
- P3: Enhancement.

## 1. Dashboard Kandidat

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

## 2. Onboarding Kandidat

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

- Kandidat langsung mendapat rekomendasi lowongan setelah login.

## 3. Profil Kandidat

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

## 4. CV Kandidat

Prioritas: P0

Kesulitan: Sedang

Fitur:

- [ ] Upload CV.
- [ ] List CV.
- [ ] Set CV utama.
- [ ] Hapus CV dengan Alert Dialog.
- [ ] Preview CV.
- [ ] AI CV summary.

Tahapan:

- P0: upload dan set CV utama.
- P1: AI CV summary.
- P2: AI CV parsing lengkap.

## 5. Pengalaman Kerja

Prioritas: P0

Kesulitan: Sedang

Fitur:

- [ ] Tambah pengalaman.
- [ ] Edit pengalaman.
- [ ] Hapus pengalaman.
- [ ] Tandai pekerjaan saat ini.
- [ ] Urutkan berdasarkan tanggal terbaru.

Field:

- Nama perusahaan.
- Jabatan.
- Tanggal mulai.
- Tanggal selesai.
- Masih bekerja di sini.
- Deskripsi.
- Lokasi.

## 6. Pendidikan

Prioritas: P0

Kesulitan: Sedang

Fitur:

- [ ] Tambah pendidikan.
- [ ] Edit pendidikan.
- [ ] Hapus pendidikan.
- [ ] Field institusi.
- [ ] Field gelar.
- [ ] Field jurusan.
- [ ] Field tahun mulai.
- [ ] Field tahun selesai.
- [ ] Field IPK.

## 7. Sertifikasi

Prioritas: P1

Kesulitan: Sedang

Fitur:

- [ ] Tambah sertifikasi.
- [ ] Edit sertifikasi.
- [ ] Hapus sertifikasi.
- [ ] Link credential.
- [ ] Nama penerbit sertifikat.
- [ ] Tanggal terbit.

## 8. Skill Kandidat

Prioritas: P0

Kesulitan: Sedang

Fitur:

- [ ] Tambah skill dari master data.
- [ ] Isi tahun pengalaman.
- [ ] Isi proficiency.
- [ ] Hapus skill.
- [ ] Badge skill terverifikasi.

## 9. Cari Lowongan Kandidat

Prioritas: P0

Kesulitan: Sedang

Fitur:

- [ ] Search lowongan.
- [ ] Filter kata kunci.
- [ ] Filter lokasi.
- [ ] Filter remote/hybrid/onsite.
- [ ] Filter kisaran gaji.
- [ ] Filter level pengalaman.
- [ ] Filter jenis pekerjaan.
- [ ] Filter industri.
- [ ] Filter company terverifikasi.
- [ ] Filter skill match.
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

## 10. Detail Lowongan Kandidat

Prioritas: P0

Kesulitan: Sedang

Fitur:

- [ ] Detail lowongan.
- [ ] Judul posisi.
- [ ] Nama perusahaan.
- [ ] Salary range jelas.
- [ ] Lokasi dan mode kerja.
- [ ] Badge perusahaan terverifikasi.
- [ ] Job integrity score.
- [ ] AI match score.
- [ ] Penjelasan AI match.
- [ ] Skill cocok.
- [ ] Skill kurang.
- [ ] Deskripsi pekerjaan.
- [ ] Tanggung jawab.
- [ ] Kualifikasi wajib.
- [ ] Kualifikasi tambahan.
- [ ] Tahapan rekrutmen.
- [ ] Recruiter response SLA.
- [ ] Lamar Sekarang.
- [ ] Simpan.
- [ ] Laporkan lowongan.
- [ ] Lowongan serupa.

## 11. Simpan Lowongan

Prioritas: P0

Kesulitan: Mudah

Fitur:

- [ ] Simpan lowongan.
- [ ] Hapus dari simpanan.
- [ ] List lowongan tersimpan.
- [ ] Sonner sukses/gagal.

## 12. Lamar Lowongan

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

Validasi:

- Kandidat harus login.
- Kandidat harus punya CV utama atau memilih CV.
- Kandidat tidak boleh melamar lowongan yang sama dua kali.

## 13. Lamaran Saya

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

Status:

- Terkirim.
- Screening.
- Shortlisted.
- Interview.
- Offering.
- Diterima.
- Ditolak.
- Dibatalkan.

## 14. Interview Kandidat

Prioritas: P1

Kesulitan: Sedang

Fitur:

- [ ] List undangan interview.
- [ ] Detail interview.
- [ ] Konfirmasi jadwal.
- [ ] Tolak jadwal.
- [ ] Link meeting.
- [ ] Reminder interview.

## 15. AI Interview Simulator

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

## 16. Assessment Kandidat

Prioritas: P2

Kesulitan: Sulit

Fitur:

- [ ] List assessment.
- [ ] Mulai assessment.
- [ ] Jawab pertanyaan.
- [ ] Submit assessment.
- [ ] Score assessment.
- [ ] Badge skill terverifikasi.

## 17. Career Coach

Prioritas: P2

Kesulitan: Sulit

Fitur:

- [ ] Chat career coach.
- [ ] Session history.
- [ ] Rekomendasi karier.
- [ ] Rekomendasi learning path.
- [ ] Rekomendasi artikel atau course.

## 18. Report Lowongan

Prioritas: P1

Kesulitan: Mudah

Fitur:

- [ ] Laporkan lowongan.
- [ ] Pilih alasan.
- [ ] Isi catatan.
- [ ] Submit laporan.
- [ ] Admin menerima laporan.

## Permission Kandidat

Kandidat boleh:

- Mengelola profil sendiri.
- Mengelola CV sendiri.
- Melihat lowongan aktif.
- Menyimpan lowongan.
- Melamar lowongan.
- Melihat status lamaran sendiri.
- Melihat jadwal interview sendiri.
- Mengirim pesan pada conversation yang terkait.
- Melaporkan lowongan.

Kandidat tidak boleh:

- Membuat lowongan.
- Melihat kandidat lain.
- Melihat data internal perusahaan.
- Mengubah status lamaran.
