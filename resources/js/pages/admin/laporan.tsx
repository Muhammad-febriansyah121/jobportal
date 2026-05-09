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
import { useTranslate } from '@/hooks/use-translate';
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

function shortMonth(ym: string, t: any): string {
    const [y, m] = ym.split('-');
    const months = [
        t('admin.reports.months.jan'), t('admin.reports.months.feb'), t('admin.reports.months.mar'), t('admin.reports.months.apr'), t('admin.reports.months.may'), t('admin.reports.months.jun'),
        t('admin.reports.months.jul'), t('admin.reports.months.aug'), t('admin.reports.months.sep'), t('admin.reports.months.oct'), t('admin.reports.months.nov'), t('admin.reports.months.dec'),
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
    const { t } = useTranslate();
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
            categories: points.map((p) => shortMonth(p.month, t)),
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
    const series = [{ name: t('admin.reports.charts.legend_total'), data: points.map((p) => p.total) }];
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
    const { t } = useTranslate();
    const categories = companySeries.map((p) => shortMonth(p.month, t));
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
        { name: t('admin.reports.charts.legend_company'), data: companySeries.map((p) => p.total) },
        { name: t('admin.reports.charts.legend_user'), data: userSeries.map((p) => p.total) },
        { name: t('admin.reports.charts.legend_application'), data: applicationSeries.map((p) => p.total) },
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
    const { t } = useTranslate();
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
                            label: t('admin.reports.charts.legend_total'),
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
    const { t } = useTranslate();
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
                            label: t('admin.reports.charts.legend_transactions'),
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
    const { t } = useTranslate();
    const kpis = [
        {
            label: t('admin.reports.kpi.total_revenue'),
            value: fmtIDR(summary.revenue_total),
            sub: t('admin.reports.kpi.all_time'),
            icon: TrendingUp,
            color: 'text-primary',
            bg: 'bg-primary/8',
        },
        {
            label: t('admin.reports.kpi.revenue_30_days'),
            value: fmtIDR(summary.revenue_30d),
            sub: `${summary.revenue_count_30d} transaksi`,
            icon: CreditCard,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
        },
        {
            label: t('admin.reports.kpi.active_subscriptions'),
            value: summary.active_subscriptions.toLocaleString(),
            sub: `${subscriptionStats.expired} expired · ${subscriptionStats.cancelled} batal`,
            icon: Building2,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
        },
        {
            label: t('admin.reports.kpi.new_users'),
            value: summary.users_30d.toLocaleString(),
            sub: t('admin.reports.kpi.last_30_days'),
            icon: Users,
            color: 'text-violet-600',
            bg: 'bg-violet-50',
        },
        {
            label: t('admin.reports.kpi.new_companies'),
            value: summary.companies_30d.toLocaleString(),
            sub: t('admin.reports.kpi.last_30_days'),
            icon: Building2,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
        },
        {
            label: t('admin.reports.kpi.new_applications'),
            value: summary.applications_30d.toLocaleString(),
            sub: t('admin.reports.kpi.last_30_days'),
            icon: Activity,
            color: 'text-rose-600',
            bg: 'bg-rose-50',
        },
    ];

    return (
        <>
            <Head title={t('admin.reports.title')} />
            <div className="flex flex-col gap-6 p-4 sm:p-6">
                {/* Header */}
                <div className="flex items-center gap-3 border-b pb-5">
                    <div className="rounded-xl bg-primary/10 p-2.5">
                        <FileSpreadsheet className="size-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {t('admin.reports.title')}
                        </h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {t('admin.reports.subtitle')}
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
                            <CardTitle className="text-base">{t('admin.reports.charts.revenue_trend')}</CardTitle>
                            <CardDescription className="text-xs">
                                {t('admin.reports.charts.last_12_months')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="-mx-2">
                            <RevenueAreaChart points={revenueSeries} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">{t('admin.reports.charts.revenue_per_plan')}</CardTitle>
                            <CardDescription className="text-xs">
                                {t('admin.reports.charts.revenue_per_plan_desc')}
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
                                {t('admin.reports.charts.platform_growth')}
                            </CardTitle>
                            <CardDescription className="text-xs">
                                {t('admin.reports.charts.platform_growth_desc')}
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
                            <CardTitle className="text-base">{t('admin.reports.charts.payment_status')}</CardTitle>
                            <CardDescription className="text-xs">
                                {t('admin.reports.charts.payment_status_desc')}
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
                                {t('admin.reports.top_companies.title')}
                            </CardTitle>
                            <CardDescription className="text-xs">
                                {t('admin.reports.top_companies.desc')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-slate-50 text-xs text-muted-foreground dark:bg-muted/30">
                                            <th className="px-4 py-2.5 text-left font-medium">
                                                {t('admin.reports.top_companies.th_hash')}
                                            </th>
                                            <th className="px-4 py-2.5 text-left font-medium">
                                                {t('admin.reports.top_companies.th_company')}
                                            </th>
                                            <th className="px-4 py-2.5 text-left font-medium">
                                                {t('admin.reports.top_companies.th_city')}
                                            </th>
                                            <th className="px-4 py-2.5 text-right font-medium">
                                                {t('admin.reports.top_companies.th_transactions')}
                                            </th>
                                            <th className="px-4 py-2.5 text-right font-medium">
                                                {t('admin.reports.top_companies.th_total_revenue')}
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
                            <h2 className="text-base font-semibold">{t('admin.reports.export.title')}</h2>
                            <p className="text-xs text-muted-foreground">
                                {t('admin.reports.export.subtitle')}
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
                        {t('admin.reports.export.footer_1')}
                        {t('admin.reports.export.footer_2')}{' '}
                        <span className="font-semibold">{t('admin.reports.export.footer_sheet')}</span>{t('admin.reports.export.footer_3')}
                    </p>
                </div>
            </div>
        </>
    );
}

/* ─── Export Card Components ─── */

function RevenueExportCard() {
    const { t } = useTranslate();
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
            title={t('admin.reports.export.revenue.title')}
            desc={t('admin.reports.export.revenue.desc')}
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
                label={t('admin.reports.export.revenue.filter_label')}
                value={status}
                onChange={setStatus}
                options={[
                    { value: 'paid', label: t('admin.reports.export.revenue.status_paid') },
                    { value: 'pending', label: t('admin.reports.export.revenue.status_pending') },
                    { value: 'failed', label: t('admin.reports.export.revenue.status_failed') },
                    { value: 'refunded', label: t('admin.reports.export.revenue.status_refunded') },
                ]}
                placeholder={t('admin.reports.export.filter_all_status')}
            />
        </ExportCard>
    );
}

function LamaranExportCard() {
    const { t } = useTranslate();
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
            title={t('admin.reports.export.applications.title')}
            desc={t('admin.reports.export.applications.desc')}
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
                label={t('admin.reports.export.applications.filter_label')}
                value={status}
                onChange={setStatus}
                options={[
                    { value: 'applied', label: t('admin.reports.export.applications.status_applied') },
                    { value: 'screened', label: t('admin.reports.export.applications.status_screened') },
                    { value: 'shortlisted', label: t('admin.reports.export.applications.status_shortlisted') },
                    { value: 'interview', label: t('admin.reports.export.applications.status_interview') },
                    { value: 'offer', label: t('admin.reports.export.applications.status_offer') },
                    { value: 'hired', label: t('admin.reports.export.applications.status_hired') },
                    { value: 'rejected', label: t('admin.reports.export.applications.status_rejected') },
                    { value: 'withdrawn', label: t('admin.reports.export.applications.status_withdrawn') },
                ]}
                placeholder={t('admin.reports.export.filter_all_status')}
            />
        </ExportCard>
    );
}

function PenggunaExportCard() {
    const { t } = useTranslate();
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
            title={t('admin.reports.export.users.title')}
            desc={t('admin.reports.export.users.desc')}
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
                label={t('admin.reports.export.users.filter_label')}
                value={role}
                onChange={setRole}
                options={[
                    { value: 'candidate', label: t('admin.reports.export.users.role_candidate') },
                    { value: 'employer', label: t('admin.reports.export.users.role_employer') },
                    { value: 'mentor', label: t('admin.reports.export.users.role_mentor') },
                ]}
                placeholder={t('admin.reports.export.users.filter_all_roles')}
            />
        </ExportCard>
    );
}

function SubscriptionExportCard() {
    const { t } = useTranslate();
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
            title={t('admin.reports.export.subscription.title')}
            desc={t('admin.reports.export.subscription.desc')}
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
                label={t('admin.reports.export.subscription.filter_label')}
                value={status}
                onChange={setStatus}
                options={[
                    { value: 'active', label: t('admin.reports.export.subscription.status_active') },
                    { value: 'expired', label: t('admin.reports.export.subscription.status_expired') },
                    { value: 'cancelled', label: t('admin.reports.export.subscription.status_cancelled') },
                ]}
                placeholder={t('admin.reports.export.filter_all_status')}
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
    const { t } = useTranslate();
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
                                {t('admin.reports.export.footer_sheet')}
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
                            {t('admin.reports.export.download_btn')}
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
    const { t } = useTranslate();
    return (
        <div className="space-y-1.5">
            <Label className="text-xs font-medium">{t('admin.reports.export.date_range')}</Label>
            <div className="flex flex-col gap-2">
                <DatePicker
                    value={start}
                    onChange={onStartChange}
                    placeholder={t('admin.reports.export.date_start')}
                    maxDate={end ? parseLocalDate(end) : undefined}
                />
                <DatePicker
                    value={end}
                    onChange={onEndChange}
                    placeholder={t('admin.reports.export.date_end')}
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
                    {t('admin.reports.export.clear_date')}
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
    const { t } = useTranslate();
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
                    {value ? formatDateDisplay(value, t) : placeholder}
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
    const { t } = useTranslate();
    return (
        <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
            {t('admin.reports.charts.no_data')}
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

function formatDateDisplay(iso: string, t: any): string {
    const [y, m, d] = iso.split('-').map(Number);
    const months = [
        t('admin.reports.months.jan'), t('admin.reports.months.feb'), t('admin.reports.months.mar'), t('admin.reports.months.apr'), t('admin.reports.months.may'), t('admin.reports.months.jun'),
        t('admin.reports.months.jul'), t('admin.reports.months.aug'), t('admin.reports.months.sep'), t('admin.reports.months.oct'), t('admin.reports.months.nov'), t('admin.reports.months.dec'),
    ];
    return `${d} ${months[m - 1]} ${y}`;
}
