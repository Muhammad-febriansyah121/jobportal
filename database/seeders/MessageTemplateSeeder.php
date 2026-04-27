<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\MessageTemplate;
use Illuminate\Database\Seeder;

class MessageTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $companies = Company::query()->get();

        if ($companies->isEmpty()) {
            return;
        }

        $templates = $this->dummyTemplates();

        foreach ($companies as $company) {
            foreach ($templates as $template) {
                MessageTemplate::firstOrCreate(
                    [
                        'company_id' => $company->id,
                        'name' => $template['name'],
                    ],
                    array_merge($template, [
                        'company_id' => $company->id,
                        'created_by' => $company->owner_id,
                    ]),
                );
            }
        }
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function dummyTemplates(): array
    {
        return [
            [
                'name' => 'Konfirmasi Lamaran Diterima',
                'channel' => 'whatsapp',
                'subject' => null,
                'body' => "Halo {nama},\n\nTerima kasih sudah melamar posisi {posisi} di {perusahaan}. Lamaran Anda sudah kami terima dan akan ditinjau oleh tim rekrutmen dalam 3-5 hari kerja.\n\nKami akan menghubungi Anda kembali jika lolos ke tahap berikutnya.\n\nSalam hangat,\nTim {perusahaan}",
                'description' => 'Auto-konfirmasi setelah kandidat melamar.',
                'is_active' => true,
            ],
            [
                'name' => 'Undangan Walk-in Interview',
                'channel' => 'whatsapp',
                'subject' => null,
                'body' => "Halo {nama},\n\nSelamat, Anda kami undang untuk walk-in interview posisi {posisi} di {perusahaan}.\n\nMohon balas pesan ini untuk konfirmasi kehadiran. Detail jadwal akan kami kirim setelah konfirmasi diterima.\n\nTerima kasih,\nTim {perusahaan}",
                'description' => 'Pakai untuk shortlist yang lolos screening CV.',
                'is_active' => true,
            ],
            [
                'name' => 'Penolakan Sopan',
                'channel' => 'whatsapp',
                'subject' => null,
                'body' => "Halo {nama},\n\nTerima kasih atas waktu dan minat Anda untuk posisi {posisi} di {perusahaan}.\n\nMohon maaf, untuk saat ini kami belum bisa melanjutkan ke tahap berikutnya. Profil Anda kami simpan di talent pool dan akan kami pertimbangkan untuk lowongan lain yang sesuai.\n\nSukses selalu,\nTim {perusahaan}",
                'description' => 'Penolakan halus. Kandidat tetap dijaga relasi-nya.',
                'is_active' => true,
            ],
            [
                'name' => 'Undangan Interview AI - Email',
                'channel' => 'email',
                'subject' => 'Undangan AI Interview untuk posisi {posisi}',
                'body' => "Halo {nama},\n\nKami senang mengundang Anda untuk mengikuti AI Interview tahap awal untuk posisi {posisi} di {perusahaan}.\n\nLink dan jadwal interview akan kami kirim terpisah melalui notifikasi sistem dan WhatsApp. Mohon siapkan:\n- Koneksi internet stabil\n- Mikrofon yang berfungsi\n- Ruangan yang tenang\n\nDurasi interview sekitar 15-30 menit.\n\nJika ada pertanyaan, balas email ini.\n\nSalam hangat,\nTim Rekrutmen {perusahaan}",
                'description' => 'Pengantar undangan AI interview.',
                'is_active' => true,
            ],
            [
                'name' => 'Penawaran Kerja - Email',
                'channel' => 'email',
                'subject' => 'Tawaran Bergabung di {perusahaan}',
                'body' => "Halo {nama},\n\nKami sangat senang menyampaikan bahwa Anda terpilih untuk bergabung di {perusahaan} sebagai {posisi}.\n\nDetail penawaran (gaji, benefit, tanggal mulai) akan kami kirim dalam dokumen offering letter terpisah dalam 1x24 jam.\n\nMohon konfirmasi penerimaan tawaran ini paling lambat 3 hari kerja setelah Anda menerima offering letter.\n\nSelamat dan sampai jumpa,\nTim Rekrutmen {perusahaan}",
                'description' => 'Email pemberitahuan offer. Detail dikirim terpisah.',
                'is_active' => true,
            ],
            [
                'name' => 'Reminder Interview Besok',
                'channel' => 'whatsapp',
                'subject' => null,
                'body' => "Halo {nama},\n\nMengingatkan bahwa Anda dijadwalkan interview untuk posisi {posisi} di {perusahaan} besok.\n\nMohon hadir tepat waktu dan siapkan dokumen yang dibutuhkan. Jika ada kendala, mohon segera hubungi kami.\n\nSampai jumpa besok,\nTim {perusahaan}",
                'description' => 'Kirim H-1 untuk reminder.',
                'is_active' => true,
            ],
        ];
    }
}
