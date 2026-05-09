<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $defaultBenefits = <<<'HTML'
<ul>
    <li>BPJS Kesehatan & BPJS Ketenagakerjaan</li>
    <li>Tunjangan Hari Raya (THR) sesuai regulasi</li>
    <li>Cuti tahunan 12 hari + cuti khusus</li>
    <li>Bonus performance kuartalan</li>
    <li>Lingkungan kerja kolaboratif & jenjang karier yang jelas</li>
    <li>Program training & sertifikasi profesional</li>
</ul>
HTML;

        $techBenefits = <<<'HTML'
<ul>
    <li>BPJS Kesehatan & BPJS Ketenagakerjaan untuk karyawan dan keluarga</li>
    <li>Tunjangan Hari Raya (THR) + bonus tahunan berbasis performa</li>
    <li>Cuti tahunan 14 hari + unlimited sick leave</li>
    <li>Asuransi kesehatan swasta dengan coverage rawat inap</li>
    <li>Hardware allowance (laptop, monitor, peripheral) Rp15.000.000</li>
    <li>Budget pengembangan diri Rp10.000.000/tahun (kursus, konferensi, buku)</li>
    <li>Fleksibilitas jam kerja & opsi remote/hybrid</li>
    <li>Stock option program untuk karyawan tetap</li>
</ul>
HTML;

        $businessBenefits = <<<'HTML'
<ul>
    <li>Gaji pokok kompetitif + komisi/insentif penjualan</li>
    <li>BPJS Kesehatan & BPJS Ketenagakerjaan</li>
    <li>Tunjangan Hari Raya (THR) + bonus tahunan</li>
    <li>Cuti tahunan 12 hari + cuti khusus</li>
    <li>Tunjangan transportasi & komunikasi</li>
    <li>Pelatihan sales & business development berkala</li>
    <li>Networking event & company retreat tahunan</li>
    <li>Career path yang jelas menuju Senior/Lead role</li>
</ul>
HTML;

        $techIds = [1, 2, 3, 6, 7, 11, 12, 13, 18, 19];
        $businessIds = [9, 14, 15, 22];

        DB::table('job_listings')
            ->whereIn('id', $techIds)
            ->update(['benefits' => $techBenefits]);

        DB::table('job_listings')
            ->whereIn('id', $businessIds)
            ->update(['benefits' => $businessBenefits]);

        DB::table('job_listings')
            ->whereNull('benefits')
            ->update(['benefits' => $defaultBenefits]);
    }

    public function down(): void
    {
        DB::table('job_listings')->update(['benefits' => null]);
    }
};
