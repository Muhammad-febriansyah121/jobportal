<?php

namespace App\Exports;

use App\Models\Subscription;
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

class SubscriptionExport implements FromQuery, ShouldAutoSize, WithHeadings, WithMapping, WithStyles, WithTitle
{
    public function __construct(
        private readonly ?string $startDate = null,
        private readonly ?string $endDate = null,
        private readonly ?string $status = null,
    ) {}

    public function title(): string
    {
        return 'Laporan Subscription';
    }

    public function query(): Builder
    {
        return Subscription::query()
            ->with(['company', 'plan'])
            ->when($this->startDate, fn (Builder $q) => $q->whereDate('created_at', '>=', $this->startDate))
            ->when($this->endDate, fn (Builder $q) => $q->whereDate('created_at', '<=', $this->endDate))
            ->when($this->status, fn (Builder $q) => $q->where('status', $this->status))
            ->latest();
    }

    public function headings(): array
    {
        return ['ID', 'Perusahaan', 'Paket', 'Harga Paket (Rp)', 'Status', 'Mulai', 'Berakhir', 'Tanggal Dibuat'];
    }

    /** @param Subscription $row */
    public function map($row): array
    {
        return [
            $row->id,
            $row->company?->name ?? '-',
            $row->plan?->name ?? '-',
            $row->plan?->price ?? 0,
            ucfirst($row->status),
            $row->starts_at?->format('d/m/Y') ?? '-',
            $row->ends_at?->format('d/m/Y') ?? '-',
            $row->created_at->format('d/m/Y H:i'),
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF01296A']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ],
        ];
    }
}
