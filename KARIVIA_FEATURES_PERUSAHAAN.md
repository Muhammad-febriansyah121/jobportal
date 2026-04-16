# Fitur Karivia - Role Perusahaan

Dokumen ini berisi fitur khusus untuk role Perusahaan atau Employer. Perusahaan memakai Karivia untuk membuat lowongan, mengelola pelamar, mencari kandidat, menjadwalkan interview, dan melihat analytics rekrutmen.

## Standar UI Perusahaan

- Bahasa UI: Indonesia.
- Font: Poppins.
- Mode: light mode saja.
- Primary color: `#ED6A2F`.
- Button aksi memakai icon + teks.
- Loading memakai Skeleton.
- Feedback sukses/gagal memakai Sonner.
- Konfirmasi aksi penting memakai Alert Dialog.
- List table memakai DataTable shadcn/ui.

Karakter UI:

- Profesional.
- Cepat.
- Berbasis data.
- Fokus pipeline.
- Fokus SLA.

## Prioritas

- P0: Wajib untuk MVP.
- P1: Penting setelah MVP stabil.
- P2: Advanced.
- P3: Enhancement.

## 1. Dashboard Perusahaan

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

Data loading:

- Eager loading company.
- Gunakan aggregate query untuk metric.
- Gunakan Skeleton untuk metric card dan shortlist card.

## 2. Onboarding Perusahaan

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

Tujuan:

- Perusahaan punya profil dasar sebelum membuat lowongan.
- Data perusahaan siap diverifikasi admin.

## 3. Profil Perusahaan

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

Public profile menampilkan:

- Logo dan cover.
- Deskripsi.
- Industri.
- Ukuran perusahaan.
- Lokasi kantor.
- Budaya kerja.
- Benefit.
- Badge trust.
- Lowongan aktif.

## 4. Verifikasi Perusahaan

Prioritas: P0

Kesulitan: Sedang

Fitur:

- [ ] Upload dokumen legal.
- [ ] Isi NIB.
- [ ] Isi NPWP.
- [ ] Submit verifikasi.
- [ ] Lihat status verifikasi.
- [ ] Re-submit jika need revision.

Status:

- Belum diajukan.
- Pending.
- Approved.
- Rejected.
- Need Revision.

## 5. Team Member Recruiter

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

## 6. Kelola Lowongan

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

Query:

```php
JobListing::query()
    ->select(['id', 'company_id', 'title', 'slug', 'status', 'work_mode', 'job_type', 'published_at', 'created_at'])
    ->withCount('applications')
    ->where('company_id', $companyId)
    ->latest()
    ->paginate(15);
```

## 7. Form Buat Lowongan

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

Validasi penting:

- Salary min tidak boleh lebih besar dari salary max.
- Lowongan publish harus punya deskripsi dan kualifikasi.
- Perusahaan belum verified boleh draft, tapi publish bisa dibatasi sesuai aturan produk.

## 8. AI Job Integrity Check

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

Output:

- Integrity score 0-100.
- Label trust.
- Daftar rekomendasi perbaikan.

## 9. Pipeline Kandidat

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

Query:

```php
Application::query()
    ->select(['id', 'job_listing_id', 'candidate_id', 'status', 'ai_fit_score', 'applied_at', 'first_responded_at'])
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

## 10. Detail Aplikasi Kandidat

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

## 11. Talent Search

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

## 12. Detail Kandidat untuk Recruiter

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

## 13. Saved Candidate

Prioritas: P1

Kesulitan: Mudah

Fitur:

- [ ] Simpan kandidat.
- [ ] Hapus kandidat dari simpanan.
- [ ] List kandidat tersimpan.
- [ ] Sonner sukses/gagal.

## 14. Interview Scheduling

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

## 15. Interview Scorecard

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

## 16. Analytics Lowongan

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

## 17. Subscription dan Billing

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

## 18. Report Kandidat

Prioritas: P2

Kesulitan: Mudah

Fitur:

- [ ] Report kandidat.
- [ ] Pilih alasan.
- [ ] Isi catatan.
- [ ] Submit ke admin.

## Permission Perusahaan

Perusahaan boleh:

- Mengelola profil perusahaan sendiri.
- Mengelola anggota perusahaan sendiri.
- Membuat lowongan untuk perusahaan sendiri.
- Melihat pelamar untuk lowongan perusahaan sendiri.
- Mengubah pipeline pelamar perusahaan sendiri.
- Mencari kandidat jika paket mengizinkan.
- Menjadwalkan interview.
- Mengirim pesan ke kandidat terkait.

Perusahaan tidak boleh:

- Mengakses data perusahaan lain.
- Mengubah data kandidat di luar proses rekrutmen.
- Melihat admin logs.
- Mengubah pricing plan sendiri tanpa subscription flow.
