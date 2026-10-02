import { Head, Link, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import type { ApexOptions } from 'apexcharts';
import { BarChart3, BriefcaseBusiness, Search, TrendingUp, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { JobseekerDataTable } from '@/components/admin/jobseeker-data-table';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cleanPaginationLabel, normalizePaginationUrl } from '@/lib/pagination';
import { jobseekerReports } from '@/routes/admin';

type JobReport = {
    id: number;
    title: string;
    company: string;
    status: string;
    applications: number;
    shortlisted: number;
    interview: number;
    hired: number;
    published_at: string;
};

type TrendPoint = { month: string; applications: number; candidates: number; hired: number };
type PaginationLink = { url: string | null; label: string; active: boolean };
type Applicant = { id: number; candidate: string; email: string; job: string; company: string; status: string; applied_at: string };

type Props = {
    jobs: { data: JobReport[]; links: PaginationLink[]; from: number | null; to: number | null; total: number };
    applicants: { data: Applicant[]; links: PaginationLink[]; from: number | null; to: number | null; total: number };
    filters: { search: string; tab: 'list' | 'analytics' | 'candidates' };
    summary: {
        total_applications: number;
        unique_candidates: number;
        active_jobs: number;
        hired_candidates: number;
        response_rate: number;
    };
    trend: TrendPoint[];
    statusCounts: Record<string, number>;
    topJobs: Array<{ title: string; company: string; applications: number }>;
};

const STATUS_LABELS: Record<string, string> = {
    applied: 'Masuk', screened: 'Screening', shortlisted: 'Shortlist', interview: 'Interview',
    offer: 'Offer', hired: 'Diterima', rejected: 'Ditolak', withdrawn: 'Mengundurkan diri',
};
const STATUS_COLORS = ['#3B82F6', '#6366F1', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444', '#94A3B8', '#CBD5E1'];
const chartBase: ApexOptions = {
    chart: { toolbar: { show: false }, zoom: { enabled: false }, fontFamily: 'inherit', animations: { enabled: true, speed: 450 } },
    dataLabels: { enabled: false },
    grid: { borderColor: '#E2E8F0', strokeDashArray: 4 },
    legend: { position: 'top', horizontalAlign: 'left', fontSize: '12px' },
    stroke: { curve: 'smooth', width: 3 },
    tooltip: { theme: 'light' },
};

const jobColumns: ColumnDef<JobReport>[] = [
    { accessorKey: 'title', header: 'Lowongan', cell: ({ row }) => <div><div className="font-semibold">{row.original.title}</div><div className="text-xs text-muted-foreground">{row.original.company}</div></div> },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge variant={row.original.status === 'published' ? 'default' : 'secondary'}>{row.original.status === 'published' ? 'Aktif' : row.original.status}</Badge> },
    { accessorKey: 'applications', header: 'Total pelamar', cell: ({ row }) => <div className="text-right font-bold tabular-nums">{number(row.original.applications)}</div> },
    { accessorKey: 'shortlisted', header: 'Shortlist', cell: ({ row }) => <div className="text-right tabular-nums">{number(row.original.shortlisted)}</div> },
    { accessorKey: 'interview', header: 'Interview', cell: ({ row }) => <div className="text-right tabular-nums">{number(row.original.interview)}</div> },
    { accessorKey: 'hired', header: 'Diterima', cell: ({ row }) => <div className="text-right font-semibold text-emerald-600 tabular-nums">{number(row.original.hired)}</div> },
    { accessorKey: 'published_at', header: 'Terbit', cell: ({ row }) => <span className="text-muted-foreground">{row.original.published_at}</span> },
];

const applicantColumns: ColumnDef<Applicant>[] = [
    { accessorKey: 'candidate', header: 'Jobseeker', cell: ({ row }) => <div><div className="font-semibold">{row.original.candidate}</div><div className="text-xs text-muted-foreground">{row.original.email}</div></div> },
    { accessorKey: 'job', header: 'Lowongan', cell: ({ row }) => <span className="font-medium">{row.original.job}</span> },
    { accessorKey: 'company', header: 'Perusahaan' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge variant={row.original.status === 'hired' ? 'default' : 'secondary'}>{STATUS_LABELS[row.original.status] ?? row.original.status}</Badge> },
    { accessorKey: 'applied_at', header: 'Waktu melamar', cell: ({ row }) => <span className="text-muted-foreground">{row.original.applied_at}</span> },
];

function number(value: number): string {
    return value.toLocaleString('id-ID');
}

function month(value: string): string {
    const [year, monthNumber] = value.split('-').map(Number);

    return new Intl.DateTimeFormat('id-ID', { month: 'short', year: '2-digit', timeZone: 'UTC' }).format(
        new Date(Date.UTC(year, monthNumber - 1, 1)),
    );
}

export default function JobseekerReports({ jobs, applicants, filters, summary, trend, statusCounts, topJobs }: Props) {
    const [search, setSearch] = useState(filters.search);
    const tab = filters.tab;

    useEffect(() => {
        const normalizedSearch = search.trim();

        if (normalizedSearch === filters.search) {
            return;
        }

        const timeout = window.setTimeout(() => {
            router.get(
                jobseekerReports({ query: { search: normalizedSearch || undefined, tab: filters.tab } }).url,
                {},
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }, 350);

        return () => window.clearTimeout(timeout);
    }, [filters.search, filters.tab, search]);

    const handleTabChange = (nextTab: string) => {
        const next = nextTab as Props['filters']['tab'];
        router.get(
            jobseekerReports({ query: { search: search.trim() || undefined, tab: next } }).url,
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const statusEntries = useMemo(() => Object.entries(statusCounts).filter(([, total]) => total > 0), [statusCounts]);
    const trendCategories = trend.map((point) => month(point.month));
    const trendOptions: ApexOptions = {
        ...chartBase,
        colors: ['#2563EB', '#10B981', '#F59E0B'],
        xaxis: { categories: trendCategories, labels: { style: { fontSize: '11px' } } },
        yaxis: { min: 0, forceNiceScale: true, labels: { formatter: (value) => number(Math.round(Number(value))) } },
    };
    const statusOptions: ApexOptions = {
        chart: { type: 'donut', fontFamily: 'inherit' },
        labels: statusEntries.map(([status]) => STATUS_LABELS[status] ?? status),
        colors: STATUS_COLORS,
        legend: { position: 'bottom', fontSize: '12px' },
        dataLabels: { enabled: true, formatter: (value) => `${Math.round(value)}%` },
        plotOptions: { pie: { donut: { size: '66%', labels: { show: true, total: { show: true, label: 'Total' } } } } },
        stroke: { width: 2, colors: ['#fff'] },
    };
    const topJobsOptions: ApexOptions = {
        chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
        plotOptions: { bar: { borderRadius: 6, horizontal: true, barHeight: '62%' } },
        colors: ['#6366F1'],
        xaxis: { categories: topJobs.map((job) => job.title), labels: { formatter: (value) => number(Number(value)) } },
        dataLabels: { enabled: true, formatter: (value) => number(Number(value)), offsetX: 18, style: { colors: ['#334155'] } },
        grid: { borderColor: '#E2E8F0', strokeDashArray: 4 },
        tooltip: { y: { formatter: (value) => `${number(value)} lamaran` } },
    };

    return (
        <>
            <Head title="Report Jobseeker" />
            <div className="space-y-6 p-4 md:p-6">
                <Heading title="Report Jobseeker" description="Pantau lamaran dari lowongan eksternal dan alur seleksi kandidat." />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    <Metric label="Total lamaran" value={summary.total_applications} icon={BarChart3} tone="blue" />
                    <Metric label="Kandidat unik" value={summary.unique_candidates} icon={Users} tone="violet" />
                    <Metric label="Lowongan aktif" value={summary.active_jobs} icon={BriefcaseBusiness} tone="emerald" />
                    <Metric label="Kandidat diterima" value={summary.hired_candidates} icon={TrendingUp} tone="amber" />
                    <Metric label="Response rate" value={`${summary.response_rate}%`} icon={TrendingUp} tone="rose" />
                </div>

                <Tabs value={tab} onValueChange={handleTabChange} className="space-y-5">
                    <TabsList className="h-11 w-full justify-start gap-1 rounded-xl border bg-card p-1 sm:w-fit">
                        <TabsTrigger value="list" className="gap-2 px-4"><BriefcaseBusiness className="size-4" />Daftar lamaran</TabsTrigger>
                        <TabsTrigger value="analytics" className="gap-2 px-4"><BarChart3 className="size-4" />Analitik</TabsTrigger>
                        <TabsTrigger value="candidates" className="gap-2 px-4"><Users className="size-4" />Kandidat</TabsTrigger>
                    </TabsList>

                    <TabsContent value="list" className="space-y-4">
                        <Card>
                            <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div><CardTitle>Lamaran per lowongan eksternal</CardTitle><CardDescription>Urut berdasarkan jumlah pelamar terbanyak.</CardDescription></div>
                                <SearchForm search={search} setSearch={setSearch} placeholder="Cari lowongan/perusahaan..." />
                            </CardHeader>
                            <CardContent className="p-0">
                                <JobseekerDataTable columns={jobColumns} data={jobs.data} emptyState="Belum ada data lamaran." className="min-w-220" />
                                <PaginationFooter from={jobs.from} to={jobs.to} total={jobs.total} links={jobs.links} label="lowongan" />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="candidates" className="space-y-4">
                        <Card>
                            <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div><CardTitle>Daftar kandidat yang melamar</CardTitle><CardDescription>Telusuri jobseeker, lowongan, dan perusahaan tujuan lamaran.</CardDescription></div>
                                <SearchForm search={search} setSearch={setSearch} placeholder="Cari kandidat/lowongan..." />
                            </CardHeader>
                            <CardContent className="p-0">
                                <JobseekerDataTable columns={applicantColumns} data={applicants.data} emptyState="Belum ada kandidat yang melamar." className="min-w-240" />
                                <PaginationFooter from={applicants.from} to={applicants.to} total={applicants.total} links={applicants.links} label="kandidat" />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="analytics" className="space-y-5">
                        <div className="grid gap-5 xl:grid-cols-[1.65fr_1fr]">
                            <Card><CardHeader><CardTitle>Tren lamaran 12 bulan</CardTitle><CardDescription>Bandingkan total lamaran, kandidat unik, dan kandidat diterima.</CardDescription></CardHeader><CardContent><ReactApexChart options={trendOptions} series={[{ name: 'Lamaran', data: trend.map((point) => point.applications) }, { name: 'Kandidat unik', data: trend.map((point) => point.candidates) }, { name: 'Diterima', data: trend.map((point) => point.hired) }]} type="line" height={340} /></CardContent></Card>
                            <Card><CardHeader><CardTitle>Distribusi status</CardTitle><CardDescription>Posisi kandidat dalam pipeline saat ini.</CardDescription></CardHeader><CardContent>{statusEntries.length ? <ReactApexChart options={statusOptions} series={statusEntries.map(([, total]) => total)} type="donut" height={330} /> : <Empty />}</CardContent></Card>
                        </div>
                        <Card><CardHeader><CardTitle>Top lowongan berdasarkan pelamar</CardTitle><CardDescription>Prioritaskan review pada lowongan dengan volume kandidat terbesar.</CardDescription></CardHeader><CardContent>{topJobs.length ? <ReactApexChart options={topJobsOptions} series={[{ name: 'Lamaran', data: topJobs.map((job) => job.applications) }]} type="bar" height={Math.max(300, topJobs.length * 54)} /> : <Empty />}</CardContent></Card>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{statusEntries.slice(0, 4).map(([status, total], index) => <Card key={status}><CardContent className="p-4"><div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground"><span className="size-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[index] }} />{STATUS_LABELS[status] ?? status}</div><div className="text-2xl font-bold tabular-nums">{number(total)}</div><div className="mt-1 text-xs text-muted-foreground">{summary.total_applications ? `${((total / summary.total_applications) * 100).toFixed(1)}% dari seluruh lamaran` : 'Belum ada data'}</div></CardContent></Card>)}</div>
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}

function Empty() {
 return <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Belum ada data analytics.</div>; 
}

function SearchForm({ search, setSearch, placeholder }: { search: string; setSearch: (value: string) => void; placeholder: string }) {
    return <div className="relative w-full max-w-sm"><Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" /><Input aria-label="Cari report" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={placeholder} className="pl-9" /></div>;
}

function PaginationFooter({ from, to, total, links, label }: { from: number | null; to: number | null; total: number; links: PaginationLink[]; label: string }) {
    return <div className="flex flex-wrap items-center justify-between gap-3 border-t px-6 py-4 text-sm text-muted-foreground"><span>{from ?? 0}–{to ?? 0} dari {number(total)} {label}</span><div className="flex gap-2">{links.map((link) => <Button key={`${link.label}-${link.url}`} asChild={Boolean(link.url)} disabled={!link.url} variant={link.active ? 'default' : 'outline'} size="sm"><Link href={link.url ? normalizePaginationUrl(link.url) : '#'}>{cleanPaginationLabel(link.label)}</Link></Button>)}</div></div>;
}

function Metric({ label, value, icon: Icon, tone }: { label: string; value: number | string; icon: LucideIcon; tone: 'blue' | 'violet' | 'emerald' | 'amber' | 'rose' }) {
    const toneClasses = {
        blue: 'bg-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-950/30',
        violet: 'bg-violet-500 bg-violet-50 text-violet-600 dark:bg-violet-950/30',
        emerald: 'bg-emerald-500 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30',
        amber: 'bg-amber-500 bg-amber-50 text-amber-600 dark:bg-amber-950/30',
        rose: 'bg-rose-500 bg-rose-50 text-rose-600 dark:bg-rose-950/30',
    }[tone];

    return <Card className="overflow-hidden"><div className={`h-1 ${toneClasses.split(' ').find((className) => className.endsWith('-500'))}`} /><CardContent className="flex items-start justify-between gap-3 p-4"><div><div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</div><div className="mt-2 text-2xl font-bold tabular-nums">{typeof value === 'number' ? number(value) : value}</div></div><div className={`rounded-lg p-2.5 ${toneClasses.replace(/\bbg-\w+-500\b/, '')}`}><Icon className="size-5" /></div></CardContent></Card>;
}
