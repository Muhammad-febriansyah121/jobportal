<?php

namespace App\Ai\Agents;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Attributes\Model;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Promptable;
use Stringable;

#[Model('gpt-5')]
class AiFitScoreAnalyzer implements Agent, HasStructuredOutput
{
    use Promptable;

    public function instructions(): Stringable|string
    {
        return <<<'PROMPT'
            Kamu adalah sistem penilaian kesesuaian kandidat dengan lowongan kerja.
            Hitung skor kesesuaian (fit_score) dari 0 sampai 100 menggunakan bobot berikut:

            1. Kesesuaian keterampilan dan kompetensi     → bobot 35%
               Bandingkan skills kandidat dengan skills yang dibutuhkan lowongan.
               Nilai 35 jika semua skill cocok, proporsional jika sebagian cocok.

            2. Kesesuaian pengalaman kerja               → bobot 25%
               Bandingkan pengalaman kerja kandidat (jabatan, durasi, relevansi)
               dengan kebutuhan pengalaman lowongan.

            3. Kesesuaian posisi atau jabatan             → bobot 15%
               Seberapa mirip judul jabatan/headline kandidat dengan posisi yang dibuka.

            4. Kesesuaian level senioritas                → bobot 10%
               Cocokkan experience_level lowongan (entry/mid/senior/lead/manager)
               dengan level aktual kandidat dari pengalaman kerjanya.

            5. Kesesuaian industri atau bidang kerja      → bobot 5%
               Seberapa relevan industri pengalaman kandidat dengan industri lowongan.

            6. Kesesuaian preferensi kerja                → bobot 10%
               Cocokkan work_mode_pref kandidat (remote/hybrid/onsite)
               dengan work_mode lowongan.

            Hitung skor tiap komponen (0-100), kalikan bobotnya, jumlahkan jadi fit_score final.
            Kembalikan juga daftar matched_skills dan missing_skills.
            Jangan inflate skor — nilailah secara objektif berdasarkan data.
        PROMPT;
    }

    public function schema(JsonSchema $schema): array
    {
        return [
            'fit_score' => $schema->integer()->min(0)->max(100)->required(),
            'skill_score' => $schema->integer()->min(0)->max(100)->required(),
            'experience_score' => $schema->integer()->min(0)->max(100)->required(),
            'position_score' => $schema->integer()->min(0)->max(100)->required(),
            'seniority_score' => $schema->integer()->min(0)->max(100)->required(),
            'industry_score' => $schema->integer()->min(0)->max(100)->required(),
            'work_preference_score' => $schema->integer()->min(0)->max(100)->required(),
            'matched_skills' => $schema->array()->items($schema->string())->required(),
            'missing_skills' => $schema->array()->items($schema->string())->required(),
        ];
    }
}
