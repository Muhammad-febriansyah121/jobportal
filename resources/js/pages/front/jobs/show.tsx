import { Deferred, Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    BadgeCheck,
    Bookmark,
    BriefcaseBusiness,
    Building2,
    CheckCircle2,
    ChevronRight,
    Clock,
    ExternalLink,
    FileText,
    Globe,
    Link2,
    LogIn,
    MapPin,
    Milestone,
    Shield,
    Star,
    Target,
    Users,
    Zap,
} from 'lucide-react';
import { useState } from 'react';
import HomeLayout from '@/layouts/front/home-layout';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';
import { login, register } from '@/routes';
import { show as showCandidateJob } from '@/routes/candidate/jobs';
import { index as jobsIndex, show as jobShow } from '@/routes/jobs';

type JobShowProps = {
    job: {
        id: number;
        slug: string;
        title: string;
        is_anonymous: boolean;
        company?: string | null;
        company_verified: boolean;
        company_logo?: string | null;
        company_slug?: string | null;
        company_size?: string | null;
        company_industry?: string | null;
        industry?: string | null;
        location: string;
        work_mode: string;
        work_mode_label: string;
        job_type: string;
        job_type_label: string;
        experience_level: string;
        salary_range: string;
        published_at?: string | null;
        closes_at?: string | null;
        response_sla_hours?: number | null;
        description: string;
        responsibilities?: string | null;
        required_qualifications?: string | null;
        preferred_qualifications?: string | null;
        benefits?: string | null;
        integrity_score?: number | null;
        company_description?: string | null;
        company_culture?: string | null;
        company_benefits?: string | null;
        company_trust_score?: number | null;
        company_response_rate?: number | null;
        company_median_response_hours?: number | null;
        matched_skills: string[];
        missing_skills: string[];
        ai_match_score?: number | null;
        ai_insight?: {
            recruitment_stages: string[];
            application_tip: string;
        } | null;
        is_saved: boolean;
        has_applied: boolean;
        ai_interview_application_id?: number | null;
        skills: Array<{ id: number; name: string }>;
        screening_questions: Array<{
            id: number;
            question: string;
            type: string;
            options?: string[];
            is_required: boolean;
        }>;
    };
    cvs: Array<{
        id: number;
        file_url: string;
        is_primary: boolean;
        uploaded_at?: string | null;
    }>;
    similarJobs: Array<{
        id: number;
        slug: string;
        title: string;
        is_anonymous: boolean;
        company?: string | null;
        company_logo?: string | null;
        location: string;
        salary_range: string;
    }>;
};

type FrontJobPageProps = {
    auth?: {
        user?: {
            role?: string | null;
        } | null;
    };
};

const workModeStyle: Record<string, string> = {
    Remote: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Hybrid: 'bg-sky-50 text-sky-700 border-sky-200',
    Onsite: 'bg-slate-100 text-slate-600 border-slate-200',
};

function initials(name: string | null | undefined): string {
    if (!name) {
        return 'CO';
    }

    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('');
}

function splitListText(value?: string | null): string[] {
    if (!value) {
        return [];
    }

    const trimmed = value.trim();

    if (/<li[\s>]/i.test(trimmed)) {
        const items: string[] = [];
        const regex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
        let match: RegExpExecArray | null;

        while ((match = regex.exec(trimmed)) !== null) {
            const cleaned = stripHtmlTags(match[1] ?? '').trim();
            if (cleaned !== '') {
                items.push(cleaned);
            }
        }

        if (items.length > 0) {
            return items;
        }
    }

    return trimmed
        .split('\n')
        .map((line) =>
            stripHtmlTags(line)
                .trim()
                .replace(/^[-•*]\s*/, ''),
        )
        .filter(Boolean);
}

function stripHtmlTags(value: string): string {
    return value
        .replace(/<\/?[a-zA-Z][^<>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ')
        .trim();
}

export default function FrontJobShow({ job, similarJobs }: JobShowProps) {
    const { t } = useTranslate();
    const { auth } = usePage<FrontJobPageProps>().props;
    const isCandidate = auth?.user?.role === 'candidate';
    const [activeTab, setActiveTab] = useState<
        'deskripsi' | 'tanggung-jawab' | 'kualifikasi'
    >('deskripsi');
    const [shareState, setShareState] = useState<'idle' | 'copied'>('idle');
    const candidateApplyUrl = showCandidateJob(job.slug, {
        query: { apply: 1 },
    }).url;
    const applyCtaUrl = isCandidate
        ? candidateApplyUrl
        : login({
              query: { redirect: candidateApplyUrl },
          }).url;
    const loginCandidateJobUrl = login({
        query: { redirect: showCandidateJob(job.slug).url },
    }).url;

    const slaDays = job.response_sla_hours
        ? Math.ceil(job.response_sla_hours / 24)
        : null;
    const integrityLabel =
        (job.integrity_score ?? 0) >= 90
            ? t('front.jobs.show.integrity_very_trusted')
            : (job.integrity_score ?? 0) >= 70
              ? t('front.jobs.show.integrity_trusted')
              : t('front.jobs.show.integrity_unverified');
    const integrityColor =
        (job.integrity_score ?? 0) >= 90
            ? 'text-emerald-600'
            : (job.integrity_score ?? 0) >= 70
              ? 'text-secondary-600'
              : 'text-slate-500';
    const workModeClass =
        workModeStyle[job.work_mode_label] ??
        'bg-slate-100 text-slate-600 border-slate-200';
    const companyCultureItems = splitListText(job.company_culture);
    const companyBenefitItems = splitListText(job.company_benefits);

    const handleShare = async (): Promise<void> => {
        const shareUrl =
            typeof window === 'undefined'
                ? jobShow(job.slug).url
                : window.location.href;

        if (
            typeof navigator !== 'undefined' &&
            typeof navigator.share === 'function'
        ) {
            try {
                await navigator.share({
                    title: `${job.title} - ${job.company ?? 'Karivia'}`,
                    text: `Lihat lowongan ${job.title} di ${job.company ?? 'Karivia'}.`,
                    url: shareUrl,
                });

                return;
            } catch (error) {
                if (
                    error instanceof DOMException &&
                    error.name === 'AbortError'
                ) {
                    return;
                }
            }
        }

        if (
            typeof navigator !== 'undefined' &&
            navigator.clipboard?.writeText
        ) {
            await navigator.clipboard.writeText(
                `Lihat lowongan ${job.title} di ${job.company ?? 'Karivia'}.\n${shareUrl}`,
            );
            setShareState('copied');

            window.setTimeout(() => {
                setShareState('idle');
            }, 2000);
        }
    };

    return (
        <HomeLayout>
            <Head title={`${job.title} — ${job.company ?? 'Karivia'}`} />

            {/* Page Header */}
            <section className="relative overflow-hidden bg-white pt-14 pb-10">
                <div className="pointer-events-none absolute -top-20 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary-500/10 blur-3xl" />
                <div className="relative mx-auto max-w-6xl px-4">
                    {/* Breadcrumb */}
                    <nav className="mb-6 flex items-center gap-1.5 text-sm text-slate-500">
                        <Link
                            href={jobsIndex().url}
                            className="flex items-center gap-1 transition hover:text-primary-600"
                        >
                            <ArrowLeft className="size-3.5" />
                            {t('front.jobs.show.breadcrumb_jobs')}
                        </Link>
                        <ChevronRight className="size-3.5 text-slate-300" />
                        {job.company && (
                            <>
                                <span className="text-slate-400">
                                    {job.company}
                                </span>
                                <ChevronRight className="size-3.5 text-slate-300" />
                            </>
                        )}
                        <span className="max-w-xs truncate font-medium text-slate-700">
                            {job.title}
                        </span>
                    </nav>

                    <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                        {/* Logo */}
                        {!job.is_anonymous && job.company_logo ? (
                            <img
                                src={job.company_logo}
                                alt={job.company ?? ''}
                                className="size-20 shrink-0 rounded-2xl border border-slate-200 object-cover shadow-sm"
                            />
                        ) : (
                            <div
                                className={cn(
                                    'inline-flex size-20 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold shadow-sm',
                                    job.is_anonymous
                                        ? 'bg-amber-100 text-amber-600'
                                        : 'bg-primary-100 text-primary-700',
                                )}
                            >
                                {job.is_anonymous ? '?' : initials(job.company)}
                            </div>
                        )}

                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                                    {job.title}
                                </h1>
                                {job.is_anonymous ? (
                                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                                        {t('front.jobs.card_anonymous_badge')}
                                    </span>
                                ) : job.company_verified ? (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                                        <CheckCircle2 className="size-3.5" />
                                        {t('front.jobs.show.company_verified')}
                                    </span>
                                ) : null}
                            </div>

                            <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm">
                                {job.is_anonymous ? (
                                    <span className="flex items-center gap-1.5 text-sm text-slate-400 italic">
                                        <Building2 className="size-4 text-slate-300" />
                                        {t('front.jobs.card_company_anonymous')}
                                    </span>
                                ) : job.company ? (
                                    <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                                        <Building2 className="size-4 text-slate-400" />
                                        {job.company}
                                    </span>
                                ) : null}
                                {job.location && (
                                    <span className="flex items-center gap-1.5 text-slate-500">
                                        <MapPin className="size-4 text-slate-400" />
                                        {job.location}
                                    </span>
                                )}
                                {job.published_at && (
                                    <span className="flex items-center gap-1.5 text-slate-400">
                                        <Clock className="size-4" />
                                        {job.published_at}
                                    </span>
                                )}
                            </div>

                            <div className="mt-3 flex flex-wrap gap-2">
                                <span
                                    className={cn(
                                        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold',
                                        workModeClass,
                                    )}
                                >
                                    {job.work_mode_label}
                                </span>
                                <span className="inline-flex items-center rounded-full border border-primary-200 bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700">
                                    {job.job_type_label}
                                </span>
                                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
                                    {job.experience_level}
                                </span>
                            </div>

                            <div className="mt-5 flex flex-wrap items-center gap-3">
                                <Link
                                    href={applyCtaUrl}
                                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary-600 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-primary-700"
                                >
                                    <LogIn className="size-4" />
                                    {isCandidate
                                        ? t('front.jobs.show.apply_now')
                                        : t('front.jobs.show.login_to_apply')}
                                </Link>
                                <Link
                                    href={loginCandidateJobUrl}
                                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-primary-300 hover:text-primary-600"
                                >
                                    <Bookmark className="size-4" />
                                    {t('front.jobs.show.save')}
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => void handleShare()}
                                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-primary-300 hover:text-primary-600"
                                >
                                    <Link2 className="size-4" />
                                    {shareState === 'copied'
                                        ? t('front.jobs.card_share_copied')
                                        : t('front.jobs.card_share')}
                                </button>
                                {job.closes_at && (
                                    <span className="ml-auto text-xs text-slate-400">
                                        {t('front.jobs.show.closes_at', {
                                            date: job.closes_at,
                                        })}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="min-h-screen bg-[#f5f6f8]">
                <div className="mx-auto max-w-6xl px-4 py-8">
                    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
                        {/* ── Main ── */}
                        <div className="space-y-5">
                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <p className="text-xs font-medium text-slate-400">
                                        {t('front.jobs.show.salary_label')}
                                    </p>
                                    <p className="mt-1 text-lg font-bold text-primary-600">
                                        {job.salary_range}
                                    </p>
                                    <p className="mt-0.5 text-xs text-slate-400">
                                        {t('front.jobs.show.salary_hint')}
                                    </p>
                                </div>
                                {job.integrity_score ? (
                                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                        <p className="text-xs font-medium text-slate-400">
                                            {t(
                                                'front.jobs.show.integrity_score_label',
                                            )}
                                        </p>
                                        <p
                                            className={cn(
                                                'mt-1 text-lg font-bold',
                                                integrityColor,
                                            )}
                                        >
                                            {job.integrity_score}/100
                                        </p>
                                        <p className="mt-0.5 text-xs text-slate-400">
                                            {integrityLabel}
                                        </p>
                                    </div>
                                ) : null}
                            </div>

                            {/* Tabs */}
                            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                                <div className="flex border-b border-slate-100">
                                    {(
                                        [
                                            'deskripsi',
                                            'tanggung-jawab',
                                            'kualifikasi',
                                        ] as const
                                    ).map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={cn(
                                                '-mb-px flex-1 border-b-2 py-3.5 text-sm font-semibold transition',
                                                activeTab === tab
                                                    ? 'border-primary-600 text-primary-600'
                                                    : 'border-transparent text-slate-500 hover:text-slate-800',
                                            )}
                                        >
                                            {tab === 'deskripsi'
                                                ? t(
                                                      'front.jobs.show.tab_description',
                                                  )
                                                : tab === 'tanggung-jawab'
                                                  ? t(
                                                        'front.jobs.show.tab_responsibilities',
                                                    )
                                                  : t(
                                                        'front.jobs.show.tab_qualifications',
                                                    )}
                                        </button>
                                    ))}
                                </div>

                                <div className="p-6">
                                    {activeTab === 'deskripsi' && (
                                        <div className="space-y-6">
                                            <Section
                                                title={t(
                                                    'front.jobs.show.section_about_job',
                                                )}
                                                icon={FileText}
                                            >
                                                <RichContent
                                                    text={job.description}
                                                />
                                            </Section>
                                            {job.skills.length > 0 && (
                                                <Section
                                                    title={t(
                                                        'front.jobs.show.section_required_skills',
                                                    )}
                                                    icon={BadgeCheck}
                                                >
                                                    <div className="flex flex-wrap gap-2">
                                                        {job.skills.map((s) => (
                                                            <span
                                                                key={s.id}
                                                                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                                                            >
                                                                {s.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </Section>
                                            )}
                                            {job.benefits && (
                                                <Section
                                                    title={t(
                                                        'front.jobs.show.section_position_benefits',
                                                    )}
                                                    icon={Zap}
                                                >
                                                    <BulletList
                                                        text={job.benefits}
                                                    />
                                                </Section>
                                            )}
                                        </div>
                                    )}
                                    {activeTab === 'tanggung-jawab' && (
                                        <Section
                                            title={t(
                                                'front.jobs.show.section_main_responsibilities',
                                            )}
                                            icon={Target}
                                        >
                                            {job.responsibilities ? (
                                                <BulletList
                                                    text={job.responsibilities}
                                                />
                                            ) : (
                                                <p className="text-sm text-slate-400">
                                                    {t('front.jobs.no_info')}
                                                </p>
                                            )}
                                        </Section>
                                    )}
                                    {activeTab === 'kualifikasi' && (
                                        <div className="space-y-6">
                                            {job.required_qualifications && (
                                                <Section
                                                    title={t(
                                                        'front.jobs.show.section_required_qualifications',
                                                    )}
                                                    icon={BadgeCheck}
                                                >
                                                    <BulletList
                                                        text={
                                                            job.required_qualifications
                                                        }
                                                    />
                                                </Section>
                                            )}
                                            {job.preferred_qualifications && (
                                                <Section
                                                    title={t(
                                                        'front.jobs.show.section_preferred_qualifications',
                                                    )}
                                                    icon={Star}
                                                >
                                                    <BulletList
                                                        text={
                                                            job.preferred_qualifications
                                                        }
                                                    />
                                                </Section>
                                            )}
                                            {!job.required_qualifications &&
                                                !job.preferred_qualifications && (
                                                    <p className="text-sm text-slate-400">
                                                        {t(
                                                            'front.jobs.no_info',
                                                        )}
                                                    </p>
                                                )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Recruitment stages (deferred — AI-generated) */}
                            <Deferred
                                data="job.ai_insight"
                                fallback={
                                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                        <div className="mb-4 flex items-center gap-2">
                                            <Milestone className="size-4 text-primary-600" />
                                            <h3 className="text-sm font-bold text-slate-800">
                                                {t(
                                                    'front.jobs.show.recruitment_stages_title',
                                                )}
                                            </h3>
                                        </div>
                                        <div className="flex items-start gap-3 overflow-x-auto">
                                            {[0, 1, 2, 3, 4].map((i) => (
                                                <div
                                                    key={i}
                                                    className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
                                                >
                                                    <div className="size-8 shrink-0 animate-pulse rounded-full bg-slate-200" />
                                                    <div className="h-2 w-12 animate-pulse rounded bg-slate-200" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                }
                            >
                                {job.ai_insight?.recruitment_stages &&
                                job.ai_insight.recruitment_stages.length > 0 ? (
                                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                        <div className="mb-4 flex items-center gap-2">
                                            <Milestone className="size-4 text-primary-600" />
                                            <h3 className="text-sm font-bold text-slate-800">
                                                {t(
                                                    'front.jobs.show.recruitment_stages_title',
                                                )}
                                            </h3>
                                        </div>
                                        <div className="flex items-start overflow-x-auto">
                                            {job.ai_insight.recruitment_stages.map(
                                                (stage, i) => (
                                                    <div
                                                        key={i}
                                                        className="flex min-w-0 flex-1 items-center"
                                                    >
                                                        <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                                                            <div
                                                                className={cn(
                                                                    'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                                                                    i === 0
                                                                        ? 'bg-primary-600 text-white'
                                                                        : 'bg-slate-100 text-slate-500',
                                                                )}
                                                            >
                                                                {i + 1}
                                                            </div>
                                                            <p
                                                                className={cn(
                                                                    'max-w-[72px] text-center text-[11px] leading-tight',
                                                                    i === 0
                                                                        ? 'font-semibold text-primary-600'
                                                                        : 'text-slate-500',
                                                                )}
                                                            >
                                                                {stage}
                                                            </p>
                                                        </div>
                                                        {i <
                                                            job.ai_insight!
                                                                .recruitment_stages
                                                                .length -
                                                                1 && (
                                                            <div className="mb-4 h-px min-w-3 flex-1 bg-slate-200" />
                                                        )}
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                ) : null}
                            </Deferred>

                            {/* Bottom CTA */}
                            <div className="rounded-2xl border border-primary-200 bg-primary-50 p-6 text-center">
                                <p className="text-sm font-semibold text-slate-800">
                                    {t('front.jobs.show.cta_title')}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    {t('front.jobs.show.cta_subtitle')}
                                </p>
                                <div className="mt-4 flex justify-center gap-3">
                                    <Link
                                        href={applyCtaUrl}
                                        className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary-600 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-primary-700"
                                    >
                                        <LogIn className="size-4" />
                                        {isCandidate
                                            ? t('front.jobs.show.apply_now')
                                            : t(
                                                  'front.jobs.show.login_and_apply',
                                              )}
                                    </Link>
                                    <Link
                                        href={register().url}
                                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-primary-300 hover:text-primary-600"
                                    >
                                        {t('front.jobs.show.register_free')}
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* ── Sidebar ── */}
                        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
                            {slaDays !== null && (
                                <div className="rounded-2xl border border-primary-200 bg-primary-50/60 p-4">
                                    <div className="flex items-center gap-2">
                                        <Zap className="size-4 text-primary-500" />
                                        <p className="text-sm font-bold text-slate-800">
                                            {t(
                                                'front.jobs.show.quick_response_title',
                                            )}
                                        </p>
                                    </div>
                                    <p className="mt-2 text-xs leading-5 text-slate-600">
                                        {t(
                                            'front.jobs.show.quick_response_text',
                                            { days: slaDays },
                                        )}
                                    </p>
                                </div>
                            )}

                            {similarJobs.length > 0 && (
                                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <h3 className="mb-3 text-sm font-bold text-slate-800">
                                        {t(
                                            'front.jobs.show.similar_jobs_title',
                                        )}
                                    </h3>
                                    <div className="space-y-1">
                                        {similarJobs.map((sj) => (
                                            <Link
                                                key={sj.id}
                                                href={jobShow(sj.slug)}
                                                className="-mx-1 flex items-center gap-3 rounded-xl p-2 transition hover:bg-slate-50"
                                            >
                                                <div
                                                    className={cn(
                                                        'inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold',
                                                        sj.is_anonymous
                                                            ? 'bg-amber-100 text-amber-600'
                                                            : 'bg-slate-100 text-slate-600',
                                                    )}
                                                >
                                                    {sj.is_anonymous
                                                        ? '?'
                                                        : initials(sj.company)}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-xs font-semibold text-slate-800">
                                                        {sj.title}
                                                    </p>
                                                    <p className="truncate text-[11px] text-slate-500">
                                                        {sj.is_anonymous
                                                            ? t(
                                                                  'front.jobs.card_company_anonymous',
                                                              )
                                                            : sj.company}
                                                        {sj.location
                                                            ? ` · ${sj.location}`
                                                            : ''}
                                                    </p>
                                                    <p className="text-[11px] font-bold text-primary-600">
                                                        {sj.salary_range}
                                                    </p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                    <Link
                                        href={jobsIndex().url}
                                        className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 transition hover:border-primary-300 hover:text-primary-600"
                                    >
                                        <BriefcaseBusiness className="size-3.5" />
                                        {t('front.jobs.see_all')}
                                    </Link>
                                </div>
                            )}

                            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="mb-3 flex items-center gap-1.5">
                                    <h3 className="text-sm font-bold text-slate-800">
                                        {t(
                                            'front.jobs.show.about_company_title',
                                            {
                                                company: job.is_anonymous
                                                    ? t(
                                                          'front.jobs.card_company_fallback',
                                                      )
                                                    : (job.company ??
                                                      t(
                                                          'front.jobs.card_company_fallback',
                                                      )),
                                            },
                                        )}
                                    </h3>
                                    {!job.is_anonymous &&
                                        job.company_verified && (
                                            <Shield className="size-3.5 text-emerald-500" />
                                        )}
                                </div>
                                {job.is_anonymous ? (
                                    <div className="rounded-lg bg-amber-50 p-3 text-center">
                                        <p className="text-xs font-medium text-amber-700">
                                            {t(
                                                'front.jobs.show.anonymous_identity_hidden',
                                            )}
                                        </p>
                                        <p className="mt-0.5 text-[11px] text-amber-600">
                                            {t(
                                                'front.jobs.show.anonymous_reveal_shortlist',
                                            )}
                                        </p>
                                    </div>
                                ) : null}
                                {!job.is_anonymous &&
                                    job.company_description && (
                                        <p className="line-clamp-4 text-xs leading-5 text-slate-500">
                                            {stripHtmlTags(
                                                job.company_description,
                                            )}
                                        </p>
                                    )}
                                {!job.is_anonymous &&
                                    companyCultureItems.length > 0 && (
                                        <div className="mt-3 rounded-lg bg-slate-50 p-2.5">
                                            <p className="text-[10px] font-semibold text-slate-400">
                                                {t(
                                                    'front.jobs.show.company_culture_label',
                                                )}
                                            </p>
                                            <ul className="mt-1 space-y-1">
                                                {companyCultureItems
                                                    .slice(0, 3)
                                                    .map((item) => (
                                                        <li
                                                            key={item}
                                                            className="truncate text-[11px] text-slate-600"
                                                        >
                                                            • {item}
                                                        </li>
                                                    ))}
                                            </ul>
                                        </div>
                                    )}
                                {!job.is_anonymous &&
                                    companyBenefitItems.length > 0 && (
                                        <div className="mt-2 rounded-lg bg-slate-50 p-2.5">
                                            <p className="text-[10px] font-semibold text-slate-400">
                                                {t(
                                                    'front.jobs.show.company_benefits_label',
                                                )}
                                            </p>
                                            <ul className="mt-1 space-y-1">
                                                {companyBenefitItems
                                                    .slice(0, 3)
                                                    .map((item) => (
                                                        <li
                                                            key={item}
                                                            className="truncate text-[11px] text-slate-600"
                                                        >
                                                            • {item}
                                                        </li>
                                                    ))}
                                            </ul>
                                        </div>
                                    )}
                                {!job.is_anonymous &&
                                    (job.company_size ||
                                        job.company_industry ||
                                        job.company_response_rate != null) && (
                                        <div className="mt-3 grid grid-cols-2 gap-2">
                                            {job.company_size && (
                                                <div className="rounded-lg bg-slate-50 p-2.5">
                                                    <p className="text-[10px] text-slate-400">
                                                        {t(
                                                            'front.jobs.show.company_employees_label',
                                                        )}
                                                    </p>
                                                    <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-slate-700">
                                                        <Users className="size-3 text-slate-400" />
                                                        {job.company_size}
                                                    </p>
                                                </div>
                                            )}
                                            {job.company_industry && (
                                                <div className="rounded-lg bg-slate-50 p-2.5">
                                                    <p className="text-[10px] text-slate-400">
                                                        {t(
                                                            'front.jobs.show.company_industry_label',
                                                        )}
                                                    </p>
                                                    <p className="mt-0.5 text-xs leading-snug font-semibold text-slate-700">
                                                        {job.company_industry}
                                                    </p>
                                                </div>
                                            )}
                                            {job.company_response_rate !=
                                                null && (
                                                <div className="rounded-lg bg-slate-50 p-2.5">
                                                    <p className="text-[10px] text-slate-400">
                                                        {t(
                                                            'front.jobs.show.company_response_rate_label',
                                                        )}
                                                    </p>
                                                    <p className="mt-0.5 text-xs font-semibold text-slate-700">
                                                        {
                                                            job.company_response_rate
                                                        }
                                                        %
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                {job.company_slug && (
                                    <Link
                                        href={`/companies/${job.company_slug}`}
                                        className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 transition hover:border-primary-300 hover:text-primary-600"
                                    >
                                        <Globe className="size-3.5" />
                                        {t('front.jobs.show.visit_profile')}
                                        <ExternalLink className="size-3" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </HomeLayout>
    );
}

function Section({
    title,
    icon: Icon,
    children,
}: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    children: React.ReactNode;
}) {
    return (
        <section>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
                <Icon className="size-4 text-primary-600" />
                {title}
            </h3>
            {children}
        </section>
    );
}

function RichContent({ text }: { text: string }) {
    const normalized = text.trim();
    const hasHtmlTags = /<[a-z][^>]*>/i.test(normalized);

    if (hasHtmlTags) {
        return (
            <div
                className="prose prose-sm max-w-none text-sm leading-7 text-slate-600 [&_h1]:mt-0 [&_h1]:mb-3 [&_h1]:text-base [&_h1]:font-bold [&_h1]:text-slate-800 [&_h2]:mt-0 [&_h2]:mb-3 [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-slate-800 [&_h3]:mt-0 [&_h3]:mb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-slate-800 [&_li]:my-1 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_strong]:font-semibold [&_strong]:text-slate-800 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5"
                dangerouslySetInnerHTML={{ __html: normalized }}
            />
        );
    }

    const lines = normalized
        .split('\n')
        .map((l) => l.trim().replace(/^[-•*]\s*/, ''))
        .filter(Boolean);

    return (
        <ul className="space-y-2">
            {lines.map((line, i) => (
                <li
                    key={i}
                    className="flex items-start gap-2.5 text-sm text-slate-600"
                >
                    <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary-500" />
                    <span className="leading-7">{line}</span>
                </li>
            ))}
        </ul>
    );
}

function BulletList({ text }: { text: string }) {
    return <RichContent text={text} />;
}
