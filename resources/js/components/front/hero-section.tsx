import { Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    Bookmark,
    BriefcaseBusiness,
    Building2,
    CheckCircle2,
    Clock3,
    Gift,
    GraduationCap,
    MapPin,
    Search,
    ShieldCheck,
    Star,
    Users,
    Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { index as jobsIndex, show as jobShow } from '@/routes/jobs';

type JobPreview = {
    id: number;
    slug: string;
    title: string;
    is_anonymous: boolean;
    is_urgent?: boolean;
    company?: string | null;
    company_logo?: string | null;
    type: string;
    work_mode: string;
    location: string;
    salary: string;
    is_saved: boolean;
};

type HeroSectionProps = {
    jobs: JobPreview[];
    jobs_pagination?: {
        current_page: number;
        last_page: number;
        has_more: boolean;
    };
    stats: {
        active_jobs: number;
        active_companies: number;
        total_candidates: number;
    };
    industries: Array<{ id: number; name: string; jobs_count: number }>;
    registeredCompanies: Array<unknown>;
    faqs: Array<unknown>;
};

type JobTab = 'Semua' | 'Terbaru' | 'Remote' | 'Gaji Tertinggi';

const quickSearches = [
    { label: 'Butuh Cepat', query: 'terbaru', icon: Clock3 },
    { label: 'Top Perusahaan', query: 'perusahaan', icon: Star },
    { label: 'Kerja Remote', query: 'remote', icon: Users },
    { label: 'Fresh Graduate', query: 'fresh graduate', icon: GraduationCap },
    { label: 'Pelamar Sedikit', query: 'pelamar sedikit', icon: Users },
    { label: 'Gaji Tinggi', query: 'gaji tinggi', icon: Wallet },
];

function formatCount(value: number): string {
    return value >= 1000
        ? (value / 1000).toFixed(1).replace('.0', '') + 'k+'
        : String(value) + '+';
}

function companyInitials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase() ?? '')
        .join('');
}

function salaryValue(value: string): number {
    return Number(value.replace(/\D/g, '')) || 0;
}

function CompanyMark({ job }: { job: JobPreview }) {
    const companyName =
        job.company ??
        (job.is_anonymous ? 'Perusahaan anonim' : 'Perusahaan terpercaya');

    return (
        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-background-soft">
            {job.company_logo ? (
                <img
                    src={job.company_logo}
                    alt=""
                    loading="lazy"
                    className="size-full object-contain p-1.5"
                />
            ) : (
                <span className="text-sm font-bold text-primary">
                    {companyInitials(companyName)}
                </span>
            )}
        </div>
    );
}

function JobCard({ job }: { job: JobPreview }) {
    const companyName =
        job.company ??
        (job.is_anonymous ? 'Perusahaan anonim' : 'Perusahaan terpercaya');

    return (
        <Link
            href={jobShow.url(job.slug)}
            className="group relative flex min-h-[218px] flex-col overflow-hidden rounded-2xl border border-border bg-white p-4 transition duration-200 hover:-translate-y-1 hover:border-primary-300 hover:shadow-[0_16px_32px_rgba(10,102,255,0.10)] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
        >
            <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-500 via-brand-sky to-primary-700 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            />

            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                    <CompanyMark job={job} />
                    <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-heading">
                            {companyName}
                        </p>
                        <h3 className="mt-1 line-clamp-2 text-sm leading-5 font-bold text-text transition-colors group-hover:text-primary">
                            {job.title}
                        </h3>
                    </div>
                </div>
                <Bookmark
                    aria-hidden="true"
                    className={
                        job.is_saved
                            ? 'mt-0.5 size-4 shrink-0 fill-primary text-primary'
                            : 'mt-0.5 size-4 shrink-0 text-slate-300 transition-colors group-hover:text-primary'
                    }
                />
            </div>

            <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                <p className="flex items-center gap-2 truncate">
                    <MapPin className="size-3.5 shrink-0 text-primary" />
                    <span className="truncate">
                        {job.location || 'Lokasi fleksibel'}
                    </span>
                </p>
                <p className="flex items-center gap-2 truncate">
                    <BriefcaseBusiness className="size-3.5 shrink-0 text-primary" />
                    <span className="truncate">
                        {job.type || 'Full-time'} · {job.work_mode || 'On-site'}
                    </span>
                </p>
            </div>

            <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4">
                <span className="inline-flex max-w-[58%] items-center gap-1.5 truncate rounded-md bg-primary-50 px-2.5 py-1.5 text-xs font-bold text-primary-700">
                    <Wallet className="size-3.5 shrink-0" />
                    <span className="truncate">
                        {job.salary || 'Gaji kompetitif'}
                    </span>
                </span>
                {job.is_urgent ? (
                    <span className="shrink-0 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700">
                        Butuh cepat
                    </span>
                ) : (
                    <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                        <Clock3 className="size-3" />
                        Terbaru
                    </span>
                )}
            </div>
        </Link>
    );
}

function TrustItem({
    icon: Icon,
    label,
    value,
}: {
    icon: LucideIcon;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary">
                <Icon className="size-4" />
            </span>
            <span className="min-w-0">
                <strong className="block truncate text-sm font-bold text-heading">
                    {value}
                </strong>
                <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                    {label}
                </span>
            </span>
        </div>
    );
}

export default function HeroSection({ jobs, stats }: HeroSectionProps) {
    const [query, setQuery] = useState('');
    const [location, setLocation] = useState('');
    const [activeTab, setActiveTab] = useState<JobTab>('Semua');

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(jobsIndex.url(), {
            search: query.trim() || undefined,
            location: location || undefined,
        });
    };

    const applyQuickSearch = (value: string) => {
        setQuery(value);
        router.get(jobsIndex.url(), { search: value });
    };

    const visibleJobs = useMemo(() => {
        const filtered =
            activeTab === 'Remote'
                ? jobs.filter((job) => job.work_mode.toLowerCase() === 'remote')
                : jobs;

        if (activeTab === 'Gaji Tertinggi') {
            return [...filtered].sort(
                (a, b) => salaryValue(b.salary) - salaryValue(a.salary),
            );
        }

        return filtered;
    }, [activeTab, jobs]);

    return (
        <>
            <section className="relative overflow-hidden border-b border-primary-900/20 bg-gradient-to-b from-[#1b5fd6] via-[#1550c4] to-[#103e9e] text-white">
                <svg
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 h-full w-full"
                    preserveAspectRatio="xMidYMid slice"
                    viewBox="0 0 1440 760"
                    fill="none"
                >
                    <g stroke="white" strokeWidth="1">
                        <path
                            d="M-50 120 C 360 40, 720 200, 1100 90 S 1600 180, 1700 110"
                            strokeOpacity="0.1"
                        />
                        <path
                            d="M-50 200 C 380 110, 760 280, 1140 170 S 1620 250, 1720 190"
                            strokeOpacity="0.08"
                        />
                        <path
                            d="M-50 300 C 320 220, 700 380, 1120 270 S 1640 340, 1740 300"
                            strokeOpacity="0.06"
                        />
                        <path
                            d="M1490 60 C 1300 200, 1380 420, 1180 560 S 1240 760, 1040 880"
                            strokeOpacity="0.12"
                        />
                        <path
                            d="M1560 60 C 1370 210, 1450 440, 1250 580 S 1310 780, 1110 900"
                            strokeOpacity="0.08"
                        />
                        <path
                            d="M-120 560 C 180 470, 360 700, 700 600 S 1100 700, 1300 600"
                            strokeOpacity="0.08"
                        />
                    </g>
                </svg>
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full bg-brand-sky/25 blur-3xl"
                />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-32 -left-24 size-96 rounded-full bg-white/10 blur-3xl"
                />

                <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-4 pt-20 pb-10 text-center sm:px-6 sm:pt-28">
                    <h1 className="text-2xl leading-tight font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                        Temukan Karir Impianmu
                        <br className="hidden sm:block" />{' '}
                        <span className="bg-gradient-to-b from-yellow-300 to-amber-400 bg-clip-text text-transparent">
                            #BarengKarivia
                        </span>
                    </h1>

                    <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-white/80 sm:text-sm">
                        <span className="inline-flex items-center gap-1.5">
                            <ShieldCheck className="size-4 text-brand-sky" />
                            Data terenkripsi
                        </span>
                        <span aria-hidden="true" className="text-white/30">
                            ·
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <Building2 className="size-4 text-brand-sky" />
                            Perusahaan terverifikasi
                        </span>
                        <span aria-hidden="true" className="text-white/30">
                            ·
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <Star className="size-4 fill-brand-sky text-brand-sky" />
                            4.8 rating pengguna
                        </span>
                        <span aria-hidden="true" className="text-white/30">
                            ·
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <Gift className="size-4 text-brand-sky" />
                            Gratis untuk kandidat
                        </span>
                    </div>

                    <form
                        onSubmit={submitSearch}
                        className="mt-9 flex w-full max-w-3xl flex-col gap-2 rounded-2xl border border-border/60 bg-white p-2 shadow-xl shadow-primary-950/10 sm:flex-row sm:items-center"
                    >
                        <label className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-xl px-3">
                            <Search
                                aria-hidden="true"
                                className="size-5 shrink-0 text-muted-foreground/60"
                            />
                            <span className="sr-only">
                                Cari posisi, skill, atau perusahaan
                            </span>
                            <input
                                value={query}
                                onChange={(event) =>
                                    setQuery(event.target.value)
                                }
                                placeholder="Posisi, skill, atau perusahaan..."
                                className="min-w-0 flex-1 border-0 bg-transparent text-sm text-heading shadow-none outline-none placeholder:text-muted-foreground/60 focus:ring-0"
                            />
                        </label>
                        <div
                            aria-hidden="true"
                            className="hidden h-7 w-px shrink-0 bg-border sm:block"
                        />
                        <label className="flex h-12 items-center gap-2 border-t border-border px-3 sm:w-[190px] sm:border-t-0">
                            <MapPin
                                aria-hidden="true"
                                className="size-5 shrink-0 text-muted-foreground/60"
                            />
                            <span className="sr-only">Kota atau lokasi</span>
                            <select
                                value={location}
                                onChange={(event) =>
                                    setLocation(event.target.value)
                                }
                                className="w-full border-0 bg-transparent p-0 text-sm text-muted-foreground outline-none focus:ring-0"
                            >
                                <option value="">Kota atau lokasi...</option>
                                <option value="Jakarta">Jakarta</option>
                                <option value="Bandung">Bandung</option>
                                <option value="Surabaya">Surabaya</option>
                                <option value="Remote">Remote</option>
                            </select>
                        </label>
                        <button
                            type="submit"
                            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-[#1565e0] px-7 text-sm font-bold text-white shadow-md shadow-primary/30 transition-all hover:shadow-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
                        >
                            <Search aria-hidden="true" className="size-4" />
                            Temukan Loker
                        </button>
                    </form>

                    <div className="-mx-4 mt-6 flex w-[calc(100%+2rem)] max-w-5xl flex-nowrap items-center gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:w-full sm:justify-center sm:gap-2.5 sm:px-1">
                        <span className="sr-only">Pencarian populer</span>
                        {quickSearches.map((item) => {
                            const Icon = item.icon;

                            return (
                                <button
                                    key={item.label}
                                    type="button"
                                    onClick={() => applyQuickSearch(item.query)}
                                    className="inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-[11px] font-semibold whitespace-nowrap text-heading shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                                >
                                    <Icon
                                        aria-hidden="true"
                                        className="size-3.5 text-primary"
                                    />
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section
                aria-label="Ringkasan Karivia"
                className="bg-white px-5 pt-4 sm:px-8 lg:px-10"
            >
                <div className="mx-auto grid max-w-[1240px] divide-y divide-border rounded-2xl border border-border bg-background-muted py-1 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
                    <TrustItem
                        icon={BriefcaseBusiness}
                        value={formatCount(stats.active_jobs) + ' lowongan'}
                        label="Peluang kerja aktif"
                    />
                    <TrustItem
                        icon={Building2}
                        value={formatCount(stats.active_companies)}
                        label="Perusahaan terpercaya"
                    />
                    <TrustItem
                        icon={ShieldCheck}
                        value="Terverifikasi"
                        label="Data dan perusahaan disaring"
                    />
                    <TrustItem
                        icon={Star}
                        value={formatCount(stats.total_candidates)}
                        label="Talenta sudah bergabung"
                    />
                </div>
            </section>

            <section aria-labelledby="latest-jobs-heading" className="bg-white">
                <div className="mx-auto max-w-[1320px] px-5 py-12 sm:px-8 sm:py-16 lg:px-10">
                    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                        <div>
                            <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">
                                Peluang terbaru
                            </p>
                            <h2
                                id="latest-jobs-heading"
                                className="mt-2 text-2xl leading-8 font-bold tracking-[-0.035em] text-heading sm:text-3xl"
                            >
                                Lowongan Terbaru
                            </h2>
                            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                                Temukan posisi yang sesuai dengan langkah
                                kariermu dari perusahaan terbaik.
                            </p>
                        </div>
                        <Link
                            href={jobsIndex.url()}
                            className="inline-flex min-h-10 items-center gap-2 self-start rounded-full border border-primary/25 px-4 text-xs font-bold text-primary transition hover:bg-primary-50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none sm:self-auto"
                        >
                            Lihat semua lowongan
                            <ArrowRight aria-hidden="true" className="size-4" />
                        </Link>
                    </div>

                    <div
                        className="-mx-1 mt-7 flex flex-nowrap gap-2 overflow-x-auto px-1 pb-1"
                        role="tablist"
                        aria-label="Filter lowongan"
                    >
                        {(
                            [
                                'Semua',
                                'Terbaru',
                                'Remote',
                                'Gaji Tertinggi',
                            ] as JobTab[]
                        ).map((tab) => (
                            <button
                                key={tab}
                                type="button"
                                role="tab"
                                aria-selected={activeTab === tab}
                                onClick={() => setActiveTab(tab)}
                                className={
                                    activeTab === tab
                                        ? 'min-h-9 shrink-0 rounded-full border border-primary bg-primary px-4 text-xs font-semibold text-white shadow-md shadow-primary/20 transition duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none'
                                        : 'min-h-9 shrink-0 rounded-full border border-border bg-white px-4 text-xs font-semibold text-text transition duration-200 hover:border-primary/40 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none'
                                }
                            >
                                {tab}
                            </button>
                        ))}
                        <span className="ml-auto hidden items-center gap-1.5 self-center text-xs text-muted-foreground sm:inline-flex">
                            <CheckCircle2 className="size-3.5 text-brand-green" />
                            {visibleJobs.length} posisi tersedia
                        </span>
                    </div>

                    {visibleJobs.length > 0 ? (
                        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {visibleJobs.map((job) => (
                                <JobCard key={job.slug} job={job} />
                            ))}
                        </div>
                    ) : (
                        <div className="mt-6 rounded-2xl border border-dashed border-primary/30 bg-background-soft px-6 py-16 text-center">
                            <Search
                                aria-hidden="true"
                                className="mx-auto size-8 text-primary"
                            />
                            <h3 className="mt-4 text-lg font-bold text-heading">
                                Belum ada lowongan di filter ini
                            </h3>
                            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                                Coba pilih kategori lain atau lihat semua
                                lowongan yang tersedia.
                            </p>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
