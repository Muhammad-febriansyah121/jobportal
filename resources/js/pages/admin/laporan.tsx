import { Head } from '@inertiajs/react';
import type { ApexOptions } from 'apexcharts';
import {
    Activity,
    Building2,
    CalendarIcon,
    CreditCard,
    Download,
    FileSpreadsheet,
    TrendingUp,
    Users,
    X,
} from 'lucide-react';
import { useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
    lamaran,
    pengguna,
    revenue,
    subscription,
} from '@/routes/admin/laporan/index';

type Point = { month: string; total: number };

type LaporanProps = {
    summary: {
        revenue_total: number;
        revenue_30d: number;
        revenue_count_30d: number;
        applications_30d: number;
        users_30d: number;
        companies_30d: number;
        active_subscriptions: number;
        pending_payments: number;
    };
    revenueSeries: Point[];
    companySeries: Point[];
    userSeries: Point[];
    applicationSeries: Point[];
    revenueByPlan: Array<{ plan: string; total: number; count: number }>;
    paymentStatusDist: Array<{
        status: string;
        count: number;
        amount: number;
    }>;
    topCompaniesByRevenue: Array<{
        id: number;
        name: string;
        city: string;
        total_revenue: number;
        payment_count: number;
    }>;
    subscriptionStats: { active: number; expired: number; cancelled: number };
};

function fmtIDR(value: number): string {
    if (value >= 1_000_000_000)
        return `Rp ${(value / 1_000_000_000).toFixed(1)}M`;
    if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}jt`;
    if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}rb`;
    return `Rp ${value.toLocaleString('id-ID')}`;
}

function buildExportUrl(
    base: string,
    params: Record<string, string>,
): string {
    const qs = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== ''),
    ).toString();
    return qs ? `${base}?${qs}` : base;
}

function shortMonth(ym: string): string {
    const [y, m] = ym.split('-');
    const months = [
        'Jan','Feb','Mar','Apr','Mei','Jun',
        'Jul','Ags','Sep','Okt','Nov','Des',
    ];
    return `${months[parseInt(m) - 1]} ${y.slice(2)}`;
}

const C = {
    primary: '#01296a',
    blue: '#3B82F6',
    emerald: '#10B981',
    amber: '#F59E0B',
    violet: '#8B5CF6',
    rose: '#F43F5E',
    slate: '#64748B',
};

const BASE: ApexOptions['chart'] = {
    toolbar: { show: false },
    zoom: { enabled: false },
    fontFamily: 'inherit',
    animations: { enabled: true, speed: 400 },
};

function RevenueAreaChart({ points }: { points: Point[] }) {
    const options: ApexOptions = {
        chart: { ...BASE, type: 'area', id: 'revenue-area' },
        stroke: { curve: 'smooth', width: 2.5 },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.25,
                opacityTo: 0.02,
                stops: [0, 100],
            },
        },
        colors: [C.primary],
        xaxis: {
            categories: points.map((p) => shortMonth(p.month)),
            labels: { style: { fontSize: '11px', colors: C.slate } },
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: {
            labels: {
                style: { fontSize: '11px', colors: C.slate },
                formatter: (v) => fmtIDR(v),
            },
        },
        tooltip: {
            y: { formatter: (v) => fmtIDR(v) },
        },
        grid: { borderColor: '#f1f5f9', strokeDashArray: 4 },
        dataLabels: { enabled: false },
    };
    const series = [{ name: 'Revenue', data: points.map((p) => p.total) }];
    return (
        <ReactApexChart
            options={options}
            series={series}
            type="area"
            height={220}
        />
    );
}

function GrowthBarChart({
    companySeries,
    userSeries,
    applicationSeries,
}: {
    companySeries: Point[];
    userSeries: Point[];
    applicationSeries: Point[];
}) {
    const categories = companySeries.map((p) => shortMonth(p.month));
    const options: ApexOptions = {
        chart: { ...BASE, type: 'bar', id: 'growth-bar', stacked: false },
        colors: [C.primary, C.emerald, C.amber],
        plotOptions: {
            bar: { borderRadius: 3, columnWidth: '60%' },
        },
        xaxis: {
            categories,
            labels: { style: { fontSize: '11px', colors: C.slate } },
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: {
            labels: { style: { fontSize: '11px', colors: C.slate } },
        },
        legend: {
            position: 'top',
            fontSize: '12px',
            markers: { size: 7 },
        },
        grid: { borderColor: '#f1f5f9', strokeDashArray: 4 },
        dataLabels: { enabled: false },
        tooltip: { shared: true, intersect: false },
    };
    const series = [
        { name: 'Perusahaan', data: companySeries.map((p) => p.total) },
        { name: 'Pengguna', data: userSeries.map((p) => p.total) },
        { name: 'Lamaran', data: applicationSeries.map((p) => p.total) },
    ];
    return (
        <ReactApexChart
            options={options}
            series={series}
            type="bar"
            height={220}
        />
    );
}

function RevenueByPlanDonut({
    data,
}: {
    data: Array<{ plan: string; total: number; count: number }>;
}) {
    const total = data.reduce((s, d) => s + d.total, 0);
    const options: ApexOptions = {
        chart: { ...BASE, type: 'donut', id: 'plan-donut' },
        colors: [C.primary, C.blue, C.emerald, C.amber, C.violet],
        labels: data.map((d) => d.plan),
        plotOptions: {
            pie: {
                donut: {
                    size: '68%',
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: 'Total',
                            formatter: () => fmtIDR(total),
                            fontSize: '13px',
                            fontWeight: 600,
                            color: C.primary,
                        },
                    },
                },
            },
        },
        legend: { position: 'bottom', fontSize: '12px' },
        dataLabels: { enabled: false },
        tooltip: { y: { formatter: (v) => fmtIDR(v) } },
    };
    return (
        <ReactApexChart
            options={options}
            series={data.map((d) => d.total)}
            type="donut"
            height={260}
        />
    );
}

function PaymentStatusDonut({
    data,
}: {
    data: Array<{ status: string; count: number; amount: number }>;
}) {
    const options: ApexOptions = {
        chart: { ...BASE, type: 'donut', id: 'status-donut' },
        colors: [C.emerald, C.amber, C.rose, C.slate],
        labels: data.map((d) => d.status),
        plotOptions: {
            pie: {
                donut: {
                    size: '68%',
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: 'Transaksi',
                            formatter: () =>
                                String(data.reduce((s, d) => s + d.count, 0)),
                            fontSize: '13px',
                            fontWeight: 600,
                            color: C.primary,
                        },
                    },
                },
            },
        },
        legend: { position: 'bottom', fontSize: '12px' },
        dataLabels: { enabled: false },
        tooltip: { y: { formatter: (v) => `${v} transaksi` } },
    };
    return (
        <ReactApexChart
            options={options}
            series={data.map((d) => d.count)}
            type="donut"
            height={260}
        />
    );
}

export default function AdminLaporan({
    summary,
    revenueSeries,
    companySeries,
    userSeries,
    applicationSeries,
    revenueByPlan,
    paymentStatusDist,
    topCompaniesByRevenue,
    subscriptionStats,
}: LaporanProps) {
    const kpis = [
        {
            label: 'Total Revenue',
            value: fmtIDR(summary.revenue_total),
            sub: 'Semua waktu',
            icon: TrendingUp,
            color: 'text-primary',
            bg: 'bg-primary/8',
        },
        {
            label: 'Revenue 30 Hari',
            value: fmtIDR(summary.revenue_30d),
            sub: `${summary.revenue_count_30d} transaksi`,
            icon: CreditCard,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
        },
        {
            label: 'Subscription Aktif',
            value: summary.active_subscriptions.toLocaleString(),
            sub: `${subscriptionStats.expired} expired · ${subscriptionStats.cancelled} batal`,
            icon: Building2,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
        },
        {
            label: 'Pengguna Baru',
            value: summary.users_30d.toLocaleString(),
            sub: '30 hari terakhir',
            icon: Users,
            color: 'text-violet-600',
            bg: 'bg-violet-50',
        },
        {
            label: 'Perusahaan Baru',
            value: summary.companies_30d.toLocaleString(),
            sub: '30 hari terakhir',
            icon: Building2,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
        },
        {
            label: 'Lamaran Baru',
            value: summary.applications_30d.toLocaleString(),
            sub: '30 hari terakhir',
            icon: Activity,
            color: 'text-rose-600',
            bg: 'bg-rose-50',
        },
    ];

    return (
        <>
            <Head title="Laporan & Analitik" />
            <div className="flex flex-col gap-6 p-4 sm:p-6">
                {/* Header */}
                <div className="flex items-center gap-3 border-b pb-5">
                    <div className="rounded-xl bg-primary/10 p-2.5">
                        <FileSpreadsheet className="size-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Laporan & Analitik
                        </h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Pantau perkembangan platform dan export data ke Excel.
                        </p>
                    </div>
                </div>

                {/* KPI Strip */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    {kpis.map((k) => (
                        <div
                            key={k.label}
                            className="flex flex-col gap-1.5 rounded-xl border bg-white p-4 shadow-sm dark:bg-card"
                        >
                            <div
                                className={`flex size-8 items-center justify-center rounded-lg ${k.bg}`}
                            >
                                <k.icon className={`size-4 ${k.color}`} />
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                {k.label}
                            </p>
                            <p className={`text-xl font-bold leading-none ${k.color}`}>
                                {k.value}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                                {k.sub}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Charts Row 1: Revenue Area + Plan Donut */}
                <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Tren Revenue</CardTitle>
                            <CardDescription className="text-xs">
                                12 bulan terakhir
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="-mx-2">
                            <RevenueAreaChart points={revenueSeries} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Revenue per Paket</CardTitle>
                            <CardDescription className="text-xs">
                                Distribusi berdasarkan pricing plan
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {revenueByPlan.length > 0 ? (
                                <RevenueByPlanDonut data={revenueByPlan} />
                            ) : (
                                <EmptyChart />
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Row 2: Growth Bar + Payment Status Donut */}
                <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">
                                Pertumbuhan Platform
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Perusahaan, pengguna, dan lamaran baru per bulan (12 bulan)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="-mx-2">
                            <GrowthBarChart
                                companySeries={companySeries}
                                userSeries={userSeries}
                                applicationSeries={applicationSeries}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Status Pembayaran</CardTitle>
                            <CardDescription className="text-xs">
                                Distribusi status transaksi
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {paymentStatusDist.length > 0 ? (
                                <PaymentStatusDonut data={paymentStatusDist} />
                            ) : (
                                <EmptyChart />
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Top Companies by Revenue */}
                {topCompaniesByRevenue.length > 0 && (
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">
                                Top 10 Perusahaan by Revenue
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Peringkat berdasarkan total pembayaran
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-slate-50 text-xs text-muted-foreground dark:bg-muted/30">
                                            <th className="px-4 py-2.5 text-left font-medium">
                                                #
                                            </th>
                                            <th className="px-4 py-2.5 text-left font-medium">
                                                Perusahaan
                                            </th>
                                            <th className="px-4 py-2.5 text-left font-medium">
                                                Kota
                                            </th>
                                            <th className="px-4 py-2.5 text-right font-medium">
                                                Transaksi
                                            </th>
                                            <th className="px-4 py-2.5 text-right font-medium">
                                                Total Revenue
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topCompaniesByRevenue.map(
                                            (company, idx) => (
                                                <tr
                                                    key={company.id}
                                                    className="border-b last:border-0 hover:bg-slate-50/60 dark:hover:bg-muted/20"
                                                >
                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary">
                                                                {company.name
                                                                    .substring(
                                                                        0,
                                                                        2,
                                                                    )
                                                                    .toUpperCase()}
                                                            </div>
                                                            <span className="font-medium">
                                                                {company.name}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        {company.city}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-muted-foreground">
                                                        {company.payment_count}x
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-semibold text-primary">
                                                        {fmtIDR(
                                                            company.total_revenue,
                                                        )}
                                                    </td>
                                                </tr>
                                            ),
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Export Section */}
                <div>
                    <div className="mb-4 flex items-center gap-2">
                        <div className="rounded-lg bg-primary/10 p-1.5">
                            <Download className="size-4 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold">Export Data</h2>
                            <p className="text-xs text-muted-foreground">
                                Atur filter lalu klik tombol untuk download file Excel
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <RevenueExportCard />
                        <LamaranExportCard />
                        <PenggunaExportCard />
                        <SubscriptionExportCard />
                    </div>
                </div>

                {/* Footer note */}
                <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
                    <Building2 className="mt-0.5 size-4 shrink-0" />
                    <p>
                        File Excel langsung terdownload. Kosongkan filter untuk export semua data.
                        Laporan Pengguna menghasilkan file dengan{' '}
                        <span className="font-semibold">2 sheet</span>: Data User dan Data Perusahaan.
                    </p>
                </div>
            </div>
        </>
    );
}

/* ─── Export Card Components ─── */

function RevenueExportCard() {
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const [status, setStatus] = useState('');
    const href = buildExportUrl(revenue.url(), {
        start_date: start,
        end_date: end,
        status,
    });
    return (
        <ExportCard
            accentColor="bg-emerald-500"
            iconBg="bg-emerald-100"
            iconColor="text-emerald-600"
            icon={TrendingUp}
            title="Revenue & Transaksi"
            desc="Pembayaran & subscription perusahaan"
            href={href}
            btnClass="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
            <DateRangePicker
                start={start}
                end={end}
                onStartChange={setStart}
                onEndChange={setEnd}
            />
            <FilterSelect
                label="Filter Status Pembayaran"
                value={status}
                onChange={setStatus}
                options={[
                    { value: 'paid', label: '✓ Paid — pembayaran berhasil' },
                    { value: 'pending', label: '⏳ Pending — menunggu konfirmasi' },
                    { value: 'failed', label: '✗ Failed — pembayaran gagal' },
                    { value: 'refunded', label: '↩ Refunded — sudah direfund' },
                ]}
                placeholder="Semua status (default)"
            />
        </ExportCard>
    );
}

function LamaranExportCard() {
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const [status, setStatus] = useState('');
    const href = buildExportUrl(lamaran.url(), {
        start_date: start,
        end_date: end,
        status,
    });
    return (
        <ExportCard
            accentColor="bg-violet-500"
            iconBg="bg-violet-100"
            iconColor="text-violet-600"
            icon={Activity}
            title="Lamaran Kandidat"
            desc="Aktivitas lamaran kerja kandidat"
            href={href}
            btnClass="bg-violet-600 hover:bg-violet-700 text-white"
        >
            <DateRangePicker
                start={start}
                end={end}
                onStartChange={setStart}
                onEndChange={setEnd}
            />
            <FilterSelect
                label="Filter Status Lamaran"
                value={status}
                onChange={setStatus}
                options={[
                    { value: 'applied', label: 'Melamar' },
                    { value: 'screened', label: 'Seleksi Awal' },
                    { value: 'shortlisted', label: 'Shortlist' },
                    { value: 'interview', label: 'Interview' },
                    { value: 'offer', label: 'Penawaran' },
                    { value: 'hired', label: 'Diterima' },
                    { value: 'rejected', label: 'Ditolak' },
                    { value: 'withdrawn', label: 'Undur Diri' },
                ]}
                placeholder="Semua status (default)"
            />
        </ExportCard>
    );
}

function PenggunaExportCard() {
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const [role, setRole] = useState('');
    const href = buildExportUrl(pengguna.url(), {
        start_date: start,
        end_date: end,
        role,
    });
    return (
        <ExportCard
            accentColor="bg-amber-500"
            iconBg="bg-amber-100"
            iconColor="text-amber-600"
            icon={Users}
            title="Pengguna & Perusahaan"
            desc="File Excel dengan 2 sheet"
            href={href}
            btnClass="bg-amber-500 hover:bg-amber-600 text-white"
            multiSheet
        >
            <DateRangePicker
                start={start}
                end={end}
                onStartChange={setStart}
                onEndChange={setEnd}
            />
            <FilterSelect
                label="Filter Role Pengguna"
                value={role}
                onChange={setRole}
                options={[
                    { value: 'candidate', label: 'Kandidat' },
                    { value: 'employer', label: 'Employer' },
                    { value: 'mentor', label: 'Mentor' },
                ]}
                placeholder="Semua role (default)"
            />
        </ExportCard>
    );
}

function SubscriptionExportCard() {
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const [status, setStatus] = useState('');
    const href = buildExportUrl(subscription.url(), {
        start_date: start,
        end_date: end,
        status,
    });
    return (
        <ExportCard
            accentColor="bg-primary"
            iconBg="bg-primary/10"
            iconColor="text-primary"
            icon={CreditCard}
            title="Subscription"
            desc="Data langganan aktif & histori"
            href={href}
            btnClass="bg-primary hover:bg-primary/90 text-white"
        >
            <DateRangePicker
                start={start}
                end={end}
                onStartChange={setStart}
                onEndChange={setEnd}
            />
            <FilterSelect
                label="Filter Status Subscription"
                value={status}
                onChange={setStatus}
                options={[
                    { value: 'active', label: '✓ Aktif — sedang berjalan' },
                    { value: 'expired', label: '⏰ Expired — sudah berakhir' },
                    { value: 'cancelled', label: '✗ Dibatalkan' },
                ]}
                placeholder="Semua status (default)"
            />
        </ExportCard>
    );
}

/* ─── Shared UI Primitives ─── */

function ExportCard({
    accentColor,
    iconBg,
    iconColor,
    icon: Icon,
    title,
    desc,
    href,
    btnClass,
    multiSheet,
    children,
}: {
    accentColor: string;
    iconBg: string;
    iconColor: string;
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    desc: string;
    href: string;
    btnClass: string;
    multiSheet?: boolean;
    children: React.ReactNode;
}) {
    return (
        <Card className="flex flex-col overflow-hidden border shadow-sm">
            <div className={`h-1 w-full ${accentColor}`} />
            <CardContent className="flex flex-1 flex-col gap-5 pt-5">
                {/* Header */}
                <div className="flex items-start gap-3">
                    <div
                        className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
                    >
                        <Icon className={`size-5 ${iconColor}`} />
                    </div>
                    <div>
                        <p className="font-semibold leading-tight">{title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {desc}
                        </p>
                        {multiSheet && (
                            <Badge
                                variant="secondary"
                                className="mt-1.5 text-[10px]"
                            >
                                2 sheet
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="space-y-3">{children}</div>

                {/* CTA */}
                <div className="mt-auto">
                    <a href={href} download>
                        <Button className={`w-full gap-2 ${btnClass}`}>
                            <Download className="size-4" />
                            Download Excel
                        </Button>
                    </a>
                </div>
            </CardContent>
        </Card>
    );
}

function DateRangePicker({
    start,
    end,
    onStartChange,
    onEndChange,
}: {
    start: string;
    end: string;
    onStartChange: (v: string) => void;
    onEndChange: (v: string) => void;
}) {
    return (
        <div className="space-y-1.5">
            <Label className="text-xs font-medium">Rentang Tanggal</Label>
            <div className="flex flex-col gap-2">
                <DatePicker
                    value={start}
                    onChange={onStartChange}
                    placeholder="Tanggal mulai"
                    maxDate={end ? parseLocalDate(end) : undefined}
                />
                <DatePicker
                    value={end}
                    onChange={onEndChange}
                    placeholder="Tanggal akhir"
                    minDate={start ? parseLocalDate(start) : undefined}
                />
            </div>
            {(start || end) && (
                <button
                    type="button"
                    onClick={() => {
                        onStartChange('');
                        onEndChange('');
                    }}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                >
                    <X className="size-3" />
                    Hapus filter tanggal
                </button>
            )}
        </div>
    );
}

function DatePicker({
    value,
    onChange,
    placeholder,
    minDate,
    maxDate,
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    minDate?: Date;
    maxDate?: Date;
}) {
    const [open, setOpen] = useState(false);
    const selected = value ? parseLocalDate(value) : undefined;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn(
                        'h-9 w-full justify-start gap-2 px-3 text-xs font-normal',
                        !value && 'text-muted-foreground',
                    )}
                >
                    <CalendarIcon className="size-3.5 shrink-0 text-muted-foreground" />
                    {value ? formatDateDisplay(value) : placeholder}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={selected}
                    onSelect={(date) => {
                        onChange(date ? toIsoDate(date) : '');
                        setOpen(false);
                    }}
                    disabled={(date) => {
                        if (minDate && date < minDate) return true;
                        if (maxDate && date > maxDate) return true;
                        return false;
                    }}
                    captionLayout="dropdown"
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    );
}

function FilterSelect({
    label,
    value,
    onChange,
    options,
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: Array<{ value: string; label: string }>;
    placeholder: string;
}) {
    return (
        <div className="space-y-1.5">
            <Label className="text-xs font-medium">{label}</Label>
            <Select
                value={value || '__all__'}
                onValueChange={(v) => onChange(v === '__all__' ? '' : v)}
            >
                <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="__all__" className="text-xs text-muted-foreground">
                        {placeholder}
                    </SelectItem>
                    {options.map((opt) => (
                        <SelectItem
                            key={opt.value}
                            value={opt.value}
                            className="text-xs"
                        >
                            {opt.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

function EmptyChart() {
    return (
        <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
            Belum ada data
        </div>
    );
}

/* ─── Date utils ─── */

function parseLocalDate(iso: string): Date {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
}

function toIsoDate(date: Date): string {
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0'),
    ].join('-');
}

function formatDateDisplay(iso: string): string {
    const [y, m, d] = iso.split('-').map(Number);
    const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
    return `${d} ${months[m - 1]} ${y}`;
}
