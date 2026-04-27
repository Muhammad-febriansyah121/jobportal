import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowUpDown,
    BadgeCheck,
    BriefcaseBusiness,
    Building2,
    ChevronDown,
    ExternalLink,
    MapPin,
    Search,
    Shield,
    SlidersHorizontal,
    Sparkles,
    Users,
    X,
} from 'lucide-react';
import { useState } from 'react';
import HomeLayout from '@/layouts/front/home-layout';
import { cn } from '@/lib/utils';
import { index as companiesIndex, show as companyShow } from '@/routes/companies';
import { index as jobsIndex } from '@/routes/jobs';

type CompanyItem = {
    id: number;
    slug: string;
    name: string;
    logo_url: string | null;
    industry: string | null;
    location: string;
    company_size: string | null;
    is_verified: boolean;
    trust_score: number | null;
    open_jobs_count: number;
};

type CompaniesPageProps = {
    filters: {
        search: string;
        industry_id: string;
        location: string;
        sort: string;
    };
    industries: Array<{ id: number; name: string }>;
    companies: {
        data: CompanyItem[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        from: number | null;
        to: number | null;
        total: number;
    };
};

const sortOptions = [
    { value: 'recommended', label: 'Rekomendasi' },
    { value: 'most_jobs', label: 'Lowongan Terbanyak' },
];

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
                className="size-14 rounded-xl border border-slate-200 object-cover shrink-0"
                src={logoUrl}
            />
        );
    }

    const initials = name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');

    return (
        <div className={cn('inline-flex size-14 shrink-0 items-center justify-center rounded-xl text-base font-bold', avatarColor(name))}>
            {initials || 'CO'}
        </div>
    );
}

function TrustBar({ score }: { score: number | null }) {
    if (!score) {
return null;
}

    const pct = Math.min(100, Math.max(0, score));
    const color = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-secondary-400' : 'bg-red-400';

    return (
        <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[11px] font-semibold text-slate-500">{pct}</span>
        </div>
    );
}

export default function FrontCompaniesIndex({ filters, industries, companies }: CompaniesPageProps) {
    const [heroSearch, setHeroSearch] = useState(filters.search);

    const showingLabel =
        companies.from && companies.to
            ? `${companies.from}–${companies.to} dari ${companies.total} perusahaan`
            : `${companies.data.length} perusahaan`;

    const activeFilterCount = [filters.search, filters.industry_id, filters.location].filter(Boolean).length;

    const activeFilterChips = [
        filters.search && { key: 'search', label: `"${filters.search}"` },
        filters.industry_id && { key: 'industry_id', label: industries.find((i) => String(i.id) === filters.industry_id)?.name ?? filters.industry_id },
        filters.location && { key: 'location', label: filters.location },
    ].filter(Boolean) as { key: string; label: string }[];

    const removeFilter = (key: string) => {
        router.get(companiesIndex().url, { ...filters, [key]: '', sort: filters.sort }, { preserveScroll: true, preserveState: true });
    };

    return (
        <HomeLayout>
            <Head title="Perusahaan" />

            {/* Hero */}
            <section className="relative overflow-hidden bg-white pt-20 pb-12 text-center">
                <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary-500/10 blur-3xl" />
                <div className="relative mx-auto max-w-3xl px-4">
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-xs font-semibold text-primary-600">
                        <Sparkles className="size-3.5" />
                        {companies.total.toLocaleString('id-ID')}+ Perusahaan Aktif
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                        Temukan Perusahaan{' '}
                        <span className="text-primary-600">Terbaik</span>
                    </h1>
                    <p className="mt-4 text-base text-slate-500">
                        Jelajahi profil perusahaan terverifikasi, cek lowongan aktif, dan pilih tempat kerja yang paling sesuai tujuan kariermu.
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
                                placeholder="Cari nama perusahaan..."
                                type="text"
                                value={heroSearch}
                            />
                        </div>
                        <button
                            className="h-12 rounded-xl bg-primary-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 active:scale-95"
                            type="submit"
                        >
                            Cari
                        </button>
                    </form>
                </div>
            </section>

            {/* Main */}
            <section className="bg-[#f5f6f8] px-4 py-8">
                <div className="mx-auto max-w-6xl">
                    <div className="grid gap-6 lg:grid-cols-[270px_1fr]">

                        {/* Sidebar */}
                        <aside className="lg:sticky lg:top-6 lg:self-start">
                            <form
                                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    const formData = new FormData(event.currentTarget);
                                    router.get(companiesIndex().url, Object.fromEntries(formData.entries()), { preserveScroll: true, preserveState: true });
                                }}
                            >
                                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3.5">
                                    <div className="flex items-center gap-2">
                                        <SlidersHorizontal className="size-4 text-primary-600" />
                                        <span className="text-sm font-bold text-slate-800">Filter</span>
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
 e.preventDefault(); router.get(companiesIndex().url); 
}}
                                            type="button"
                                        >
                                            Reset semua
                                        </button>
                                    )}
                                </div>

                                <div className="divide-y divide-slate-100">
                                    <div className="p-4">
                                        <p className="mb-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase">Nama perusahaan</p>
                                        <div className="relative">
                                            <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-400" />
                                            <input
                                                className="h-10 w-full rounded-lg border border-slate-200 bg-white pr-3 pl-8 text-sm transition outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                                                defaultValue={filters.search}
                                                name="search"
                                                placeholder="Tokopedia, Gojek..."
                                                type="text"
                                            />
                                        </div>
                                    </div>

                                    <div className="p-4">
                                        <p className="mb-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase">Industri</p>
                                        <select
                                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm transition outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                                            defaultValue={filters.industry_id}
                                            name="industry_id"
                                        >
                                            <option value="">Semua industri</option>
                                            {industries.map((industry) => (
                                                <option key={industry.id} value={industry.id}>
                                                    {industry.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="p-4">
                                        <p className="mb-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase">Lokasi</p>
                                        <div className="relative">
                                            <MapPin className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-400" />
                                            <input
                                                className="h-10 w-full rounded-lg border border-slate-200 bg-white pr-3 pl-8 text-sm transition outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                                                defaultValue={filters.location}
                                                name="location"
                                                placeholder="Jakarta, Surabaya..."
                                                type="text"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 pt-0">
                                    <button
                                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary-600 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 active:scale-[0.98]"
                                        type="submit"
                                    >
                                        <Search className="size-4" />
                                        Terapkan Filter
                                    </button>
                                </div>
                            </form>
                        </aside>

                        {/* List */}
                        <div className="space-y-4">
                            {/* Toolbar */}
                            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                                <p className="text-sm font-medium text-slate-500">
                                    Menampilkan <span className="font-bold text-slate-800">{showingLabel}</span>
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

                            {/* Cards grid */}
                            {companies.data.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-14 text-center shadow-sm">
                                    <Building2 className="mx-auto size-10 text-slate-300" />
                                    <p className="mt-4 text-base font-semibold text-slate-700">Perusahaan tidak ditemukan</p>
                                    <p className="mt-1 text-sm text-slate-400">Coba ubah kata kunci atau longgarkan filter.</p>
                                    <button
                                        onClick={() => router.get(companiesIndex().url)}
                                        className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-primary-300 hover:text-primary-600"
                                    >
                                        <X className="size-3.5" />
                                        Reset filter
                                    </button>
                                </div>
                            ) : (
                                <div className="grid gap-3 md:grid-cols-2">
                                    {companies.data.map((company) => (
                                        <CompanyCard key={company.id} company={company} />
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
                    </div>
                </div>
            </section>
        </HomeLayout>
    );
}

function CompanyCard({ company }: { company: CompanyItem }) {
    return (
        <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:border-primary-200 hover:shadow-md">
            <div className="absolute top-0 left-0 h-full w-1 rounded-l-2xl bg-primary-600 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

            <div className="p-5">
                {/* Header row */}
                <div className="flex items-start gap-3">
                    <CompanyAvatar name={company.name} logoUrl={company.logo_url} />

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                            <h2 className="truncate text-base font-bold text-slate-900 transition group-hover:text-primary-600">
                                {company.name}
                            </h2>
                            {company.is_verified && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                                    <BadgeCheck className="size-3" />
                                    Verified
                                </span>
                            )}
                        </div>

                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                                <Building2 className="size-3.5 text-slate-400" />
                                {company.industry ?? 'Industri umum'}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                                <MapPin className="size-3.5 text-slate-400" />
                                {company.location || 'Indonesia'}
                            </span>
                        </div>
                    </div>

                    {/* Lowongan badge */}
                    <span className={cn(
                        'shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold',
                        company.open_jobs_count > 0
                            ? 'bg-primary-50 text-primary-700 border border-primary-200'
                            : 'bg-slate-100 text-slate-500',
                    )}>
                        <BriefcaseBusiness className="size-3.5" />
                        {company.open_jobs_count}
                    </span>
                </div>

                {/* Meta row */}
                <div className="mt-4 space-y-2.5">
                    <div className="flex flex-wrap gap-2">
                        {company.company_size && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] text-slate-600">
                                <Users className="size-3 text-slate-400" />
                                {company.company_size} karyawan
                            </span>
                        )}
                        {company.trust_score !== null && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] text-slate-600">
                                <Shield className="size-3 text-slate-400" />
                                Trust {company.trust_score}
                            </span>
                        )}
                    </div>
                    {company.trust_score !== null && (
                        <TrustBar score={company.trust_score} />
                    )}
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                    <Link
                        className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        href={companyShow(company.slug)}
                    >
                        <ExternalLink className="size-3.5" />
                        Profil
                    </Link>
                    <Link
                        className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-primary-200 bg-primary-50 text-sm font-semibold text-primary-700 transition hover:border-primary-300 hover:bg-primary-100"
                        href={`${jobsIndex().url}?search=${encodeURIComponent(company.name)}`}
                    >
                        <BriefcaseBusiness className="size-3.5" />
                        {company.open_jobs_count} Lowongan
                    </Link>
                </div>
            </div>
        </article>
    );
}
