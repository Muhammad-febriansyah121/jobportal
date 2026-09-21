import { Head } from '@inertiajs/react';
import { useTranslate } from '@/hooks/use-translate';
import type { ApexOptions } from 'apexcharts';
import {
    Activity,
    Briefcase,
    CreditCard,
    ShieldCheck,
    TrendingUp,
    Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import ReactApexChart from 'react-apexcharts';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

type SeriesPoint = { month: string; total: number };

type AnalyticsProps = {
    totals: {
        users: number;
        companies: number;
        verified_companies: number;
        jobs_live: number;
        applications_month: number;
        active_subscriptions: number;
        verification_queue: number;
        pending_payments: number;
    };
    series: Record<string, SeriesPoint[]>;
    revenueSeries: SeriesPoint[];
    summary: {
        conversion_apply: number;
        subscription_revenue: number;
        report_pending: number;
        ai_failed: number;
    };
    applicationFunnel: Record<string, number>;
    userRoles: Record<string, number>;
    jobsByStatus: Record<string, number>;
    jobsByWorkMode: Record<string, number>;
    topIndustries: Array<{ name: string; total: number }>;
    subscriptionsByPlan: Array<{
        id: number;
        name: string;
        price: number;
        active_count: number;
        revenue: number | null;
    }>;
    aiByFeature: Array<{
        feature: string;
        total: number;
        success: number;
        failed: number;
        success_rate: number;
    }>;
};

const C = {
    primary: '#136BB4',
    blue: '#3B82F6',
    violet: '#8B5CF6',
    indigo: '#6366F1',
    emerald: '#10B981',
    green: '#059669',
    amber: '#F59E0B',
    rose: '#F43F5E',
    sky: '#0EA5E9',
    gray: '#9CA3AF',
    red: '#EF4444',
} as const;

const PALETTE = [
    C.blue,
    C.amber,
    C.emerald,
    C.violet,
    C.rose,
    C.sky,
    C.green,
    C.red,
    C.indigo,
    C.gray,
];

const BASE_CHART = {
    toolbar: { show: false },
    zoom: { enabled: false },
    fontFamily: 'inherit',
    animations: { enabled: true, speed: 500 },
};

function fmtMonth(value: string): string {
    const [year, month] = value.split('-');
    if (!year || !month) return value;
    const d = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
    if (Number.isNaN(d.getTime())) return value;
    return new Intl.DateTimeFormat('id-ID', {
        month: 'short',
        timeZone: 'UTC',
    }).format(d);
}

function fmtLabel(value: string): string {
    return value
        .replaceAll('_', ' ')
        .split(' ')
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

function fmtIDR(value: number): string {
    if (value >= 1_000_000_000)
        return `Rp ${(value / 1_000_000_000).toFixed(1)}M`;
    if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}jt`;
    if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}rb`;
    return `Rp ${value.toLocaleString('id-ID')}`;
}

function Empty({ height = 200 }: { height?: number }) {
    const { t } = useTranslate();
    return (
        <div
            className="flex items-center justify-center text-sm text-muted-foreground"
            style={{ height }}
        >
            {t('admin.analytics.charts.no_data')}
        </div>
    );
}

function KpiCard({
    label,
    value,
    icon: Icon,
    accent,
    iconBg,
    iconColor,
}: {
    label: string;
    value: string;
    icon: LucideIcon;
    accent: string;
    iconBg: string;
    iconColor: string;
}) {
    return (
        <Card className="overflow-hidden border shadow-sm">
            <div className={`h-1 w-full ${accent}`} />
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] leading-tight font-medium tracking-wide text-muted-foreground uppercase">
                            {label}
                        </p>
                        <p className="mt-2 text-2xl leading-none font-bold tabular-nums">
                            {value}
                        </p>
                    </div>
                    <div className={`shrink-0 rounded-xl p-2.5 ${iconBg}`}>
                        <Icon className={`size-5 ${iconColor}`} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function AdminAnalytics({
    totals,
    series,
    revenueSeries,
    summary,
    applicationFunnel,
    jobsByWorkMode,
    topIndustries,
    subscriptionsByPlan,
    aiByFeature,
}: AnalyticsProps) {
    const { t } = useTranslate();
    const mrr = subscriptionsByPlan.reduce(
        (s, p) => s + p.price * p.active_count,
        0,
    );

    const kpiCards = [
        {
            label: t('admin.analytics.kpi.total_users'),
            value: totals.users.toLocaleString('id-ID'),
            icon: Users,
            accent: 'bg-blue-500',
            iconBg: 'bg-blue-50',
            iconColor: 'text-blue-600',
        },
        {
            label: t('admin.analytics.kpi.jobs_live'),
            value: totals.jobs_live.toLocaleString('id-ID'),
            icon: Briefcase,
            accent: 'bg-violet-500',
            iconBg: 'bg-violet-50',
            iconColor: 'text-violet-600',
        },
        {
            label: t('admin.analytics.kpi.applications_month'),
            value: totals.applications_month.toLocaleString('id-ID'),
            icon: Activity,
            accent: 'bg-emerald-500',
            iconBg: 'bg-emerald-50',
            iconColor: 'text-emerald-600',
        },
        {
            label: t('admin.analytics.kpi.revenue_total'),
            value: fmtIDR(summary.subscription_revenue),
            icon: CreditCard,
            accent: 'bg-amber-500',
            iconBg: 'bg-amber-50',
            iconColor: 'text-amber-600',
        },
        {
            label: t('admin.analytics.kpi.active_subscriptions'),
            value: totals.active_subscriptions.toLocaleString('id-ID'),
            icon: TrendingUp,
            accent: 'bg-sky-500',
            iconBg: 'bg-sky-50',
            iconColor: 'text-sky-600',
        },
        {
            label: t('admin.analytics.kpi.verification_queue'),
            value: totals.verification_queue.toLocaleString('id-ID'),
            icon: ShieldCheck,
            accent: 'bg-rose-500',
            iconBg: 'bg-rose-50',
            iconColor: 'text-rose-600',
        },
    ];

    // ── Growth chart ──
    const growthMonths = (series.users ?? []).map((p) => fmtMonth(p.month));
    const growthOptions: ApexOptions = {
        chart: { ...BASE_CHART, type: 'area' },
        colors: [C.primary, C.violet, C.emerald],
        fill: {
            type: 'gradient',
            gradient: { shadeIntensity: 1, opacityFrom: 0.2, opacityTo: 0.02 },
        },
        stroke: { curve: 'smooth', width: 2.5 },
        xaxis: {
            categories: growthMonths,
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: { style: { fontSize: '11px' } },
        },
        yaxis: { labels: { style: { fontSize: '11px' } } },
        grid: { borderColor: '#f1f5f9', strokeDashArray: 3 },
        legend: {
            position: 'top',
            horizontalAlign: 'right',
            fontSize: '12px',
            markers: { size: 5 },
        },
        tooltip: { shared: true, intersect: false, theme: 'light' },
        dataLabels: { enabled: false },
    };

    // ── Revenue chart ──
    const revenueOptions: ApexOptions = {
        chart: { ...BASE_CHART, type: 'area' },
        colors: [C.emerald],
        fill: {
            type: 'gradient',
            gradient: { shadeIntensity: 1, opacityFrom: 0.25, opacityTo: 0.02 },
        },
        stroke: { curve: 'smooth', width: 2.5 },
        xaxis: {
            categories: revenueSeries.map((p) => fmtMonth(p.month)),
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: { style: { fontSize: '11px' } },
        },
        yaxis: {
            labels: {
                style: { fontSize: '11px' },
                formatter: (v) => fmtIDR(v),
            },
        },
        grid: { borderColor: '#f1f5f9', strokeDashArray: 3 },
        tooltip: {
            theme: 'light',
            y: { formatter: (v) => `Rp ${v.toLocaleString('id-ID')}` },
        },
        dataLabels: { enabled: false },
    };

    // ── Subscription donut ──
    const subData = subscriptionsByPlan.map((p) => p.active_count);
    const subDonutOptions: ApexOptions = {
        chart: { ...BASE_CHART, type: 'donut' },
        labels: subscriptionsByPlan.map((p) => p.name),
        colors: PALETTE,
        legend: { position: 'bottom', fontSize: '12px' },
        plotOptions: {
            pie: {
                donut: {
                    size: '72%',
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: t('admin.analytics.charts.active'),
                            fontSize: '11px',
                            color: '#6b7280',
                            formatter: () => `${totals.active_subscriptions}`,
                        },
                        value: { fontSize: '22px', fontWeight: '700' },
                    },
                },
            },
        },
        dataLabels: { enabled: false },
        tooltip: {
            theme: 'light',
            y: {
                formatter: (v) =>
                    `${v} ${t('admin.analytics.charts.subscriber')}`,
            },
        },
    };

    // ── Application funnel (column) ──
    const funnelOrder = [
        'applied',
        'screened',
        'shortlisted',
        'interview',
        'offer',
        'hired',
    ];
    const funnelLabelMap: Record<string, string> = {
        applied: t('admin.analytics.funnel.applied'),
        screened: t('admin.analytics.funnel.screened'),
        shortlisted: t('admin.analytics.funnel.shortlisted'),
        interview: t('admin.analytics.funnel.interview'),
        offer: t('admin.analytics.funnel.offer'),
        hired: t('admin.analytics.funnel.hired'),
    };
    const funnelOptions: ApexOptions = {
        chart: { ...BASE_CHART, type: 'bar' },
        plotOptions: {
            bar: { distributed: true, borderRadius: 6, columnWidth: '55%' },
        },
        colors: [C.blue, C.amber, C.emerald, C.violet, C.rose, C.sky],
        dataLabels: {
            enabled: true,
            formatter: (v) => (Number(v) === 0 ? '' : `${v}`),
            style: {
                fontSize: '11px',
                fontWeight: '600',
                colors: ['#fff'],
            },
            dropShadow: { enabled: false },
        },
        xaxis: {
            categories: funnelOrder.map((k) => funnelLabelMap[k] ?? k),
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: { style: { fontSize: '11px' } },
        },
        yaxis: { labels: { style: { fontSize: '11px' } } },
        grid: { borderColor: '#f1f5f9', strokeDashArray: 3 },
        legend: { show: false },
        tooltip: {
            theme: 'light',
            y: {
                formatter: (v) =>
                    `${v} ${t('admin.analytics.charts.applicant')}`,
            },
        },
    };

    // ── Status distribution donut ──
    const statusColorMap: Record<string, string> = {
        applied: C.blue,
        screened: C.amber,
        shortlisted: C.violet,
        interview: C.sky,
        offer: C.emerald,
        hired: C.green,
        rejected: C.red,
        withdrawn: C.gray,
    };
    const statusLabelMap: Record<string, string> = {
        applied: t('admin.analytics.funnel.applied'),
        screened: t('admin.analytics.funnel.screened'),
        shortlisted: t('admin.analytics.funnel.shortlisted'),
        interview: t('admin.analytics.funnel.interview'),
        offer: t('admin.analytics.funnel.offer'),
        hired: t('admin.analytics.funnel.hired'),
        rejected: t('admin.analytics.funnel.rejected'),
        withdrawn: t('admin.analytics.funnel.withdrawn'),
    };
    const statusEntries = Object.entries(applicationFunnel).filter(
        ([, v]) => v > 0,
    );
    const statusDonutOptions: ApexOptions = {
        chart: { ...BASE_CHART, type: 'donut' },
        labels: statusEntries.map(([k]) => statusLabelMap[k] ?? k),
        colors: statusEntries.map(([k]) => statusColorMap[k] ?? C.primary),
        legend: { position: 'bottom', fontSize: '11px' },
        plotOptions: {
            pie: {
                donut: {
                    size: '68%',
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: t('admin.analytics.charts.total'),
                            fontSize: '11px',
                            color: '#6b7280',
                        },
                        value: { fontSize: '22px', fontWeight: '700' },
                    },
                },
            },
        },
        dataLabels: { enabled: false },
        tooltip: {
            theme: 'light',
            y: {
                formatter: (v) =>
                    `${v} ${t('admin.analytics.charts.application')}`,
            },
        },
    };

    // ── Top industries (horizontal bar) ──
    const industries = topIndustries.slice(0, 10);
    const industryOptions: ApexOptions = {
        chart: { ...BASE_CHART, type: 'bar' },
        plotOptions: {
            bar: { horizontal: true, borderRadius: 4, barHeight: '65%' },
        },
        colors: [C.primary],
        dataLabels: {
            enabled: true,
            formatter: (v) => (Number(v) === 0 ? '' : `${v}`),
            style: { fontSize: '11px', colors: ['#fff'] },
            dropShadow: { enabled: false },
        },
        xaxis: {
            categories: industries.map((i) => i.name),
            labels: { show: false },
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: { labels: { style: { fontSize: '11px' } } },
        grid: { show: false },
        tooltip: {
            theme: 'light',
            y: { formatter: (v) => `${v} ${t('admin.analytics.charts.job')}` },
        },
    };

    // ── Work mode pie ──
    const workModeMap: Record<string, string> = {
        remote: t('admin.analytics.work_mode.remote'),
        hybrid: t('admin.analytics.work_mode.hybrid'),
        onsite: t('admin.analytics.work_mode.onsite'),
    };
    const workModeEntries = Object.entries(jobsByWorkMode).filter(
        ([, v]) => v > 0,
    );
    const workModeOptions: ApexOptions = {
        chart: { ...BASE_CHART, type: 'pie' },
        labels: workModeEntries.map(([k]) => workModeMap[k] ?? k),
        colors: [C.blue, C.amber, C.emerald],
        legend: { position: 'bottom', fontSize: '12px' },
        dataLabels: {
            enabled: true,
            formatter: (v) => `${Number(v).toFixed(0)}%`,
        },
        tooltip: {
            theme: 'light',
            y: { formatter: (v) => `${v} ${t('admin.analytics.charts.job')}` },
        },
    };

    // ── AI stacked bar ──
    const aiOptions: ApexOptions = {
        chart: { ...BASE_CHART, type: 'bar', stacked: true },
        plotOptions: { bar: { borderRadius: 4, columnWidth: '50%' } },
        colors: [C.emerald, C.red],
        dataLabels: { enabled: false },
        xaxis: {
            categories: aiByFeature.map((f) => fmtLabel(f.feature)),
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: { style: { fontSize: '11px' }, rotate: -15 },
        },
        yaxis: { labels: { style: { fontSize: '11px' } } },
        grid: { borderColor: '#f1f5f9', strokeDashArray: 3 },
        legend: {
            position: 'top',
            horizontalAlign: 'right',
            fontSize: '12px',
            markers: { size: 5 },
        },
        tooltip: { theme: 'light', shared: true, intersect: false },
    };

    const metricRows = [
        {
            label: t('admin.analytics.metrics.conversion_rate'),
            value: `${summary.conversion_apply}%`,
            color: '',
        },
        {
            label: t('admin.analytics.metrics.verified_companies'),
            value: totals.verified_companies.toLocaleString('id-ID'),
            color: '',
        },
        {
            label: t('admin.analytics.metrics.report_pending'),
            value: `${summary.report_pending}`,
            color: 'text-amber-600',
        },
        {
            label: t('admin.analytics.metrics.ai_failed'),
            value: `${summary.ai_failed}`,
            color: 'text-rose-600',
        },
        {
            label: t('admin.analytics.metrics.payment_pending'),
            value: `${totals.pending_payments}`,
            color: 'text-amber-600',
        },
    ];

    return (
        <>
            <Head title={t('admin.analytics.title')} />

            <div className="flex flex-col gap-6 p-4 sm:p-6">
                {/* Header */}
                <div className="border-b pb-5">
                    <h1 className="text-2xl font-bold tracking-tight">
                        {t('admin.analytics.title')}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {t('admin.analytics.subtitle')}
                    </p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                    {kpiCards.map((c) => (
                        <KpiCard key={c.label} {...c} />
                    ))}
                </div>

                {/* Platform Growth */}
                <Card className="shadow-sm">
                    <CardHeader className="pb-0">
                        <CardTitle className="text-sm font-semibold">
                            {t('admin.analytics.growth.title')}
                        </CardTitle>
                        <CardDescription>
                            {t('admin.analytics.growth.desc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <ReactApexChart
                            type="area"
                            series={[
                                {
                                    name: t('admin.analytics.charts.user'),
                                    data: (series.users ?? []).map(
                                        (p) => p.total,
                                    ),
                                },
                                {
                                    name: t('admin.analytics.charts.job'),
                                    data: (series.jobs ?? []).map(
                                        (p) => p.total,
                                    ),
                                },
                                {
                                    name: t(
                                        'admin.analytics.charts.application',
                                    ),
                                    data: (series.applications ?? []).map(
                                        (p) => p.total,
                                    ),
                                },
                            ]}
                            options={growthOptions}
                            height={280}
                        />
                    </CardContent>
                </Card>

                {/* Revenue + Subscription */}
                <div className="grid gap-6 lg:grid-cols-2">
                    <Card className="shadow-sm">
                        <CardHeader className="pb-0">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <CardTitle className="text-sm font-semibold">
                                        {t('admin.analytics.revenue.title')}
                                    </CardTitle>
                                    <CardDescription>
                                        {t('admin.analytics.revenue.desc')}
                                    </CardDescription>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                                        {t(
                                            'admin.analytics.revenue.total_label',
                                        )}
                                    </p>
                                    <p className="text-base font-bold text-emerald-600">
                                        Rp{' '}
                                        {summary.subscription_revenue.toLocaleString(
                                            'id-ID',
                                        )}
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-2">
                            {revenueSeries.every((p) => p.total === 0) ? (
                                <Empty height={220} />
                            ) : (
                                <ReactApexChart
                                    type="area"
                                    series={[
                                        {
                                            name: t(
                                                'admin.analytics.charts.revenue',
                                            ),
                                            data: revenueSeries.map(
                                                (p) => p.total,
                                            ),
                                        },
                                    ]}
                                    options={revenueOptions}
                                    height={220}
                                />
                            )}
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-0">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <CardTitle className="text-sm font-semibold">
                                        {t(
                                            'admin.analytics.subscription.title',
                                        )}
                                    </CardTitle>
                                    <CardDescription>
                                        {t('admin.analytics.subscription.desc')}
                                    </CardDescription>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                                        {t(
                                            'admin.analytics.subscription.est_mrr',
                                        )}
                                    </p>
                                    <p className="text-base font-bold text-[#136BB4]">
                                        Rp {mrr.toLocaleString('id-ID')}
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-2">
                            {subData.every((v) => v === 0) ? (
                                <Empty height={220} />
                            ) : (
                                <ReactApexChart
                                    type="donut"
                                    series={subData}
                                    options={subDonutOptions}
                                    height={220}
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Application Funnel + Status */}
                <div className="grid gap-6 lg:grid-cols-2">
                    <Card className="shadow-sm">
                        <CardHeader className="pb-0">
                            <CardTitle className="text-sm font-semibold">
                                {t('admin.analytics.funnel.title')}
                            </CardTitle>
                            <CardDescription>
                                {t('admin.analytics.funnel.desc')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-2">
                            <ReactApexChart
                                type="bar"
                                series={[
                                    {
                                        name: t(
                                            'admin.analytics.charts.applicant',
                                        ),
                                        data: funnelOrder.map(
                                            (k) => applicationFunnel[k] ?? 0,
                                        ),
                                    },
                                ]}
                                options={funnelOptions}
                                height={250}
                            />
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-0">
                            <CardTitle className="text-sm font-semibold">
                                {t('admin.analytics.status_dist.title')}
                            </CardTitle>
                            <CardDescription>
                                {t('admin.analytics.status_dist.desc')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-2">
                            {statusEntries.length === 0 ? (
                                <Empty height={250} />
                            ) : (
                                <ReactApexChart
                                    type="donut"
                                    series={statusEntries.map(([, v]) => v)}
                                    options={statusDonutOptions}
                                    height={250}
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Industries + Work Mode */}
                <div className="grid gap-6 lg:grid-cols-2">
                    <Card className="shadow-sm">
                        <CardHeader className="pb-0">
                            <CardTitle className="text-sm font-semibold">
                                {t('admin.analytics.top_industries.title')}
                            </CardTitle>
                            <CardDescription>
                                {t('admin.analytics.top_industries.desc')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-2">
                            {industries.length === 0 ? (
                                <Empty height={300} />
                            ) : (
                                <ReactApexChart
                                    type="bar"
                                    series={[
                                        {
                                            name: t(
                                                'admin.analytics.charts.job',
                                            ),
                                            data: industries.map(
                                                (i) => i.total,
                                            ),
                                        },
                                    ]}
                                    options={industryOptions}
                                    height={industries.length * 38 + 24}
                                />
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex flex-col gap-6">
                        <Card className="shadow-sm">
                            <CardHeader className="pb-0">
                                <CardTitle className="text-sm font-semibold">
                                    {t('admin.analytics.work_mode.title')}
                                </CardTitle>
                                <CardDescription>
                                    {t('admin.analytics.work_mode.desc')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-2">
                                {workModeEntries.length === 0 ? (
                                    <Empty height={200} />
                                ) : (
                                    <ReactApexChart
                                        type="pie"
                                        series={workModeEntries.map(
                                            ([, v]) => v,
                                        )}
                                        options={workModeOptions}
                                        height={200}
                                    />
                                )}
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold">
                                    {t('admin.analytics.metrics.title')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-0">
                                {metricRows.map((row) => (
                                    <div
                                        key={row.label}
                                        className="flex items-center justify-between gap-2 text-sm"
                                    >
                                        <span className="text-muted-foreground">
                                            {row.label}
                                        </span>
                                        <span
                                            className={`font-semibold tabular-nums ${row.color}`}
                                        >
                                            {row.value}
                                        </span>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* AI Feature Usage */}
                {aiByFeature.length > 0 && (
                    <Card className="shadow-sm">
                        <CardHeader className="pb-0">
                            <CardTitle className="text-sm font-semibold">
                                {t('admin.analytics.ai_usage.title')}
                            </CardTitle>
                            <CardDescription>
                                {t('admin.analytics.ai_usage.desc')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-2">
                            <ReactApexChart
                                type="bar"
                                series={[
                                    {
                                        name: t(
                                            'admin.analytics.charts.success',
                                        ),
                                        data: aiByFeature.map((f) => f.success),
                                    },
                                    {
                                        name: t(
                                            'admin.analytics.charts.failed',
                                        ),
                                        data: aiByFeature.map((f) => f.failed),
                                    },
                                ]}
                                options={aiOptions}
                                height={300}
                            />
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}
