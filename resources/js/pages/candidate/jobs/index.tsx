import { Head, Link, router } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import {
    Banknote,
    Bookmark,
    BookmarkCheck,
    BriefcaseBusiness,
    Building2,
    CheckCircle2,
    Clock3,
    Eye,
    ExternalLink,
    Filter,
    MapPin,
    Sparkles,
} from 'lucide-react';
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
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';
import { index, save, show, unsave } from '@/routes/candidate/jobs';
import { show as scrapedJobShow } from '@/routes/jobs/scraped';

type Option = {
    value: string;
    label: string;
};

type Job = {
    id: number;
    slug: string;
    title: string;
    is_scraped?: boolean;
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
    has_internal_apply?: boolean;
    source_platform?: string | null;
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
    source: 'external' | 'internal';
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

function matchScoreBarClass(score: number): string {
    if (score >= 70) return 'bg-emerald-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-slate-400';
}

export default function CandidateJobsIndex({
    filters,
    has_intent_data,
    industries,
    jobs,
    source,
}: JobsIndexProps) {
    const { t } = useTranslate();

    const tabs = (source === 'external'
        ? [
              ['all', t('candidate.jobs.tabs.all')],
              ['remote', t('candidate.jobs.tabs.remote')],
              ['salary-transparent', t('candidate.jobs.tabs.salary_transparent')],
          ]
        : [
              ['recommended', t('candidate.jobs.tabs.recommended')],
              ['all', t('candidate.jobs.tabs.all')],
              ['remote', t('candidate.jobs.tabs.remote')],
              ['salary-transparent', t('candidate.jobs.tabs.salary_transparent')],
          ]);

    return (
        <>
            <Head title={t('candidate.jobs.page_title')} />

            <div className="space-y-5 p-4 md:p-6">
                {/* Page header */}
                <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#0F4C94]/10">
                        <BriefcaseBusiness className="size-5 text-[#0F4C94]" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-foreground">
                            {t('candidate.jobs.page_title')}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {t('candidate.jobs.page_description')}
                        </p>
                        {source === 'external' ? (
                            <span className="mt-2 inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                                Data lowongan eksternal
                            </span>
                        ) : null}
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
                                        ? 'bg-white text-[#0F4C94] shadow-sm ring-1 ring-black/5'
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
                                const formData = new FormData(
                                    event.currentTarget,
                                );
                                router.get(
                                    index(),
                                    Object.fromEntries(formData.entries()),
                                    {
                                        preserveScroll: true,
                                        preserveState: true,
                                    },
                                );
                            }}
                        >
                            <input
                                type="hidden"
                                name="tab"
                                value={filters.tab}
                            />

                            {/* Row 1: keyword + location + mode + type */}
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <Field
                                    label={t('candidate.jobs.keyword')}
                                    name="search"
                                >
                                    <Input
                                        name="search"
                                        defaultValue={filters.search ?? ''}
                                        placeholder={t(
                                            'candidate.jobs.keyword_placeholder',
                                        )}
                                    />
                                </Field>
                                <Field
                                    label={t('candidate.jobs.location')}
                                    name="location"
                                >
                                    <Input
                                        name="location"
                                        defaultValue={filters.location ?? ''}
                                        placeholder={t(
                                            'candidate.jobs.location_placeholder',
                                        )}
                                    />
                                </Field>
                                <Field
                                    label={t('candidate.jobs.work_mode')}
                                    name="work_mode"
                                >
                                    <Select
                                        name="work_mode"
                                        defaultValue={filters.work_mode ?? ''}
                                    >
                                        <option value="">
                                            {t('candidate.jobs.all_modes')}
                                        </option>
                                        <option value="remote">
                                            {t('candidate.jobs.mode_remote')}
                                        </option>
                                        <option value="hybrid">
                                            {t('candidate.jobs.mode_hybrid')}
                                        </option>
                                        <option value="onsite">
                                            {t('candidate.jobs.mode_onsite')}
                                        </option>
                                    </Select>
                                </Field>
                                <Field
                                    label={t('candidate.jobs.job_type')}
                                    name="job_type"
                                >
                                    <Select
                                        name="job_type"
                                        defaultValue={filters.job_type ?? ''}
                                    >
                                        <option value="">
                                            {t('candidate.jobs.all_types')}
                                        </option>
                                        <option value="full_time">
                                            {t('candidate.jobs.type_full_time')}
                                        </option>
                                        <option value="part_time">
                                            {t('candidate.jobs.type_part_time')}
                                        </option>
                                        <option value="contract">
                                            {t('candidate.jobs.type_contract')}
                                        </option>
                                        <option value="internship">
                                            {t(
                                                'candidate.jobs.type_internship',
                                            )}
                                        </option>
                                        <option value="freelance">
                                            {t('candidate.jobs.type_freelance')}
                                        </option>
                                    </Select>
                                </Field>
                            </div>

                            {/* Row 2: source-supported filters */}
                            {source === 'external' ? (
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                    <Field
                                        label={t('candidate.jobs.salary_min')}
                                        name="salary_min"
                                    >
                                        <RupiahInput
                                            name="salary_min"
                                            defaultValue={filters.salary_min}
                                            placeholder={t(
                                                'candidate.jobs.salary_min_placeholder',
                                            )}
                                        />
                                    </Field>
                                    <div className="flex items-end sm:col-span-1 lg:col-span-3">
                                        <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-xs leading-5 text-muted-foreground">
                                            Filter pengalaman, industri, perusahaan terverifikasi, dan skill match tersedia setelah data lowongan internal aktif.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                    <Field
                                        label={t('candidate.jobs.experience')}
                                        name="experience_level"
                                    >
                                        <Select
                                            name="experience_level"
                                            defaultValue={
                                                filters.experience_level ?? ''
                                            }
                                        >
                                            <option value="">
                                                {t('candidate.jobs.all_levels')}
                                            </option>
                                            <option value="entry">
                                                {t('candidate.jobs.level_entry')}
                                            </option>
                                            <option value="mid">
                                                {t('candidate.jobs.level_mid')}
                                            </option>
                                            <option value="senior">
                                                {t('candidate.jobs.level_senior')}
                                            </option>
                                            <option value="lead">
                                                {t('candidate.jobs.level_lead')}
                                            </option>
                                            <option value="manager">
                                                {t('candidate.jobs.level_manager')}
                                            </option>
                                        </Select>
                                    </Field>
                                    <Field
                                        label={t('candidate.jobs.industry')}
                                        name="industry_id"
                                    >
                                        <Select
                                            name="industry_id"
                                            defaultValue={filters.industry_id ?? ''}
                                        >
                                            <option value="">
                                                {t('candidate.jobs.all_industries')}
                                            </option>
                                            {industries.map((industry) => (
                                                <option
                                                    key={industry.value}
                                                    value={industry.value}
                                                >
                                                    {industry.label}
                                                </option>
                                            ))}
                                        </Select>
                                    </Field>
                                    <Field
                                        label={t('candidate.jobs.salary_min')}
                                        name="salary_min"
                                    >
                                        <RupiahInput
                                            name="salary_min"
                                            defaultValue={filters.salary_min}
                                            placeholder={t(
                                                'candidate.jobs.salary_min_placeholder',
                                            )}
                                        />
                                    </Field>
                                    <div className="flex flex-col justify-end gap-2.5">
                                        <label className="flex cursor-pointer items-center gap-2 text-sm">
                                            <input
                                                className="size-4 rounded border-input"
                                                type="checkbox"
                                                name="verified_company"
                                                value="1"
                                                defaultChecked={
                                                    filters.verified_company
                                                }
                                            />
                                            {t('candidate.jobs.verified_company')}
                                        </label>
                                        <label className="flex cursor-pointer items-center gap-2 text-sm">
                                            <input
                                                className="size-4 rounded border-input"
                                                type="checkbox"
                                                name="skill_match"
                                                value="1"
                                                defaultChecked={filters.skill_match}
                                            />
                                            {t('candidate.jobs.skill_match')}
                                        </label>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-3 pt-1">
                                <Button
                                    type="submit"
                                    className="bg-[#0F4C94] hover:bg-[#093579]"
                                >
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
    const companyName = job.is_anonymous
        ? 'Anonim'
        : (job.company ?? 'Perusahaan');
    const initial = companyName[0]?.toUpperCase() ?? '?';
    const avatarColor = companyAvatarColor(companyName);

    const postedDate = job.published_at
        ? formatDistanceToNow(new Date(job.published_at), {
              addSuffix: true,
              locale: idLocale,
          })
        : null;
    const score = job.ai_match_score ?? 0;
    const visibleSkills = job.skills.slice(0, 4);
    const detailHref = job.is_scraped
        ? scrapedJobShow.url(job.id)
        : show(job.slug);

    return (
        <Card
            className={cn(
                'overflow-hidden border-border/70 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0F4C94]/25 hover:shadow-md',
                job.has_applied && 'border-l-[3px] border-l-emerald-500',
            )}
        >
            <CardContent className="p-0">
                <div className="grid lg:grid-cols-[minmax(0,1fr)_230px]">
                    <div className="min-w-0 p-5">
                        <div className="flex items-start gap-3.5">
                            <div
                                className={cn(
                                    'flex size-12 shrink-0 items-center justify-center rounded-xl text-base font-bold shadow-sm ring-1 ring-black/5',
                                    avatarColor,
                                )}
                            >
                                {initial}
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <Link
                                            href={detailHref}
                                            className="line-clamp-2 text-lg leading-tight font-bold text-foreground transition-colors hover:text-[#0F4C94]"
                                        >
                                            {job.title}
                                        </Link>
                                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                                            <span className="inline-flex min-w-0 items-center gap-1">
                                                <Building2 className="size-3.5 shrink-0" />
                                                <span className="truncate">
                                                    {job.is_anonymous ? (
                                                        <span className="italic">
                                                            {t(
                                                                'candidate.jobs.anonymous_company',
                                                            )}
                                                        </span>
                                                    ) : (
                                                        job.company
                                                    )}
                                                </span>
                                            </span>
                                            {postedDate ? (
                                                <>
                                                    <span className="text-muted-foreground/40">
                                                        ·
                                                    </span>
                                                    <span>{postedDate}</span>
                                                </>
                                            ) : null}
                                        </div>
                                    </div>

                                    {!job.is_scraped ? (
                                        <SaveJobButton job={job} />
                                    ) : null}
                                </div>

                                <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                    <JobMeta
                                        icon={MapPin}
                                        label="Lokasi"
                                        value={
                                            job.location || 'Tidak disebutkan'
                                        }
                                    />
                                    <JobMeta
                                        icon={Banknote}
                                        label="Gaji"
                                        value={job.salary_range}
                                    />
                                    <JobMeta
                                        icon={BriefcaseBusiness}
                                        label="Industri"
                                        value={job.industry || 'Umum'}
                                    />
                                </div>

                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                    {job.has_applied ? (
                                        <Badge className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                                            <CheckCircle2 className="size-3" />
                                            Sudah Melamar
                                        </Badge>
                                    ) : null}
                                    {job.is_anonymous ? (
                                        <Badge className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50">
                                            {t(
                                                'candidate.jobs.anonymous_badge',
                                            )}
                                        </Badge>
                                    ) : job.is_scraped ? (
                                        <Badge className="gap-1 border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50">
                                            <ExternalLink className="size-3" />
                                            Eksternal
                                        </Badge>
                                    ) : job.company_verified ? (
                                        <Badge className="border-transparent bg-[#0F4C94]/10 text-[#0F4C94] hover:bg-[#0F4C94]/10">
                                            {t('candidate.jobs.verified_badge')}
                                        </Badge>
                                    ) : null}
                                    <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
                                        {job.work_mode_label}
                                    </Badge>
                                    <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
                                        {job.job_type_label}
                                    </Badge>
                                </div>

                                {job.skills.length > 0 ? (
                                    <div className="mt-4 border-t border-border/50 pt-4">
                                        <div className="mb-2 flex items-center justify-between gap-3">
                                            <p className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
                                                Skill lowongan
                                            </p>
                                            {job.matched_skills_count !==
                                                null &&
                                            job.matched_skills_count !==
                                                undefined ? (
                                                <span className="text-xs font-medium text-[#0F4C94]">
                                                    {job.matched_skills_count}/
                                                    {job.skills.length} cocok
                                                </span>
                                            ) : null}
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {visibleSkills.map((skill) => (
                                                <Badge
                                                    key={skill.id}
                                                    variant="outline"
                                                    className="rounded-md border-slate-200 bg-white text-xs font-medium text-muted-foreground"
                                                >
                                                    {skill.name}
                                                </Badge>
                                            ))}
                                            {job.skills.length >
                                            visibleSkills.length ? (
                                                <Badge
                                                    variant="outline"
                                                    className="rounded-md border-slate-200 bg-slate-50 text-xs font-medium text-muted-foreground"
                                                >
                                                    +
                                                    {job.skills.length -
                                                        visibleSkills.length}
                                                </Badge>
                                            ) : null}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    <aside className="border-t border-border/60 bg-slate-50/80 p-5 lg:border-t-0 lg:border-l">
                        {job.is_scraped ? (
                            <div className="rounded-lg border border-dashed border-amber-200 bg-amber-50/70 p-3">
                                <p className="text-sm font-semibold text-amber-800">
                                    Sumber eksternal
                                </p>
                                <p className="mt-1 text-xs leading-5 text-amber-700">
                                    Detail dan opsi lamaran tersedia di halaman lowongan.
                                </p>
                            </div>
                        ) : score > 0 ? (
                            <div>
                                <div
                                    className={cn(
                                        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold',
                                        matchScoreClass(score),
                                    )}
                                >
                                    <Sparkles className="size-3.5" />
                                    Match
                                </div>
                                <div className="mt-3 flex items-end gap-1.5">
                                    <span className="text-4xl leading-none font-bold tracking-tight text-[#07112f]">
                                        {score}
                                    </span>
                                    <span className="pb-1 text-sm font-semibold text-muted-foreground">
                                        %
                                    </span>
                                </div>
                                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                                    <div
                                        className={cn(
                                            'h-full rounded-full',
                                            matchScoreBarClass(score),
                                        )}
                                        style={{
                                            width: `${Math.min(score, 100)}%`,
                                        }}
                                    />
                                </div>
                                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                                    Skor kecocokan profil Anda dengan lowongan
                                    ini.
                                </p>
                            </div>
                        ) : (
                            <div className="rounded-lg border border-dashed border-slate-200 bg-white p-3">
                                <p className="text-sm font-semibold text-slate-700">
                                    Skor belum tersedia
                                </p>
                                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                    Lengkapi profil agar rekomendasi lebih
                                    akurat.
                                </p>
                            </div>
                        )}

                        <div className="mt-5 grid gap-2">
                            <Button
                                asChild
                                className="h-10 bg-[#0F4C94] hover:bg-[#093579]"
                            >
                                <Link href={detailHref}>
                                    {job.is_scraped ? (
                                        <ExternalLink className="size-4" />
                                    ) : (
                                        <Eye className="size-4" />
                                    )}
                                    {job.is_scraped
                                        ? job.has_internal_apply
                                            ? 'Lihat & Lamar'
                                            : 'Lihat lowongan'
                                        : job.has_applied
                                        ? t('candidate.jobs.view_application')
                                        : t('candidate.jobs.detail')}
                                </Link>
                            </Button>
                            {!job.is_scraped ? (
                                <SaveJobButton
                                    job={job}
                                    className="h-10 justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                                    withLabel
                                />
                            ) : null}
                        </div>
                    </aside>
                </div>
            </CardContent>
        </Card>
    );
}

function SaveJobButton({
    job,
    className,
    withLabel = false,
}: {
    job: Job;
    className?: string;
    withLabel?: boolean;
}) {
    return job.is_saved ? (
        <Link
            href={unsave(job.id)}
            method="delete"
            as="button"
            className={cn(
                'inline-flex shrink-0 items-center gap-2 text-[#0F4C94] transition-colors hover:text-[#093579]',
                className,
            )}
            aria-label="Hapus simpanan"
        >
            <BookmarkCheck className="size-5" />
            {withLabel ? 'Tersimpan' : null}
        </Link>
    ) : (
        <Link
            href={save(job.id)}
            method="post"
            as="button"
            className={cn(
                'inline-flex shrink-0 items-center gap-2 text-muted-foreground transition-colors hover:text-foreground',
                className,
            )}
            aria-label="Simpan"
        >
            <Bookmark className="size-5" />
            {withLabel ? 'Simpan' : null}
        </Link>
    );
}

function JobMeta({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof MapPin;
    label: string;
    value: string;
}) {
    return (
        <div className="flex min-w-0 items-start gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
            <Icon className="mt-0.5 size-4 shrink-0 text-slate-500" />
            <div className="min-w-0">
                <p className="text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
                    {label}
                </p>
                <p className="truncate text-sm font-semibold text-slate-800">
                    {value}
                </p>
            </div>
        </div>
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
