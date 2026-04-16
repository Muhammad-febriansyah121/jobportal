<?php

namespace App\Http\Controllers\Candidate;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class CandidateWorkspaceController extends Controller
{
    public function messages(): Response
    {
        return Inertia::render('candidate/workspace', [
            'title' => 'Pesan',
            'description' => 'Pantau percakapan dengan recruiter dan update proses seleksi.',
            'message' => 'Inbox kandidat akan menampilkan pesan recruiter, undangan interview, dan tindak lanjut lamaran.',
        ]);
    }
}
