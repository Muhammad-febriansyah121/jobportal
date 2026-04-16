import { Head, Link } from '@inertiajs/react';
import {
    BarChart2,
    BriefcaseBusiness,
    CheckCircle2,
    Clock,
    Eye,
    MousePointerClick,
    Percent,
    TrendingUp,
    Users,
} from 'lucide-react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { edit as companyEdit } from '@/routes/employer/company';

type Overview = {
    total_applications: number;
    hired_count: number;
    avg_fit_score: number | null;
    total_views_30d: number;
    total_clicks_30d: number;
    conversion_rate_30d: number;
    response_rate: number | null;
    median_response_hours: number | null;
};

type PipelineStage = {
    status: string;
    label: string;
    total: number;
};

type TopJob = {
    id: number;
    title: string;
    status: string;
    applications_count: number;
    hired_count: number;
    views_total: number;
    clicks_total: number;
    conversion_rate: number;
    published_at: string;
};

type TrendPoint = {
    day: string;
    total: number;
};

type ViewPoint = {
    day: string;
    views: number;
    clicks: number;
};

type AnalyticsProps = {
    hasCompany: boolean;
    overview: Overview | Record<string, never>;
    pipeline: PipelineStage[];
    topJobs: TopJob[];
    applicationsTrend: TrendPoint[];
    viewsTrend: ViewPoint[];
};

const STATUS_COLORS: Record<string, string> = {
    applied: 'bg-blue-400',
    screened: 'bg-indigo-400',
    shortlisted: 'bg-violet-400',
    interview: 'bg-amber-400',
    offer: 'bg-orange-400',
    hired: 'bg-green-500',
    rejected: 'bg-red-400',
    withdrawn: 'bg-gray-400',
};

const JOB_STATUS_LABELS: Record<string, string> = {
    published: 'Aktif',
    draft: 'Draft',
    closed: 'Ditutup',
    pending_review: 'Review',
    suspended: 'Ditangguhkan',
    rejected: 'Ditolak',
};

export default function EmployerAnalytics({
    hasCompany,
    overview,
    pipeline,
    topJobs,
    applicationsTrend,
    viewsTrend,
}: AnalyticsProps) {
    if (!hasCompany) {
        return (
            <>
                <Head title="Analytics" />
                <div className="space-y-6 p-4 md:p-6">
                    <Heading
                        title="Analytics"
                        description="Pantau performa lowongan, sumber kandidat, dan SLA rekrutmen."
                    />
                    <Card className="border-orange-200 bg-orange-50/80">
                        <CardHeader>
                            <CardTitle>Perusahaan belum disiapkan</CardTitle>
                            <CardDescription>
                                Lengkapi profil perusahaan lebih dulu untuk
                                melihat analytics rekrutmen.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild>
                                <Link href={companyEdit()}>
                                    Mulai onboarding perusahaan
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </>
        );
    }

    const ov = overview as Overview;
    const pipelineTotal = pipeline.reduce((s, p) => s + p.total, 0);
    const appTrendMax =
        applicationsTrend.length > 0
            ? Math.max(...applicationsTrend.map((p) => p.total), 1)
            : 1;
    const viewTrendMax =
        viewsTrend.length > 0
            ? Math.max(...viewsTrend.map((p) => p.views), 1)
            : 1;

    return (
        <>
            <Head title="Analytics" />

            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title="Analytics"
                    description="Pantau performa lowongan, sumber kandidat, dan SLA rekrutmen — 30 hari terakhir."
                />

                {/* Overview cards */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricCard
                        icon={<Users className="size-5" />}
                        label="Total Pelamar"
                        value={ov.total_applications}
                    />
                    <MetricCard
                        icon={
                            <CheckCircle2 className="size-5 text-green-500" />
                        }
                        label="Kandidat Hired"
                        value={ov.hired_count}
                    />
                    <MetricCard
                        icon={<Eye className="size-5" />}
                        label="Views Lowongan (30h)"
                        value={ov.total_views_30d.toLocaleString('id-ID')}
                    />
                    <MetricCard
                        icon={<MousePointerClick className="size-5" />}
                        label="Klik Apply (30h)"
                        value={ov.total_clicks_30d.toLocaleString('id-ID')}
                    />
                    <MetricCard
                        icon={<Percent className="size-5" />}
                        label="Conversion Rate (30h)"
                        value={`${ov.conversion_rate_30d}%`}
                    />
                    <MetricCard
                        icon={<BarChart2 className="size-5" />}
                        label="Avg AI Fit Score"
                        value={
                            ov.avg_fit_score !== null
                                ? `${ov.avg_fit_score}/100`
                                : '-'
                        }
                    />
                    <MetricCard
                        icon={<Clock className="size-5" />}
                        label="Median Respon"
                        value={
                            ov.median_response_hours !== null
                                ? `${ov.median_response_hours} jam`
                                : '-'
                        }
                    />
                    <MetricCard
                        icon={<TrendingUp className="size-5" />}
                        label="Response Rate"
                        value={
                            ov.response_rate !== null
                                ? `${ov.response_rate}%`
                                : '-'
                        }
                    />
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                    {/* Pipeline funnel */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Pipeline Kandidat</CardTitle>
                            <CardDescription>
                                Distribusi pelamar per tahap rekrutmen.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {pipeline.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    Belum ada data pipeline.
                                </p>
                            ) : (
                                pipeline.map((stage) => (
                                    <div key={stage.status}>
                                        <div className="mb-1 flex items-center justify-between text-sm">
                                            <span className="font-medium">
                                                {stage.label}
                                            </span>
                                            <span className="text-muted-foreground">
                                                {stage.total}
                                                {pipelineTotal > 0 && (
                                                    <span className="ml-1 text-xs">
                                                        (
                                                        {Math.round(
                                                            (stage.total /
                                                                pipelineTotal) *
                                                                100,
                                                        )}
                                                        %)
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                            <div
                                                className={`h-full rounded-full transition-all ${STATUS_COLORS[stage.status] ?? 'bg-gray-400'}`}
                                                style={{
                                                    width:
                                                        pipelineTotal > 0
                                                            ? `${(stage.total / pipelineTotal) * 100}%`
                                                            : '0%',
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    {/* Applications trend */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Tren Lamaran (30 Hari)</CardTitle>
                            <CardDescription>
                                Jumlah lamaran masuk per hari.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {applicationsTrend.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    Belum ada lamaran dalam 30 hari terakhir.
                                </p>
                            ) : (
                                <TrendChart
                                    data={applicationsTrend.map((p) => ({
                                        label: formatDay(p.day),
                                        value: p.total,
                                        max: appTrendMax,
                                        color: 'bg-blue-400',
                                    }))}
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Views trend */}
                {viewsTrend.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Views & Klik (30 Hari)</CardTitle>
                            <CardDescription>
                                Perbandingan views lowongan vs klik apply per
                                hari.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {viewsTrend.map((point) => (
                                    <div
                                        key={point.day}
                                        className="flex items-center gap-3"
                                    >
                                        <span className="w-20 shrink-0 text-xs text-muted-foreground">
                                            {formatDay(point.day)}
                                        </span>
                                        <div className="flex flex-1 flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                                    <div
                                                        className="h-full rounded-full bg-indigo-400"
                                                        style={{
                                                            width: `${(point.views / viewTrendMax) * 100}%`,
                                                        }}
                                                    />
                                                </div>
                                                <span className="w-12 shrink-0 text-right text-xs text-muted-foreground">
                                                    {point.views} views
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                                    <div
                                                        className="h-full rounded-full bg-orange-400"
                                                        style={{
                                                            width: `${(point.clicks / viewTrendMax) * 100}%`,
                                                        }}
                                                    />
                                                </div>
                                                <span className="w-12 shrink-0 text-right text-xs text-muted-foreground">
                                                    {point.clicks} klik
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                    <span className="inline-block size-2 rounded-full bg-indigo-400" />
                                    Views
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="inline-block size-2 rounded-full bg-orange-400" />
                                    Klik Apply
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Top jobs table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BriefcaseBusiness className="size-5" />
                            Performa Lowongan
                        </CardTitle>
                        <CardDescription>
                            Lowongan diurutkan berdasarkan jumlah pelamar
                            terbanyak.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {topJobs.length === 0 ? (
                            <p className="px-6 py-4 text-sm text-muted-foreground">
                                Belum ada lowongan yang dipublikasikan.
                            </p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Judul</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">
                                            Pelamar
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Hired
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Views
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Klik
                                        </TableHead>
                                        <TableHead className="text-right">
                                            CTR
                                        </TableHead>
                                        <TableHead>Terbit</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {topJobs.map((job) => (
                                        <TableRow key={job.id}>
                                            <TableCell className="font-medium">
                                                {job.title}
                                            </TableCell>
                                            <TableCell>
                                                <StatusPill
                                                    status={job.status}
                                                    label={
                                                        JOB_STATUS_LABELS[
                                                            job.status
                                                        ] ?? job.status
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {job.applications_count}
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-green-600">
                                                {job.hired_count}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {job.views_total}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {job.clicks_total}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {job.conversion_rate}%
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {job.published_at}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

function MetricCard({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
}) {
    return (
        <Card>
            <CardHeader className="flex-row items-center gap-3 space-y-0 pb-2">
                <span className="text-muted-foreground">{icon}</span>
                <CardDescription>{label}</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold">{value}</p>
            </CardContent>
        </Card>
    );
}

function TrendChart({
    data,
}: {
    data: Array<{
        label: string;
        value: number;
        max: number;
        color: string;
    }>;
}) {
    return (
        <div className="flex h-32 items-end gap-1">
            {data.map((point, i) => (
                <div
                    key={i}
                    className="group relative flex flex-1 flex-col items-center gap-1"
                >
                    <div className="w-full overflow-hidden rounded-t">
                        <div
                            className={`w-full rounded-t transition-all ${point.color}`}
                            style={{
                                height: `${Math.round((point.value / point.max) * 112)}px`,
                                minHeight: point.value > 0 ? '4px' : '0',
                            }}
                        />
                    </div>
                    {/* Tooltip */}
                    <div className="absolute -top-8 left-1/2 hidden -translate-x-1/2 rounded bg-foreground px-1.5 py-0.5 text-xs text-background group-hover:block">
                        {point.value}
                    </div>
                </div>
            ))}
        </div>
    );
}

function StatusPill({ status, label }: { status: string; label: string }) {
    const colors: Record<string, string> = {
        published: 'bg-green-100 text-green-700',
        draft: 'bg-gray-100 text-gray-600',
        closed: 'bg-slate-100 text-slate-600',
        pending_review: 'bg-yellow-100 text-yellow-700',
        suspended: 'bg-red-100 text-red-700',
        rejected: 'bg-red-100 text-red-700',
    };
    return (
        <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] ?? 'bg-gray-100 text-gray-600'}`}
        >
            {label}
        </span>
    );
}

function formatDay(dayStr: string): string {
    const d = new Date(dayStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}
