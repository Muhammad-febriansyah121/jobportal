import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowUpDown,
    BriefcaseBusiness,
    Building2,
    ChevronDown,
    Clock3,
    MapPin,
    Search,
    SlidersHorizontal,
    Sparkles,
    Wallet,
    X,
} from 'lucide-react';
import { useState } from 'react';
import HomeLayout from '@/layouts/front/home-layout';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';
import { index as companiesIndex } from '@/routes/companies';

type CompanyItem = {
    id: number | string;
    detail_url: string;
    name: string;
    logo_url: string | null;
    location: string;
    open_jobs_count: number;
    source: 'scraped';
};

type CompaniesPageProps = {
    filters: {
        search: string;
        location: string;
        sort: string;
    };
    companies: {
        data: CompanyItem[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        from: number | null;
        to: number | null;
        total: number;
    };
};


const avatarColors = [
    'bg-violet-100 text-violet-700',
    'bg-sky-100 text-sky-700',
    'bg-emerald-100 text-emerald-700',
    'bg-secondary-100 text-secondary-700',
    'bg-rose-100 text-rose-700',
    'bg-indigo-100 text-indigo-700',
    'bg-primary-100 text-primary-700',
];

function avatarColor(name: string): string {
    return avatarColors[name.charCodeAt(0) % avatarColors.length];
}

function CompanyAvatar({ name, logoUrl }: { name: string; logoUrl: string | null }) {
    if (logoUrl) {
        return (
            <img
                alt={name}
                className="size-14 shrink-0 rounded-2xl border border-primary-100 bg-primary-50 object-contain p-1.5"
                src={logoUrl}
            />
        );
    }

    const initials = name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');

    return <div className={cn('inline-flex size-14 shrink-0 items-center justify-center rounded-2xl text-sm font-bold', avatarColor(name))}>{initials || 'CO'}</div>;
}

export default function FrontCompaniesIndex({ filters, companies }: CompaniesPageProps) {
    const { t } = useTranslate();
    const [heroSearch, setHeroSearch] = useState(filters.search);

    const sortOptions = [
        { value: 'recommended', label: t('front.companies.sort_recommended') },
        { value: 'most_jobs', label: t('front.companies.sort_most_jobs') },
    ];

    const showingLabel =
        companies.from && companies.to
            ? t('front.companies.showing_range', { from: companies.from, to: companies.to, total: companies.total })
            : t('front.companies.showing_count', { count: companies.data.length });

    const activeFilterCount = [filters.search, filters.location].filter(Boolean).length;

    const activeFilterChips = [
        filters.search && { key: 'search', label: `"${filters.search}"` },
        filters.location && { key: 'location', label: filters.location },
    ].filter(Boolean) as { key: string; label: string }[];

    const removeFilter = (key: string) => {
        router.get(companiesIndex().url, { ...filters, [key]: '', sort: filters.sort }, { preserveScroll: true, preserveState: true });
    };

    return (
        <HomeLayout>
            <Head title={t('front.companies.head_title')} />

            {/* Hero */}
            <section className="relative overflow-hidden bg-white pt-20 pb-12 text-center">
                <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary-500/10 blur-3xl" />
                <div className="relative mx-auto max-w-3xl px-4">
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-xs font-semibold text-primary-600">
                        <Sparkles className="size-3.5" />
                        {t('front.companies.hero_badge', { count: companies.total.toLocaleString('id-ID') })}
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                        {t('front.companies.hero_title')}{' '}
                        <span className="text-primary-600">{t('front.companies.hero_title_highlight')}</span>
                    </h1>
                    <p className="mt-4 text-base text-slate-500">
                        {t('front.companies.hero_subtitle')}
                    </p>
                    <form
                        className="mt-8 flex gap-2"
                        onSubmit={(e) => {
                            e.preventDefault();
                            router.get(companiesIndex().url, { ...filters, search: heroSearch }, { preserveScroll: true, preserveState: true });
                        }}
                    >
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
                            <input
                                className="h-12 w-full rounded-xl border border-slate-200 bg-white pr-4 pl-10 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-200"
                                onChange={(e) => setHeroSearch(e.target.value)}
                                placeholder={t('front.companies.hero_search_placeholder')}
                                type="text"
                                value={heroSearch}
                            />
                        </div>
                        <button
                            className="h-12 rounded-xl bg-primary-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 active:scale-95"
                            type="submit"
                        >
                            {t('front.companies.hero_search_button')}
                        </button>
                    </form>
                </div>
            </section>

            {/* Main */}
            <section className="bg-[#f5f6f8] px-4 py-8">
                <div className="mx-auto max-w-7xl space-y-5">

                    {/* Filter bar (horizontal, on top) */}
                    <form
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                        onSubmit={(event) => {
                            event.preventDefault();
                            const formData = new FormData(event.currentTarget);
                            router.get(companiesIndex().url, Object.fromEntries(formData.entries()), { preserveScroll: true, preserveState: true });
                        }}
                    >
                        <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3">
                            <div className="flex items-center gap-2">
                                <SlidersHorizontal className="size-4 text-primary-600" />
                                <span className="text-sm font-bold text-slate-800">{t('front.companies.filter_title')}</span>
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
                                        router.get(companiesIndex().url);
                                    }}
                                    type="button"
                                >
                                    {t('front.companies.filter_reset_all')}
                                </button>
                            )}
                        </div>

                        <div className="grid gap-3 p-4 md:grid-cols-2 lg:grid-cols-12 lg:items-end">
                            {/* Company name */}
                            <div className="lg:col-span-5">
                                <p className="mb-1.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase">{t('front.companies.filter_company_name_label')}</p>
                                <div className="relative">
                                    <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-400" />
                                    <input
                                        className="h-10 w-full rounded-lg border border-slate-200 bg-white pr-3 pl-8 text-sm transition outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                                        defaultValue={filters.search}
                                        name="search"
                                        placeholder={t('front.companies.filter_company_name_placeholder')}
                                        type="text"
                                    />
                                </div>
                            </div>

                            {/* Location */}
                            <div className="lg:col-span-5">
                                <p className="mb-1.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase">{t('front.companies.filter_location_label')}</p>
                                <div className="relative">
                                    <MapPin className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-400" />
                                    <input
                                        className="h-10 w-full rounded-lg border border-slate-200 bg-white pr-3 pl-8 text-sm transition outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                                        defaultValue={filters.location}
                                        name="location"
                                        placeholder={t('front.companies.filter_location_placeholder')}
                                        type="text"
                                    />
                                </div>
                            </div>

                            {/* Apply */}
                            <div className="lg:col-span-2">
                                <button
                                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 active:scale-[0.98]"
                                    type="submit"
                                >
                                    <Search className="size-4" />
                                    {t('front.companies.filter_apply_button')}
                                </button>
                            </div>
                        </div>
                    </form>

                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                        <p className="text-sm font-medium text-slate-500">
                            {t('front.companies.toolbar_showing')} <span className="font-bold text-slate-800">{showingLabel}</span>
                        </p>
                        <form>
                            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-500 transition hover:border-primary-300">
                                <ArrowUpDown className="size-3.5 text-slate-400" />
                                <select
                                    className="cursor-pointer bg-transparent font-semibold text-slate-800 outline-none"
                                    defaultValue={filters.sort}
                                    name="sort"
                                    onChange={(e) => router.get(companiesIndex().url, { ...filters, sort: e.target.value }, { preserveScroll: true, preserveState: true })}
                                >
                                    {sortOptions.map((o) => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
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

                    {/* Cards grid (3 cols on large) */}
                    {companies.data.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-14 text-center shadow-sm">
                            <Building2 className="mx-auto size-10 text-slate-300" />
                            <p className="mt-4 text-base font-semibold text-slate-700">{t('front.companies.empty_title')}</p>
                            <p className="mt-1 text-sm text-slate-400">{t('front.companies.empty_subtitle')}</p>
                            <button
                                onClick={() => router.get(companiesIndex().url)}
                                className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-primary-300 hover:text-primary-600"
                            >
                                <X className="size-3.5" />
                                {t('front.companies.empty_reset')}
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {companies.data.map((company) => (
                                <CompanyCard key={`${company.source}-${company.id}`} company={company} />
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {companies.links.length > 3 && (
                        <nav className="flex items-center justify-center gap-1.5 pt-2">
                            {companies.links.map((link, index) => (
                                <Link
                                    key={`${link.label}-${index}`}
                                    className={cn(
                                        'min-w-9 rounded-lg border px-3 py-1.5 text-center text-sm font-medium transition',
                                        link.active
                                            ? 'border-primary-600 bg-primary-600 text-white shadow-sm'
                                            : 'border-slate-200 bg-white text-slate-600 hover:border-primary-300 hover:text-primary-600',
                                        !link.url && 'pointer-events-none opacity-40',
                                    )}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    href={link.url ?? '#'}
                                    preserveScroll
                                />
                            ))}
                        </nav>
                    )}
                </div>
            </section>
        </HomeLayout>
    );
}

function CompanyCard({ company }: { company: CompanyItem }) {
    const { t } = useTranslate();

    return (
        <Link
            aria-label={`Lihat lowongan dari ${company.name}`}
            className="group relative flex h-full min-h-[330px] flex-col overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-[0_18px_40px_rgba(15,76,148,0.12)] focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:outline-none"
            href={company.detail_url}
        >
            <div className="flex flex-1 flex-col px-5 pt-5">
                <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex items-center gap-1 rounded-lg border border-primary-100 bg-primary-50 px-2.5 py-1 text-[11px] font-bold tracking-wide text-primary-700 uppercase">
                        <Sparkles className="size-3.5" />
                        {t('front.companies.card_jobs_latest')}
                    </span>
                    <BriefcaseBusiness className="size-5 shrink-0 text-slate-300 transition-colors group-hover:text-primary-500" />
                </div>

                <div className="mt-4 flex items-start gap-3.5">
                    <CompanyAvatar name={company.name} logoUrl={company.logo_url} />
                    <div className="min-w-0 pt-0.5">
                        <h2 className="line-clamp-2 text-[17px] leading-[1.15] font-bold tracking-[-0.02em] text-slate-900 transition-colors group-hover:text-primary-600">
                            {company.name}
                        </h2>
                        <p className="mt-1 truncate text-sm text-slate-500">
                            {t('front.companies.card_scraped_company')}
                        </p>
                    </div>
                </div>

                <div className="mt-5 space-y-3 rounded-xl border border-slate-100 bg-slate-50/65 px-3.5 py-3 text-sm text-slate-600">
                    <p className="flex items-center gap-2">
                        <BriefcaseBusiness className="size-4 shrink-0 text-primary-500" />
                        <span className="font-semibold text-primary-600">
                            {t('front.companies.card_jobs', { count: company.open_jobs_count })}
                        </span>
                    </p>
                    <p className="flex items-center gap-2">
                        <MapPin className="size-4 shrink-0 text-slate-500" />
                        <span className="truncate">
                            {company.location || t('front.companies.card_location_fallback')}
                        </span>
                    </p>
                    <p className="flex items-center gap-2">
                        <Clock3 className="size-4 shrink-0 text-slate-500" />
                        <span>{t('front.companies.card_jobs_available')}</span>
                    </p>
                    <p className="flex items-center gap-2 font-semibold text-slate-700">
                        <Wallet className="size-4 shrink-0 text-slate-500" />
                        <span>{t('front.companies.card_salary_available')}</span>
                    </p>
                </div>
            </div>

            <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-200 bg-slate-50/60 px-5 py-3 text-xs font-semibold text-primary-600">
                <span>{t('front.companies.card_view_jobs')}</span>
                <BriefcaseBusiness className="size-3.5" />
            </div>
        </Link>
    );
}
