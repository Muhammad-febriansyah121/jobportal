<?php

namespace App\Http\Controllers\Employer;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class EmployerWorkspaceController extends Controller
{
    public function candidates(): Response
    {
        return $this->page(
            'Kandidat',
            'Kelola pipeline kandidat, shortlist, dan kandidat prioritas dari satu tempat.',
            'Pipeline kandidat akan terhubung dengan lamaran masuk, AI fit score, dan status interview.'
        );
    }

    public function messages(): Response
    {
        return $this->page(
            'Pesan',
            'Pantau percakapan kandidat dan follow-up recruiter.',
            'Inbox kandidat akan menampilkan thread pesan, status terbaca, dan konteks lowongan.'
        );
    }

    public function analytics(): Response
    {
        return $this->page(
            'Analytics',
            'Lihat performa lowongan, sumber kandidat, dan SLA rekrutmen.',
            'Analytics employer akan merangkum conversion rate, response time, dan pipeline velocity.'
        );
    }

    public function billing(): Response
    {
        return $this->page(
            'Billing',
            'Kelola paket aktif, limit lowongan, seat recruiter, dan riwayat pembayaran.',
            'Billing akan tersambung dengan subscription, invoice, dan kuota AI screening.'
        );
    }

    public function talentSearch(): Response
    {
        return $this->page(
            'Cari Talenta',
            'Temukan kandidat relevan berdasarkan skill, lokasi, pengalaman, dan kecocokan AI.',
            'Talent search akan memakai filter kandidat dan rekomendasi match score.'
        );
    }

    private function page(string $title, string $description, string $message): Response
    {
        return Inertia::render('employer/workspace', [
            'title' => $title,
            'description' => $description,
            'message' => $message,
        ]);
    }
}
