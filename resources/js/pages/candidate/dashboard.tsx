import { Head, Link, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Award,
    BarChart3,
    Bookmark,
    BriefcaseBusiness,
    CalendarClock,
    Check,
    FileText,
    Rocket,
} from 'lucide-react';
import { useMemo } from 'react';
import {
    EmptyState,
    ProgressBar,
    StatusBadge,
} from '@/components/candidate/candidate-ui';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useInitials } from '@/hooks/use-initials';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes/candidate';
import { index as aiInterviewsIndex } from '@/routes/candidate/ai-interviews';
import { index as cvsIndex } from '@/routes/candidate/cvs';
import { index as educationsIndex } from '@/routes/candidate/educations';
import { index as experiencesIndex } from '@/routes/candidate/experiences';
import { index as jobsIndex, show as jobShow } from '@/routes/candidate/jobs';
import { edit as onboardingEdit } from '@/routes/candidate/onboarding';
import { index as pricingIndex } from '@/routes/candidate/pricing';
import { edit as profileEdit } from '@/routes/candidate/profile';
import { index as skillsIndex } from '@/routes/candidate/skills';
import { edit as settingsProfileEdit } from '@/routes/profile';
import type { Auth } from '@/types';

type JobCard = {
    id: number;
    slug: string;
    title: string;
    company: string | null;
    company_verified: boolean;
    location: string;
    work_mode: string;
    job_type: string;
    salary_range: string;
    published_at: string | null;
    match_score?: number | null;
    match_reason?: string | null;
};

type DashboardProps = {
    profile: {
        full_name: string;
        headline?: string | null;
        location: string;
        profile_completion: number;
        preferred_role?: string | null;
        preferred_industry?: string | null;
        ai_cv_summary?: string | null;
        avatar_url?: string | null;
        profile_completion_missing: Array<{
            key: string;
            label: string;
        }>;
    };
    metrics: {
        saved_jobs: number;
        active_applications: number;
        upcoming_interviews: number;
        verified_skills: number;
    };
    primaryCv: {
        file_url: string;
        uploaded_at: string | null;
    } | null;
    cvBuilder: {
        has_free_draft_available: boolean;
        can_generate_draft: boolean;
        ai_token_balance: number;
        cv_builder_quota_balance: number;
        draft_token_cost: number;
        draft_quota_cost: number;
        builder_href: string;
        pricing_href: string;
    };
    recommendedJobs: JobCard[];
    savedJobs: JobCard[];
    activeApplications: Array<{
        id: number;
        job_title: string | null;
        company: string | null;
        status: string;
        status_label: string;
        ai_fit_score?: number | null;
        applied_at?: string | null;
    }>;
    applicationTracker: Array<{
        status: string;
        label: string;
        total: number;
    }>;
    interviews: Array<{
        id: number;
        job_title: string | null;
        company: string | null;
        mode: string;
        location_url?: string | null;
        scheduled_at?: string | null;
        status: string;
    }>;
    skills: Array<{
        id: number;
        name: string;
        proficiency?: string | null;
        years_exp?: number | null;
        verified: boolean;
    }>;
    careerTips: Array<{
        id: number;
        title: string;
        type: string;
        category?: string | null;
        thumbnail_path?: string | null;
        published_at?: string | null;
    }>;
};

export default function CandidateDashboard({
    profile,
    metrics,
    primaryCv,
    cvBuilder,
    recommendedJobs,
    activeApplications,
    applicationTracker,
    interviews,
    skills,
    careerTips,
}: DashboardProps) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const { t } = useTranslate();
    const getInitials = useInitials();
    const firstName = profile.full_name.split(' ')[0] ?? profile.full_name;
    const isOnboardingIncomplete = !auth.user?.onboarding_completed_at;
    const newestApplication = activeApplications[0];
    const visibleTracker = applicationTracker.filter((item) =>
        ['applied', 'interview', 'offer'].includes(item.status),
    );

    const completionActionByKey = (
        key: string,
    ): { cta: string; href: string } => {
        switch (key) {
            case 'profile_photo':
                return {
                    cta: t('candidate.dashboard.completion_upload_photo'),
                    href: settingsProfileEdit(),
                };
            case 'cv':
                return {
                    cta: t('candidate.dashboard.completion_upload_cv'),
                    href: cvsIndex(),
                };
            case 'skills':
                return {
                    cta: t('candidate.dashboard.completion_add_skill'),
                    href: skillsIndex(),
                };
            case 'experiences':
                return {
                    cta: t('candidate.dashboard.completion_add_experience'),
                    href: experiencesIndex(),
                };
            case 'educations':
                return {
                    cta: t('candidate.dashboard.completion_add_education'),
                    href: educationsIndex(),
                };
            default:
                return {
                    cta: t('candidate.dashboard.completion_complete_profile'),
                    href: profileEdit(),
                };
        }
    };

    const metricCards = useMemo(
        () => [
            {
                label: t('candidate.dashboard.metric_active_applications'),
                value: metrics.active_applications,
                icon: BriefcaseBusiness,
            },
            {
                label: t('candidate.dashboard.metric_saved'),
                value: metrics.saved_jobs,
                icon: Bookmark,
            },
            {
                label: t('candidate.dashboard.metric_interview'),
                value: metrics.upcoming_interviews,
                icon: CalendarClock,
            },
            {
                label: t('candidate.dashboard.metric_skill_verified'),
                value: metrics.verified_skills,
                icon: Award,
            },
        ],
        [t, metrics],
    );

    return (
        <>
            <Head title={t('candidate.dashboard.title')} />

            <div className="bg-zinc-50 px-4 py-6 text-zinc-950 md:px-8">
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                    <section className="space-y-6">
                        {isOnboardingIncomplete ? (
                            <Card className="rounded-lg border-primary-200 bg-primary-50/70">
                                <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                                    <div className="flex items-start gap-3">
                                        <span className="mt-0.5 rounded-md bg-primary-100 p-2 text-primary-700">
                                            <AlertTriangle className="size-4" />
                                        </span>
                                        <div>
                                            <p className="font-semibold text-primary-900">
                                                {t(
                                                    'candidate.dashboard.onboarding_incomplete_title',
                                                )}
                                            </p>
                                            <p className="mt-1 text-sm text-primary-800/90">
                                                {t(
                                                    'candidate.dashboard.onboarding_incomplete_description',
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        asChild
                                        className="bg-primary-600 hover:bg-primary-700"
                                    >
                                        <Link href={onboardingEdit()}>
                                            {t(
                                                'candidate.dashboard.onboarding_cta',
                                            )}
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : null}

                        <Card className="overflow-hidden rounded-lg border-zinc-200 bg-white">
                            <CardContent className="grid gap-6 p-6 md:grid-cols-[1fr_160px] md:items-center">
                                <div>
                                    <p className="text-3xl font-bold tracking-tight">
                                        {t('candidate.dashboard.greeting', {
                                            name: firstName,
                                        })}
                                    </p>
                                    <p className="mt-3 max-w-2xl text-slate-600">
                                        {t(
                                            'candidate.dashboard.recommended_today',
                                            {
                                                count: recommendedJobs.length,
                                            },
                                        )}
                                    </p>
                                    <div className="mt-6 flex flex-wrap gap-3">
                                        <Button
                                            asChild
                                            className="bg-primary-600 hover:bg-primary-700"
                                        >
                                            <Link
                                                href={jobsIndex({
                                                    query: {
                                                        tab: 'recommended',
                                                    },
                                                })}
                                            >
                                                {t(
                                                    'candidate.dashboard.cta_view_jobs',
                                                )}
                                            </Link>
                                        </Button>
                                        <Button asChild variant="secondary">
                                            <Link href={profileEdit()}>
                                                {t(
                                                    'candidate.dashboard.cta_edit_profile',
                                                )}
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                                <Avatar className="hidden size-36 rounded-lg md:flex">
                                    <AvatarImage
                                        className="rounded-lg object-cover"
                                        src={profile.avatar_url ?? undefined}
                                        alt={profile.full_name}
                                    />
                                    <AvatarFallback className="rounded-lg bg-primary-100 text-4xl font-bold text-primary-700">
                                        {getInitials(profile.full_name)}
                                    </AvatarFallback>
                                </Avatar>
                            </CardContent>
                        </Card>

                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            {metricCards.map((metric) => (
                                <div
                                    className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-4"
                                    key={metric.label}
                                >
                                    <span className="flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                                        <metric.icon className="size-5" />
                                    </span>
                                    <span>
                                        <span className="block text-xl font-bold">
                                            {metric.value}
                                        </span>
                                        <span className="text-sm text-slate-500">
                                            {metric.label}
                                        </span>
                                    </span>
                                </div>
                            ))}
                        </div>

                        <Card className="rounded-lg border-zinc-200 bg-white">
                            <CardHeader>
                                <CardTitle className="text-xl">
                                    {t(
                                        'candidate.dashboard.application_tracker_title',
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {newestApplication ? (
                                    <div>
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="flex gap-4">
                                                <span className="flex size-12 items-center justify-center rounded-lg bg-slate-100">
                                                    <BriefcaseBusiness className="size-5 text-slate-700" />
                                                </span>
                                                <span>
                                                    <span className="block font-semibold">
                                                        {
                                                            newestApplication.job_title
                                                        }
                                                    </span>
                                                    <span className="text-sm text-slate-500">
                                                        {
                                                            newestApplication.company
                                                        }{' '}
                                                        ·{' '}
                                                        {
                                                            newestApplication.applied_at
                                                        }
                                                    </span>
                                                </span>
                                            </div>
                                            <StatusBadge
                                                status={
                                                    newestApplication.status
                                                }
                                                label={
                                                    newestApplication.status_label
                                                }
                                            />
                                        </div>
                                        <div className="mt-8 grid grid-cols-3 items-start gap-3">
                                            {visibleTracker.map(
                                                (item, index) => (
                                                    <TrackerStep
                                                        active={
                                                            item.total > 0 ||
                                                            index === 0
                                                        }
                                                        key={item.status}
                                                        label={item.label}
                                                        total={item.total}
                                                    />
                                                ),
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <EmptyState
                                        title={t(
                                            'candidate.dashboard.empty_active_applications_title',
                                        )}
                                        description={t(
                                            'candidate.dashboard.empty_active_applications_description',
                                        )}
                                    />
                                )}
                            </CardContent>
                        </Card>

                        <Card className="rounded-lg border-zinc-200 bg-white">
                            <CardHeader>
                                <CardTitle className="text-xl">
                                    {t(
                                        'candidate.dashboard.skill_badges_title',
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-3 md:grid-cols-3">
                                    {skills.length ? (
                                        skills
                                            .slice(0, 6)
                                            .map((skill, index) => (
                                                <SkillBadge
                                                    index={index}
                                                    key={skill.id}
                                                    skill={skill}
                                                />
                                            ))
                                    ) : (
                                        <p className="text-sm text-slate-500">
                                            {t(
                                                'candidate.dashboard.skills_empty',
                                            )}
                                        </p>
                                    )}
                                </div>
                                <Button
                                    asChild
                                    className="mt-4 border-dashed"
                                    variant="outline"
                                >
                                    <Link href={skillsIndex()}>
                                        {t(
                                            'candidate.dashboard.cta_add_skill',
                                        )}
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="rounded-lg border-zinc-200 bg-white">
                            <CardHeader>
                                <CardTitle className="text-xl">
                                    {t(
                                        'candidate.dashboard.interview_schedule_title',
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {interviews.length ? (
                                    interviews.map((interview) => (
                                        <div
                                            className="rounded-lg border border-zinc-200 p-4"
                                            key={interview.id}
                                        >
                                            <p className="font-semibold">
                                                {interview.job_title}
                                            </p>
                                            <p className="mt-1 text-sm text-slate-500">
                                                {interview.company} ·{' '}
                                                {interview.scheduled_at}
                                            </p>
                                            <StatusBadge
                                                className="mt-3"
                                                status={interview.status}
                                            />
                                        </div>
                                    ))
                                ) : (
                                    <EmptyState
                                        title={t(
                                            'candidate.dashboard.empty_interviews_title',
                                        )}
                                        description={t(
                                            'candidate.dashboard.empty_interviews_description',
                                        )}
                                    />
                                )}
                            </CardContent>
                        </Card>
                    </section>

                    <aside className="space-y-6">
                        <Card className="rounded-lg border-zinc-200 bg-white">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <span>
                                        <span className="block text-sm font-bold tracking-[0.18em] text-slate-500 uppercase">
                                            {t(
                                                'candidate.dashboard.profile_completion_label',
                                            )}
                                        </span>
                                        <span className="mt-2 block text-3xl font-bold text-primary-600">
                                            {profile.profile_completion}%
                                        </span>
                                    </span>
                                    <BarChart3 className="size-8 text-primary-600" />
                                </div>
                                <div className="mt-5">
                                    <ProgressBar
                                        value={profile.profile_completion}
                                    />
                                </div>
                                <p className="mt-5 text-sm leading-6 text-slate-500">
                                    {t(
                                        'candidate.dashboard.profile_completion_hint',
                                    )}
                                </p>
                                {profile.profile_completion_missing.length >
                                0 ? (
                                    <div className="mt-4 rounded-lg border border-primary-100 bg-primary-50/60 p-3">
                                        <p className="text-xs font-semibold tracking-[0.1em] text-primary-700 uppercase">
                                            {t(
                                                'candidate.dashboard.missing_label',
                                            )}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-600">
                                            {t(
                                                'candidate.dashboard.missing_count',
                                                {
                                                    count: profile
                                                        .profile_completion_missing
                                                        .length,
                                                },
                                            )}
                                        </p>
                                        <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                                            {profile.profile_completion_missing.map(
                                                (item) => {
                                                    const action =
                                                        completionActionByKey(
                                                            item.key,
                                                        );

                                                    return (
                                                        <li
                                                            key={item.key}
                                                            className="flex items-start gap-2"
                                                        >
                                                            <span className="mt-1 size-1.5 rounded-full bg-primary-500" />
                                                            <span className="flex flex-wrap items-center gap-2">
                                                                <span>
                                                                    {item.label}
                                                                </span>
                                                                <Link
                                                                    href={
                                                                        action.href
                                                                    }
                                                                    className="text-xs font-semibold text-primary-700 underline underline-offset-2"
                                                                >
                                                                    {action.cta}
                                                                </Link>
                                                            </span>
                                                        </li>
                                                    );
                                                },
                                            )}
                                        </ul>
                                    </div>
                                ) : (
                                    <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
                                        {t(
                                            'candidate.dashboard.profile_complete_message',
                                        )}
                                    </div>
                                )}
                                <Button
                                    asChild
                                    className="mt-5 w-full"
                                    variant="secondary"
                                >
                                    <Link href={profileEdit()}>
                                        {t(
                                            'candidate.dashboard.cta_complete_profile',
                                        )}
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>

                        <Card className="rounded-lg border-zinc-200 bg-white">
                            <CardHeader className="flex-row items-center justify-between">
                                <CardTitle>
                                    {t(
                                        'candidate.dashboard.recommended_title',
                                    )}
                                </CardTitle>
                                <Link
                                    className="text-sm font-semibold text-primary-600"
                                    href={jobsIndex()}
                                >
                                    {t('candidate.dashboard.see_all')}
                                </Link>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {recommendedJobs.length ? (
                                    recommendedJobs
                                        .slice(0, 3)
                                        .map((job) => (
                                            <JobCardItem
                                                job={job}
                                                key={job.id}
                                            />
                                        ))
                                ) : (
                                    <EmptyState
                                        title={t(
                                            'candidate.dashboard.empty_recommended_title',
                                        )}
                                        description={t(
                                            'candidate.dashboard.empty_recommended_description',
                                        )}
                                    />
                                )}
                            </CardContent>
                        </Card>

                        <Card className="rounded-lg border-zinc-200 bg-white">
                            <CardHeader>
                                <CardTitle>
                                    {t(
                                        'candidate.dashboard.career_tips_title',
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {careerTips.length ? (
                                    careerTips.map((tip, index) => (
                                        <CareerTip
                                            index={index}
                                            key={tip.id}
                                            tip={tip}
                                        />
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-500">
                                        {t(
                                            'candidate.dashboard.career_tips_empty',
                                        )}
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="rounded-lg border-zinc-200 bg-white">
                            <CardHeader>
                                <CardTitle>
                                    {t(
                                        'candidate.dashboard.generate_cv_title',
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="rounded-lg border border-primary-100 bg-primary-50/70 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-primary-900">
                                                {t(
                                                    'candidate.dashboard.cv_builder_title',
                                                )}
                                            </p>
                                            <p className="mt-1 text-sm leading-6 text-slate-600">
                                                {t(
                                                    'candidate.dashboard.cv_builder_description',
                                                )}
                                            </p>
                                        </div>
                                        <Rocket className="size-5 text-primary-600" />
                                    </div>
                                    <div className="mt-4 space-y-1 text-xs text-slate-600">
                                        <p>
                                            {t(
                                                'candidate.dashboard.ai_token_balance_label',
                                            )}{' '}
                                            <b>
                                                {cvBuilder.ai_token_balance.toLocaleString(
                                                    'id-ID',
                                                )}
                                            </b>
                                        </p>
                                        <p>
                                            {t(
                                                'candidate.dashboard.cv_builder_quota_label',
                                            )}{' '}
                                            <b>
                                                {cvBuilder.cv_builder_quota_balance.toLocaleString(
                                                    'id-ID',
                                                )}
                                            </b>
                                        </p>
                                        <p>
                                            {cvBuilder.has_free_draft_available
                                                ? t(
                                                      'candidate.dashboard.draft_free_message',
                                                  )
                                                : t(
                                                      'candidate.dashboard.draft_cost_message',
                                                      {
                                                          tokens: cvBuilder.draft_token_cost.toLocaleString(
                                                              'id-ID',
                                                          ),
                                                          quota: cvBuilder.draft_quota_cost,
                                                      },
                                                  )}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        asChild
                                        className="flex-1 bg-primary-600 hover:bg-primary-700"
                                    >
                                        <Link href={cvsIndex()}>
                                            {t(
                                                'candidate.dashboard.cta_open_cv_builder',
                                            )}
                                        </Link>
                                    </Button>
                                    {!cvBuilder.can_generate_draft ? (
                                        <Button
                                            asChild
                                            className="flex-1"
                                            variant="outline"
                                        >
                                            <Link href={pricingIndex()}>
                                                {t(
                                                    'candidate.dashboard.cta_topup_cv',
                                                )}
                                            </Link>
                                        </Button>
                                    ) : null}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-lg border-zinc-200 bg-white">
                            <CardHeader>
                                <CardTitle>
                                    {t(
                                        'candidate.dashboard.primary_cv_title',
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {primaryCv ? (
                                    <a
                                        className="flex items-center gap-3 rounded-lg border border-zinc-200 p-4 hover:bg-zinc-50"
                                        href={primaryCv.file_url}
                                        target="_blank"
                                    >
                                        <FileText className="size-5 text-teal-700" />
                                        <span>
                                            <span className="block text-sm font-semibold">
                                                {t(
                                                    'candidate.dashboard.cv_active_label',
                                                )}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                {primaryCv.uploaded_at}
                                            </span>
                                        </span>
                                    </a>
                                ) : (
                                    <Button
                                        asChild
                                        className="w-full"
                                        variant="outline"
                                    >
                                        <Link href={cvsIndex()}>
                                            {t(
                                                'candidate.dashboard.cta_upload_cv',
                                            )}
                                        </Link>
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </aside>
                </div>
            </div>
        </>
    );
}

function TrackerStep({
    active,
    label,
    total,
}: {
    active: boolean;
    label: string;
    total: number;
}) {
    return (
        <div className="text-center">
            <span
                className={cn(
                    'mx-auto flex size-10 items-center justify-center rounded-full border text-sm font-bold',
                    active
                        ? 'border-primary-600 bg-primary-600 text-white'
                        : 'border-slate-200 bg-slate-100 text-slate-400',
                )}
            >
                {active ? <Check className="size-4" /> : total}
            </span>
            <div
                className={cn(
                    'mt-2 h-1 rounded-full',
                    active ? 'bg-primary-600' : 'bg-slate-200',
                )}
            />
            <p
                className={cn(
                    'mt-2 text-xs font-semibold',
                    active ? 'text-primary-700' : 'text-slate-400',
                )}
            >
                {label}
            </p>
        </div>
    );
}

function SkillBadge({
    skill,
    index,
}: {
    skill: DashboardProps['skills'][number];
    index: number;
}) {
    const { t } = useTranslate();
    const colors = [
        'bg-secondary-100 text-secondary-700',
        'bg-blue-100 text-blue-700',
        'bg-teal-100 text-teal-700',
    ];

    return (
        <Link
            className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 hover:bg-zinc-50"
            href={aiInterviewsIndex()}
        >
            <span
                className={cn(
                    'flex size-11 items-center justify-center rounded-lg',
                    colors[index % colors.length],
                )}
            >
                <Award className="size-5" />
            </span>
            <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">
                    {skill.name}
                </span>
                <span className="text-xs tracking-wide text-slate-500 uppercase">
                    {skill.verified
                        ? t('candidate.dashboard.skill_verified')
                        : (skill.proficiency ??
                          t('candidate.dashboard.skill_not_verified'))}
                </span>
            </span>
        </Link>
    );
}

function JobCardItem({ job }: { job: JobCard }) {
    const { t } = useTranslate();
    return (
        <Link
            className="block rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50"
            href={jobShow(job.slug)}
        >
            <div className="flex items-start justify-between gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-teal-700 text-xs font-bold text-white">
                    {(job.company ?? 'K').slice(0, 2).toUpperCase()}
                </span>
                {job.match_score ? (
                    <Badge className="rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-50">
                        {t('candidate.dashboard.match_label', {
                            score: job.match_score,
                        })}
                    </Badge>
                ) : null}
            </div>
            <p className="mt-4 leading-5 font-semibold">{job.title}</p>
            <p className="mt-1 text-sm text-slate-500">
                {job.company} · {job.location || 'Remote'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
                <Badge className="rounded-lg" variant="secondary">
                    {job.job_type}
                </Badge>
                <Badge className="rounded-lg" variant="secondary">
                    {job.work_mode}
                </Badge>
            </div>
            {job.match_reason ? (
                <p className="mt-3 line-clamp-2 text-xs text-slate-500">
                    {job.match_reason}
                </p>
            ) : null}
        </Link>
    );
}

function CareerTip({
    tip,
    index,
}: {
    tip: DashboardProps['careerTips'][number];
    index: number;
}) {
    const { t } = useTranslate();
    const featured = index === 0;

    if (featured) {
        return (
            <div className="overflow-hidden rounded-lg border border-zinc-200">
                <div className="flex h-28 items-start bg-teal-800 p-3 text-white">
                    <Badge className="rounded-lg bg-primary-600 text-white hover:bg-primary-600">
                        {tip.category ?? tip.type}
                    </Badge>
                </div>
                <div className="bg-white p-4">
                    <p className="leading-5 font-semibold">{tip.title}</p>
                    <p className="mt-2 text-sm text-slate-500">
                        {t('candidate.dashboard.read_minutes', { minutes: 5 })}{' '}
                        · {tip.type}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex gap-3 rounded-lg border border-zinc-200 p-4">
            <span className="flex size-12 items-center justify-center rounded-lg bg-slate-100 text-primary-600">
                <Rocket className="size-5" />
            </span>
            <span>
                <span className="block text-sm leading-5 font-semibold">
                    {tip.title}
                </span>
                <span className="text-xs text-slate-500">
                    {tip.category ?? tip.type}
                </span>
            </span>
        </div>
    );
}

CandidateDashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard Kandidat',
            href: dashboard(),
        },
    ],
};
