import { Head, Link } from '@inertiajs/react';
import type { ApexOptions } from 'apexcharts';
import ReactApexChart from 'react-apexcharts';
import {
    AlertTriangle,
    ArrowRight,
    BadgeCheck,
    BriefcaseBusiness,
    CalendarClock,
    ChevronDown,
    Clock,
    Clock3,
    ExternalLink,
    FileText,
    Flame,
    Filter,
    LineChart,
    ListChecks,
    Mic,
    Plus,
    Sparkles,
    Snowflake,
    Star,
    Trophy,
    UserPlus,
    Users,
    Video,
    Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';
import { index as billingIndex } from '@/routes/employer/billing';
import { index as candidatesIndex } from '@/routes/employer/candidates';
import { edit as companyEdit } from '@/routes/employer/company';
import {
    create as createJob,
    index as jobsIndex,
} from '@/routes/employer/jobs';
import { index as talentPoolIndex } from '@/routes/employer/talent-pool';
import { index as verificationIndex } from '@/routes/employer/verification';

type DashboardProps = {
    company: {
        id: number;
        name: string;
        verification_status: string;
        is_verified: boolean;
        subscription: string | null;
    } | null;
    subscriptionAlert: {
        status: 'expired' | 'critical' | 'warning';
        title: string;
        message: string;
        ends_at: string;
        days_left: number;
    } | null;
    quotaUsage: Array<{
        key: string;
        label: string;
        used: number;
        limit: number | null;
        remaining: number | null;
        percent: number;
        is_over_limit: boolean;
    }>;
    metrics: {
        active_jobs: number;
        total_applications: number;
        avg_response_hours: number | null;
        new_hires_month: number;
        needs_response: {
            count: number;
            overdue: number;
        };
        interviews_week: {
            count: number;
            today: number;
        };
        hire_rate_30d: {
            rate: number;
            previous: number;
            delta: number;
        };
        applications_week: {
            count: number;
            previous: number;
            delta: number | null;
        };
    };
    pipelineSummary: Array<{
        status: string;
        label: string;
        total: number;
    }>;
    recentApplications: Array<{
        id: number;
        candidate_name: string;
        headline?: string | null;
        job_title?: string | null;
        status: string;
        ai_fit_score?: number | null;
        applied_at?: string | null;
    }>;
    recentJobs: Array<{
        id: number;
        title: string;
        status: string;
        applications_count: number;
        published_at: string;
    }>;
    slaAlert: {
        job_title?: string | null;
        candidate_name?: string | null;
        sla_hours?: number | null;
        applied_at?: string | null;
    } | null;
    shortlistedCandidates: Array<{
        id: number;
        name: string;
        headline: string;
        score: number;
        job_title?: string | null;
    }>;
    candidateSources: Array<{
        source: string;
        label: string;
        total: number;
        percentage: number;
    }>;
    pipelineBoard: Array<{
        status: string;
        label: string;
        total: number;
        applications: Array<{
            id: number;
            candidate_name: string;
            headline?: string | null;
            updated_at?: string | null;
        }>;
    }>;
    recentActivities: Array<{
        id: number;
        title: string;
        actor?: string | null;
        time?: string | null;
    }>;
    actionItems: Array<{
        key: string;
        label: string;
        count: number;
        tone: 'amber' | 'blue' | 'violet' | 'red' | 'neutral';
        href: string;
        cta: string;
    }>;
    todayInterviews: Array<{
        id: number;
        candidate_name: string;
        job_title: string;
        mode: string | null;
        mode_label: string;
        scheduled_at: string | null;
        time_label: string;
        duration_minutes: number | null;
        meeting_url: string | null;
    }>;
    pipelineFunnel: Array<{
        status: string;
        label: string;
        total: number;
        conversion_percent: number | null;
        bar_percent: number;
    }>;
    applicationTrend: Array<{
        date: string;
        label: string;
        short_date: string;
        total: number;
        bar_percent: number;
    }>;
    applicationTrendTotal: number;
    topJobs: Array<{
        id: number;
        title: string;
        applications_count: number;
        recent_applications_count: number;
        published_at: string | null;
        days_published: number | null;
        is_stagnant: boolean;
    }>;
    topSkills: Array<{
        name: string;
        total: number;
        bar_percent: number;
    }>;
    coldTalentPool: Array<{
        id: number;
        name: string;
        headline: string | null;
        location: string | null;
        avatar_url: string | null;
        saved_at: string | null;
        days_cold: number;
    }>;
    sourceRoi: Array<{
        source: string;
        label: string;
        apply: number;
        progressed: number;
        hire: number;
        hire_rate: number;
        progress_rate: number;
    }>;
    recruiterLeaderboard: Array<{
        user_id: number;
        name: string;
        avatar_url: string | null;
        total_actions: number;
        bar_percent: number;
    }>;
};

const ACTION_TONE: Record<
    DashboardProps['actionItems'][number]['tone'],
    { bg: string; text: string; border: string }
> = {
    amber: {
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-200',
    },
    blue: {
        bg: 'bg-blue-50',
        text: 'text-blue-800',
        border: 'border-blue-200',
    },
    violet: {
        bg: 'bg-violet-50',
        text: 'text-violet-800',
        border: 'border-violet-200',
    },
    red: {
        bg: 'bg-rose-50',
        text: 'text-rose-800',
        border: 'border-rose-200',
    },
    neutral: {
        bg: 'bg-muted/30',
        text: 'text-foreground',
        border: 'border-input',
    },
};

export default function EmployerDashboard({
    company,
    subscriptionAlert,
    quotaUsage,
    metrics,
    slaAlert,
    actionItems,
    todayInterviews,
    pipelineFunnel,
    applicationTrend,
    applicationTrendTotal,
    topJobs,
    topSkills,
    coldTalentPool,
    sourceRoi,
    recruiterLeaderboard,
    shortlistedCandidates,
    recentActivities,
    recentJobs,
}: DashboardProps) {
    const { t } = useTranslate();
    if (company === null) {
        return (
            <>
                <Head title={t('employer.dashboard.title')} />
                <div className="min-h-screen bg-white p-4 md:p-6">
                    <div className="mx-auto max-w-3xl space-y-4">
                        <Card className="border-[#0F4C94]/20 bg-gradient-to-br from-[#eff4ff] to-background">
                            <CardContent className="space-y-4 p-8 text-center">
                                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#0F4C94]/15">
                                    <BriefcaseBusiness className="size-6 text-[#0F4C94]" />
                                </div>
                                <div className="space-y-2">
                                    <h1 className="text-2xl font-bold">
                                        {t(
                                            'employer.dashboard.complete_company_profile',
                                        )}
                                    </h1>
                                    <p className="text-sm text-muted-foreground">
                                        {t(
                                            'employer.dashboard.complete_company_profile_desc',
                                        )}
                                    </p>
                                </div>
                                <Button asChild size="lg">
                                    <Link href={companyEdit().url}>
                                        {t(
                                            'employer.dashboard.start_onboarding',
                                        )}
                                        <ArrowRight className="size-4" />
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </>
        );
    }

    const greeting = greetingByHour(t);
    const hasUrgentToday =
        todayInterviews.length > 0 ||
        actionItems.some((item) => item.count > 0) ||
        slaAlert !== null;

    return (
        <>
            <Head title={t('employer.dashboard.title')} />

            <div className="min-h-screen bg-white p-4 md:p-6">
                <div className="mx-auto max-w-7xl space-y-6">
                    <HeroBar
                        greeting={greeting}
                        company={company}
                        quotaUsage={quotaUsage}
                    />

                    {subscriptionAlert ? (
                        <SubscriptionAlertBanner alert={subscriptionAlert} />
                    ) : null}

                    {hasUrgentToday ? (
                        <SectionHeader
                            icon={Zap}
                            tone="urgent"
                            title={t('employer.dashboard.today')}
                            subtitle={t('employer.dashboard.today_subtitle')}
                        />
                    ) : null}

                    {hasUrgentToday ? (
                        <div className="grid gap-4 lg:grid-cols-2">
                            <TodayInterviewsCard interviews={todayInterviews} />
                            <ActionItemsCard items={actionItems} />
                        </div>
                    ) : null}

                    {slaAlert ? <SlaAlertBanner alert={slaAlert} /> : null}

                    <SectionHeader
                        icon={Filter}
                        title={t('employer.dashboard.application_progress')}
                        subtitle={t(
                            'employer.dashboard.application_progress_subtitle',
                        )}
                    />

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <KpiCard
                            icon={Flame}
                            label={t('employer.dashboard.kpi_needs_response')}
                            value={metrics.needs_response.count.toLocaleString(
                                'id-ID',
                            )}
                            hint={
                                metrics.needs_response.overdue > 0
                                    ? t('employer.dashboard.kpi_overdue_sla', {
                                          count: metrics.needs_response.overdue,
                                      })
                                    : t('employer.dashboard.kpi_all_on_target')
                            }
                            tone={
                                metrics.needs_response.overdue > 0
                                    ? 'rose'
                                    : metrics.needs_response.count > 0
                                      ? 'amber'
                                      : 'emerald'
                            }
                            href={candidatesIndex().url}
                        />
                        <KpiCard
                            icon={CalendarClock}
                            label={t('employer.dashboard.kpi_interviews_week')}
                            value={metrics.interviews_week.count.toLocaleString(
                                'id-ID',
                            )}
                            hint={
                                metrics.interviews_week.today > 0
                                    ? t(
                                          'employer.dashboard.kpi_scheduled_today',
                                          {
                                              count: metrics.interviews_week
                                                  .today,
                                          },
                                      )
                                    : t('employer.dashboard.kpi_none_today')
                            }
                            tone="blue"
                        />
                        <KpiCard
                            icon={UserPlus}
                            label={t('employer.dashboard.kpi_hire_rate_30d')}
                            value={`${metrics.hire_rate_30d.rate}%`}
                            hint={
                                metrics.hire_rate_30d.delta === 0
                                    ? t(
                                          'employer.dashboard.kpi_stable_vs_prev',
                                          {
                                              value: metrics.hire_rate_30d
                                                  .previous,
                                          },
                                      )
                                    : `${metrics.hire_rate_30d.delta > 0 ? '↑' : '↓'} ${Math.abs(metrics.hire_rate_30d.delta)}% ${t('employer.dashboard.kpi_vs_prev_period')}`
                            }
                            tone={
                                metrics.hire_rate_30d.delta > 0
                                    ? 'emerald'
                                    : metrics.hire_rate_30d.delta < 0
                                      ? 'rose'
                                      : 'violet'
                            }
                        />
                        <KpiCard
                            icon={FileText}
                            label={t(
                                'employer.dashboard.kpi_applications_week',
                            )}
                            value={metrics.applications_week.count.toLocaleString(
                                'id-ID',
                            )}
                            hint={
                                metrics.applications_week.delta === null
                                    ? t(
                                          'employer.dashboard.kpi_total_last_week',
                                          {
                                              value: metrics.applications_week
                                                  .previous,
                                          },
                                      )
                                    : `${metrics.applications_week.delta > 0 ? '↑' : metrics.applications_week.delta < 0 ? '↓' : '='} ${Math.abs(metrics.applications_week.delta)}% ${t('employer.dashboard.kpi_vs_last_week')}`
                            }
                            tone={
                                (metrics.applications_week.delta ?? 0) > 0
                                    ? 'emerald'
                                    : (metrics.applications_week.delta ?? 0) < 0
                                      ? 'amber'
                                      : 'violet'
                            }
                        />
                    </div>

                    {pipelineFunnel.length > 0 ? (
                        <PipelineFunnelCard funnel={pipelineFunnel} />
                    ) : null}

                    {shortlistedCandidates.length > 0 ? (
                        <>
                            <SectionHeader
                                icon={Flame}
                                tone="positive"
                                title={t('employer.dashboard.top_candidates')}
                                subtitle={t(
                                    'employer.dashboard.top_candidates_subtitle',
                                )}
                            />
                            <div className="grid gap-3 md:grid-cols-3">
                                {shortlistedCandidates.map((candidate) => (
                                    <ShortlistedCard
                                        key={candidate.id}
                                        candidate={candidate}
                                    />
                                ))}
                            </div>
                        </>
                    ) : null}

                    <SectionHeader
                        icon={LineChart}
                        title={t('employer.dashboard.performance_insight')}
                        subtitle={t(
                            'employer.dashboard.performance_insight_subtitle',
                        )}
                    />

                    <PerformanceTabs
                        applicationTrend={applicationTrend}
                        applicationTrendTotal={applicationTrendTotal}
                        topJobs={topJobs}
                        topSkills={topSkills}
                        sourceRoi={sourceRoi}
                        recruiterLeaderboard={recruiterLeaderboard}
                        coldTalentPool={coldTalentPool}
                    />

                    {recentActivities.length > 0 || recentJobs.length > 0 ? (
                        <div className="grid gap-4 lg:grid-cols-2">
                            <RecentJobsCard jobs={recentJobs} />
                            <RecentActivitiesCard
                                activities={recentActivities}
                            />
                        </div>
                    ) : null}
                </div>
            </div>
        </>
    );
}

function HeroBar({
    greeting,
    company,
    quotaUsage,
}: {
    greeting: string;
    company: NonNullable<DashboardProps['company']>;
    quotaUsage: DashboardProps['quotaUsage'];
}) {
    const { t } = useTranslate();
    const primaryQuota = quotaUsage[0] ?? null;

    return (
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-[#0F4C94] via-[#0F4C94] to-[#136BB4] text-white shadow-lg">
            <CardContent className="grid gap-5 p-6 md:grid-cols-[1.6fr_1fr] md:items-center md:p-8">
                <div className="space-y-3">
                    <p className="text-xs font-semibold tracking-[0.2em] text-white/70 uppercase">
                        {greeting}
                    </p>
                    <h1 className="text-2xl leading-tight font-bold md:text-3xl">
                        {company.name}
                    </h1>
                    <div className="flex flex-wrap gap-2">
                        {company.is_verified ? (
                            <Badge className="border-0 bg-white/15 text-white">
                                <BadgeCheck className="size-3" />
                                {t('employer.dashboard.verified')}
                            </Badge>
                        ) : (
                            <Button
                                asChild
                                size="sm"
                                variant="outline"
                                className="h-7 border-white/30 bg-white/10 text-white hover:bg-white/20"
                            >
                                <Link href={verificationIndex().url}>
                                    {t(
                                        'employer.dashboard.complete_verification',
                                    )}
                                </Link>
                            </Button>
                        )}
                        {company.subscription ? (
                            <Badge className="border-0 bg-white/15 text-white">
                                <Sparkles className="size-3" />
                                {company.subscription}
                            </Badge>
                        ) : (
                            <Badge className="border-0 bg-white/15 text-white">
                                {t('employer.dashboard.free_plan')}
                            </Badge>
                        )}
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex flex-wrap gap-2 md:justify-end">
                        <Button
                            asChild
                            size="lg"
                            className="bg-white text-[#0F4C94] hover:bg-white/90"
                        >
                            <Link href={createJob().url}>
                                <Plus className="size-4" />
                                {t('employer.dashboard.post_job')}
                            </Link>
                        </Button>
                        <Button
                            asChild
                            size="lg"
                            variant="outline"
                            className="border-white/30 bg-white/10 text-white hover:bg-white/20"
                        >
                            <Link href={candidatesIndex().url}>
                                <Users className="size-4" />
                                {t('employer.dashboard.candidates')}
                            </Link>
                        </Button>
                    </div>

                    {primaryQuota ? (
                        <div className="rounded-lg bg-white/10 p-3 text-xs">
                            <div className="mb-1.5 flex items-center justify-between">
                                <span className="font-semibold text-white/85">
                                    {primaryQuota.label}
                                </span>
                                <span className="font-semibold">
                                    {primaryQuota.used}
                                    {primaryQuota.limit !== null
                                        ? ` / ${primaryQuota.limit}`
                                        : ''}
                                </span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
                                <div
                                    className={cn(
                                        'h-full rounded-full transition-all',
                                        primaryQuota.is_over_limit
                                            ? 'bg-rose-300'
                                            : primaryQuota.percent >= 80
                                              ? 'bg-amber-300'
                                              : 'bg-white',
                                    )}
                                    style={{
                                        width: `${Math.min(100, primaryQuota.percent)}%`,
                                    }}
                                />
                            </div>
                            <Link
                                href={billingIndex().url}
                                className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-white/70 hover:text-white"
                            >
                                {t('employer.dashboard.view_all_quota')}
                                <ArrowRight className="size-3" />
                            </Link>
                        </div>
                    ) : null}
                </div>
            </CardContent>
        </Card>
    );
}

function SubscriptionAlertBanner({
    alert,
}: {
    alert: NonNullable<DashboardProps['subscriptionAlert']>;
}) {
    const { t } = useTranslate();
    const styles = {
        expired: {
            bg: 'bg-rose-50 border-rose-200',
            text: 'text-rose-900',
            icon: 'text-rose-600',
        },
        critical: {
            bg: 'bg-amber-50 border-amber-200',
            text: 'text-amber-900',
            icon: 'text-amber-600',
        },
        warning: {
            bg: 'bg-blue-50 border-blue-200',
            text: 'text-blue-900',
            icon: 'text-blue-600',
        },
    }[alert.status];

    return (
        <div
            className={cn(
                'flex flex-wrap items-start justify-between gap-3 rounded-lg border px-4 py-3',
                styles.bg,
            )}
        >
            <div className="flex items-start gap-3">
                <AlertTriangle className={cn('mt-0.5 size-5', styles.icon)} />
                <div>
                    <p className={cn('text-sm font-semibold', styles.text)}>
                        {alert.title}
                    </p>
                    <p
                        className={cn(
                            'text-xs leading-5 opacity-85',
                            styles.text,
                        )}
                    >
                        {alert.message}
                    </p>
                </div>
            </div>
            <Button asChild size="sm" variant="outline">
                <Link href={billingIndex().url}>
                    {t('employer.dashboard.view_billing')}
                </Link>
            </Button>
        </div>
    );
}

function SlaAlertBanner({
    alert,
}: {
    alert: NonNullable<DashboardProps['slaAlert']>;
}) {
    const { t } = useTranslate();
    return (
        <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
            <div className="flex items-start gap-3">
                <Clock className="mt-0.5 size-5 text-rose-600" />
                <div>
                    <p className="text-sm font-semibold text-rose-900">
                        {t('employer.dashboard.sla_deadline_passed')}
                    </p>
                    <p className="text-xs leading-5 text-rose-900/85">
                        {alert.candidate_name ??
                            t('employer.dashboard.candidate_label')}{' '}
                        {t('employer.dashboard.for_position')}{' '}
                        <span className="font-semibold">
                            {alert.job_title ?? '—'}
                        </span>{' '}
                        {t('employer.dashboard.already')}{' '}
                        {alert.applied_at ?? '—'} (SLA {alert.sla_hours ?? '—'}{' '}
                        {t('employer.dashboard.hours')}).
                    </p>
                </div>
            </div>
            <Button asChild size="sm" className="bg-rose-600 hover:bg-rose-700">
                <Link href={candidatesIndex().url}>
                    {t('employer.dashboard.review_applications')}
                </Link>
            </Button>
        </div>
    );
}

function SectionHeader({
    icon: Icon,
    title,
    subtitle,
    tone = 'neutral',
}: {
    icon: LucideIcon;
    title: string;
    subtitle?: string;
    tone?: 'urgent' | 'positive' | 'neutral';
}) {
    const iconStyle = {
        urgent: 'bg-rose-100 text-rose-700',
        positive: 'bg-emerald-100 text-emerald-700',
        neutral: 'bg-[#0F4C94]/10 text-[#0F4C94]',
    }[tone];
    return (
        <div className="flex items-start gap-3">
            <span
                className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-md',
                    iconStyle,
                )}
            >
                <Icon className="size-4" />
            </span>
            <div>
                <h2 className="text-base leading-tight font-bold">{title}</h2>
                {subtitle ? (
                    <p className="text-xs text-muted-foreground">{subtitle}</p>
                ) : null}
            </div>
        </div>
    );
}

function TodayInterviewsCard({
    interviews,
}: {
    interviews: DashboardProps['todayInterviews'];
}) {
    const { t } = useTranslate();
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <CalendarClock className="size-4 text-[#0F4C94]" />
                    {t('employer.dashboard.interview_today')}
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                    {interviews.length}
                </Badge>
            </CardHeader>
            <CardContent className="space-y-2">
                {interviews.length > 0 ? (
                    interviews.map((iv) => (
                        <div
                            key={iv.id}
                            className="flex flex-wrap items-start gap-3 rounded-lg border p-3"
                        >
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[#0F4C94]/10 text-[#0F4C94]">
                                {iv.mode === 'voice_ai' ? (
                                    <Mic className="size-4" />
                                ) : (
                                    <Video className="size-4" />
                                )}
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm leading-tight font-medium">
                                    {iv.candidate_name}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                    {iv.job_title} · {iv.mode_label}
                                </p>
                                <p className="mt-0.5 text-xs font-semibold text-[#0F4C94]">
                                    {iv.time_label}
                                    {iv.duration_minutes
                                        ? ` · ${iv.duration_minutes} ${t('employer.dashboard.minutes')}`
                                        : ''}
                                </p>
                            </div>
                            {iv.meeting_url ? (
                                <Button asChild size="sm" variant="outline">
                                    <a
                                        href={iv.meeting_url}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        <ExternalLink className="size-3.5" />
                                        {t('employer.dashboard.open')}
                                    </a>
                                </Button>
                            ) : null}
                        </div>
                    ))
                ) : (
                    <EmptyState
                        message={t('employer.dashboard.no_interview_today')}
                        icon={CalendarClock}
                    />
                )}
            </CardContent>
        </Card>
    );
}

function ActionItemsCard({ items }: { items: DashboardProps['actionItems'] }) {
    const { t } = useTranslate();
    const visible = items.filter((item) => item.count > 0);
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <ListChecks className="size-4 text-[#0F4C94]" />
                    {t('employer.dashboard.action_required')}
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                    {visible.reduce((sum, item) => sum + item.count, 0)}
                </Badge>
            </CardHeader>
            <CardContent className="space-y-2">
                {visible.length > 0 ? (
                    visible.map((item) => {
                        const tone = ACTION_TONE[item.tone];
                        return (
                            <Link
                                key={item.key}
                                href={item.href}
                                className={cn(
                                    'flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition hover:shadow-sm',
                                    tone.bg,
                                    tone.border,
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <span
                                        className={cn(
                                            'flex size-8 shrink-0 items-center justify-center rounded-md bg-white/70 text-sm font-bold',
                                            tone.text,
                                        )}
                                    >
                                        {item.count}
                                    </span>
                                    <p
                                        className={cn(
                                            'text-sm font-medium',
                                            tone.text,
                                        )}
                                    >
                                        {item.label}
                                    </p>
                                </div>
                                <span
                                    className={cn(
                                        'inline-flex items-center gap-1 text-xs font-semibold',
                                        tone.text,
                                    )}
                                >
                                    {item.cta}
                                    <ArrowRight className="size-3" />
                                </span>
                            </Link>
                        );
                    })
                ) : (
                    <EmptyState
                        message={t('employer.dashboard.no_pending_actions')}
                        icon={ListChecks}
                    />
                )}
            </CardContent>
        </Card>
    );
}

function KpiCard({
    icon: Icon,
    label,
    value,
    hint,
    tone,
    href,
}: {
    icon: LucideIcon;
    label: string;
    value: string;
    hint?: string;
    tone: 'blue' | 'violet' | 'amber' | 'emerald' | 'rose';
    href?: string;
}) {
    const iconBg = {
        blue: 'bg-blue-100 text-blue-600',
        violet: 'bg-violet-100 text-violet-600',
        amber: 'bg-amber-100 text-amber-600',
        emerald: 'bg-emerald-100 text-emerald-600',
        rose: 'bg-rose-100 text-rose-600',
    }[tone];
    const valueTone = {
        blue: 'text-foreground',
        violet: 'text-foreground',
        amber: 'text-foreground',
        emerald: 'text-foreground',
        rose: 'text-rose-700',
    }[tone];
    const hintTone = {
        blue: 'text-muted-foreground',
        violet: 'text-muted-foreground',
        amber: 'text-amber-700',
        emerald: 'text-emerald-700',
        rose: 'text-rose-700',
    }[tone];
    const inner = (
        <CardContent className="space-y-2 p-4">
            <div className="flex items-center justify-between">
                <span
                    className={cn(
                        'flex size-9 items-center justify-center rounded-md',
                        iconBg,
                    )}
                >
                    <Icon className="size-4" />
                </span>
                {href ? (
                    <ArrowRight className="size-3.5 text-muted-foreground" />
                ) : null}
            </div>
            <div>
                <p
                    className={cn(
                        'text-2xl leading-tight font-bold',
                        valueTone,
                    )}
                >
                    {value}
                </p>
                <p className="text-xs font-medium">{label}</p>
                {hint ? (
                    <p className={cn('text-[10px]', hintTone)}>{hint}</p>
                ) : null}
            </div>
        </CardContent>
    );

    if (href) {
        return (
            <Link href={href}>
                <Card className="h-full transition hover:shadow-md">
                    {inner}
                </Card>
            </Link>
        );
    }

    return <Card className="h-full">{inner}</Card>;
}

function PipelineFunnelCard({
    funnel,
}: {
    funnel: DashboardProps['pipelineFunnel'];
}) {
    const { t } = useTranslate();
    const palette = [
        '#319FC9',
        '#f59e0b',
        '#10b981',
        '#8b5cf6',
        '#f43f5e',
        '#06b6d4',
        '#f97316',
    ];

    const options: ApexOptions = {
        chart: {
            type: 'bar',
            toolbar: { show: false },
            animations: { enabled: true, speed: 600 },
        },
        plotOptions: {
            bar: {
                horizontal: false,
                distributed: true,
                borderRadius: 4,
                columnWidth: '60%',
            },
        },
        dataLabels: {
            enabled: true,
            formatter: (val, opts) => {
                if (!opts || val === 0) return '';
                const stage = funnel[opts.dataPointIndex];
                return opts.dataPointIndex > 0 &&
                    stage.conversion_percent !== null
                    ? `${val} (${stage.conversion_percent}%)`
                    : `${val}`;
            },
            style: { fontSize: '11px', fontWeight: '600', colors: ['#fff'] },
            dropShadow: { enabled: false },
        },
        colors: funnel.map((_, i) => palette[i % palette.length]),
        legend: { show: false },
        xaxis: {
            categories: funnel.map((s) => s.label),
            labels: {
                style: {
                    fontSize: '11px',
                    fontWeight: '500',
                    colors: ['#6b7280'],
                },
            },
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: {
            labels: { show: false },
        },
        grid: { show: false },
        tooltip: {
            y: {
                formatter: (val, opts) => {
                    if (!opts)
                        return `${val} ${t('employer.dashboard.applicants')}`;
                    const stage = funnel[opts.dataPointIndex];
                    let text = `${val} ${t('employer.dashboard.applicants')}`;
                    if (
                        opts.dataPointIndex > 0 &&
                        stage.conversion_percent !== null
                    ) {
                        text += ` · ${stage.conversion_percent}% ${t('employer.dashboard.from_previous_stage')}`;
                    }
                    return text;
                },
            },
        },
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Filter className="size-4 text-[#0F4C94]" />
                    {t('employer.dashboard.application_progress')}
                </CardTitle>
                <Button asChild size="sm" variant="ghost">
                    <Link href={candidatesIndex().url}>
                        {t('employer.dashboard.candidate_detail')}
                        <ArrowRight className="size-3" />
                    </Link>
                </Button>
            </CardHeader>
            <CardContent className="-mx-2">
                <ReactApexChart
                    type="bar"
                    series={[
                        {
                            name: t('employer.dashboard.applicants'),
                            data: funnel.map((s) => s.total),
                        },
                    ]}
                    options={options}
                    height={funnel.length * 52 + 20}
                />
            </CardContent>
        </Card>
    );
}

function ShortlistedCard({
    candidate,
}: {
    candidate: DashboardProps['shortlistedCandidates'][number];
}) {
    const { t } = useTranslate();
    const initials = candidate.name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
    const tone =
        candidate.score >= 80
            ? 'bg-emerald-100 text-emerald-800'
            : candidate.score >= 60
              ? 'bg-amber-100 text-amber-800'
              : 'bg-rose-100 text-rose-800';
    return (
        <Card className="transition hover:shadow-md">
            <CardContent className="space-y-3 p-4">
                <div className="flex items-start gap-3">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#0F4C94]/10 text-base font-bold text-[#0F4C94]">
                        {initials || '?'}
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="truncate leading-tight font-semibold">
                            {candidate.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                            {candidate.headline}
                        </p>
                    </div>
                    <Badge className={cn('shrink-0 text-xs', tone)}>
                        {candidate.score}
                    </Badge>
                </div>
                {candidate.job_title ? (
                    <p className="rounded-md bg-muted/40 px-2 py-1 text-xs text-muted-foreground">
                        {t('employer.dashboard.apply_to')}{' '}
                        <span className="font-medium text-foreground">
                            {candidate.job_title}
                        </span>
                    </p>
                ) : null}
                <Button asChild size="sm" variant="outline" className="w-full">
                    <Link href={`/employer/candidates/${candidate.id}`}>
                        {t('employer.dashboard.view_profile')}
                        <ArrowRight className="size-3.5" />
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}

function PerformanceTabs({
    applicationTrend,
    applicationTrendTotal,
    topJobs,
    topSkills,
    sourceRoi,
    recruiterLeaderboard,
    coldTalentPool,
}: Pick<
    DashboardProps,
    | 'applicationTrend'
    | 'applicationTrendTotal'
    | 'topJobs'
    | 'topSkills'
    | 'sourceRoi'
    | 'recruiterLeaderboard'
    | 'coldTalentPool'
>) {
    const { t } = useTranslate();
    return (
        <Tabs defaultValue="trend" className="space-y-4">
            <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto bg-muted/40 p-1">
                <PerfTab
                    value="trend"
                    icon={LineChart}
                    label={t('employer.dashboard.tab_application_trend')}
                />
                <PerfTab
                    value="jobs"
                    icon={BriefcaseBusiness}
                    label={t('employer.dashboard.tab_top_jobs')}
                    count={topJobs.length}
                />
                <PerfTab
                    value="skills"
                    icon={Sparkles}
                    label={t('employer.dashboard.tab_top_skills')}
                    count={topSkills.length}
                />
                <PerfTab
                    value="source"
                    icon={LineChart}
                    label={t('employer.dashboard.tab_source_roi')}
                    count={sourceRoi.length}
                />
                <PerfTab
                    value="team"
                    icon={Trophy}
                    label={t('employer.dashboard.tab_recruiter_team')}
                    count={recruiterLeaderboard.length}
                />
                <PerfTab
                    value="pool"
                    icon={Snowflake}
                    label={t('employer.dashboard.tab_cold_talent_pool')}
                    count={coldTalentPool.length}
                />
            </TabsList>

            <TabsContent value="trend" className="mt-0">
                <ApplicationTrendCard
                    trend={applicationTrend}
                    total={applicationTrendTotal}
                />
            </TabsContent>

            <TabsContent value="jobs" className="mt-0">
                <TopJobsCard jobs={topJobs} />
            </TabsContent>

            <TabsContent value="skills" className="mt-0">
                <TopSkillsCard skills={topSkills} />
            </TabsContent>

            <TabsContent value="source" className="mt-0">
                <SourceRoiCard items={sourceRoi} />
            </TabsContent>

            <TabsContent value="team" className="mt-0">
                <RecruiterLeaderboardCard items={recruiterLeaderboard} />
            </TabsContent>

            <TabsContent value="pool" className="mt-0">
                <ColdTalentPoolCard items={coldTalentPool} />
            </TabsContent>
        </Tabs>
    );
}

function PerfTab({
    value,
    icon: Icon,
    label,
    count,
}: {
    value: string;
    icon: LucideIcon;
    label: string;
    count?: number;
}) {
    return (
        <TabsTrigger
            value={value}
            className="shrink-0 gap-2 rounded-md border border-transparent px-3 py-2 text-xs font-medium text-muted-foreground transition data-[state=active]:border-[#0F4C94]/15 data-[state=active]:bg-[#eff4ff] data-[state=active]:text-[#0F4C94] data-[state=active]:shadow-sm sm:text-sm"
        >
            <Icon className="size-3.5" />
            <span>{label}</span>
            {count !== undefined && count > 0 ? (
                <Badge
                    variant="secondary"
                    className="ml-1 h-5 min-w-5 justify-center px-1.5 text-[10px]"
                >
                    {count}
                </Badge>
            ) : null}
        </TabsTrigger>
    );
}

function ApplicationTrendCard({
    trend,
    total,
}: {
    trend: DashboardProps['applicationTrend'];
    total: number;
}) {
    const { t } = useTranslate();
    const max = Math.max(...trend.map((p) => p.total), 1);
    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                        {t('employer.dashboard.applications_last_7_days')}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                        {t('employer.dashboard.total_label')} {total}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                {trend.length > 0 ? (
                    <div className="flex h-40 items-end gap-2">
                        {trend.map((point) => (
                            <div
                                key={point.date}
                                className="flex flex-1 flex-col items-center gap-1.5"
                            >
                                <div className="flex h-full w-full items-end">
                                    <div
                                        className="w-full rounded-t-md bg-gradient-to-t from-[#0F4C94] to-[#319FC9] transition-all hover:from-[#0F4C94] hover:to-[#319FC9]"
                                        style={{
                                            height: `${Math.max((point.total / max) * 100, point.total > 0 ? 4 : 2)}%`,
                                        }}
                                        title={`${point.label}: ${point.total} ${t('employer.dashboard.applications')}`}
                                    />
                                </div>
                                <span className="text-[10px] font-medium">
                                    {point.total}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                    {point.short_date}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        message={t('employer.dashboard.no_application_data_7d')}
                        icon={LineChart}
                    />
                )}
            </CardContent>
        </Card>
    );
}

function TopJobsCard({ jobs }: { jobs: DashboardProps['topJobs'] }) {
    const { t } = useTranslate();
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                <CardTitle className="text-base">
                    {t('employer.dashboard.most_applied_jobs')}
                </CardTitle>
                <Button asChild size="sm" variant="ghost">
                    <Link href={jobsIndex().url}>
                        {t('employer.dashboard.all_jobs')}
                        <ArrowRight className="size-3" />
                    </Link>
                </Button>
            </CardHeader>
            <CardContent className="space-y-2">
                {jobs.length > 0 ? (
                    jobs.map((job, index) => (
                        <div key={job.id} className="rounded-lg border p-3">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2">
                                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                                        #{index + 1}
                                    </span>
                                    <div>
                                        <p className="leading-tight font-medium">
                                            {job.title}
                                        </p>
                                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                                            <span>
                                                {job.applications_count}{' '}
                                                {t(
                                                    'employer.dashboard.applications',
                                                )}
                                            </span>
                                            {job.recent_applications_count >
                                            0 ? (
                                                <Badge
                                                    variant="outline"
                                                    className="text-[10px] text-emerald-700"
                                                >
                                                    +
                                                    {
                                                        job.recent_applications_count
                                                    }{' '}
                                                    {t(
                                                        'employer.dashboard.this_week',
                                                    )}
                                                </Badge>
                                            ) : null}
                                            {job.is_stagnant ? (
                                                <Badge
                                                    variant="outline"
                                                    className="text-[10px] text-amber-700"
                                                >
                                                    {t(
                                                        'employer.dashboard.stagnant',
                                                    )}
                                                </Badge>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                                <Button asChild size="sm" variant="ghost">
                                    <Link href={`/employer/jobs/${job.id}`}>
                                        <ArrowRight className="size-3.5" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    ))
                ) : (
                    <EmptyState
                        message={t('employer.dashboard.no_jobs_with_apps')}
                        icon={BriefcaseBusiness}
                    />
                )}
            </CardContent>
        </Card>
    );
}

function TopSkillsCard({ skills }: { skills: DashboardProps['topSkills'] }) {
    const { t } = useTranslate();
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base">
                    {t('employer.dashboard.top_candidate_skills')}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {skills.length > 0 ? (
                    skills.map((skill) => (
                        <div key={skill.name} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-medium">
                                    {skill.name}
                                </span>
                                <span className="text-muted-foreground">
                                    {skill.total}{' '}
                                    {t('employer.dashboard.candidates_lc')}
                                </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-muted/40">
                                <div
                                    className="h-full rounded-full bg-[#0F4C94] transition-all"
                                    style={{
                                        width: `${Math.max(skill.bar_percent, skill.total > 0 ? 4 : 0)}%`,
                                    }}
                                />
                            </div>
                        </div>
                    ))
                ) : (
                    <EmptyState
                        message={t('employer.dashboard.no_skill_data')}
                        icon={Sparkles}
                    />
                )}
            </CardContent>
        </Card>
    );
}

function SourceRoiCard({ items }: { items: DashboardProps['sourceRoi'] }) {
    const { t } = useTranslate();
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base">
                    {t('employer.dashboard.source_roi')}
                </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
                {items.length > 0 ? (
                    <table className="w-full min-w-[480px] text-sm">
                        <thead className="text-[10px] tracking-wider text-muted-foreground uppercase">
                            <tr className="border-b">
                                <th className="py-2 text-left">
                                    {t('employer.dashboard.source')}
                                </th>
                                <th className="py-2 text-right">
                                    {t('employer.dashboard.apply')}
                                </th>
                                <th className="py-2 text-right">
                                    {t('employer.dashboard.progress')}
                                </th>
                                <th className="py-2 text-right">
                                    {t('employer.dashboard.hire')}
                                </th>
                                <th className="py-2 text-right">
                                    {t('employer.dashboard.hire_percent')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr
                                    key={item.source}
                                    className="border-b last:border-0"
                                >
                                    <td className="py-2 font-medium">
                                        {item.label}
                                    </td>
                                    <td className="py-2 text-right">
                                        {item.apply}
                                    </td>
                                    <td className="py-2 text-right">
                                        {item.progressed}{' '}
                                        <span className="text-[10px] text-muted-foreground">
                                            ({item.progress_rate}%)
                                        </span>
                                    </td>
                                    <td className="py-2 text-right">
                                        {item.hire}
                                    </td>
                                    <td className="py-2 text-right font-semibold">
                                        <span
                                            className={cn(
                                                'rounded-md px-1.5 py-0.5 text-xs',
                                                item.hire_rate >= 10
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : item.hire_rate >= 5
                                                      ? 'bg-amber-100 text-amber-800'
                                                      : 'bg-rose-100 text-rose-800',
                                            )}
                                        >
                                            {item.hire_rate}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <EmptyState
                        message={t('employer.dashboard.no_source_data')}
                        icon={LineChart}
                    />
                )}
            </CardContent>
        </Card>
    );
}

function RecruiterLeaderboardCard({
    items,
}: {
    items: DashboardProps['recruiterLeaderboard'];
}) {
    const { t } = useTranslate();
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base">
                    {t('employer.dashboard.recruiter_activity')}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {items.length > 0 ? (
                    items.map((member, index) => (
                        <div
                            key={member.user_id}
                            className="flex items-center gap-3"
                        >
                            <span
                                className={cn(
                                    'flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                                    index === 0
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-muted text-muted-foreground',
                                )}
                            >
                                {index === 0 ? (
                                    <Trophy className="size-4" />
                                ) : (
                                    `#${index + 1}`
                                )}
                            </span>
                            <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="truncate text-sm font-medium">
                                        {member.name}
                                    </p>
                                    <span className="shrink-0 text-xs font-semibold">
                                        {member.total_actions}{' '}
                                        {t('employer.dashboard.actions')}
                                    </span>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-muted/40">
                                    <div
                                        className="h-full rounded-full bg-[#0F4C94]"
                                        style={{
                                            width: `${Math.max(member.bar_percent, member.total_actions > 0 ? 4 : 0)}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <EmptyState
                        message={t('employer.dashboard.no_recruiter_activity')}
                        icon={Users}
                    />
                )}
            </CardContent>
        </Card>
    );
}

function ColdTalentPoolCard({
    items,
}: {
    items: DashboardProps['coldTalentPool'];
}) {
    const { t } = useTranslate();
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                <CardTitle className="text-base">
                    {t('employer.dashboard.cold_talent_pool')}
                </CardTitle>
                <Button asChild size="sm" variant="ghost">
                    <Link href={talentPoolIndex().url}>
                        {t('employer.dashboard.all_talent_pool')}
                        <ArrowRight className="size-3" />
                    </Link>
                </Button>
            </CardHeader>
            <CardContent className="space-y-2">
                {items.length > 0 ? (
                    items.map((talent) => (
                        <div
                            key={talent.id}
                            className="flex items-start gap-3 rounded-lg border p-3"
                        >
                            {talent.avatar_url ? (
                                <img
                                    src={talent.avatar_url}
                                    alt={talent.name}
                                    className="size-10 shrink-0 rounded-full object-cover"
                                />
                            ) : (
                                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                                    {talent.name[0]?.toUpperCase() ?? '?'}
                                </span>
                            )}
                            <div className="min-w-0 flex-1 space-y-0.5">
                                <p className="truncate text-sm font-medium">
                                    {talent.name}
                                </p>
                                {talent.headline ? (
                                    <p className="truncate text-xs text-muted-foreground">
                                        {talent.headline}
                                    </p>
                                ) : null}
                                <Badge
                                    variant="outline"
                                    className="mt-1 text-[10px] text-amber-700"
                                >
                                    <Snowflake className="size-3" />
                                    {talent.days_cold}{' '}
                                    {t('employer.dashboard.days_not_contacted')}
                                </Badge>
                            </div>
                        </div>
                    ))
                ) : (
                    <EmptyState
                        message={t('employer.dashboard.no_cold_talent')}
                        icon={Snowflake}
                    />
                )}
            </CardContent>
        </Card>
    );
}

function RecentJobsCard({ jobs }: { jobs: DashboardProps['recentJobs'] }) {
    const { t } = useTranslate();
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <BriefcaseBusiness className="size-4 text-[#0F4C94]" />
                    {t('employer.dashboard.recent_jobs')}
                </CardTitle>
                <Button asChild size="sm" variant="ghost">
                    <Link href={jobsIndex().url}>
                        {t('employer.dashboard.all')}
                    </Link>
                </Button>
            </CardHeader>
            <CardContent className="space-y-2">
                {jobs.length > 0 ? (
                    jobs.map((job) => (
                        <Link
                            key={job.id}
                            href={`/employer/jobs/${job.id}`}
                            className="flex items-center justify-between gap-3 rounded-lg border p-3 transition hover:border-[#0F4C94]/40"
                        >
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                    {job.title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {job.applications_count}{' '}
                                    {t('employer.dashboard.applications')} ·{' '}
                                    {job.published_at}
                                </p>
                            </div>
                            <Badge variant="outline" className="capitalize">
                                {job.status}
                            </Badge>
                        </Link>
                    ))
                ) : (
                    <EmptyState
                        message={t('employer.dashboard.no_jobs')}
                        icon={BriefcaseBusiness}
                    />
                )}
            </CardContent>
        </Card>
    );
}

function RecentActivitiesCard({
    activities,
}: {
    activities: DashboardProps['recentActivities'];
}) {
    const { t } = useTranslate();
    const [open, setOpen] = useState(false);
    const visible = open ? activities : activities.slice(0, 4);
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Star className="size-4 text-[#0F4C94]" />
                    {t('employer.dashboard.recent_activities')}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {activities.length > 0 ? (
                    <>
                        <ol className="space-y-2 border-l border-muted pl-4">
                            {visible.map((activity) => (
                                <li key={activity.id} className="relative">
                                    <span
                                        className="absolute top-1.5 -left-[1.4rem] size-2.5 rounded-full bg-[#0F4C94]"
                                        aria-hidden
                                    />
                                    <p className="text-sm leading-tight">
                                        {activity.title}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                        {activity.actor
                                            ? `${activity.actor} · `
                                            : ''}
                                        {activity.time ?? ''}
                                    </p>
                                </li>
                            ))}
                        </ol>
                        {activities.length > 4 ? (
                            <button
                                type="button"
                                onClick={() => setOpen((v) => !v)}
                                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#0F4C94] hover:underline"
                            >
                                {open
                                    ? t('employer.dashboard.show_less')
                                    : t(
                                          'employer.dashboard.show_more_activities',
                                          { count: activities.length - 4 },
                                      )}
                                <ChevronDown
                                    className={cn(
                                        'size-3 transition',
                                        open && 'rotate-180',
                                    )}
                                />
                            </button>
                        ) : null}
                    </>
                ) : (
                    <EmptyState
                        message={t('employer.dashboard.no_activity')}
                        icon={Star}
                    />
                )}
            </CardContent>
        </Card>
    );
}

function EmptyState({
    message,
    icon: Icon,
}: {
    message: string;
    icon: LucideIcon;
}) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/20 py-8 text-center">
            <Icon className="size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{message}</p>
        </div>
    );
}

function greetingByHour(t: (key: string) => string): string {
    const hour = new Date().getHours();
    if (hour < 11) {
        return t('employer.dashboard.greeting_morning');
    }
    if (hour < 15) {
        return t('employer.dashboard.greeting_noon');
    }
    if (hour < 18) {
        return t('employer.dashboard.greeting_afternoon');
    }
    return t('employer.dashboard.greeting_evening');
}
