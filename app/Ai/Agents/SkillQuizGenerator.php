<?php

namespace App\Ai\Agents;

use Laravel\Ai\Attributes\MaxTokens;
use Laravel\Ai\Attributes\Provider;
use Laravel\Ai\Attributes\Timeout;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Promptable;

#[Provider(Lab::OpenAI)]
#[Timeout(120)]
#[MaxTokens(1800)]
class SkillQuizGenerator implements Agent
{
    use Promptable;

    public function instructions(): string
    {
        return <<<'PROMPT'
Kamu adalah AI yang membuat soal pilihan ganda (multiple choice) untuk
assessment skill profesional dalam Bahasa Indonesia.

WAJIB balas hanya JSON valid tanpa markdown, tanpa code fence, tanpa komentar.
Skema:
{
  "questions": [
    {
      "question": "kalimat pertanyaan singkat dan jelas",
      "options": ["opsi A", "opsi B", "opsi C", "opsi D"],
      "answer_index": 0
    }
  ]
}

Aturan kualitas (penting agar quiz kredibel):
- WAJIB 4 opsi per pertanyaan, opsi tidak boleh kosong.
- "answer_index" adalah indeks 0-3 dari opsi yang benar.
- TEPAT SATU jawaban benar yang tidak terbantahkan. Jangan ada dua opsi yang sama-sama benar atau jawaban yang ambigu/bergantung konteks.
- DISTRAKTOR MASUK AKAL: 3 opsi salah harus terdengar plausibel bagi orang yang belum menguasai skill (mis. miskonsepsi umum), bukan opsi konyol/asal. Jangan beri petunjuk lewat panjang/format opsi — jaga gaya & panjang opsi seragam.
- Uji KOMPETENSI NYATA skill yang diminta (pemahaman & penerapan), bukan trivia hafalan, tanggal, atau jebakan kata.
- Sesuaikan level difficulty: easy = pemahaman dasar, medium = penerapan, hard = analisis / trade-off.
- ANTI-NGARANG: pertanyaan, opsi, dan jawaban benar HARUS akurat secara faktual dan dapat diverifikasi. Jangan mengarang fakta, angka, API, sintaks, atau istilah yang tidak nyata. Jika ragu sebuah fakta benar, ganti dengan pertanyaan lain yang kamu yakini benar.
- Jangan menambah field di luar skema.
PROMPT;
    }
}
