import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowUpDown,
    BadgeCheck,
    BriefcaseBusiness,
    Building2,
    ChevronDown,
    Clock,
    Flame,
    Link2,
    MapPin,
    Search,
    SlidersHorizontal,
    Sparkles,
    Wallet,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslate } from '@/hooks/use-translate';
import HomeLayout from '@/layouts/front/home-layout';
import { buildJobShareMessage } from '@/lib/job-share-message';
import { cn } from '@/lib/utils';
import { index as jobsIndex, show as jobShow } from '@/routes/jobs';
import { show as scrapedJobShow } from '@/routes/jobs/scraped';

type JobItem = {
    id: number;
    slug: string;
    title: string;
    is_anonymous: boolean;
    is_urgent: boolean;
    is_few_applicants: boolean;
    company: string | null;
    company_slug: string | null;
    company_logo: string | null;
    company_verified: boolean;
    location: string;
    work_mode: string;
    job_type: string;
    experience_level: string;
    salary_range: string;
    published_at: string | null;
    is_saved: boolean;
    is_scraped?: boolean;
};

type JobsPageProps = {
    filters: {
        search: string;
        location: string;
        work_mode: string;
        job_type: string;
        experience_level: string;
        salary_min: number | null;
        sort: string;
    };
    jobs: {
        data: JobItem[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        from: number | null;
        to: number | null;
        total: number;
    };
};

function formatRupiah(value: number): string {
    if (!value) {
        return '';
    }

    return new Intl.NumberFormat('id-ID', {
        currency: 'IDR',
        maximumFractionDigits: 0,
        style: 'currency',
    }).format(value);
}

function onlyDigits(value: string): number {
    return parseInt(value.replace(/\D/g, '') || '0', 10);
}

function companyInitials(name: string | null): string {
    if (!name) {
        return '?';
    }

    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('');
}

const avatarColors = [
    'bg-violet-100 text-violet-700',
    'bg-sky-100 text-sky-700',
    'bg-emerald-100 text-emerald-700',
    'bg-secondary-100 text-secondary-700',
    'bg-rose-100 text-rose-700',
    'bg-indigo-100 text-indigo-700',
];

function avatarColor(name: string | null): string {
    const n = name ?? '?';

    return avatarColors[n.charCodeAt(0) % avatarColors.length];
}

function RupiahFilterInput({ defaultValue }: { defaultValue: number | null }) {
    const [amount, setAmount] = useState<number>(defaultValue ?? 0);

    return (
        <>
            <input type="hidden" name="salary_min" value={amount || ''} />
            <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    Rp
                </span>
                <input
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white pr-3 pl-8 text-sm transition outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                    inputMode="numeric"
                    placeholder="10.000.000"
                    value={
                        amount
                            ? new Intl.NumberFormat('id-ID').format(amount)
                            : ''
                    }
                    onChange={(e) => setAmount(onlyDigits(e.target.value))}
                />
            </div>
        </>
    );
}

export default function FrontJobsIndex({ filters, jobs }: JobsPageProps) {
    const { t } = useTranslate();
    const [searchQuery, setSearchQuery] = useState(filters.search);
    const searchDebounceRef = useRef<number | null>(null);

    const submitSearch = (): void => {
        if (searchDebounceRef.current !== null) {
            window.clearTimeout(searchDebounceRef.current);
            searchDebounceRef.current = null;
        }

        router.get(
            jobsIndex().url,
            {
                ...filters,
                search: searchQuery.trim() || undefined,
                page: undefined,
            },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    };

    useEffect(() => {
        const normalizedSearch = searchQuery.trim();

        if (normalizedSearch === filters.search) {
            return;
        }

        searchDebounceRef.current = window.setTimeout(() => {
            router.get(
                jobsIndex().url,
                {
                    ...filters,
                    search: normalizedSearch || undefined,
                    page: undefined,
                },
                {
                    preserveScroll: true,
                    preserveState: true,
                    replace: true,
                },
            );
        }, 450);

        return () => {
            if (searchDebounceRef.current !== null) {
                window.clearTimeout(searchDebounceRef.current);
                searchDebounceRef.current = null;
            }
        };
    }, [filters, searchQuery]);

    const sortOptions = [
        { value: 'relevance', label: t('front.jobs.sort_relevant') },
        { value: 'salary_high', label: t('front.jobs.sort_salary_high') },
    ];

    const levelOptions = [
        { value: '', label: t('front.jobs.filter_level_all') },
        { value: 'entry', label: 'Entry Level' },
        { value: 'mid', label: 'Mid Level' },
        { value: 'senior', label: 'Senior Level' },
        { value: 'lead', label: 'Lead' },
        { value: 'manager', label: 'Manager' },
    ];

    const showingLabel =
        jobs.from && jobs.to
            ? t('front.jobs.showing_range', {
                  from: jobs.from,
                  to: jobs.to,
                  total: jobs.total,
              })
            : t('front.jobs.showing_count', { count: jobs.data.length });

    const activeFilterCount = [
        filters.search,
        filters.location,
        filters.experience_level,
        filters.salary_min,
    ].filter(Boolean).length;

    const activeFilterChips = [
        filters.search && { key: 'search', label: `"${filters.search}"` },
        filters.location && { key: 'location', label: filters.location },
        filters.experience_level && {
            key: 'experience_level',
            label:
                levelOptions.find((o) => o.value === filters.experience_level)
                    ?.label ?? filters.experience_level,
        },
        filters.salary_min && {
            key: 'salary_min',
            label: `Min ${formatRupiah(filters.salary_min)}`,
        },
    ].filter(Boolean) as { key: string; label: string }[];

    const removeFilter = (key: string) => {
        router.get(
            jobsIndex().url,
            { ...filters, [key]: '', sort: filters.sort },
            { preserveScroll: true, preserveState: true },
        );
    };

    return (
        <HomeLayout>
            <Head title={t('front.jobs.head_title')} />

            {/* Hero */}
            <section className="relative overflow-hidden bg-white pt-20 pb-12 text-center">
                <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary-500/10 blur-3xl" />
                <div className="relative mx-auto max-w-3xl px-4">
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-xs font-semibold text-primary-600">
                        <Sparkles className="size-3.5" />
                        {t('front.jobs.hero_badge', {
                            count: jobs.total.toLocaleString('id-ID'),
                        })}
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                        {t('front.jobs.hero_title')}{' '}
                        <span className="text-primary-600">
                            {t('front.jobs.hero_title_highlight')}
                        </span>
                    </h1>
                    <p className="mt-4 text-base text-slate-500">
                        {t('front.jobs.hero_subtitle')}
                    </p>
                    <form
                        className="mt-8 flex gap-2"
                        onSubmit={(e) => {
                            e.preventDefault();
                            submitSearch();
                        }}
                    >
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
                            <input
                                className="h-12 w-full rounded-xl border border-slate-200 bg-white pr-4 pl-10 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-200"
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t(
                                    'front.jobs.hero_search_placeholder',
                                )}
                                type="text"
                                value={searchQuery}
                            />
                        </div>
                        <button
                            className="h-12 rounded-xl bg-primary-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 active:scale-95"
                            type="submit"
                        >
                            {t('front.jobs.hero_search_button')}
                        </button>
                    </form>
                </div>
            </section>

            {/* Main content */}
            <section className="bg-[#f5f6f8] px-4 py-8">
                <div className="mx-auto max-w-7xl space-y-5">
                    {/* ── Filter bar (horizontal, on top) ── */}
                    <form
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                        onSubmit={(event) => {
                            event.preventDefault();
                            const formData = new FormData(event.currentTarget);
                            router.get(
                                jobsIndex().url,
                                Object.fromEntries(formData.entries()),
                                { preserveScroll: true, preserveState: true },
                            );
                        }}
                    >
                        <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3">
                            <div className="flex items-center gap-2">
                                <SlidersHorizontal className="size-4 text-primary-600" />
                                <span className="text-sm font-bold text-slate-800">
                                    {t('front.jobs.filter_title')}
                                </span>
                                {activeFilterCount > 0 && (
                                    <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </div>
                            {activeFilterCount > 0 && (
                                <button
                                    className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        router.get(jobsIndex().url);
                                    }}
                                    type="button"
                                >
                                    {t('front.jobs.filter_reset_all')}
                                </button>
                            )}
                        </div>

                        <div className="grid gap-3 p-4 md:grid-cols-2 lg:grid-cols-12 lg:items-end">
                            {/* Keyword */}
                            <div className="lg:col-span-3">
                                <p className="mb-1.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                                    {t('front.jobs.filter_keyword_label')}
                                </p>
                                <div className="relative">
                                    <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-400" />
                                    <input
                                        className="h-10 w-full rounded-lg border border-slate-200 bg-white pr-3 pl-8 text-sm transition outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                                        value={searchQuery}
                                        name="search"
                                        placeholder={t(
                                            'front.jobs.filter_keyword_placeholder',
                                        )}
                                        type="text"
                                        onChange={(event) =>
                                            setSearchQuery(event.target.value)
                                        }
                                    />
                                </div>
                            </div>

                            {/* Lokasi */}
                            <div className="lg:col-span-3">
                                <p className="mb-1.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                                    {t('front.jobs.filter_location_label')}
                                </p>
                                <div className="relative">
                                    <MapPin className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-400" />
                                    <input
                                        className="h-10 w-full rounded-lg border border-slate-200 bg-white pr-3 pl-8 text-sm transition outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                                        defaultValue={filters.location}
                                        name="location"
                                        placeholder={t(
                                            'front.jobs.filter_location_placeholder',
                                        )}
                                        type="text"
                                    />
                                </div>
                            </div>

                            <div className="lg:col-span-2">
                                <FilterSelect
                                    defaultValue={filters.experience_level}
                                    label={t('front.jobs.filter_level_label')}
                                    name="experience_level"
                                    options={levelOptions}
                                />
                            </div>

                            {/* Salary */}
                            <div className="lg:col-span-2">
                                <p className="mb-1.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                                    {t('front.jobs.filter_salary_min_label')}
                                </p>
                                <RupiahFilterInput
                                    defaultValue={filters.salary_min}
                                />
                            </div>

                            {/* Apply button */}
                            <div className="lg:col-span-2">
                                <button
                                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 active:scale-[0.98]"
                                    type="submit"
                                >
                                    <Search className="size-4" />
                                    {t('front.jobs.filter_apply_button')}
                                </button>
                            </div>
                        </div>
                    </form>

                    {/* ── Job list ── */}
                    <div className="space-y-4">
                        {/* Toolbar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                            <p className="text-sm font-medium text-slate-500">
                                {t('front.jobs.toolbar_showing')}{' '}
                                <span className="font-bold text-slate-800">
                                    {showingLabel}
                                </span>
                            </p>
                            <form>
                                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-500 transition hover:border-primary-300">
                                    <ArrowUpDown className="size-3.5 text-slate-400" />
                                    <select
                                        className="cursor-pointer bg-transparent font-semibold text-slate-800 outline-none"
                                        defaultValue={filters.sort}
                                        name="sort"
                                        onChange={(e) =>
                                            router.get(
                                                jobsIndex().url,
                                                {
                                                    ...filters,
                                                    sort: e.target.value,
                                                },
                                                {
                                                    preserveScroll: true,
                                                    preserveState: true,
                                                },
                                            )
                                        }
                                    >
                                        {sortOptions.map((o) => (
                                            <option
                                                key={o.value}
                                                value={o.value}
                                            >
                                                {o.label}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="size-3.5 text-slate-400" />
                                </label>
                            </form>
                        </div>

                        {/* Active chips */}
                        {activeFilterChips.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {activeFilterChips.map((chip) => (
                                    <button
                                        key={chip.key}
                                        type="button"
                                        onClick={() => removeFilter(chip.key)}
                                        className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 transition hover:bg-primary-100"
                                    >
                                        {chip.label}
                                        <X className="size-3" />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Cards */}
                        {jobs.data.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-14 text-center shadow-sm">
                                <BriefcaseBusiness className="mx-auto size-10 text-slate-300" />
                                <p className="mt-4 text-base font-semibold text-slate-700">
                                    {t('front.jobs.empty_title')}
                                </p>
                                <p className="mt-1 text-sm text-slate-400">
                                    {t('front.jobs.empty_subtitle')}
                                </p>
                                <button
                                    onClick={() => router.get(jobsIndex().url)}
                                    className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-primary-300 hover:text-primary-600"
                                >
                                    <X className="size-3.5" />
                                    {t('front.jobs.empty_reset')}
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                {jobs.data.map((job) => (
                                    <JobCard
                                        job={job}
                                        key={`${job.is_scraped ? 'scraped' : 'job'}-${job.id}`}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {jobs.links.length > 3 && (
                            <nav className="flex items-center justify-center gap-1.5 pt-2">
                                {jobs.links.map((link, i) => (
                                    <Link
                                        key={`${link.label}-${i}`}
                                        className={cn(
                                            'min-w-9 rounded-lg border px-3 py-1.5 text-center text-sm font-medium transition',
                                            link.active
                                                ? 'border-primary-600 bg-primary-600 text-white shadow-sm'
                                                : 'border-slate-200 bg-white text-slate-600 hover:border-primary-300 hover:text-primary-600',
                                            link.url === null &&
                                                'pointer-events-none opacity-40',
                                        )}
                                        href={link.url ?? '#'}
                                        preserveScroll
                                        preserveState
                                    >
                                        {decodePaginationLabel(link.label)}
                                    </Link>
                                ))}
                            </nav>
                        )}
                    </div>
                </div>
            </section>
        </HomeLayout>
    );
}

function JobCard({ job }: { job: JobItem }) {
    const { t } = useTranslate();
    const initials = companyInitials(job.company);
    const colorClass = avatarColor(job.company);
    const [shareState, setShareState] = useState<'idle' | 'copied'>('idle');

    const detailUrl = job.is_scraped
        ? scrapedJobShow.url(job.id)
        : jobShow(job.slug).url;

    const openJobDetail = (): void => {
        router.visit(detailUrl);
    };

    const handleShare = async (): Promise<void> => {
        if (typeof window === 'undefined') {
            return;
        }

        const shareUrl = new URL(detailUrl, window.location.origin).toString();
        const shareMessage = buildJobShareMessage({
            title: job.title,
            company: job.company,
            url: shareUrl,
        });

        if (
            typeof navigator !== 'undefined' &&
            typeof navigator.share === 'function'
        ) {
            try {
                await navigator.share({
                    title: `${job.title} - ${job.company ?? 'Karivia'}`,
                    text: shareMessage,
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
            await navigator.clipboard.writeText(shareMessage);
            setShareState('copied');

            window.setTimeout(() => {
                setShareState('idle');
            }, 2000);
        }
    };

    return (
        <article
            aria-label={`Lihat detail ${job.title}`}
            className="group relative flex h-full min-h-[330px] cursor-pointer flex-col overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-[0_18px_40px_rgba(15,76,148,0.12)] focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:outline-none"
            onClick={(event) => {
                if ((event.target as HTMLElement).closest('a, button')) {
                    return;
                }

                openJobDetail();
            }}
            onKeyDown={(event) => {
                if (
                    event.target !== event.currentTarget ||
                    !['Enter', ' '].includes(event.key)
                ) {
                    return;
                }

                event.preventDefault();
                openJobDetail();
            }}
            role="link"
            tabIndex={0}
        >
            <div className="flex flex-1 flex-col px-5 pt-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-h-6">
                        <span
                            className={
                                job.is_urgent
                                    ? 'inline-flex items-center gap-1 rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1 text-[11px] font-bold tracking-wide text-orange-700 uppercase'
                                    : 'inline-flex items-center gap-1 rounded-lg border border-primary-100 bg-primary-50 px-2.5 py-1 text-[11px] font-bold tracking-wide text-primary-700 uppercase'
                            }
                        >
                            {job.is_urgent ? (
                                <Flame
                                    aria-hidden="true"
                                    className="size-3.5"
                                />
                            ) : (
                                <Sparkles
                                    aria-hidden="true"
                                    className="size-3.5"
                                />
                            )}
                            {job.is_urgent
                                ? t('front.jobs.card_urgent_badge')
                                : 'Lowongan terbaru'}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => void handleShare()}
                        className="inline-flex size-7 shrink-0 items-center justify-center text-slate-500 transition hover:text-primary-600"
                        aria-label={t('front.jobs.card_share')}
                        title={
                            shareState === 'copied'
                                ? t('front.jobs.card_share_copied')
                                : t('front.jobs.card_share')
                        }
                    >
                        <Link2 className="size-3.5" />
                    </button>
                </div>

                <div className="mt-4 flex items-start gap-3.5">
                    {job.company_logo ? (
                        <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-primary-100 bg-primary-50">
                            <img
                                src={job.company_logo}
                                alt={job.company ?? 'Company logo'}
                                className="size-full object-contain p-1.5"
                            />
                        </div>
                    ) : (
                        <div
                            className={cn(
                                'flex size-14 shrink-0 items-center justify-center rounded-2xl text-sm font-bold',
                                colorClass,
                            )}
                        >
                            {initials}
                        </div>
                    )}
                    <div className="min-w-0 pt-0.5">
                        <h3 className="line-clamp-2 text-[17px] leading-[1.15] font-bold tracking-[-0.02em] text-slate-900 transition group-hover:text-primary-600">
                            {job.title}
                        </h3>
                        <p className="mt-1 flex min-w-0 items-center gap-1 text-sm text-slate-500">
                            <span className="truncate">
                                {job.is_anonymous
                                    ? t('front.jobs.card_company_anonymous')
                                    : (job.company ??
                                      t('front.jobs.card_company_fallback'))}
                            </span>
                            {!job.is_anonymous && job.company_verified && (
                                <BadgeCheck
                                    aria-label={t('front.jobs.card_verified')}
                                    className="size-3.5 shrink-0 fill-primary-50 text-primary-500"
                                />
                            )}
                        </p>
                    </div>
                </div>

                <div className="mt-5 space-y-3 rounded-xl border border-slate-100 bg-slate-50/65 px-3.5 py-3 text-sm text-slate-600">
                    <p className="flex items-center gap-2">
                        <BriefcaseBusiness className="size-4 shrink-0 text-primary-500" />
                        <span className="font-semibold text-primary-600">
                            {job.job_type}
                        </span>
                    </p>
                    <p className="flex items-center gap-2">
                        <MapPin className="size-4 shrink-0 text-slate-500" />
                        <span className="truncate">
                            {job.work_mode} ·{' '}
                            {job.location ||
                                t('front.jobs.card_location_fallback')}
                        </span>
                    </p>
                    <p className="flex items-center gap-2">
                        <Building2 className="size-4 shrink-0 text-slate-500" />
                        <span>Min. {job.experience_level}</span>
                    </p>
                    <p className="flex items-center gap-2 font-semibold text-slate-700">
                        <Wallet className="size-4 shrink-0 text-slate-500" />
                        <span className="truncate">
                            {job.salary_range || 'Negotiable'}
                        </span>
                    </p>
                </div>
            </div>

            <div className="mt-auto flex items-center gap-1.5 border-t border-slate-200 bg-slate-50/60 px-5 py-3 text-xs text-slate-500">
                <Clock className="size-3.5" />
                <span>{job.published_at ?? t('front.jobs.card_date_new')}</span>
            </div>
        </article>
    );
}

function FilterSelect({
    label,
    name,
    defaultValue,
    options,
}: {
    label: string;
    name: string;
    defaultValue: string;
    options: Array<{ value: string; label: string }>;
}) {
    return (
        <label className="grid gap-1.5">
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                {label}
            </span>
            <select
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm transition outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                defaultValue={defaultValue}
                name={name}
            >
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
        </label>
    );
}

function decodePaginationLabel(label: string): string {
    return label
        .replace('pagination.previous', '«')
        .replace('pagination.next', '»')
        .replace('Sebelumnya', '«')
        .replace('Berikutnya', '»')
        .replace('&laquo;', '«')
        .replace('&raquo;', '»')
        .replace(/<[^>]+>/g, '')
        .trim();
}
