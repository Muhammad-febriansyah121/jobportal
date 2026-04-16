# Fitur Karivia - Role Mentor

Dokumen ini berisi fitur khusus untuk role Mentor. Mentor membantu kandidat mengembangkan karier melalui review profil, catatan mentoring, skill gap, learning path, dan rekomendasi karier.

## Standar UI Mentor

- Bahasa UI: Indonesia.
- Font: Poppins.
- Mode: light mode saja.
- Primary color: `#ED6A2F`.
- Button aksi memakai icon + teks.
- Loading memakai Skeleton.
- Feedback sukses/gagal memakai Sonner.
- Konfirmasi aksi penting memakai Alert Dialog.

Karakter UI:

- Tenang.
- Fokus progress kandidat.
- Mudah mencatat.
- Mudah memberi rekomendasi.

## Prioritas

- P0: Minimal placeholder untuk MVP.
- P1: Penting setelah kandidat dan lowongan stabil.
- P2: Advanced.
- P3: Enhancement.

## 1. Dashboard Mentor

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

MVP awal:

- [ ] Dashboard placeholder.
- [ ] Profil mentor dasar.

## 2. Profil Mentor

Prioritas: P1

Kesulitan: Sedang

Fitur:

- [ ] Edit headline.
- [ ] Edit bio.
- [ ] Edit expertise.
- [ ] Edit availability.
- [ ] Edit rate jika mentoring berbayar.
- [ ] Upload foto.

Field:

- Headline.
- Bio.
- Expertise.
- Availability.
- Rate.
- Foto profil.

## 3. Kandidat Bimbingan

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

Data loading:

- Eager loading kandidat.
- Eager loading skills.
- Eager loading primary CV.
- Pagination untuk list kandidat.

## 4. Detail Kandidat Bimbingan

Prioritas: P1

Kesulitan: Sedang

Fitur:

- [ ] Header kandidat.
- [ ] Headline kandidat.
- [ ] Lokasi.
- [ ] CV summary.
- [ ] Skill list.
- [ ] Pengalaman.
- [ ] Pendidikan.
- [ ] Sertifikasi.
- [ ] Catatan mentoring.
- [ ] Learning path aktif.
- [ ] Progress assessment.

## 5. Catatan Mentoring

Prioritas: P1

Kesulitan: Sedang

Fitur:

- [ ] Tambah catatan.
- [ ] Edit catatan.
- [ ] Hapus catatan.
- [ ] Tandai private atau visible to candidate.
- [ ] Kategori catatan.

Kategori:

- CV.
- Interview.
- Skill.
- Career direction.
- Portfolio.
- Follow up.

## 6. Skill Gap Kandidat

Prioritas: P2

Kesulitan: Sulit

Fitur:

- [ ] Pilih target role.
- [ ] Bandingkan skill kandidat dengan kebutuhan role.
- [ ] Tampilkan skill cocok.
- [ ] Tampilkan skill kurang.
- [ ] Rekomendasi assessment.
- [ ] Rekomendasi learning path.

Output:

- Skill yang sudah kuat.
- Skill yang perlu ditingkatkan.
- Prioritas belajar.
- Rekomendasi materi.

## 7. Learning Path

Prioritas: P2

Kesulitan: Sedang

Fitur:

- [ ] Buat learning path.
- [ ] Tambah step.
- [ ] Edit step.
- [ ] Hapus step.
- [ ] Urutkan step.
- [ ] Tandai selesai.
- [ ] Tambah resource.
- [ ] Track progress.

## 8. Review CV

Prioritas: P2

Kesulitan: Sedang

Fitur:

- [ ] Lihat CV kandidat.
- [ ] Tambah komentar.
- [ ] Beri rekomendasi perbaikan.
- [ ] Tandai review selesai.
- [ ] Riwayat review CV.

## 9. Rekomendasi Karier

Prioritas: P2

Kesulitan: Sulit

Fitur:

- [ ] Generate rekomendasi karier.
- [ ] Pilih career path.
- [ ] Beri alasan rekomendasi.
- [ ] Tambahkan learning path.
- [ ] Hubungkan ke lowongan relevan.

## 10. Materi Karier

Prioritas: P1

Kesulitan: Mudah

Fitur:

- [ ] Lihat resource.
- [ ] Filter kategori.
- [ ] Bagikan resource ke kandidat.
- [ ] Simpan resource favorit.

## 11. Jadwal Mentoring

Prioritas: P2

Kesulitan: Sedang

Fitur:

- [ ] Buat jadwal sesi.
- [ ] Kandidat konfirmasi.
- [ ] Kandidat batalkan.
- [ ] Link meeting.
- [ ] Reminder.

## 12. Chat Mentor dan Kandidat

Prioritas: P2

Kesulitan: Sedang

Fitur:

- [ ] Conversation mentor-kandidat.
- [ ] Kirim pesan.
- [ ] Read status.
- [ ] Attachment opsional.
- [ ] Link resource.

## Permission Mentor

Mentor boleh:

- Mengelola profil mentor sendiri.
- Melihat kandidat bimbingan.
- Menambah catatan mentoring.
- Membuat learning path.
- Memberi rekomendasi karier.
- Membagikan resource.

Mentor tidak boleh:

- Melihat semua kandidat bebas seperti recruiter.
- Mengubah status lamaran.
- Mengakses data billing perusahaan.
- Mengelola lowongan.
