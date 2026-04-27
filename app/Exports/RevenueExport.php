<?php

namespace App\Exports;

use App\Models\Payment;
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

class RevenueExport implements FromQuery, ShouldAutoSize, WithHeadings, WithMapping, WithStyles, WithTitle
{
    public function __construct(
        private readonly ?string $startDate = null,
        private readonly ?string $endDate = null,
        private readonly ?string $status = null,
    ) {}

    public function title(): string
    {
        return 'Laporan Revenue';
    }

    public function query(): Builder
    {
        return Payment::query()
            ->with(['company', 'subscription.plan'])
            ->when($this->startDate, fn (Builder $q) => $q->whereDate('created_at', '>=', $this->startDate))
            ->when($this->endDate, fn (Builder $q) => $q->whereDate('created_at', '<=', $this->endDate))
            ->when($this->status, fn (Builder $q) => $q->where('status', $this->status))
            ->latest();
    }

    public function headings(): array
    {
        return ['ID', 'Perusahaan', 'Paket Subscription', 'Nominal (Rp)', 'Status', 'Provider', 'Tanggal Bayar', 'Tanggal Dibuat'];
    }

    /** @param Payment $row */
    public function map($row): array
    {
        return [
            $row->id,
            $row->company?->name ?? '-',
            $row->subscription?->plan?->name ?? '-',
            $row->amount,
            ucfirst($row->status),
            $row->provider ?? '-',
            $row->paid_at?->format('d/m/Y H:i') ?? '-',
            $row->created_at->format('d/m/Y H:i'),
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF1E4D96']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ],
        ];
    }
}
