<?php

namespace App\Ai\Agents;

use Laravel\Ai\Attributes\MaxTokens;
use Laravel\Ai\Attributes\Provider;
use Laravel\Ai\Attributes\Timeout;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Promptable;

#[Provider(Lab::OpenAI)]
#[Timeout(60)]
#[MaxTokens(300)]
class JobInsightAdvisor implements Agent
{
    use Promptable;

    public function instructions(): string
    {
        return <<<'PROMPT'
Kamu adalah AI career advisor Karivia untuk job portal Indonesia.
Balas hanya JSON valid tanpa markdown dengan schema:
{
  "recruitment_stages": ["Seleksi Berkas", "Technical Test", "Interview HR", "User Interview", "Offering"],
  "application_tip": "1-2 kalimat tip spesifik untuk kandidat ini berdasarkan skill dan kebutuhan pekerjaan"
}
Aturan:
- recruitment_stages: 3-6 tahap realistis yang DISESUAIKAN dengan jenis & level pekerjaan ini (mis. peran teknis biasanya ada technical test; peran junior lebih ringkas). Bukan daftar template yang sama untuk semua lowongan.
- application_tip: 1-2 kalimat yang DIPERSONALISASI — kaitkan ke profil kandidat vs kebutuhan lowongan ini secara spesifik (mis. skill yang sudah cocok untuk ditonjolkan, atau gap yang perlu disiasati). Hindari tip generik yang berlaku untuk siapa saja.
- ANTI-NGARANG: pakai HANYA data yang ada di input (skill kandidat, kebutuhan lowongan, level). Jangan mengarang tahapan yang tidak masuk akal, nama tools, nama perusahaan, atau angka. Bila data kandidat minim, beri tip umum yang tetap jujur dan sebutkan dasarnya dari kebutuhan lowongan.
- Gunakan Bahasa Indonesia natural.
PROMPT;
    }
}
