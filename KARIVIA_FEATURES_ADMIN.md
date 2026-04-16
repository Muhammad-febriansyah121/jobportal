# Fitur Karivia - Role Admin

Dokumen ini berisi fitur khusus untuk role Admin. Admin adalah tim internal Karivia yang mengelola operasional platform, trust, moderasi, verifikasi, master data, subscription, dan audit AI.

## Standar UI Admin

- Bahasa UI: Indonesia.
- Font: Poppins.
- Mode: light mode saja.
- Primary color: `#ED6A2F`.
- Semua list utama memakai DataTable shadcn/ui.
- Loading memakai Skeleton.
- Feedback sukses/gagal memakai Sonner.
- Aksi destruktif memakai Alert Dialog.
- Semua button aksi memakai icon + teks.

Contoh button:

- `EyeIcon` + `Lihat Detail`
- `CheckIcon` + `Setujui`
- `XIcon` + `Tolak`
- `ShieldCheckIcon` + `Verifikasi`
- `BanIcon` + `Suspend`
- `PencilIcon` + `Edit`
- `TrashIcon` + `Hapus`

## Prioritas

- P0: Wajib untuk MVP.
- P1: Penting setelah MVP stabil.
- P2: Advanced.
- P3: Enhancement.

## 1. Dashboard Admin

Prioritas: P0

Kesulitan: Sedang

Fitur:

- [ ] Total user.
- [ ] Total kandidat.
- [ ] Total perusahaan.
- [ ] Total mentor.
- [ ] Total lowongan aktif.
- [ ] Total lamaran.
- [ ] Perusahaan menunggu verifikasi.
- [ ] Report pending.
- [ ] Subscription aktif.
- [ ] AI usage summary.
- [ ] Platform activity terbaru.

Data loading:

- Gunakan aggregate query.
- Gunakan cache pendek untuk metrik berat.
- Gunakan Skeleton untuk metric card.

## 2. Kelola User

Prioritas: P0

Kesulitan: Sedang

Fitur:

- [ ] DataTable user.
- [ ] Search nama/email.
- [ ] Filter role.
- [ ] Filter status aktif.
- [ ] Detail user.
- [ ] Aktifkan user.
- [ ] Nonaktifkan user.
- [ ] Lihat activity user.
- [ ] Reset email verification jika diperlukan.

Kolom table:

- Nama
- Email
- Role
- Status
- Tanggal daftar
- Aksi

Query:

```php
User::query()
    ->select(['id', 'name', 'email', 'role', 'is_active', 'created_at'])
    ->latest()
    ->paginate(15);
```

## 3. Kelola Perusahaan

Prioritas: P0

Kesulitan: Sedang

Fitur:

- [ ] DataTable perusahaan.
- [ ] Search nama perusahaan.
- [ ] Filter verification status.
- [ ] Filter industri.
- [ ] Detail perusahaan.
- [ ] Lihat profil public perusahaan.
- [ ] Lihat lowongan perusahaan.
- [ ] Lihat anggota recruiter.
- [ ] Suspend perusahaan.
- [ ] Aktifkan kembali perusahaan.

Kolom table:

- Logo
- Nama perusahaan
- Industri
- Status verifikasi
- Lowongan aktif
- Tanggal bergabung
- Aksi

Query:

```php
Company::query()
    ->select(['id', 'industry_id', 'name', 'slug', 'logo_url', 'verification_status', 'is_verified', 'created_at'])
    ->with(['industry:id,name'])
    ->withCount(['jobListings as active_jobs_count' => fn ($query) => $query->where('status', 'published')])
    ->latest()
    ->paginate(15);
```

## 4. Verifikasi Perusahaan

Prioritas: P0

Kesulitan: Sedang

Fitur:

- [ ] DataTable submission verifikasi.
- [ ] Detail dokumen legal.
- [ ] Lihat NIB.
- [ ] Lihat NPWP.
- [ ] Lihat dokumen upload.
- [ ] Approve.
- [ ] Reject.
- [ ] Need revision.
- [ ] Catatan reviewer.
- [ ] Kirim notifikasi ke perusahaan.

Status:

- Pending
- Approved
- Rejected
- Need Revision

Alert Dialog:

- Tolak verifikasi.
- Setujui verifikasi.
- Minta revisi.

## 5. Kelola Lowongan

Prioritas: P0

Kesulitan: Sedang

Fitur:

- [ ] DataTable lowongan.
- [ ] Search judul lowongan.
- [ ] Filter status.
- [ ] Filter perusahaan.
- [ ] Filter industri.
- [ ] Detail lowongan.
- [ ] Lihat job integrity score.
- [ ] Update integrity score manual.
- [ ] Publish.
- [ ] Suspend.
- [ ] Reject.

Kolom table:

- Judul
- Perusahaan
- Lokasi
- Status
- Integrity score
- Tanggal publish
- Aksi

Query:

```php
JobListing::query()
    ->select(['id', 'company_id', 'industry_id', 'title', 'slug', 'status', 'integrity_score', 'published_at', 'created_at'])
    ->with(['company:id,name,slug,is_verified', 'industry:id,name'])
    ->withCount('applications')
    ->latest()
    ->paginate(15);
```

## 6. Moderasi Report

Prioritas: P1

Kesulitan: Sedang

Fitur:

- [ ] DataTable report.
- [ ] Filter status.
- [ ] Filter tipe subject.
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

## 7. Kelola Skill

Prioritas: P0

Kesulitan: Mudah

Fitur:

- [ ] DataTable skill.
- [ ] Tambah skill.
- [ ] Edit skill.
- [ ] Hapus skill.
- [ ] Kategori skill.
- [ ] Cache skill list.

Kolom:

- Nama
- Slug
- Kategori
- Jumlah kandidat
- Jumlah lowongan
- Aksi

## 8. Kelola Industri

Prioritas: P0

Kesulitan: Mudah

Fitur:

- [ ] DataTable industri.
- [ ] Tambah industri.
- [ ] Edit industri.
- [ ] Hapus industri.
- [ ] Cache industry list.

Kolom:

- Nama
- Slug
- Jumlah perusahaan
- Jumlah lowongan
- Aksi

## 9. Kelola Pricing Plan

Prioritas: P1

Kesulitan: Mudah

Fitur:

- [ ] DataTable pricing plan.
- [ ] Tambah paket.
- [ ] Edit paket.
- [ ] Aktif/nonaktif paket.
- [ ] Set harga.
- [ ] Set active jobs limit.
- [ ] Set recruiter seat limit.
- [ ] Set AI screening quota.
- [ ] Set talent search quota.
- [ ] Set feature list.

Plan:

- Starter
- Growth
- Enterprise

## 10. Kelola Subscription

Prioritas: P2

Kesulitan: Sedang

Fitur:

- [ ] DataTable subscription.
- [ ] Filter status.
- [ ] Detail subscription.
- [ ] Extend subscription manual.
- [ ] Cancel subscription manual.
- [ ] Lihat payment history.
- [ ] Lihat company usage.

## 11. Kelola Salary Insight

Prioritas: P1

Kesulitan: Sedang

Fitur:

- [ ] DataTable salary insight.
- [ ] Tambah salary insight.
- [ ] Edit salary insight.
- [ ] Hapus salary insight.
- [ ] Import data opsional.
- [ ] Publish insight.

Data:

- Job title
- Industri
- Company
- Salary min
- Salary median
- Salary max
- Source count

## 12. Kelola Career Resource

Prioritas: P1

Kesulitan: Mudah

Fitur:

- [ ] DataTable resource.
- [ ] Tambah artikel.
- [ ] Edit artikel.
- [ ] Publish/unpublish.
- [ ] Hapus artikel.
- [ ] Kategori resource.

## 13. Kelola Mentor

Prioritas: P1

Kesulitan: Sedang

Fitur:

- [ ] DataTable mentor.
- [ ] Detail mentor.
- [ ] Verifikasi mentor.
- [ ] Aktif/nonaktif mentor.
- [ ] Lihat kandidat bimbingan.
- [ ] Lihat rating atau feedback jika tersedia.

## 14. AI Audit Log

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

AI feature yang diaudit:

- CV summary
- Natural language search parser
- Match score explanation
- Job integrity score
- Interview analysis
- Career recommendation

## 15. Activity Log

Prioritas: P2

Kesulitan: Sedang

Fitur:

- [ ] DataTable activity logs.
- [ ] Filter actor.
- [ ] Filter action.
- [ ] Filter subject.
- [ ] Detail properties.

Aksi sensitif yang wajib masuk log:

- Suspend user.
- Suspend perusahaan.
- Approve/reject verifikasi.
- Publish/suspend lowongan.
- Update pricing.
- Cancel subscription.

## 16. Platform Analytics

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

## Permission Admin

Admin boleh:

- Mengelola seluruh data platform.
- Verifikasi perusahaan.
- Moderasi lowongan.
- Moderasi laporan.
- Mengelola master data.
- Mengelola pricing.
- Mengelola subscription.
- Melihat audit log.

Catatan:

- Semua aksi destruktif wajib memakai Alert Dialog.
- Semua aksi sensitif wajib masuk activity log.
- Semua list besar wajib DataTable server-side pagination.
