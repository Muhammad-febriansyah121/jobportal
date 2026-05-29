import { Head, Link, router } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Bookmark, BookmarkCheck, BriefcaseBusiness, CheckCircle2, Filter, MapPin, Sparkles } from 'lucide-react';
import {
    Field,
    RupiahInput,
    Select,
} from '@/components/candidate/candidate-form';
import {
    EmptyState,
    PaginationLinks,
} from '@/components/candidate/candidate-ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';
import { index, save, show, unsave } from '@/routes/candidate/jobs';

type Option = {
    value: string;
    label: string;
};

type Job = {
    id: number;
    slug: string;
    title: string;
    is_anonymous: boolean;
    company?: string | null;
    company_verified: boolean;
    industry?: string | null;
    location: string;
    work_mode: string;
    work_mode_label: string;
    job_type: string;
    job_type_label: string;
    salary_range: string;
    published_at?: string | null;
    matched_skills_count?: number | null;
    ai_match_score?: number | null;
    is_saved: boolean;
    has_applied: boolean;
    skills: Array<{ id: number; name: string }>;
};

type JobsIndexProps = {
    filters: {
        tab: string;
        search?: string;
        location?: string;
        work_mode?: string;
        job_type?: string;
        experience_level?: string;
        industry_id?: string;
        salary_min?: string;
        verified_company: boolean;
        skill_match: boolean;
    };
    has_intent_data: boolean;
    industries: Option[];
    jobs: {
        data: Job[];
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
};

const AVATAR_COLORS = [
    'bg-blue-100 text-blue-700',
    'bg-emerald-100 text-emerald-700',
    'bg-violet-100 text-violet-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-cyan-100 text-cyan-700',
    'bg-orange-100 text-orange-700',
    'bg-indigo-100 text-indigo-700',
    'bg-pink-100 text-pink-700',
    'bg-teal-100 text-teal-700',
];

function companyAvatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function matchScoreClass(score: number): string {
    if (score >= 70) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score >= 40) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-slate-50 text-slate-600 border-slate-200';
}

export default function CandidateJobsIndex({
    filters,
    has_intent_data,
    industries,
    jobs,
}: JobsIndexProps) {
    const { t } = useTranslate();

    const tabs = [
        ['recommended', t('candidate.jobs.tabs.recommended')],
        ['all', t('candidate.jobs.tabs.all')],
        ['remote', t('candidate.jobs.tabs.remote')],
        ['salary-transparent', t('candidate.jobs.tabs.salary_transparent')],
    ] as const;

    return (
        <>
            <Head title={t('candidate.jobs.page_title')} />

            <div className="space-y-5 p-4 md:p-6">
                {/* Page header */}
                <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#01296A]/10">
                        <BriefcaseBusiness className="size-5 text-[#01296A]" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-foreground">{t('candidate.jobs.page_title')}</h1>
                        <p className="text-sm text-muted-foreground">{t('candidate.jobs.page_description')}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="space-y-1.5">
                    <div className="inline-flex flex-wrap gap-1.5 rounded-xl bg-muted p-1">
                        {tabs.map(([tab, label]) => (
                            <Link
                                key={tab}
                                href={index({ query: { tab } })}
                                className={[
                                    'rounded-lg px-4 py-1.5 text-sm font-medium transition-all duration-150',
                                    filters.tab === tab
                                        ? 'bg-white text-[#01296A] shadow-sm ring-1 ring-black/5'
                                        : 'text-muted-foreground hover:text-foreground',
                                ].join(' ')}
                            >
                                {label}
                            </Link>
                        ))}
                    </div>
                    {filters.tab === 'recommended' && has_intent_data && (
                        <p className="text-xs text-muted-foreground">
                            {t('candidate.jobs.intent_hint')}
                        </p>
                    )}
                </div>

                {/* Filter */}
                <Card className="border-border/60">
                    <CardContent className="p-4 md:p-5">
                        <form
                            className="space-y-4"
                            onSubmit={(event) => {
                                event.preventDefault();
                                const formData = new FormData(event.currentTarget);
                                router.get(index(), Object.fromEntries(formData.entries()), {
                                    preserveScroll: true,
                                    preserveState: true,
                                });
                            }}
                        >
                            <input type="hidden" name="tab" value={filters.tab} />

                            {/* Row 1: keyword + location + mode + type */}
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <Field label={t('candidate.jobs.keyword')} name="search">
                                    <Input name="search" defaultValue={filters.search ?? ''} placeholder={t('candidate.jobs.keyword_placeholder')} />
                                </Field>
                                <Field label={t('candidate.jobs.location')} name="location">
                                    <Input name="location" defaultValue={filters.location ?? ''} placeholder={t('candidate.jobs.location_placeholder')} />
                                </Field>
                                <Field label={t('candidate.jobs.work_mode')} name="work_mode">
                                    <Select name="work_mode" defaultValue={filters.work_mode ?? ''}>
                                        <option value="">{t('candidate.jobs.all_modes')}</option>
                                        <option value="remote">{t('candidate.jobs.mode_remote')}</option>
                                        <option value="hybrid">{t('candidate.jobs.mode_hybrid')}</option>
                                        <option value="onsite">{t('candidate.jobs.mode_onsite')}</option>
                                    </Select>
                                </Field>
                                <Field label={t('candidate.jobs.job_type')} name="job_type">
                                    <Select name="job_type" defaultValue={filters.job_type ?? ''}>
                                        <option value="">{t('candidate.jobs.all_types')}</option>
                                        <option value="full_time">{t('candidate.jobs.type_full_time')}</option>
                                        <option value="part_time">{t('candidate.jobs.type_part_time')}</option>
                                        <option value="contract">{t('candidate.jobs.type_contract')}</option>
                                        <option value="internship">{t('candidate.jobs.type_internship')}</option>
                                        <option value="freelance">{t('candidate.jobs.type_freelance')}</option>
                                    </Select>
                                </Field>
                            </div>

                            {/* Row 2: experience + industry + salary + toggles + submit */}
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <Field label={t('candidate.jobs.experience')} name="experience_level">
                                    <Select name="experience_level" defaultValue={filters.experience_level ?? ''}>
                                        <option value="">{t('candidate.jobs.all_levels')}</option>
                                        <option value="entry">{t('candidate.jobs.level_entry')}</option>
                                        <option value="mid">{t('candidate.jobs.level_mid')}</option>
                                        <option value="senior">{t('candidate.jobs.level_senior')}</option>
                                        <option value="lead">{t('candidate.jobs.level_lead')}</option>
                                        <option value="manager">{t('candidate.jobs.level_manager')}</option>
                                    </Select>
                                </Field>
                                <Field label={t('candidate.jobs.industry')} name="industry_id">
                                    <Select name="industry_id" defaultValue={filters.industry_id ?? ''}>
                                        <option value="">{t('candidate.jobs.all_industries')}</option>
                                        {industries.map((industry) => (
                                            <option key={industry.value} value={industry.value}>{industry.label}</option>
                                        ))}
                                    </Select>
                                </Field>
                                <Field label={t('candidate.jobs.salary_min')} name="salary_min">
                                    <RupiahInput name="salary_min" defaultValue={filters.salary_min} placeholder={t('candidate.jobs.salary_min_placeholder')} />
                                </Field>
                                <div className="flex flex-col justify-end gap-2.5">
                                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                                        <input className="size-4 rounded border-input" type="checkbox" name="verified_company" value="1" defaultChecked={filters.verified_company} />
                                        {t('candidate.jobs.verified_company')}
                                    </label>
                                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                                        <input className="size-4 rounded border-input" type="checkbox" name="skill_match" value="1" defaultChecked={filters.skill_match} />
                                        {t('candidate.jobs.skill_match')}
                                    </label>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-1">
                                <Button type="submit" className="bg-[#01296A] hover:bg-[#001D4D]">
                                    <Filter className="size-4" />
                                    {t('candidate.jobs.apply_filter')}
                                </Button>
                                {jobs.data.length > 0 && (
                                    <span className="text-sm text-muted-foreground">
                                        {jobs.data.length} lowongan ditemukan
                                    </span>
                                )}
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Job list */}
                <div className="grid gap-4">
                    {jobs.data.length ? (
                        jobs.data.map((job) => (
                            <JobCard job={job} key={job.id} t={t} />
                        ))
                    ) : (
                        <EmptyState
                            title={t('candidate.jobs.empty_title')}
                            description={t('candidate.jobs.empty_description')}
                        />
                    )}
                </div>

                <PaginationLinks links={jobs.links} />
            </div>
        </>
    );
}

function JobCard({
    job,
    t,
}: {
    job: Job;
    t: (key: string, replacements?: Record<string, string | number>) => string;
}) {
    const companyName = job.is_anonymous ? 'Anonim' : (job.company ?? 'Perusahaan');
    const initial = companyName[0]?.toUpperCase() ?? '?';
    const avatarColor = companyAvatarColor(companyName);

    const postedDate = job.published_at
        ? formatDistanceToNow(new Date(job.published_at), { addSuffix: true, locale: idLocale })
        : null;

    return (
        <Card className={cn(
            'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5',
            job.has_applied && 'border-l-[3px] border-l-emerald-500',
        )}>
            <CardContent className="p-5">
                {/* Header: Avatar + Title/Meta + Bookmark */}
                <div className="flex items-start gap-3.5">
                    {/* Company avatar */}
                    <div className={cn(
                        'flex size-11 shrink-0 items-center justify-center rounded-xl text-[15px] font-bold',
                        avatarColor,
                    )}>
                        {initial}
                    </div>

                    {/* Title + company + location + date */}
                    <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                            <Link
                                href={show(job.slug)}
                                className="text-[15px] font-semibold leading-snug text-foreground transition-colors hover:text-[#01296A]"
                            >
                                {job.title}
                            </Link>
                            {job.is_saved ? (
                                <Link
                                    href={unsave(job.id)}
                                    method="delete"
                                    as="button"
                                    className="mt-0.5 shrink-0 text-[#01296A] transition-colors hover:text-[#001D4D]"
                                    aria-label="Hapus simpanan"
                                >
                                    <BookmarkCheck className="size-5" />
                                </Link>
                            ) : (
                                <Link
                                    href={save(job.id)}
                                    method="post"
                                    as="button"
                                    className="mt-0.5 shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                                    aria-label="Simpan"
                                >
                                    <Bookmark className="size-5" />
                                </Link>
                            )}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm text-muted-foreground">
                            <span>
                                {job.is_anonymous
                                    ? <span className="italic">{t('candidate.jobs.anonymous_company')}</span>
                                    : job.company
                                }
                            </span>
                            {job.location && (
                                <>
                                    <span className="text-muted-foreground/40">·</span>
                                    <span className="flex items-center gap-0.5">
                                        <MapPin className="size-3 shrink-0" />
                                        {job.location}
                                    </span>
                                </>
                            )}
                            {postedDate && (
                                <>
                                    <span className="text-muted-foreground/40">·</span>
                                    <span>{postedDate}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Status + type badges */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {job.has_applied && (
                        <Badge className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                            <CheckCircle2 className="size-3" />
                            Sudah Melamar
                        </Badge>
                    )}
                    {job.is_anonymous ? (
                        <Badge className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50">
                            {t('candidate.jobs.anonymous_badge')}
                        </Badge>
                    ) : job.company_verified ? (
                        <Badge className="border-transparent bg-[#01296A]/10 text-[#01296A] hover:bg-[#01296A]/10">
                            {t('candidate.jobs.verified_badge')}
                        </Badge>
                    ) : null}
                    <Badge variant="secondary">{job.work_mode_label}</Badge>
                    <Badge variant="secondary">{job.job_type_label}</Badge>
                </div>

                {/* Skills */}
                {job.skills.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {job.skills.slice(0, 5).map((skill) => (
                            <Badge key={skill.id} variant="outline" className="text-xs font-normal text-muted-foreground">
                                {skill.name}
                            </Badge>
                        ))}
                        {job.skills.length > 5 && (
                            <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                                +{job.skills.length - 5}
                            </Badge>
                        )}
                    </div>
                )}

                {/* Footer: salary + match score + action */}
                <div className="mt-4 flex items-center justify-between gap-4 border-t border-border/50 pt-3.5">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-foreground/80">{job.salary_range}</span>
                        {job.ai_match_score ? (
                            <span className={cn(
                                'flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
                                matchScoreClass(job.ai_match_score),
                            )}>
                                <Sparkles className="size-3" />
                                {job.ai_match_score}% cocok
                            </span>
                        ) : null}
                    </div>
                    <Button asChild size="sm" className="shrink-0 bg-[#01296A] hover:bg-[#001D4D]">
                        <Link href={show(job.slug)}>
                            {job.has_applied ? t('candidate.jobs.view_application') : t('candidate.jobs.detail')}
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

CandidateJobsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Cari Lowongan',
            href: index(),
        },
    ],
};
