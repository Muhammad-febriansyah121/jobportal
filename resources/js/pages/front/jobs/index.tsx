import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowUpDown,
    BadgeCheck,
    BriefcaseBusiness,
    Building2,
    ChevronDown,
    Clock,
    Link2,
    MapPin,
    Search,
    SlidersHorizontal,
    Sparkles,
    Wallet,
    X,
} from 'lucide-react';
import { useState } from 'react';
import HomeLayout from '@/layouts/front/home-layout';
import { cn } from '@/lib/utils';
import { index as jobsIndex, show as jobShow } from '@/routes/jobs';

type JobItem = {
    id: number;
    slug: string;
    title: string;
    is_anonymous: boolean;
    company: string | null;
    company_verified: boolean;
    location: string;
    work_mode: string;
    job_type: string;
    experience_level: string;
    salary_range: string;
    published_at: string | null;
    is_saved: boolean;
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

const workModeOptions = [
    { value: '', label: 'Semua mode kerja' },
    { value: 'remote', label: 'Remote' },
    { value: 'hybrid', label: 'Hybrid' },
    { value: 'onsite', label: 'Onsite' },
];

const jobTypeOptions = [
    { value: '', label: 'Semua tipe kerja' },
    { value: 'full_time', label: 'Full Time' },
    { value: 'part_time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'internship', label: 'Internship' },
    { value: 'freelance', label: 'Freelance' },
];

const levelOptions = [
    { value: '', label: 'Semua level' },
    { value: 'entry', label: 'Entry Level' },
    { value: 'mid', label: 'Mid Level' },
    { value: 'senior', label: 'Senior Level' },
    { value: 'lead', label: 'Lead' },
    { value: 'manager', label: 'Manager' },
];

const sortOptions = [
    { value: 'relevance', label: 'Paling Relevan' },
    { value: 'salary_high', label: 'Gaji Tertinggi' },
];

const workModeStyle: Record<string, string> = {
    Remote: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Hybrid: 'bg-sky-50 text-sky-700 border-sky-200',
    Onsite: 'bg-slate-100 text-slate-600 border-slate-200',
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
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-sm transition outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                    inputMode="numeric"
                    placeholder="10.000.000"
                    value={amount ? new Intl.NumberFormat('id-ID').format(amount) : ''}
                    onChange={(e) => setAmount(onlyDigits(e.target.value))}
                />
            </div>
        </>
    );
}

export default function FrontJobsIndex({ filters, jobs }: JobsPageProps) {
    const [heroSearch, setHeroSearch] = useState(filters.search);

    const showingLabel =
        jobs.from && jobs.to
            ? `${jobs.from}–${jobs.to} dari ${jobs.total} lowongan`
            : `${jobs.data.length} lowongan`;

    const activeFilterCount = [
        filters.search,
        filters.location,
        filters.work_mode,
        filters.job_type,
        filters.experience_level,
        filters.salary_min,
    ].filter(Boolean).length;

    const activeFilterChips = [
        filters.search && { key: 'search', label: `"${filters.search}"` },
        filters.location && { key: 'location', label: filters.location },
        filters.work_mode && { key: 'work_mode', label: workModeOptions.find((o) => o.value === filters.work_mode)?.label ?? filters.work_mode },
        filters.job_type && { key: 'job_type', label: jobTypeOptions.find((o) => o.value === filters.job_type)?.label ?? filters.job_type },
        filters.experience_level && { key: 'experience_level', label: levelOptions.find((o) => o.value === filters.experience_level)?.label ?? filters.experience_level },
        filters.salary_min && { key: 'salary_min', label: `Min ${formatRupiah(filters.salary_min)}` },
    ].filter(Boolean) as { key: string; label: string }[];

    const removeFilter = (key: string) => {
        router.get(jobsIndex().url, { ...filters, [key]: '', sort: filters.sort }, { preserveScroll: true, preserveState: true });
    };

    return (
        <HomeLayout>
            <Head title="Lowongan Kerja" />

            {/* Hero */}
            <section className="relative overflow-hidden bg-white pt-20 pb-12 text-center">
                <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary-500/10 blur-3xl" />
                <div className="relative mx-auto max-w-3xl px-4">
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-xs font-semibold text-primary-600">
                        <Sparkles className="size-3.5" />
                        {jobs.total.toLocaleString('id-ID')}+ Lowongan Aktif
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                        Temukan Pekerjaan{' '}
                        <span className="text-primary-600">Impianmu</span>
                    </h1>
                    <p className="mt-4 text-base text-slate-500">
                        Ribuan lowongan dari perusahaan terpercaya. Gunakan filter pintar untuk menemukan yang paling sesuai.
                    </p>
                    <form
                        className="mt-8 flex gap-2"
                        onSubmit={(e) => {
                            e.preventDefault();
                            router.get(jobsIndex().url, { ...filters, search: heroSearch }, { preserveScroll: true, preserveState: true });
                        }}
                    >
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
                            <input
                                className="h-12 w-full rounded-xl border border-slate-200 bg-white pr-4 pl-10 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-200"
                                onChange={(e) => setHeroSearch(e.target.value)}
                                placeholder="Cari jabatan, perusahaan, atau skill..."
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

            {/* Main content */}
            <section className="bg-[#f5f6f8] px-4 py-8">
                <div className="mx-auto max-w-6xl">
                    <div className="grid gap-6 lg:grid-cols-[270px_1fr]">

                        {/* ── Sidebar ── */}
                        <aside className="lg:sticky lg:top-6 lg:self-start">
                            <form
                                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    const formData = new FormData(event.currentTarget);
                                    router.get(jobsIndex().url, Object.fromEntries(formData.entries()), { preserveScroll: true, preserveState: true });
                                }}
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between bg-slate-50 px-5 py-3.5 border-b border-slate-100">
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
 e.preventDefault(); router.get(jobsIndex().url); 
}}
                                            type="button"
                                        >
                                            Reset semua
                                        </button>
                                    )}
                                </div>

                                <div className="divide-y divide-slate-100">
                                    {/* Keyword */}
                                    <div className="p-4">
                                        <p className="mb-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase">Kata kunci</p>
                                        <div className="relative">
                                            <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-400" />
                                            <input
                                                className="h-10 w-full rounded-lg border border-slate-200 bg-white pr-3 pl-8 text-sm transition outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                                                defaultValue={filters.search}
                                                name="search"
                                                placeholder="Backend, UI/UX, data..."
                                                type="text"
                                            />
                                        </div>
                                    </div>

                                    {/* Lokasi */}
                                    <div className="p-4">
                                        <p className="mb-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase">Lokasi</p>
                                        <div className="relative">
                                            <MapPin className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-400" />
                                            <input
                                                className="h-10 w-full rounded-lg border border-slate-200 bg-white pr-3 pl-8 text-sm transition outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                                                defaultValue={filters.location}
                                                name="location"
                                                placeholder="Jakarta, Bandung..."
                                                type="text"
                                            />
                                        </div>
                                    </div>

                                    {/* Selects */}
                                    <div className="space-y-3 p-4">
                                        <FilterSelect defaultValue={filters.work_mode} label="Mode kerja" name="work_mode" options={workModeOptions} />
                                        <FilterSelect defaultValue={filters.job_type} label="Tipe kerja" name="job_type" options={jobTypeOptions} />
                                        <FilterSelect defaultValue={filters.experience_level} label="Level" name="experience_level" options={levelOptions} />
                                    </div>

                                    {/* Salary */}
                                    <div className="p-4">
                                        <p className="mb-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase">Gaji minimum</p>
                                        <RupiahFilterInput defaultValue={filters.salary_min} />
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

                        {/* ── Job list ── */}
                        <div className="space-y-4">
                            {/* Toolbar */}
                            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                                <p className="text-sm font-medium text-slate-500">
                                    Menampilkan <span className="font-bold text-slate-800">{showingLabel}</span>
                                </p>
                                <form>
                                    <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-500 cursor-pointer hover:border-primary-300 transition">
                                        <ArrowUpDown className="size-3.5 text-slate-400" />
                                        <select
                                            className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
                                            defaultValue={filters.sort}
                                            name="sort"
                                            onChange={(e) => router.get(jobsIndex().url, { ...filters, sort: e.target.value }, { preserveScroll: true, preserveState: true })}
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

                            {/* Cards */}
                            {jobs.data.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-14 text-center shadow-sm">
                                    <BriefcaseBusiness className="mx-auto size-10 text-slate-300" />
                                    <p className="mt-4 text-base font-semibold text-slate-700">Lowongan tidak ditemukan</p>
                                    <p className="mt-1 text-sm text-slate-400">Coba ubah keyword atau longgarkan filter.</p>
                                    <button
                                        onClick={() => router.get(jobsIndex().url)}
                                        className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-primary-300 hover:text-primary-600"
                                    >
                                        <X className="size-3.5" />
                                        Reset filter
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {jobs.data.map((job) => <JobCard job={job} key={job.id} />)}
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
                                                link.url === null && 'pointer-events-none opacity-40',
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
                </div>
            </section>
        </HomeLayout>
    );
}

function JobCard({ job }: { job: JobItem }) {
    const initials = companyInitials(job.company);
    const colorClass = avatarColor(job.company);
    const workModeClass = workModeStyle[job.work_mode] ?? 'bg-slate-100 text-slate-600 border-slate-200';
    const [shareState, setShareState] = useState<'idle' | 'copied'>('idle');

    const handleShare = async (): Promise<void> => {
        if (typeof window === 'undefined') {
            return;
        }

        const shareUrl = new URL(jobShow(job.slug).url, window.location.origin).toString();

        if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
            try {
                await navigator.share({
                    title: `${job.title} - ${job.company ?? 'Karivia'}`,
                    text: `Lihat lowongan ${job.title} di ${job.company ?? 'Karivia'}.`,
                    url: shareUrl,
                });

                return;
            } catch (error) {
                if (error instanceof DOMException && error.name === 'AbortError') {
                    return;
                }
            }
        }

        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(shareUrl);
            setShareState('copied');

            window.setTimeout(() => {
                setShareState('idle');
            }, 2000);
        }
    };

    return (
        <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:border-primary-200 hover:shadow-md">
            {/* Left accent bar on hover */}
            <div className="absolute top-0 left-0 h-full w-1 bg-primary-600 opacity-0 transition-opacity duration-200 group-hover:opacity-100 rounded-l-2xl" />

            <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center">
                {/* Company avatar */}
                <div className={cn('hidden shrink-0 size-12 items-center justify-center rounded-xl text-sm font-bold md:flex', colorClass)}>
                    {initials}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            href={jobShow(job.slug)}
                            className="text-base font-bold text-slate-900 transition group-hover:text-primary-600"
                        >
                            {job.title}
                        </Link>
                        {!job.is_anonymous && job.company_verified && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                                <BadgeCheck className="size-3" />
                                Verified
                            </span>
                        )}
                    </div>

                    <p className="flex items-center gap-1.5 text-sm text-slate-500">
                        <Building2 className="size-3.5 shrink-0 text-slate-400" />
                        {job.is_anonymous ? (
                            <span className="inline-flex items-center gap-1">
                                <span className="text-slate-400 italic">Perusahaan Anonim</span>
                                <span className="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">Anonim</span>
                            </span>
                        ) : (job.company ?? 'Perusahaan')}
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                        <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold', workModeClass)}>
                            {job.work_mode}
                        </span>
                        <Chip icon={BriefcaseBusiness}>{job.job_type}</Chip>
                        <Chip icon={MapPin}>{job.location || 'Indonesia'}</Chip>
                        <Chip icon={BadgeCheck}>{job.experience_level}</Chip>
                    </div>
                </div>

                {/* Right: salary + meta + CTA */}
                <div className="flex shrink-0 flex-row items-center justify-between gap-4 md:flex-col md:items-end">
                    <div className="text-right">
                        <p className="text-sm font-bold text-primary-600">
                            {job.salary_range}
                        </p>
                        <p className="mt-0.5 flex items-center justify-end gap-1 text-[11px] text-slate-400">
                            <Clock className="size-3" />
                            {job.published_at ?? 'Baru'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => void handleShare()}
                            className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-primary-300 hover:text-primary-600"
                        >
                            <Link2 className="size-3.5" />
                            {shareState === 'copied' ? 'Link Tersalin' : 'Bagikan'}
                        </button>
                        <Link
                            className="inline-flex h-9 shrink-0 items-center justify-center rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
                            href={jobShow(job.slug)}
                        >
                            Lihat Detail
                        </Link>
                    </div>
                </div>
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
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{label}</span>
            <select
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm transition outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                defaultValue={defaultValue}
                name={name}
            >
                {options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
        </label>
    );
}

function Chip({ children, icon: Icon }: { children: React.ReactNode; icon: React.ComponentType<{ className?: string }> }) {
    return (
        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] text-slate-500">
            <Icon className="size-3 shrink-0" />
            {children}
        </span>
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
