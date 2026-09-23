<x-mail::message>
# Lamaran {{ $job?->title ?? 'Lowongan pekerjaan' }}

Yth. Tim rekrutmen {{ $job?->company_name ?? 'perusahaan' }},

Saya {{ $candidate?->full_name ?? $candidateUser?->name ?? 'kandidat' }} bermaksud melamar posisi **{{ $job?->title ?? 'ini' }}**.

**Data kandidat**

- Nama: {{ $candidate?->full_name ?? $candidateUser?->name ?? '-' }}
- Email: {{ $candidateUser?->email ?? '-' }}
- Nomor WhatsApp: {{ $candidateUser?->phone ?? '-' }}

@if (filled($application->cover_letter))
**Surat lamaran**

{{ strip_tags($application->cover_letter) }}
@endif

CV saya lampirkan pada email ini. Saya siap mengikuti proses rekrutmen berikutnya.

Sumber lowongan: {{ $job?->source_url ?? '-' }}

Hormat saya,<br>
{{ $candidate?->full_name ?? $candidateUser?->name ?? 'Kandidat' }}
</x-mail::message>
