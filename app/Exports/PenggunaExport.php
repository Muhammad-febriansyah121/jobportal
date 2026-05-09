<?php

namespace App\Exports;

use App\Models\Company;
use App\Models\User;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class PenggunaExport implements WithMultipleSheets
{
    public function __construct(
        private readonly ?string $startDate = null,
        private readonly ?string $endDate = null,
        private readonly ?string $role = null,
    ) {}

    public function sheets(): array
    {
        return [
            new UserSheet($this->startDate, $this->endDate, $this->role),
            new CompanySheet($this->startDate, $this->endDate),
        ];
    }
}

class UserSheet implements FromCollection, ShouldAutoSize, WithHeadings, WithMapping, WithStyles, WithTitle
{
    public function __construct(
        private readonly ?string $startDate = null,
        private readonly ?string $endDate = null,
        private readonly ?string $role = null,
    ) {}

    public function title(): string
    {
        return 'Data User';
    }

    public function collection(): Collection
    {
        return User::query()
            ->when($this->startDate, fn ($q) => $q->whereDate('created_at', '>=', $this->startDate))
            ->when($this->endDate, fn ($q) => $q->whereDate('created_at', '<=', $this->endDate))
            ->when($this->role, fn ($q) => $q->where('role', $this->role))
            ->latest()
            ->get(['id', 'name', 'email', 'role', 'phone', 'is_active', 'email_verified_at', 'created_at']);
    }

    public function headings(): array
    {
        return ['ID', 'Nama', 'Email', 'Role', 'Telepon', 'Status', 'Email Terverifikasi', 'Tanggal Daftar'];
    }

    /** @param User $row */
    public function map($row): array
    {
        return [
            $row->id,
            $row->name,
            $row->email,
            ucfirst($row->role),
            $row->phone ?? '-',
            $row->is_active ? 'Aktif' : 'Nonaktif',
            $row->email_verified_at ? 'Ya' : 'Belum',
            $row->created_at->format('d/m/Y H:i'),
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FFF59E0B']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ],
        ];
    }
}

class CompanySheet implements FromCollection, ShouldAutoSize, WithHeadings, WithMapping, WithStyles, WithTitle
{
    public function __construct(
        private readonly ?string $startDate = null,
        private readonly ?string $endDate = null,
    ) {}

    public function title(): string
    {
        return 'Data Perusahaan';
    }

    public function collection(): Collection
    {
        return Company::query()
            ->with(['industry', 'activeSubscription.plan'])
            ->when($this->startDate, fn ($q) => $q->whereDate('created_at', '>=', $this->startDate))
            ->when($this->endDate, fn ($q) => $q->whereDate('created_at', '<=', $this->endDate))
            ->latest()
            ->get();
    }

    public function headings(): array
    {
        return ['ID', 'Nama Perusahaan', 'Industri', 'Status Verifikasi', 'Subscription Aktif', 'Kota', 'Status Akun', 'Tanggal Daftar'];
    }

    /** @param Company $row */
    public function map($row): array
    {
        return [
            $row->id,
            $row->name,
            $row->industry?->name ?? '-',
            ucfirst($row->verification_status),
            $row->activeSubscription?->plan?->name ?? 'Free',
            $row->hq_city ?? '-',
            $row->is_active ? 'Aktif' : 'Nonaktif',
            $row->created_at->format('d/m/Y H:i'),
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FFF59E0B']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ],
        ];
    }
}
