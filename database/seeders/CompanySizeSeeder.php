<?php

namespace Database\Seeders;

use App\Models\CompanySize;
use Illuminate\Database\Seeder;

class CompanySizeSeeder extends Seeder
{
    public function run(): void
    {
        $sizes = [
            ['label' => '1-10 karyawan', 'sort_order' => 1],
            ['label' => '11-50 karyawan', 'sort_order' => 2],
            ['label' => '51-200 karyawan', 'sort_order' => 3],
            ['label' => '201-500 karyawan', 'sort_order' => 4],
            ['label' => '501-1000 karyawan', 'sort_order' => 5],
            ['label' => '1001-5000 karyawan', 'sort_order' => 6],
            ['label' => '5000+ karyawan', 'sort_order' => 7],
        ];

        foreach ($sizes as $size) {
            CompanySize::firstOrCreate(['label' => $size['label']], $size);
        }
    }
}
