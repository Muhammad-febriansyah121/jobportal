# Fitur Karivia - Public dan Shared

Dokumen ini berisi fitur Public atau Guest serta fitur Shared yang dipakai lintas role. Fitur ini dipisahkan agar dokumen role Admin, Perusahaan, Kandidat, dan Mentor tetap fokus.

## Standar UI Umum

- Bahasa UI: Indonesia.
- Font: Poppins.
- Mode: light mode saja.
- Primary color: `#ED6A2F`.
- Button aksi memakai icon + teks.
- Loading memakai Skeleton.
- Feedback sukses/gagal memakai Sonner.
- Konfirmasi aksi penting memakai Alert Dialog.
- List table memakai DataTable jika berbentuk tabel.

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

## 3. Matrix Fitur per Role

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

## 4. MVP Public dan Shared

MVP Public:

- Landing page.
- Search lowongan.
- Detail lowongan.
- Pricing teaser.
- Login.
- Register kandidat.
- Register perusahaan.

MVP Shared:

- Auth.
- Redirect dashboard berdasarkan role.
- Profile account sederhana.
- Notification database basic.
- Sonner toast.
