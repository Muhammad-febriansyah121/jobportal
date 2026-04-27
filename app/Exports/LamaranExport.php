<?php

namespace App\Exports;

use App\Models\Application;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class LamaranExport implements FromQuery, ShouldAutoSize, WithHeadings, WithMapping, WithStyles, WithTitle
{
    public function __construct(
        private readonly ?string $startDate = null,
        private readonly ?string $endDate = null,
        private readonly ?string $status = null,
    ) {}

    public function title(): string
    {
        return 'Laporan Lamaran';
    }

    public function query(): Builder
    {
        return Application::query()
            ->with(['jobListing.company', 'candidate.user'])
            ->when($this->startDate, fn (Builder $q) => $q->whereDate('applied_at', '>=', $this->startDate))
            ->when($this->endDate, fn (Builder $q) => $q->whereDate('applied_at', '<=', $this->endDate))
            ->when($this->status, fn (Builder $q) => $q->where('status', $this->status))
            ->latest('applied_at');
    }

    public function headings(): array
    {
        return ['ID', 'Kandidat', 'Email', 'Posisi', 'Perusahaan', 'Status', 'Skor AI', 'Tanggal Melamar'];
    }

    /** @param Application $row */
    public function map($row): array
    {
        return [
            $row->id,
            $row->candidate?->user?->name ?? '-',
            $row->candidate?->user?->email ?? '-',
            $row->jobListing?->title ?? '-',
            $row->jobListing?->company?->name ?? '-',
            ucfirst($row->status),
            $row->ai_fit_score ?? '-',
            $row->applied_at?->format('d/m/Y H:i') ?? '-',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF8B5CF6']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ],
        ];
    }
}
