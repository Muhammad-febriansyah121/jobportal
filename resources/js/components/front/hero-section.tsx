import { Link, router } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowRight,
    Bookmark,
    BriefcaseBusiness,
    Building2,
    CheckCircle2,
    Clock3,
    Flame,
    Gift,
    GraduationCap,
    MapPin,
    Search,
    ShieldCheck,
    Star,
    Sparkles,
    Users,
    Wallet,
    Wifi,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { index as jobsIndex, show as jobShow } from '@/routes/jobs';
import { show as scrapedJobShow } from '@/routes/jobs/scraped';

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
    published_at?: string | null;
    is_saved: boolean;
    is_scraped?: boolean;
    source_url?: string | null;
    source_platform?: string | null;
};

type HeroSectionProps = {
    jobs: JobPreview[];
    scrapedJobs: JobPreview[];
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
    { label: 'Butuh cepat', query: 'terbaru', icon: Clock3 },
    { label: 'Top perusahaan', query: 'perusahaan', icon: Star },
    { label: 'Kerja remote', query: 'remote', icon: Wifi },
    { label: 'Fresh graduate', query: 'fresh graduate', icon: GraduationCap },
    { label: 'Pelamar sedikit', query: 'pelamar sedikit', icon: Users },
    { label: 'Gaji tinggi', query: 'gaji tinggi', icon: Wallet },
];

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
        <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-primary-100 bg-primary-50">
            {job.company_logo ? (
                <img
                    src={job.company_logo}
                    alt=""
                    loading="lazy"
                    className="size-full object-contain p-2"
                />
            ) : (
                <span className="text-sm font-bold tracking-tight text-primary">
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

    const cardContent = (
        <>
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
                            <Flame aria-hidden="true" className="size-3.5" />
                        ) : (
                            <Sparkles aria-hidden="true" className="size-3.5" />
                        )}
                        {job.is_urgent
                            ? 'Loker Butuh Cepat'
                            : 'Lowongan Terbaru'}
                    </span>
                </div>
                <Bookmark
                    aria-hidden="true"
                    className={
                        job.is_saved
                            ? 'size-5 shrink-0 fill-primary text-primary'
                            : 'size-5 shrink-0 text-slate-300 transition-colors group-hover:text-primary'
                    }
                />
            </div>

            <div className="mt-4 flex min-w-0 items-start gap-3.5">
                <CompanyMark job={job} />
                <div className="min-w-0 pt-0.5">
                    <h3 className="line-clamp-2 text-[17px] leading-[1.15] font-bold tracking-[-0.02em] text-heading transition-colors group-hover:text-primary">
                        {job.title}
                    </h3>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                        {companyName}
                    </p>
                </div>
            </div>

            <div className="mt-5 space-y-3 rounded-xl border border-slate-100 bg-slate-50/65 px-3.5 py-3 text-sm text-muted-foreground">
                <p className="flex items-center gap-2 truncate">
                    <BriefcaseBusiness className="size-4 shrink-0 text-primary" />
                    <span className="font-semibold text-primary">
                        {job.type || 'Full-time'}
                    </span>
                </p>
                <p className="flex items-center gap-2 truncate">
                    <MapPin className="size-4 shrink-0 text-slate-500" />
                    <span className="truncate">
                        {job.work_mode || 'On-site'} ·{' '}
                        {job.location || 'Lokasi fleksibel'}
                    </span>
                </p>
                <p className="flex items-center gap-2 truncate">
                    <Wallet className="size-4 shrink-0 text-slate-500" />
                    <span className="font-semibold text-slate-700">
                        {job.salary || 'Negotiable'}
                    </span>
                </p>
            </div>

            <div className="mt-auto flex items-center gap-1.5 border-t border-border bg-slate-50/60 px-0 py-3 text-xs text-muted-foreground">
                <Clock3 className="size-3.5" />
                <span>{job.published_at || 'Baru diposting'}</span>
            </div>
        </>
    );

    const cardClassName =
        'group relative flex min-h-[330px] flex-col overflow-hidden rounded-[20px] border border-slate-200 bg-white px-5 pt-5 transition duration-200 hover:-translate-y-1 hover:border-primary-200 hover:shadow-[0_18px_40px_rgba(15,76,148,0.12)] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none';

    if (job.is_scraped) {
        return (
            <Link href={scrapedJobShow.url(job.id)} className={cardClassName}>
                {cardContent}
            </Link>
        );
    }

    return (
        <Link href={jobShow.url(job.slug)} className={cardClassName}>
            {cardContent}
        </Link>
    );
}

export default function HeroSection({
    jobs,
    scrapedJobs,
    stats,
    industries,
}: HeroSectionProps) {
    const [query, setQuery] = useState('');
    const [location, setLocation] = useState('');
    const [activeTab, setActiveTab] = useState<JobTab>('Semua');
    const [visibleCount, setVisibleCount] = useState(12);

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

    const sourceJobs = useMemo(() => {
        const seen = new Set<string>();

        return [...scrapedJobs, ...jobs].filter((job) => {
            if (seen.has(job.slug)) {
                return false;
            }

            seen.add(job.slug);

            return true;
        });
    }, [jobs, scrapedJobs]);

    const filteredJobs = useMemo(() => {
        const filtered =
            activeTab === 'Remote'
                ? sourceJobs.filter(
                      (job) => job.work_mode.toLowerCase() === 'remote',
                  )
                : sourceJobs;

        if (activeTab === 'Gaji Tertinggi') {
            return [...filtered].sort(
                (a, b) => salaryValue(b.salary) - salaryValue(a.salary),
            );
        }

        return filtered;
    }, [activeTab, sourceJobs]);

    const visibleJobs = filteredJobs.slice(0, visibleCount);
    const remainingJobs = filteredJobs.length - visibleJobs.length;

    return (
        <>
            <section className="relative isolate overflow-hidden border-b border-primary-100 bg-[#f7fbff] text-heading">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.98),rgba(239,247,255,0.62)_58%,rgba(222,237,255,0.7))]"
                />
                <img
                    src="/images/karivia-dot-pattern.png"
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute top-28 right-6 hidden w-36 opacity-30 mix-blend-multiply lg:block"
                />
                <img
                    src="/images/karivia-wave.png"
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-28 -left-56 w-[760px] max-w-none opacity-60 sm:-left-36 lg:-bottom-40 lg:-left-28 lg:w-[920px]"
                />
                <img
                    src="/images/karivia-wave.png"
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-72 bottom-[-210px] hidden w-[780px] max-w-none -rotate-[12deg] opacity-50 lg:block"
                />
                <img
                    src="/images/karivia-buildings.png"
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute right-[-1%] bottom-0 hidden w-[21vw] max-w-[390px] min-w-[280px] object-contain object-bottom lg:block"
                />

                <div className="relative z-10 mx-auto flex min-h-[650px] max-w-[1440px] flex-col items-center px-4 pt-28 pb-14 text-center sm:px-6 lg:pt-32">
                    <div className="absolute top-32 left-4 hidden w-48 text-left 2xl:left-12 2xl:block 2xl:w-56">
                        <img
                            src="/images/karivia-jobs-stat-card.png"
                            alt={`${stats.active_jobs.toLocaleString('id-ID')} lowongan tersedia`}
                            className="h-[108px] w-full object-cover object-center"
                        />
                    </div>

                    <div className="absolute top-24 right-5 hidden h-44 w-52 text-left drop-shadow-[0_18px_30px_rgba(70,125,209,0.16)] xl:block 2xl:right-12 2xl:w-56">
                        <svg
                            aria-hidden="true"
                            viewBox="0 0 240 160"
                            className="absolute inset-0 size-full"
                            preserveAspectRatio="none"
                        >
                            <path
                                d="M38 8h164c18 0 30 12 30 30v60c0 18-12 30-30 30h-61c-4 0-7 2-9 6l-10 16c-3 4-8 4-11-1l-7-15c-2-4-5-6-9-6H38c-18 0-30-12-30-30V38C8 20 20 8 38 8Z"
                                fill="white"
                                fillOpacity="0.78"
                            />
                        </svg>
                        <div className="relative z-10 px-7 pt-10 text-center">
                            <span className="mx-auto mb-2 block h-0.5 w-8 bg-primary" />
                            <p className="text-sm leading-6 font-medium text-[#51698f]">
                                Kesempatan lebih luas untuk masa depanmu.
                            </p>
                        </div>
                    </div>

                    <div className="absolute bottom-20 left-5 hidden h-44 w-52 text-left drop-shadow-[0_18px_30px_rgba(70,125,209,0.16)] xl:left-12 xl:block 2xl:left-12 2xl:w-56">
                        <svg
                            aria-hidden="true"
                            viewBox="0 0 240 160"
                            className="absolute inset-0 size-full"
                            preserveAspectRatio="none"
                        >
                            <path
                                d="M38 8h164c18 0 30 12 30 30v60c0 18-12 30-30 30h-61c-4 0-7 2-9 6l-10 16c-3 4-8 4-11-1l-7-15c-2-4-5-6-9-6H38c-18 0-30-12-30-30V38C8 20 20 8 38 8Z"
                                fill="white"
                                fillOpacity="0.78"
                            />
                        </svg>
                        <div className="relative z-10 px-7 pt-10 text-center">
                            <span className="mx-auto mb-2 block h-0.5 w-8 bg-primary" />
                            <p className="text-sm leading-6 font-medium text-[#51698f]">
                                Talenta hebat membangun Indonesia
                            </p>
                        </div>
                    </div>

                    <p className="text-[11px] font-semibold tracking-[0.2em] text-primary uppercase sm:text-xs">
                        Karir lebih dekat, masa depan lebih cerah
                    </p>
                    <h1 className="mt-4 max-w-4xl text-4xl leading-[1.02] font-bold tracking-[-0.06em] text-[#10275d] sm:text-5xl lg:text-7xl">
                        <span className="block">Temukan Karir Impianmu</span>
                        <span className="mt-4 block bg-gradient-to-r from-[#1476ff] via-[#1765df] to-[#1b8cff] bg-clip-text pb-2 leading-[1.1] text-transparent">
                            #BarengKarivia
                        </span>
                    </h1>
                    <p className="mt-5 max-w-2xl text-sm leading-6 text-[#64779d] sm:text-base">
                        Akses ribuan lowongan dari perusahaan terpercaya di
                        seluruh Indonesia.
                        <br className="hidden sm:block" />
                        Karir yang lebih baik, dimulai dari sini.
                    </p>

                    <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-[#2f4e86] sm:text-sm">
                        <span className="inline-flex items-center gap-1.5">
                            <ShieldCheck className="size-4 text-primary" />
                            Data terenkripsi
                        </span>
                        <span aria-hidden="true" className="text-[#91a6cc]">
                            |
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <Building2 className="size-4 text-primary" />
                            Perusahaan terverifikasi
                        </span>
                        <span aria-hidden="true" className="text-[#91a6cc]">
                            |
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <Star className="size-4 fill-primary text-primary" />
                            4.8 rating pengguna
                        </span>
                        <span aria-hidden="true" className="text-[#91a6cc]">
                            |
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <Gift className="size-4 text-primary" />
                            Gratis untuk kandidat
                        </span>
                    </div>

                    <form
                        onSubmit={submitSearch}
                        className="mt-8 flex w-full max-w-4xl flex-col gap-2 rounded-[22px] border border-white bg-white/95 p-2 shadow-[0_18px_55px_rgba(53,118,216,0.2)] backdrop-blur sm:flex-row sm:items-center"
                    >
                        <label className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-xl px-3 text-left focus-within:bg-primary-50">
                            <span className="sr-only">
                                Posisi, skill, atau perusahaan
                            </span>
                            <Search
                                className="size-5 shrink-0 text-[#10275d]"
                                aria-hidden="true"
                            />
                            <input
                                value={query}
                                onChange={(event) =>
                                    setQuery(event.target.value)
                                }
                                placeholder="Posisi, skill, atau perusahaan..."
                                className="min-w-0 flex-1 border-0 bg-transparent text-sm text-heading outline-none placeholder:text-[#8a9bb9] focus:ring-0"
                            />
                        </label>
                        <span
                            aria-hidden="true"
                            className="hidden h-7 w-px bg-border sm:block"
                        />
                        <label className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-xl px-3 text-left focus-within:bg-primary-50 sm:max-w-[15rem]">
                            <span className="sr-only">Kota atau lokasi</span>
                            <MapPin
                                className="size-5 shrink-0 text-[#10275d]"
                                aria-hidden="true"
                            />
                            <select
                                value={location}
                                onChange={(event) =>
                                    setLocation(event.target.value)
                                }
                                aria-label="Pilih lokasi pekerjaan"
                                className="w-full min-w-0 border-0 bg-transparent text-sm text-heading outline-none focus:ring-0"
                            >
                                <option value="">Kota atau Remote...</option>
                                <option value="Jakarta">Jakarta</option>
                                <option value="Bandung">Bandung</option>
                                <option value="Surabaya">Surabaya</option>
                                <option value="Remote">Remote</option>
                            </select>
                        </label>
                        <button
                            type="submit"
                            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-7 text-sm font-bold text-white shadow-md shadow-primary/30 transition duration-200 hover:-translate-y-0.5 hover:bg-primary-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
                        >
                            <Search className="size-4" aria-hidden="true" />
                            Temukan Lowongan
                        </button>
                    </form>

                    <div className="mt-6 flex w-full flex-nowrap items-center justify-start gap-2 overflow-x-auto px-1 pb-1 lg:justify-center">
                        {quickSearches.map((item) => {
                            const Icon = item.icon;

                            return (
                                <button
                                    key={item.label}
                                    type="button"
                                    onClick={() => applyQuickSearch(item.query)}
                                    className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-white bg-white/90 px-3.5 text-xs font-semibold whitespace-nowrap text-heading shadow-[0_5px_18px_rgba(49,105,192,0.1)] transition duration-200 hover:-translate-y-0.5 hover:bg-white focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
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

            <section aria-labelledby="latest-jobs-heading" className="bg-white">
                <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 lg:py-16">
                    <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
                        <div>
                            <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.16em] text-primary uppercase">
                                <span className="h-px w-8 bg-primary" />
                                Pilihan terbaru
                            </div>
                            <h2
                                id="latest-jobs-heading"
                                className="mt-3 text-3xl leading-tight font-bold tracking-[-0.045em] text-heading sm:text-4xl"
                            >
                                Lowongan Terbaru
                            </h2>
                            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                                Posisi terbaru dari perusahaan terpercaya di
                                seluruh Indonesia.
                            </p>
                        </div>
                        <Link
                            href={jobsIndex.url()}
                            className="inline-flex min-h-11 items-center gap-2 self-start rounded-full border border-primary-200 bg-white px-4 text-xs font-bold text-primary transition duration-200 hover:border-primary hover:bg-primary-50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none sm:self-auto"
                        >
                            Lihat semua lowongan
                            <ArrowRight className="size-4" aria-hidden="true" />
                        </Link>
                    </div>

                    <div
                        className="mt-7 flex flex-nowrap gap-2 overflow-x-auto pb-1"
                        aria-label="Kategori lowongan"
                    >
                        <button
                            type="button"
                            onClick={() => router.get(jobsIndex.url())}
                            className="inline-flex min-h-10 shrink-0 items-center rounded-full bg-primary px-4 text-xs font-bold text-white shadow-sm transition hover:bg-primary-700 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                        >
                            Semua
                        </button>
                        {industries.map((industry) => (
                            <button
                                key={industry.id}
                                type="button"
                                onClick={() =>
                                    router.get(jobsIndex.url(), {
                                        industry_id: industry.id,
                                    })
                                }
                                className="inline-flex min-h-10 shrink-0 items-center rounded-full border border-border bg-white px-4 text-xs font-semibold text-heading transition hover:border-primary-300 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                            >
                                {industry.name}
                            </button>
                        ))}
                    </div>

                    <div
                        className="mt-4 flex flex-wrap items-center gap-2"
                        role="tablist"
                        aria-label="Urutkan lowongan"
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
                                onClick={() => {
                                    setActiveTab(tab);
                                    setVisibleCount(12);
                                }}
                                className={
                                    activeTab === tab
                                        ? 'inline-flex min-h-11 items-center rounded-full bg-heading px-4 text-xs font-bold text-white shadow-sm transition duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none'
                                        : 'inline-flex min-h-11 items-center rounded-full border border-primary-100 bg-white px-4 text-xs font-semibold text-muted-foreground transition duration-200 hover:border-primary-300 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none'
                                }
                            >
                                {tab}
                            </button>
                        ))}
                        <span className="ml-auto hidden items-center gap-1.5 text-xs font-semibold text-muted-foreground sm:inline-flex">
                            <CheckCircle2
                                className="size-4 text-emerald-500"
                                aria-hidden="true"
                            />
                            {filteredJobs.length} posisi tersedia
                        </span>
                    </div>

                    {visibleJobs.length > 0 ? (
                        <>
                            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {visibleJobs.map((job) => (
                                    <JobCard key={job.slug} job={job} />
                                ))}
                            </div>
                            {remainingJobs > 0 && (
                                <div className="mt-8 flex justify-center">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setVisibleCount((count) =>
                                                Math.min(
                                                    count + 4,
                                                    filteredJobs.length,
                                                ),
                                            )
                                        }
                                        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-primary-200 bg-white px-5 text-sm font-bold text-primary transition hover:border-primary hover:bg-primary-50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                                    >
                                        Muat {Math.min(4, remainingJobs)}
                                        lowongan lagi
                                        <ArrowDown
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="mt-6 rounded-2xl border border-dashed border-primary-200 bg-white px-6 py-16 text-center">
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
