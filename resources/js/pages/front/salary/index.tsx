import { Head, router } from '@inertiajs/react';
import {
    BarChart3,
    Building2,
    MapPin,
    Search,
    TrendingUpIcon,
    Users,
    X,
} from 'lucide-react';
import { useState } from 'react';
import HomeLayout from '@/layouts/front/home-layout';

type SalaryInsight = {
    id: number;
    job_title: string;
    industry: string | null;
    location_city: string | null;
    salary_min: number | null;
    salary_median: number | null;
    salary_max: number | null;
    source_count: number | null;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type SalaryPageProps = {
    filters: {
        search: string;
        industry_id: string;
        location: string;
    };
    industries: Array<{ id: number; name: string }>;
    insights: {
        data: SalaryInsight[];
        links: PaginationLink[];
        from: number | null;
        to: number | null;
        total: number;
        current_page: number;
        last_page: number;
    };
};

function formatMoney(amount: number | null): string {
    if (amount === null) {
return '-';
}

    return 'Rp ' + new Intl.NumberFormat('id-ID').format(amount);
}

function SalaryBar({
    min,
    median,
    max,
}: {
    min: number | null;
    median: number | null;
    max: number | null;
}) {
    if (!min || !max || !median) {
return null;
}

    const medianPct = ((median - min) / (max - min)) * 100;

    return (
        <div className="space-y-1">
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 via-primary/60 to-primary" />
                <div
                    className="absolute top-1/2 h-3.5 w-1.5 -translate-y-1/2 rounded-full bg-white shadow-md ring-2 ring-primary"
                    style={{ left: `${medianPct}%` }}
                />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Min</span>
                <span>Median</span>
                <span>Max</span>
            </div>
        </div>
    );
}

function InsightCard({ insight }: { insight: SalaryInsight }) {
    return (
        <div className="group flex flex-col gap-4 rounded-2xl border border-border bg-white p-5 shadow-sm transition hover:border-primary/30 hover:shadow-md">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-bold text-foreground group-hover:text-primary">
                        {insight.job_title}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        {insight.industry && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Building2 className="size-3 shrink-0" />
                                {insight.industry}
                            </span>
                        )}
                        {insight.location_city && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="size-3 shrink-0" />
                                {insight.location_city}
                            </span>
                        )}
                    </div>
                </div>
                {insight.source_count && (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                        <Users className="size-3" />
                        {insight.source_count} data
                    </span>
                )}
            </div>

            <SalaryBar
                max={insight.salary_max}
                median={insight.salary_median}
                min={insight.salary_min}
            />

            <div className="grid grid-cols-3 divide-x divide-border rounded-xl bg-muted/40 text-center">
                <div className="px-1 py-2.5">
                    <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                        MIN
                    </p>
                    <p className="mt-0.5 text-xs font-bold text-foreground">
                        {formatMoney(insight.salary_min)}
                    </p>
                </div>
                <div className="px-1 py-2.5">
                    <p className="text-[10px] font-medium tracking-wide text-primary uppercase">
                        MEDIAN
                    </p>
                    <p className="mt-0.5 text-xs font-bold text-primary">
                        {formatMoney(insight.salary_median)}
                    </p>
                </div>
                <div className="px-1 py-2.5">
                    <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                        MAX
                    </p>
                    <p className="mt-0.5 text-xs font-bold text-foreground">
                        {formatMoney(insight.salary_max)}
                    </p>
                </div>
            </div>
        </div>
    );
}

function Pagination({
    links,
    from,
    to,
    total,
}: {
    links: PaginationLink[];
    from: number | null;
    to: number | null;
    total: number;
}) {
    const prevLink = links.find(
        (l) =>
            l.label.includes('pagination.previous') ||
            l.label.includes('Previous') ||
            l.label.includes('Sebelumnya'),
    );
    const nextLink = links.find(
        (l) =>
            l.label.includes('pagination.next') ||
            l.label.includes('Next') ||
            l.label.includes('Berikutnya'),
    );
    const visibleLinks = links.filter((l) => l !== prevLink && l !== nextLink);

    return (
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <p className="text-sm text-muted-foreground">
                {from && to
                    ? `Menampilkan ${from}–${to} dari ${total} data`
                    : `${total} data`}
            </p>
            <div className="flex items-center gap-1">
                <button
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-sm text-muted-foreground transition hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={!prevLink?.url}
                    onClick={() => prevLink?.url && router.get(prevLink.url)}
                >
                    ‹
                </button>
                {visibleLinks.map((link) => (
                    <button
                        className={`flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-sm font-medium transition ${
                            link.active
                                ? 'border-primary bg-primary text-white'
                                : 'border-border bg-white text-muted-foreground hover:border-primary/30 hover:text-primary'
                        }`}
                        key={link.label}
                        onClick={() =>
                            !link.active && link.url && router.get(link.url)
                        }
                    >
                        {link.label}
                    </button>
                ))}
                <button
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-sm text-muted-foreground transition hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={!nextLink?.url}
                    onClick={() => nextLink?.url && router.get(nextLink.url)}
                >
                    ›
                </button>
            </div>
        </div>
    );
}

export default function SalaryIndex({
    filters,
    industries,
    insights,
}: SalaryPageProps) {
    const [search, setSearch] = useState(filters.search);
    const [location, setLocation] = useState(filters.location);
    const [industryId, setIndustryId] = useState(filters.industry_id);

    const hasActiveFilters =
        filters.search || filters.industry_id || filters.location;

    function applyFilters(overrides?: Partial<typeof filters>) {
        const params = {
            search,
            industry_id: industryId,
            location,
            ...overrides,
        };

        router.get('/salary', params, {
            preserveScroll: true,
            preserveState: true,
        });
    }

    function clearFilters() {
        setSearch('');
        setIndustryId('');
        setLocation('');
        router.get('/salary');
    }

    return (
        <HomeLayout>
            <Head title="Info Gaji" />

            {/* Hero */}
            <section className="relative overflow-hidden bg-white pt-20 pb-4 text-center">
                <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
                <div className="relative mx-auto max-w-3xl px-4">
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary">
                        <TrendingUpIcon className="size-3.5" />
                        Data Gaji Real-time
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                        Ketahui Berapa{' '}
                        <span className="text-primary">Gajimu</span> Seharusnya
                    </h1>
                    <p className="mt-4 text-base text-muted-foreground">
                        Jelajahi rentang gaji berdasarkan posisi, industri, dan
                        kota di seluruh Indonesia.
                    </p>

                    {/* Hero search */}
                    <form
                        className="mt-8 flex flex-col gap-3 sm:flex-row"
                        onSubmit={(e) => {
                            e.preventDefault();
                            applyFilters();
                        }}
                    >
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                className="h-11 w-full rounded-xl border border-border bg-white pr-4 pl-10 text-sm text-foreground placeholder-muted-foreground shadow-sm transition outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari posisi, misal: Backend Engineer..."
                                type="text"
                                value={search}
                            />
                        </div>
                        <button
                            className="h-11 rounded-xl bg-primary px-6 text-sm font-semibold text-white transition hover:bg-primary/90 active:scale-95"
                            type="submit"
                        >
                            Cari Gaji
                        </button>
                    </form>
                </div>
            </section>

            {/* Filters + Content */}
            <section className="bg-gray-50 px-4 py-10">
                <div className="mx-auto max-w-6xl">
                    {/* Filter bar */}
                    <div className="mb-6 flex flex-wrap items-center gap-3">
                        <select
                            className="h-9 rounded-lg border border-border bg-white px-3 text-sm text-foreground shadow-sm transition outline-none focus:border-primary/50"
                            onChange={(e) => {
                                setIndustryId(e.target.value);
                                applyFilters({ industry_id: e.target.value });
                            }}
                            value={industryId}
                        >
                            <option value="">Semua Industri</option>
                            {industries.map((ind) => (
                                <option key={ind.id} value={String(ind.id)}>
                                    {ind.name}
                                </option>
                            ))}
                        </select>

                        <div className="relative">
                            <MapPin className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                            <input
                                className="h-9 w-44 rounded-lg border border-border bg-white pr-3 pl-8 text-sm text-foreground shadow-sm transition outline-none focus:border-primary/50"
                                onBlur={() => applyFilters()}
                                onChange={(e) => setLocation(e.target.value)}
                                onKeyDown={(e) =>
                                    e.key === 'Enter' && applyFilters()
                                }
                                placeholder="Kota..."
                                type="text"
                                value={location}
                            />
                        </div>

                        {hasActiveFilters && (
                            <button
                                className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-sm font-medium text-muted-foreground shadow-sm transition hover:border-red-200 hover:text-red-500"
                                onClick={clearFilters}
                            >
                                <X className="size-3.5" />
                                Reset Filter
                            </button>
                        )}

                        <span className="ml-auto text-sm text-muted-foreground">
                            <span className="font-semibold text-foreground">
                                {insights.total}
                            </span>{' '}
                            data gaji
                        </span>
                    </div>

                    {/* Cards grid */}
                    {insights.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white py-20 text-center">
                            <BarChart3 className="size-12 text-muted-foreground/30" />
                            <p className="mt-3 text-base font-semibold text-foreground">
                                Tidak ada data gaji ditemukan
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Coba ubah kata kunci atau filter kamu
                            </p>
                            <button
                                className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
                                onClick={clearFilters}
                            >
                                Reset Filter
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {insights.data.map((insight) => (
                                <InsightCard
                                    insight={insight}
                                    key={insight.id}
                                />
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {insights.last_page > 1 && (
                        <div className="mt-8">
                            <Pagination
                                from={insights.from}
                                links={insights.links}
                                to={insights.to}
                                total={insights.total}
                            />
                        </div>
                    )}
                </div>
            </section>
        </HomeLayout>
    );
}
