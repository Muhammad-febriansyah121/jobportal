import { Head, Link } from '@inertiajs/react';
import { useTranslate } from '@/hooks/use-translate';
import type { ApexOptions } from 'apexcharts';
import {
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    Banknote,
    Bot,
    BriefcaseBusiness,
    Building2,
    ChartColumn,
    CheckCircle2,
    ClipboardList,
    FileCheck2,
    Handshake,
    MapPin,
    Minus,
    Plus,
    TrendingUp,
    UserPlus,
    Users,
    WalletCards,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import ReactApexChart from 'react-apexcharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { analytics as adminAnalytics } from '@/routes/admin';
import { index as adminAiAuditLogs } from '@/routes/admin/ai-audit-logs';
import { index as adminCompanies } from '@/routes/admin/companies';
import { index as adminCompanyVerifications } from '@/routes/admin/company-verifications';
import { index as adminJobs } from '@/routes/admin/jobs';
import { index as adminReports } from '@/routes/admin/reports';
import { index as adminUsers } from '@/routes/admin/users';

type SeriesPoint = { month: string; total: number };

type Metrics = {
    total_users: number;
    total_candidates: number;
    total_companies: number;
    total_mentors: number;
    active_jobs: number;
    total_applications: number;
    pending_company_verifications: number;
    pending_reports: number;
    active_subscriptions: number;
    subscription_revenue_total: number;
    subscription_revenue_month: number;
    subscription_revenue_prev_month: number;
    new_subscriptions_month: number;
    pending_payments_count: number;
    pending_payments_total: number;
    ai_usage: { total: number; failed: number; success: number };
};

type DashboardProps = {
    metrics: Metrics;
    revenueSeries: SeriesPoint[];
    revenueByPlan: Array<{ plan: string; total: number; count: number }>;
    registrationSeries: {
        users: SeriesPoint[];
        companies: SeriesPoint[];
        jobs: SeriesPoint[];
    };
    aiUsageByFeature: Array<{ feature: string; total: number }>;
    conversionFunnel: {
        applications: number;
        interviews: number;
        hired: number;
    };
    topJobs: Array<{
        id: number;
        title: string;
        company: string;
        status: string;
        work_mode: string;
        applications_count: number;
    }>;
    topCompanies: Array<{
        id: number;
        name: string;
        verification_status: string;
        is_active: boolean;
        hq_city: string;
        job_listings_count: number;
        members_count: number;
    }>;
    recentRegistrations: Array<{
        id: number;
        name: string;
        email: string;
        role: string;
        created_at: string;
    }>;
    recentPayments: Array<{
        id: string;
        company_name: string;
        plan_name: string;
        amount: number;
        status: string;
        provider_reference: string | null;
        paid_at: string | null;
        created_at: string | null;
    }>;
};

/* ─── Chart constants ─── */
const C = {
    primary: '#0F4C94',
    blue: '#3B82F6',
    emerald: '#10B981',
    amber: '#F59E0B',
    violet: '#8B5CF6',
    rose: '#F43F5E',
} as const;

const BASE: ApexOptions['chart'] = {
    toolbar: { show: false },
    zoom: { enabled: false },
    fontFamily: 'inherit',
    animations: { enabled: true, speed: 400 },
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

function fmtIDR(value: number): string {
    if (value >= 1_000_000_000)
        return `Rp ${(value / 1_000_000_000).toFixed(1)}M`;
    if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}jt`;
    if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}rb`;
    return `Rp ${value.toLocaleString('id-ID')}`;
}

/* ─── Main component ─── */
export default function AdminDashboard({
    metrics,
    revenueSeries,
    revenueByPlan,
    registrationSeries,
    aiUsageByFeature,
    conversionFunnel,
    topJobs,
    topCompanies,
    recentRegistrations,
    recentPayments,
}: DashboardProps) {
    const { t } = useTranslate();
    const aiSuccessRate =
        metrics.ai_usage.total > 0
            ? (metrics.ai_usage.success / metrics.ai_usage.total) * 100
            : 0;

    const revenueChangePercent =
        metrics.subscription_revenue_prev_month > 0
            ? ((metrics.subscription_revenue_month -
                  metrics.subscription_revenue_prev_month) /
                  metrics.subscription_revenue_prev_month) *
              100
            : null;

    const hasAlerts =
        metrics.pending_company_verifications > 0 ||
        metrics.pending_reports > 0 ||
        metrics.ai_usage.failed > 0;

    return (
        <>
            <Head title={t('admin.dashboard.title')} />
            <div className="flex flex-col gap-8 p-4 md:p-6">
                {/* ─── Hero ─── */}
                <section className="relative overflow-hidden rounded-2xl border bg-[#0F4C94] px-6 py-5 text-white shadow-sm">
                    <div className="relative z-10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-xs font-semibold tracking-widest text-white/50 uppercase">
                                {t('admin.dashboard.admin_panel')}
                            </p>
                            <h1 className="mt-1 text-2xl font-bold tracking-tight">
                                {t('admin.dashboard.title')}
                            </h1>
                            <p className="mt-1 text-sm text-white/65">
                                {t('admin.dashboard.subtitle')}
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/20">
                                <CheckCircle2 className="mr-1 size-3.5 text-emerald-300" />
                                {t('admin.dashboard.ai_success')}{' '}
                                {aiSuccessRate.toFixed(1)}%
                            </Badge>
                            <Button
                                asChild
                                size="sm"
                                variant="outline"
                                className="border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                            >
                                <Link href={adminAnalytics()}>
                                    <ChartColumn className="mr-1.5 size-4" />
                                    {t('admin.dashboard.analytics_detail')}
                                </Link>
                            </Button>
                        </div>
                    </div>
                    <div className="pointer-events-none absolute -top-10 -right-10 size-52 rounded-full bg-white/5" />
                    <div className="pointer-events-none absolute right-36 -bottom-8 size-36 rounded-full bg-white/5" />
                </section>

                {/* ─── Alert / Priority Panel ─── */}
                {hasAlerts && (
                    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {metrics.pending_company_verifications > 0 && (
                            <AlertCard
                                href={adminCompanyVerifications({
                                    query: { status: 'pending' },
                                })}
                                icon={FileCheck2}
                                count={metrics.pending_company_verifications}
                                label={t(
                                    'admin.dashboard.alerts.pending_verification',
                                )}
                                sub={t(
                                    'admin.dashboard.alerts.pending_verification_sub',
                                )}
                                color="amber"
                            />
                        )}
                        {metrics.pending_reports > 0 && (
                            <AlertCard
                                href={adminReports({
                                    query: { status: 'open' },
                                })}
                                icon={AlertTriangle}
                                count={metrics.pending_reports}
                                label={t('admin.dashboard.alerts.open_reports')}
                                sub={t(
                                    'admin.dashboard.alerts.open_reports_sub',
                                )}
                                color="red"
                            />
                        )}
                        {metrics.ai_usage.failed > 0 && (
                            <AlertCard
                                href={adminAiAuditLogs()}
                                icon={Bot}
                                count={metrics.ai_usage.failed}
                                label={t('admin.dashboard.alerts.ai_failed')}
                                sub={t('admin.dashboard.alerts.ai_failed_sub')}
                                color="orange"
                            />
                        )}
                    </section>
                )}

                {/* ─── Revenue KPIs ─── */}
                <section className="space-y-4">
                    <SectionLabel>
                        {t('admin.dashboard.revenue.title')}
                    </SectionLabel>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <KpiCard
                            label={t('admin.dashboard.revenue.this_month')}
                            value={fmtIDR(metrics.subscription_revenue_month)}
                            icon={TrendingUp}
                            sub={
                                revenueChangePercent === null ? (
                                    <span className="text-xs text-muted-foreground">
                                        {t(
                                            'admin.dashboard.revenue.no_data_last_month',
                                        )}
                                    </span>
                                ) : revenueChangePercent === 0 ? (
                                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Minus className="size-3" />{' '}
                                        {t('admin.dashboard.revenue.no_change')}
                                    </span>
                                ) : revenueChangePercent > 0 ? (
                                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                                        <ArrowUpRight className="size-3.5" />+
                                        {revenueChangePercent.toFixed(1)}%
                                        <span className="font-normal text-muted-foreground">
                                            {t(
                                                'admin.dashboard.revenue.vs_last_month',
                                            )}
                                        </span>
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-xs font-semibold text-red-500">
                                        <ArrowDownRight className="size-3.5" />
                                        {revenueChangePercent.toFixed(1)}%
                                        <span className="font-normal text-muted-foreground">
                                            {t(
                                                'admin.dashboard.revenue.vs_last_month',
                                            )}
                                        </span>
                                    </span>
                                )
                            }
                        />
                        <KpiCard
                            label={t('admin.dashboard.revenue.total')}
                            value={fmtIDR(metrics.subscription_revenue_total)}
                            icon={Banknote}
                            sub={
                                <span className="text-xs text-muted-foreground">
                                    {t('admin.dashboard.revenue.all_time_sub')}
                                </span>
                            }
                        />
                        <KpiCard
                            label={t('admin.dashboard.revenue.active_subs')}
                            value={metrics.active_subscriptions.toLocaleString(
                                'id-ID',
                            )}
                            icon={WalletCards}
                            sub={
                                <Link
                                    href={adminAnalytics()}
                                    className="text-xs text-primary-600 hover:underline"
                                >
                                    {t('admin.dashboard.revenue.view_detail')}
                                </Link>
                            }
                        />
                        <KpiCard
                            label={t('admin.dashboard.revenue.new_subs')}
                            value={metrics.new_subscriptions_month.toLocaleString(
                                'id-ID',
                            )}
                            icon={Plus}
                            iconBg="bg-emerald-50 dark:bg-emerald-950/30"
                            iconColor="text-emerald-600"
                            sub={
                                <span className="text-xs text-muted-foreground">
                                    {t(
                                        'admin.dashboard.revenue.this_month_sub',
                                    )}
                                </span>
                            }
                        />
                    </div>

                    {/* Revenue Charts */}
                    <div className="grid gap-4 xl:grid-cols-5">
                        <Card className="xl:col-span-3">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base font-semibold">
                                    {t(
                                        'admin.dashboard.revenue.trend_6_months',
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <RevenueBarChart points={revenueSeries} />
                            </CardContent>
                        </Card>
                        <Card className="xl:col-span-2">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base font-semibold">
                                    {t('admin.dashboard.revenue.per_plan')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <RevenueDonutChart data={revenueByPlan} />
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* ─── Operasional (grid 3) ─── */}
                <section className="space-y-4">
                    <SectionLabel>
                        {t('admin.dashboard.ops.title')}
                    </SectionLabel>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <StatCard
                            label={t('admin.dashboard.ops.total_users')}
                            value={metrics.total_users}
                            sub={`${metrics.total_candidates.toLocaleString('id-ID')} ${t('admin.dashboard.ops.candidates')}`}
                            icon={Users}
                            href={adminUsers()}
                        />
                        <StatCard
                            label={t('admin.dashboard.ops.total_companies')}
                            value={metrics.total_companies}
                            icon={Building2}
                            href={adminCompanies()}
                        />
                        <StatCard
                            label={t('admin.dashboard.ops.active_jobs')}
                            value={metrics.active_jobs}
                            icon={BriefcaseBusiness}
                            href={adminJobs({ query: { status: 'published' } })}
                        />
                    </div>
                </section>

                {/* ─── Platform Growth Chart ─── */}
                <section className="space-y-4">
                    <SectionLabel>
                        {t('admin.dashboard.growth.title')}
                    </SectionLabel>
                    <Card>
                        <CardContent className="pt-4">
                            <GrowthAreaChart series={registrationSeries} />
                        </CardContent>
                    </Card>
                </section>

                {/* ─── Conversion Funnel ─── */}
                <section className="space-y-4">
                    <SectionLabel>
                        {t('admin.dashboard.funnel.title')}
                    </SectionLabel>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-stretch gap-0 sm:flex-row sm:items-center">
                                <FunnelStep
                                    label={t(
                                        'admin.dashboard.funnel.total_applications',
                                    )}
                                    value={conversionFunnel.applications}
                                    icon={ClipboardList}
                                    color="bg-[#0F4C94]"
                                />
                                <FunnelArrow
                                    rate={
                                        conversionFunnel.applications > 0
                                            ? (conversionFunnel.interviews /
                                                  conversionFunnel.applications) *
                                              100
                                            : 0
                                    }
                                />
                                <FunnelStep
                                    label={t(
                                        'admin.dashboard.funnel.interviewed',
                                    )}
                                    value={conversionFunnel.interviews}
                                    icon={Users}
                                    color="bg-blue-500"
                                />
                                <FunnelArrow
                                    rate={
                                        conversionFunnel.interviews > 0
                                            ? (conversionFunnel.hired /
                                                  conversionFunnel.interviews) *
                                              100
                                            : 0
                                    }
                                />
                                <FunnelStep
                                    label={t('admin.dashboard.funnel.hired')}
                                    value={conversionFunnel.hired}
                                    icon={Handshake}
                                    color="bg-emerald-500"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* ─── Leaderboard ─── */}
                <section className="space-y-4">
                    <SectionLabel>
                        {t('admin.dashboard.leaderboard.title')}
                    </SectionLabel>
                    <div className="grid gap-6 xl:grid-cols-2">
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base font-semibold">
                                        {t(
                                            'admin.dashboard.leaderboard.top_jobs',
                                        )}
                                    </CardTitle>
                                    <Button
                                        asChild
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs"
                                    >
                                        <Link href={adminJobs()}>
                                            {t(
                                                'admin.dashboard.leaderboard.see_all',
                                            )}
                                        </Link>
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-1 pt-0">
                                {topJobs.length === 0 ? (
                                    <p className="py-4 text-center text-sm text-muted-foreground">
                                        {t(
                                            'admin.dashboard.leaderboard.no_data',
                                        )}
                                    </p>
                                ) : (
                                    topJobs.map((job, i) => (
                                        <div
                                            key={job.id}
                                            className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/50"
                                        >
                                            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground">
                                                {i + 1}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">
                                                    {job.title}
                                                </p>
                                                <p className="truncate text-xs text-muted-foreground">
                                                    {job.company}
                                                </p>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <p className="text-sm font-bold text-[#0F4C94]">
                                                    {job.applications_count}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground">
                                                    {t(
                                                        'admin.dashboard.leaderboard.applications',
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base font-semibold">
                                        {t(
                                            'admin.dashboard.leaderboard.top_companies',
                                        )}
                                    </CardTitle>
                                    <Button
                                        asChild
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs"
                                    >
                                        <Link href={adminCompanies()}>
                                            {t(
                                                'admin.dashboard.leaderboard.see_all',
                                            )}
                                        </Link>
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-1 pt-0">
                                {topCompanies.length === 0 ? (
                                    <p className="py-4 text-center text-sm text-muted-foreground">
                                        {t(
                                            'admin.dashboard.leaderboard.no_data',
                                        )}
                                    </p>
                                ) : (
                                    topCompanies.map((company, i) => (
                                        <div
                                            key={company.id}
                                            className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/50"
                                        >
                                            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground">
                                                {i + 1}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5">
                                                    <p className="truncate text-sm font-medium">
                                                        {company.name}
                                                    </p>
                                                    {company.verification_status ===
                                                        'approved' && (
                                                        <CheckCircle2 className="size-3 shrink-0 text-emerald-500" />
                                                    )}
                                                    {!company.is_active && (
                                                        <Badge
                                                            variant="destructive"
                                                            className="h-4 px-1 text-[9px]"
                                                        >
                                                            {t('admin.dashboard.leaderboard.suspend')}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <MapPin className="size-3" />
                                                    {company.hq_city}
                                                </div>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <p className="text-sm font-bold text-[#0F4C94]">
                                                    {company.job_listings_count}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground">
                                                    {t(
                                                        'admin.dashboard.leaderboard.jobs',
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </section>

                {/* ─── AI Usage + Recent Registrations ─── */}
                <div className="grid gap-6 xl:grid-cols-2">
                    {/* AI Usage */}
                    <Card>
                        <CardHeader className="pb-0">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base font-semibold">
                                    {t('admin.dashboard.ai_usage.title')}
                                </CardTitle>
                                <Button asChild variant="outline" size="sm">
                                    <Link href={adminAiAuditLogs()}>
                                        <Bot className="mr-1.5 size-3.5" />
                                        {t(
                                            'admin.dashboard.ai_usage.view_audit',
                                        )}
                                    </Link>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <AiUsageBarChart data={aiUsageByFeature} />
                        </CardContent>
                    </Card>

                    {/* Recent Registrations */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                    <UserPlus className="size-4 text-[#0F4C94]" />
                                    {t(
                                        'admin.dashboard.recent_registrations.title',
                                    )}
                                </CardTitle>
                                <Button
                                    asChild
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs"
                                >
                                    <Link href={adminUsers()}>
                                        {t(
                                            'admin.dashboard.recent_registrations.see_all',
                                        )}
                                    </Link>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="divide-y">
                                {recentRegistrations.length === 0 ? (
                                    <p className="py-4 text-center text-sm text-muted-foreground">
                                        {t(
                                            'admin.dashboard.recent_registrations.no_data',
                                        )}
                                    </p>
                                ) : (
                                    recentRegistrations.map((user) => (
                                        <div
                                            key={user.id}
                                            className="flex items-center gap-3 py-2.5"
                                        >
                                            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#0F4C94]/10 text-xs font-bold text-[#0F4C94]">
                                                {user.name
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">
                                                    {user.name}
                                                </p>
                                                <p className="truncate text-xs text-muted-foreground">
                                                    {user.email}
                                                </p>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        'text-[10px] capitalize',
                                                        user.role ===
                                                            'candidate'
                                                            ? 'border-blue-200 bg-blue-50 text-blue-700'
                                                            : 'border-emerald-200 bg-emerald-50 text-emerald-700',
                                                    )}
                                                >
                                                    {user.role === 'candidate'
                                                        ? t(
                                                              'admin.dashboard.recent_registrations.candidate',
                                                          )
                                                        : t(
                                                              'admin.dashboard.recent_registrations.employer',
                                                          )}
                                                </Badge>
                                                <p className="mt-0.5 text-[10px] text-muted-foreground">
                                                    {user.created_at}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ─── Recent Payments ─── */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-2">
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                <WalletCards className="size-4 text-[#0F4C94]" />
                                {t('admin.dashboard.recent_payments.title')}
                            </CardTitle>
                            {metrics.pending_payments_count > 0 && (
                                <Badge
                                    variant="outline"
                                    className="border-amber-200 bg-amber-50 text-amber-700"
                                >
                                    {metrics.pending_payments_count}{' '}
                                    {t('admin.dashboard.recent_payments.pending')}{' '}
                                    · {fmtIDR(metrics.pending_payments_total)}
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        {recentPayments.length === 0 ? (
                            <p className="py-4 text-center text-sm text-muted-foreground">
                                {t('admin.dashboard.recent_payments.no_data')}
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-xs text-muted-foreground">
                                            <th className="py-2 pr-3 font-medium">
                                                {t('admin.dashboard.recent_payments.company')}
                                            </th>
                                            <th className="py-2 pr-3 font-medium">
                                                {t('admin.dashboard.recent_payments.plan')}
                                            </th>
                                            <th className="py-2 pr-3 text-right font-medium">
                                                {t('admin.dashboard.recent_payments.amount')}
                                            </th>
                                            <th className="py-2 pr-3 font-medium">
                                                {t('admin.dashboard.recent_payments.status')}
                                            </th>
                                            <th className="py-2 font-medium">
                                                {t('admin.dashboard.recent_payments.when')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {recentPayments.map((p) => (
                                            <tr key={p.id}>
                                                <td className="py-2.5 pr-3">
                                                    <p className="truncate font-medium">
                                                        {p.company_name}
                                                    </p>
                                                    {p.provider_reference && (
                                                        <p className="truncate font-mono text-[10px] text-muted-foreground">
                                                            {p.provider_reference}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="py-2.5 pr-3 text-muted-foreground">
                                                    {p.plan_name}
                                                </td>
                                                <td className="py-2.5 pr-3 text-right font-mono tabular-nums">
                                                    {fmtIDR(p.amount)}
                                                </td>
                                                <td className="py-2.5 pr-3">
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            'text-[10px] capitalize',
                                                            p.status === 'paid'
                                                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                                : p.status === 'pending'
                                                                  ? 'border-amber-200 bg-amber-50 text-amber-700'
                                                                  : 'border-rose-200 bg-rose-50 text-rose-700',
                                                        )}
                                                    >
                                                        {p.status}
                                                    </Badge>
                                                </td>
                                                <td className="py-2.5 text-xs text-muted-foreground">
                                                    {p.paid_at ?? p.created_at}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

/* ─── Chart components ─── */

function RevenueBarChart({ points }: { points: SeriesPoint[] }) {
    const { t } = useTranslate();
    const hasData = points.some((p) => p.total > 0);
    if (!hasData) {
        return (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                {t('admin.dashboard.charts.no_revenue_data')}
            </div>
        );
    }

    const options: ApexOptions = {
        chart: { ...BASE, type: 'bar' },
        colors: [C.primary],
        plotOptions: {
            bar: { borderRadius: 6, columnWidth: '50%' },
        },
        dataLabels: {
            enabled: true,
            formatter: (val) => fmtIDR(val as number),
            style: { fontSize: '10px', fontWeight: '600', colors: [C.primary] },
            offsetY: -6,
            background: { enabled: false },
        },
        xaxis: {
            categories: points.map((p) => fmtMonth(p.month)),
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: { style: { fontSize: '11px' } },
        },
        yaxis: {
            labels: {
                formatter: (val) => fmtIDR(val),
                style: { fontSize: '10px' },
            },
        },
        grid: { borderColor: '#f1f5f9', strokeDashArray: 4 },
        tooltip: {
            y: { formatter: (val) => fmtIDR(val) },
        },
    };

    return (
        <ReactApexChart
            type="bar"
            height={200}
            options={options}
            series={[
                {
                    name: t('admin.dashboard.charts.revenue'),
                    data: points.map((p) => p.total),
                },
            ]}
        />
    );
}

function RevenueDonutChart({
    data,
}: {
    data: Array<{ plan: string; total: number; count: number }>;
}) {
    const { t } = useTranslate();
    if (!data.length) {
        return (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                {t('admin.dashboard.charts.no_plan_data')}
            </div>
        );
    }

    const COLORS = [C.blue, C.amber, C.emerald, C.violet, C.rose];

    const options: ApexOptions = {
        chart: { ...BASE, type: 'donut' },
        colors: COLORS,
        labels: data.map((d) => d.plan),
        legend: {
            position: 'bottom',
            fontSize: '12px',
            markers: { size: 8 },
        },
        dataLabels: {
            enabled: true,
            formatter: (val) => `${(val as number).toFixed(0)}%`,
            style: { fontSize: '11px' },
        },
        plotOptions: {
            pie: {
                donut: {
                    size: '60%',
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: t('admin.dashboard.charts.total'),
                            formatter: (w) =>
                                fmtIDR(
                                    w.globals.seriesTotals.reduce(
                                        (a: number, b: number) => a + b,
                                        0,
                                    ),
                                ),
                        },
                    },
                },
            },
        },
        tooltip: {
            y: { formatter: (val) => fmtIDR(val) },
        },
    };

    return (
        <ReactApexChart
            type="donut"
            height={220}
            options={options}
            series={data.map((d) => d.total)}
        />
    );
}

function GrowthAreaChart({
    series,
}: {
    series: {
        users: SeriesPoint[];
        companies: SeriesPoint[];
        jobs: SeriesPoint[];
    };
}) {
    const { t } = useTranslate();
    const categories = series.users.map((p) => fmtMonth(p.month));
    const hasData =
        series.users.some((p) => p.total > 0) ||
        series.companies.some((p) => p.total > 0) ||
        series.jobs.some((p) => p.total > 0);

    if (!hasData) {
        return (
            <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
                {t('admin.dashboard.charts.no_growth_data')}
            </div>
        );
    }

    const options: ApexOptions = {
        chart: { ...BASE, type: 'area', stacked: false },
        colors: [C.blue, C.amber, C.emerald],
        stroke: { curve: 'smooth', width: 2.5 },
        fill: {
            type: 'gradient',
            gradient: { shadeIntensity: 1, opacityFrom: 0.25, opacityTo: 0.02 },
        },
        markers: { size: 4, strokeWidth: 0 },
        xaxis: {
            categories,
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: { style: { fontSize: '11px' } },
        },
        yaxis: {
            labels: {
                formatter: (val) => Math.round(val).toLocaleString('id-ID'),
                style: { fontSize: '10px' },
            },
        },
        grid: { borderColor: '#f1f5f9', strokeDashArray: 4 },
        legend: {
            position: 'top',
            horizontalAlign: 'right',
            fontSize: '12px',
            markers: { size: 8 },
        },
        tooltip: {
            shared: true,
            intersect: false,
            y: { formatter: (val) => val.toLocaleString('id-ID') },
        },
    };

    return (
        <ReactApexChart
            type="area"
            height={240}
            options={options}
            series={[
                {
                    name: t('admin.dashboard.charts.users'),
                    data: series.users.map((p) => p.total),
                },
                {
                    name: t('admin.dashboard.charts.companies'),
                    data: series.companies.map((p) => p.total),
                },
                {
                    name: t('admin.dashboard.charts.job'),
                    data: series.jobs.map((p) => p.total),
                },
            ]}
        />
    );
}

function AiUsageBarChart({
    data,
}: {
    data: Array<{ feature: string; total: number }>;
}) {
    const { t } = useTranslate();
    if (!data.length) {
        return (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                {t('admin.dashboard.charts.no_ai_data')}
            </div>
        );
    }

    const options: ApexOptions = {
        chart: { ...BASE, type: 'bar' },
        colors: [C.primary],
        plotOptions: {
            bar: {
                horizontal: true,
                borderRadius: 5,
                barHeight: '55%',
                dataLabels: { position: 'right' },
            },
        },
        dataLabels: {
            enabled: true,
            formatter: (val) => (val as number).toLocaleString('id-ID'),
            style: { fontSize: '11px', fontWeight: '600', colors: [C.primary] },
            offsetX: 6,
            background: { enabled: false },
        },
        xaxis: {
            categories: data.map((d) => d.feature),
            labels: { style: { fontSize: '11px' } },
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: {
            labels: { style: { fontSize: '11px' } },
        },
        grid: {
            borderColor: '#f1f5f9',
            strokeDashArray: 4,
            xaxis: { lines: { show: true } },
            yaxis: { lines: { show: false } },
        },
        tooltip: {
            y: { formatter: (val) => val.toLocaleString('id-ID') + ' request' },
        },
    };

    const chartHeight = Math.max(180, data.length * 42);

    return (
        <ReactApexChart
            type="bar"
            height={chartHeight}
            options={options}
            series={[
                {
                    name: t('admin.dashboard.charts.request'),
                    data: data.map((d) => d.total),
                },
            ]}
        />
    );
}

/* ─── Helper components ─── */

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-center gap-3">
            <h2 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                {children}
            </h2>
            <div className="h-px flex-1 bg-border" />
        </div>
    );
}

function AlertCard({
    href,
    icon: Icon,
    count,
    label,
    sub,
    color,
}: {
    href: { url: string } | string;
    icon: LucideIcon;
    count: number;
    label: string;
    sub: string;
    color: 'amber' | 'red' | 'orange';
}) {
    const styles = {
        amber: {
            wrap: 'border-amber-200 bg-amber-50 hover:bg-amber-100 dark:border-amber-800/40 dark:bg-amber-900/10',
            icon: 'bg-amber-100 dark:bg-amber-900/30',
            iconColor: 'text-amber-600',
            title: 'text-amber-800 dark:text-amber-300',
            sub: 'text-amber-600/80',
            arrow: 'text-amber-500',
        },
        red: {
            wrap: 'border-red-200 bg-red-50 hover:bg-red-100 dark:border-red-800/40 dark:bg-red-900/10',
            icon: 'bg-red-100 dark:bg-red-900/30',
            iconColor: 'text-red-600',
            title: 'text-red-800 dark:text-red-300',
            sub: 'text-red-600/80',
            arrow: 'text-red-500',
        },
        orange: {
            wrap: 'border-orange-200 bg-orange-50 hover:bg-orange-100 dark:border-orange-800/40 dark:bg-orange-900/10',
            icon: 'bg-orange-100 dark:bg-orange-900/30',
            iconColor: 'text-orange-600',
            title: 'text-orange-800 dark:text-orange-300',
            sub: 'text-orange-600/80',
            arrow: 'text-orange-500',
        },
    }[color];

    const url = typeof href === 'string' ? href : href.url;

    return (
        <Link
            href={url}
            className={cn(
                'group flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors',
                styles.wrap,
            )}
        >
            <div
                className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-lg',
                    styles.icon,
                )}
            >
                <Icon className={cn('size-4', styles.iconColor)} />
            </div>
            <div className="min-w-0">
                <p className={cn('text-sm font-semibold', styles.title)}>
                    {count} {label}
                </p>
                <p className={cn('truncate text-xs', styles.sub)}>{sub}</p>
            </div>
            <ArrowUpRight
                className={cn(
                    'ml-auto size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100',
                    styles.arrow,
                )}
            />
        </Link>
    );
}

function KpiCard({
    label,
    value,
    icon: Icon,
    sub,
    iconBg = 'bg-[#0F4C94]/10',
    iconColor = 'text-[#0F4C94]',
}: {
    label: string;
    value: string;
    icon: LucideIcon;
    sub?: React.ReactNode;
    iconBg?: string;
    iconColor?: string;
}) {
    return (
        <article className="rounded-xl border bg-white p-4 shadow-xs dark:bg-card">
            <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-muted-foreground">{label}</p>
                <div
                    className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-lg',
                        iconBg,
                    )}
                >
                    <Icon className={cn('size-4', iconColor)} />
                </div>
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight">{value}</p>
            {sub && <div className="mt-2">{sub}</div>}
        </article>
    );
}

function StatCard({
    label,
    value,
    sub,
    icon: Icon,
    href,
}: {
    label: string;
    value: number;
    sub?: string;
    icon: LucideIcon;
    href: { url: string } | string;
}) {
    const { t } = useTranslate();
    const url = typeof href === 'string' ? href : href.url;
    return (
        <article className="rounded-xl border bg-white p-4 shadow-xs dark:bg-card">
            <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-muted-foreground">{label}</p>
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#0F4C94]/10">
                    <Icon className="size-4 text-[#0F4C94]" />
                </div>
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight">
                {value.toLocaleString('id-ID')}
            </p>
            {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
            <Button
                asChild
                variant="ghost"
                size="sm"
                className="mt-2 h-7 px-0 text-xs"
            >
                <Link href={url}>{t('admin.dashboard.ops.view_data')}</Link>
            </Button>
        </article>
    );
}

function FunnelStep({
    label,
    value,
    icon: Icon,
    color,
}: {
    label: string;
    value: number;
    icon: LucideIcon;
    color: string;
}) {
    return (
        <div className="flex flex-1 flex-col items-center gap-2 rounded-xl bg-muted/30 p-4 text-center">
            <div
                className={cn(
                    'flex size-10 items-center justify-center rounded-full text-white',
                    color,
                )}
            >
                <Icon className="size-5" />
            </div>
            <p className="text-2xl font-black tracking-tight">
                {value.toLocaleString('id-ID')}
            </p>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
        </div>
    );
}

function FunnelArrow({ rate }: { rate: number }) {
    return (
        <div className="flex shrink-0 flex-col items-center justify-center gap-1 px-2 py-4 sm:py-0">
            <ArrowUpRight className="size-4 rotate-90 text-muted-foreground sm:rotate-0" />
            <span
                className={cn(
                    'text-[11px] font-bold',
                    rate >= 50
                        ? 'text-emerald-600'
                        : rate >= 20
                          ? 'text-amber-500'
                          : 'text-red-500',
                )}
            >
                {rate.toFixed(0)}%
            </span>
        </div>
    );
}
