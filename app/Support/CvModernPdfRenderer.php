<?php

namespace App\Support;

use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Str;

class CvModernPdfRenderer
{
    /**
     * Render the "modern" photo CV template to a PDF binary string.
     *
     * @param  array<string, mixed>  $builderData
     */
    public function render(array $builderData): string
    {
        $options = new Options;
        $options->set('isRemoteEnabled', false);
        $options->set('isHtml5ParserEnabled', true);
        $options->set('defaultFont', 'DejaVu Serif');

        $dompdf = new Dompdf($options);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->loadHtml($this->buildHtml($builderData), 'UTF-8');
        $dompdf->render();

        return (string) $dompdf->output();
    }

    /**
     * @param  array<string, mixed>  $builderData
     */
    private function buildHtml(array $builderData): string
    {
        $personal = is_array($builderData['personal'] ?? null) ? $builderData['personal'] : [];

        $name = Str::upper((string) ($personal['full_name'] ?? 'Kandidat'));
        $birthLine = $this->joinFilled([
            (string) ($personal['birth_place'] ?? ''),
            (string) ($personal['birth_date'] ?? ''),
        ], ', ');
        $degreeTitle = (string) ($personal['degree_title'] ?? $personal['headline'] ?? '');

        $links = collect([
            $personal['linkedin'] ?? null,
            $personal['github'] ?? null,
            $personal['portfolio'] ?? null,
        ])->filter(fn ($v): bool => is_string($v) && $v !== '')->values()->all();

        return View::make('pdf.cv-modern', [
            'name' => $name,
            'birthLine' => $birthLine,
            'degreeTitle' => $degreeTitle,
            'city' => (string) ($personal['city'] ?? ''),
            'phone' => (string) ($personal['phone'] ?? ''),
            'email' => (string) ($personal['email'] ?? ''),
            'links' => $links,
            'photo' => $this->photoDataUri($personal['photo_path'] ?? null),
            'icons' => $this->icons(),
            'summary' => trim((string) ($builderData['summary'] ?? '')),
            'educations' => $this->mapEducations($builderData['educations'] ?? []),
            'academic' => $this->stringList($builderData['academic'] ?? []),
            'experiences' => $this->mapExperiences($builderData['experiences'] ?? []),
            'skills' => $this->stringList($builderData['skills'] ?? []),
            'certifications' => $this->mapCertifications($builderData['certifications'] ?? []),
            'languages' => $this->mapLanguages($builderData['languages'] ?? []),
        ])->render();
    }

    /**
     * @param  array<int, mixed>  $items
     * @return array<int, array{school: string, detail: string, period: string, bullets: array<int, string>}>
     */
    private function mapEducations(array $items): array
    {
        return collect($items)
            ->filter(fn ($e): bool => is_array($e))
            ->map(fn (array $e): array => [
                'school' => (string) ($e['school_name'] ?? ''),
                'detail' => $this->joinFilled([
                    (string) ($e['degree'] ?? ''),
                    (string) ($e['field_of_study'] ?? ''),
                ], ' | '),
                'period' => $this->period((string) ($e['start_year'] ?? ''), (string) ($e['end_year'] ?? '')),
                'bullets' => $this->bullets((string) ($e['description'] ?? '')),
            ])
            ->filter(fn (array $e): bool => $e['school'] !== '')
            ->values()
            ->all();
    }

    /**
     * @param  array<int, mixed>  $items
     * @return array<int, array{company: string, role: string, period: string, paragraph: string, bullets: array<int, string>}>
     */
    private function mapExperiences(array $items): array
    {
        return collect($items)
            ->filter(fn ($e): bool => is_array($e))
            ->map(function (array $e): array {
                $description = (string) ($e['description'] ?? '');
                $bullets = $this->bullets($description);

                return [
                    'company' => (string) ($e['company_name'] ?? ''),
                    'role' => (string) ($e['job_title'] ?? ''),
                    'period' => $this->joinFilled([
                        (string) ($e['location'] ?? ''),
                        $this->period(
                            (string) ($e['start_date'] ?? ''),
                            ($e['is_current'] ?? false) ? 'Sekarang' : (string) ($e['end_date'] ?? '')
                        ),
                    ], ' | '),
                    'paragraph' => $bullets === [] ? trim($description) : '',
                    'bullets' => $bullets,
                ];
            })
            ->filter(fn (array $e): bool => $e['company'] !== '' || $e['role'] !== '')
            ->values()
            ->all();
    }

    /**
     * @param  array<int, mixed>  $items
     * @return array<int, string>
     */
    private function mapCertifications(array $items): array
    {
        return collect($items)
            ->filter(fn ($c): bool => is_array($c))
            ->map(fn (array $c): string => $this->joinFilled([
                (string) ($c['name'] ?? ''),
                (string) ($c['issuer'] ?? ''),
                (string) ($c['year'] ?? ''),
            ], ' - '))
            ->filter(fn (string $c): bool => $c !== '')
            ->values()
            ->all();
    }

    /**
     * @param  array<int, mixed>  $items
     * @return array<int, string>
     */
    private function mapLanguages(array $items): array
    {
        return collect($items)
            ->map(function ($l): string {
                if (is_string($l)) {
                    return trim($l);
                }

                if (is_array($l)) {
                    $name = (string) ($l['name'] ?? '');
                    $level = (string) ($l['level'] ?? '');

                    return $level !== '' ? "{$name} ({$level})" : $name;
                }

                return '';
            })
            ->filter(fn (string $l): bool => $l !== '')
            ->values()
            ->all();
    }

    /**
     * @param  array<int, mixed>  $items
     * @return array<int, string>
     */
    private function stringList(array $items): array
    {
        return collect($items)
            ->filter(fn ($v): bool => is_string($v) && trim($v) !== '')
            ->map(fn (string $v): string => trim($v))
            ->values()
            ->all();
    }

    /**
     * Split a textarea description into bullet items (one per non-empty line).
     *
     * @return array<int, string>
     */
    private function bullets(string $text): array
    {
        return collect(preg_split('/\r\n|\r|\n/', $text) ?: [])
            ->map(fn (string $line): string => trim(ltrim($line, "-*• \t")))
            ->filter(fn (string $line): bool => $line !== '')
            ->values()
            ->all();
    }

    /**
     * @param  array<int, string>  $parts
     */
    private function joinFilled(array $parts, string $glue): string
    {
        return collect($parts)
            ->map(fn (string $p): string => trim($p))
            ->filter(fn (string $p): bool => $p !== '')
            ->implode($glue);
    }

    private function period(string $start, string $end): string
    {
        $start = trim($start);
        $end = trim($end);

        if ($start === '' && $end === '') {
            return '';
        }

        if ($start === '') {
            return $end;
        }

        if ($end === '') {
            return $start;
        }

        return "{$start} - {$end}";
    }

    private function photoDataUri(mixed $path): ?string
    {
        if (! is_string($path) || $path === '') {
            return null;
        }

        if (! Storage::disk('public')->exists($path)) {
            return null;
        }

        $contents = Storage::disk('public')->get($path);
        if ($contents === null) {
            return null;
        }

        $mime = Str::endsWith(Str::lower($path), ['.png']) ? 'image/png' : 'image/jpeg';

        return "data:{$mime};base64,".base64_encode($contents);
    }

    /**
     * Inline SVG icons as base64 data URIs (dark gray, 16px viewBox).
     *
     * @return array{location: string, phone: string, email: string, link: string}
     */
    private function icons(): array
    {
        $svg = static fn (string $path): string => 'data:image/svg+xml;base64,'.base64_encode(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#1f3c88">'.$path.'</svg>'
        );

        return [
            'location' => $svg('<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/>'),
            'phone' => $svg('<path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24 11.36 11.36 0 0 0 3.57.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.36 11.36 0 0 0 .57 3.57 1 1 0 0 1-.25 1.02l-2.2 2.2z"/>'),
            'email' => $svg('<path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5z"/>'),
            'link' => $svg('<path d="M3.9 12a3.1 3.1 0 0 1 3.1-3.1h4V7H7a5 5 0 0 0 0 10h4v-1.9H7A3.1 3.1 0 0 1 3.9 12zM17 7h-4v1.9h4a3.1 3.1 0 0 1 0 6.2h-4V17h4a5 5 0 0 0 0-10zm-9 4h8v2H8z"/>'),
        ];
    }
}
