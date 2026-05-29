import { Deferred, Head, Link, router } from '@inertiajs/react';
import {
    BadgeCheck,
    Banknote,
    BrainCircuit,
    Check,
    Bookmark,
    BookmarkCheck,
    BriefcaseBusiness,
    CalendarCheck,
    ChevronsUpDown,
    Clock3,
    Eye,
    GraduationCap,
    Gauge,
    Info,
    ListFilter,
    MapPin,
    MessageCircle,
    SlidersHorizontal,
    Sparkles,
    Target,
    UserCheck,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { useInitials } from '@/hooks/use-initials';
import { useTranslate } from '@/hooks/use-translate';
import { formatAvailability } from '@/lib/availability';
import { cn } from '@/lib/utils';
import { index as talentPoolIndex } from '@/routes/employer/talent-pool';
import {
    contact as talentSearchContact,
    index as talentSearchIndex,
    save as talentSearchSave,
    show as talentSearchShow,
    shortlist as talentSearchShortlist,
    unsave as talentSearchUnsave,
    unshortlist as talentSearchUnshortlist,
} from '@/routes/employer/talent-search';

type Option = {
    value: string;
    label: string;
};

type TalentCandidate = {
    id: number;
    name: string;
    avatar_url: string | null;
    headline: string;
    location: string;
    salary_range: string;
    max_years_exp: number;
    availability: string;
    work_mode_pref: string;
    profile_completion: number;
    company_applications_count: number;
    match_score: number;
    match_source: 'ai' | 'ai_match_score' | 'computed';
    match_reason: string | null;
    score_breakdown: Array<{
        label: string;
        weight: number;
        raw_pct: number;
    }> | null;
    is_saved: boolean;
    is_shortlisted: boolean;
    conversation_id: number | null;
    skills: Array<{
        name: string;
        years_exp: number | null;
        verified: boolean;
    }>;
    experiences: Array<{
        job_title: string | null;
        company_name: string | null;
        start_date: string | null;
        end_date: string | null;
        is_current: boolean;
    }>;
    educations: Array<{
        institution: string | null;
        degree: string | null;
        field_of_study: string | null;
        end_year: number | null;
    }>;
};

type TalentSearchProps = {
    company: {
        id: number;
        name: string;
    } | null;
    filters: {
        q?: string;
        skill_id?: string;
        location?: string;
        salary?: string;
        experience?: string;
        availability?: string;
        sort?: string;
        saved_only?: string;
        pool?: 'all' | 'saved' | 'shortlisted';
    };
    filterOptions: {
        skills: Option[];
        locations: Option[];
    };
    aiSuggestions: string[];
    recommendationSource: 'ai' | 'computed';
    aiRerankedCandidates?: TalentCandidate[] | null;
    candidates: {
        data: TalentCandidate[];
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
        total: number;
        from: number | null;
        to: number | null;
    };
    totalCandidates: number;
    savedCandidatesCount: number;
    shortlistedCount: number;
    poolTotalCount: number;
    viewMode: 'all' | 'saved';
};

type FilterField =
    | 'skill_id'
    | 'location'
    | 'salary'
    | 'experience'
    | 'availability';

const salaryOptions: Option[] = [
    { value: '', label: 'Gaji Ekspektasi' },
    { value: 'under_10', label: '< Rp10 jt' },
    { value: '10_20', label: 'Rp10-20 jt' },
    { value: '20_35', label: 'Rp20-35 jt' },
    { value: 'above_35', label: '> Rp35 jt' },
];

const experienceOptions: Option[] = [
    { value: '', label: 'Pengalaman' },
    { value: '0_2', label: '0-2 tahun' },
    { value: '3_5', label: '3-5 tahun' },
    { value: '6_plus', label: '6+ tahun' },
];

const availabilityOptions: Option[] = [
    { value: '', label: 'Ketersediaan' },
    { value: 'none', label: 'Siap mulai sekarang' },
    { value: 'lt_1_month', label: 'Kurang dari 1 bulan' },
    { value: '1_month', label: '1 Bulan' },
    { value: '2_months', label: '2 Bulan' },
    { value: 'gt_2_months', label: 'Lebih dari 2 bulan' },
];

export default function EmployerTalentSearch({
    filters,
    filterOptions,
    aiSuggestions,
    recommendationSource,
    aiRerankedCandidates,
    candidates,
    totalCandidates,
    savedCandidatesCount,
    shortlistedCount,
    poolTotalCount,
    viewMode,
}: TalentSearchProps) {
    const { t } = useTranslate();
    const formRef = useRef<HTMLFormElement>(null);
    const listingRoute =
        viewMode === 'saved' ? talentPoolIndex : talentSearchIndex;

    const hasActiveAiFilter =
        (filters.q ?? '') !== '' ||
        (filters.skill_id ?? '') !== '' ||
        (filters.location ?? '') !== '' ||
        (filters.salary ?? '') !== '' ||
        (filters.experience ?? '') !== '' ||
        (filters.availability ?? '') !== '';

    const displayCandidates =
        aiRerankedCandidates && aiRerankedCandidates.length > 0
            ? aiRerankedCandidates
            : candidates.data;

    const effectiveSource: 'ai' | 'computed' =
        aiRerankedCandidates && aiRerankedCandidates.length > 0
            ? 'ai'
            : recommendationSource;
    const currentQuery = {
        q: filters.q ?? '',
        skill_id: filters.skill_id ?? '',
        location: filters.location ?? '',
        salary: filters.salary ?? '',
        experience: filters.experience ?? '',
        availability: filters.availability ?? '',
        sort: filters.sort ?? 'match',
        pool: filters.pool ?? 'all',
    };

    function buildPayload(
        form: HTMLFormElement,
        override?: { field: FilterField; value: string },
    ) {
        const formData = new FormData(form);

        const payload = {
            q: formData.get('q')?.toString() ?? '',
            skill_id: formData.get('skill_id')?.toString() ?? '',
            location: formData.get('location')?.toString() ?? '',
            salary: formData.get('salary')?.toString() ?? '',
            experience: formData.get('experience')?.toString() ?? '',
            availability: formData.get('availability')?.toString() ?? '',
            sort: formData.get('sort')?.toString() ?? 'match',
        };

        if (override) {
            payload[override.field] = override.value;
        }

        return payload;
    }

    function submitSearch(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        router.get(listingRoute(), buildPayload(event.currentTarget), {
            preserveScroll: true,
            preserveState: true,
        });
    }

    function submitFilters(field: FilterField, value: string) {
        const form = formRef.current;

        if (!form) {
            return;
        }

        router.get(listingRoute(), buildPayload(form, { field, value }), {
            preserveScroll: true,
            preserveState: true,
        });
    }

    return (
        <>
            <Head
                title={
                    viewMode === 'saved'
                        ? 'Talent Pool Employer'
                        : 'Pencarian Bakat AI'
                }
            />

            <div className="bg-zinc-50 px-4 py-8 text-zinc-950 md:px-8">
                <div className="mx-auto max-w-6xl space-y-7">
                    <section>
                        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                            {viewMode === 'saved'
                                ? 'Talent Pool'
                                : 'Pencarian Bakat AI'}
                        </h1>
                        <p className="mt-3 text-lg text-slate-600">
                            {viewMode === 'saved'
                                ? 'Kelola kandidat tersimpan untuk diproses ulang ke posisi yang lebih tepat.'
                                : 'Temukan kandidat terbaik dengan teknologi pencarian semantik bertenaga AI.'}
                        </p>
                    </section>

                    <div className="inline-flex w-full max-w-md rounded-lg border border-zinc-200 bg-white p-1 shadow-sm">
                        <Link
                            className={cn(
                                'inline-flex flex-1 items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition',
                                viewMode === 'all'
                                    ? 'bg-primary-600 text-white'
                                    : 'text-zinc-600 hover:bg-zinc-100',
                            )}
                            href={talentSearchIndex({ query: currentQuery })}
                            preserveScroll
                        >
                            {t('employer.talent_search.all_candidates')}
                        </Link>
                        <Link
                            className={cn(
                                'inline-flex flex-1 items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition',
                                viewMode === 'saved'
                                    ? 'bg-primary-600 text-white'
                                    : 'text-zinc-600 hover:bg-zinc-100',
                            )}
                            href={talentPoolIndex({ query: currentQuery })}
                            preserveScroll
                        >
                            Talent Pool ({poolTotalCount})
                        </Link>
                    </div>

                    {viewMode === 'saved' ? (
                        <div className="inline-flex flex-wrap gap-1.5">
                            {(
                                [
                                    {
                                        v: 'all',
                                        label: 'Semua',
                                        count: poolTotalCount,
                                    },
                                    {
                                        v: 'saved',
                                        label: 'Tersimpan',
                                        count: savedCandidatesCount,
                                    },
                                    {
                                        v: 'shortlisted',
                                        label: 'Shortlisted',
                                        count: shortlistedCount,
                                    },
                                ] as const
                            ).map((opt) => {
                                const active =
                                    (filters.pool ?? 'all') === opt.v;

                                return (
                                    <Link
                                        key={opt.v}
                                        href={talentPoolIndex({
                                            query: {
                                                ...currentQuery,
                                                pool: opt.v,
                                            },
                                        })}
                                        preserveScroll
                                        className={cn(
                                            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                                            active
                                                ? 'border-primary-300 bg-primary-50 text-primary-700'
                                                : 'border-zinc-200 bg-white text-zinc-600 hover:border-primary-200 hover:text-primary-700',
                                        )}
                                    >
                                        {opt.label}
                                        <span
                                            className={cn(
                                                'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold',
                                                active
                                                    ? 'bg-primary-600 text-white'
                                                    : 'bg-zinc-100 text-zinc-700',
                                            )}
                                        >
                                            {opt.count}
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : null}

                    <form
                        className="space-y-5"
                        onSubmit={submitSearch}
                        ref={formRef}
                    >
                        <div className="overflow-hidden rounded-lg border border-primary-100 bg-white shadow-sm">
                            <div className="grid lg:grid-cols-[minmax(0,1fr)_380px]">
                                <div className="relative p-5 sm:p-6">
                                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                                        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white shadow-sm">
                                            <BrainCircuit className="size-6" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-primary-50 px-3 py-1 text-[11px] font-bold tracking-wide text-primary-700 uppercase">
                                                <Sparkles className="size-3.5" />
                                                AI Talent Matching
                                            </div>
                                            <h2 className="mt-3 text-xl font-bold tracking-tight text-slate-950">
                                                Cara kerja pencarian AI
                                            </h2>
                                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                                                Tulis kebutuhan hiring seperti
                                                brief recruiter. AI membaca
                                                intensi pencarian, lalu
                                                menggabungkannya dengan filter,
                                                skill, pengalaman, lokasi,
                                                ekspektasi gaji, dan preferensi
                                                kerja kandidat.
                                            </p>

                                            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                                                <p className="text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                                                    Contoh query yang efektif
                                                </p>
                                                <p className="mt-1 text-sm font-semibold text-slate-800">
                                                    React senior Bandung, siap
                                                    WFO, 5 tahun pengalaman,
                                                    terbiasa SaaS
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-slate-200 bg-slate-50/70 lg:border-t-0 lg:border-l">
                                    <div className="divide-y divide-slate-200">
                                        <AiGuideItem
                                            icon={Target}
                                            number="01"
                                            title="Baca kebutuhan"
                                            text="AI memahami role, senioritas, skill utama, lokasi, dan konteks pekerjaan dari query."
                                        />
                                        <AiGuideItem
                                            icon={SlidersHorizontal}
                                            number="02"
                                            title="Gabungkan filter"
                                            text="Filter skill, gaji, pengalaman, dan ketersediaan tetap dipakai untuk mempersempit hasil."
                                        />
                                        <AiGuideItem
                                            icon={Gauge}
                                            number="03"
                                            title="Ranking kandidat"
                                            text="Badge AI berarti hasil diranking ulang; AUTO berarti memakai skor standar profil."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center">
                                <div className="flex min-h-12 flex-1 items-center gap-3 px-2">
                                    <div className="flex shrink-0 items-center gap-1.5">
                                        <Sparkles className="size-5 text-primary-600" />
                                        <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-bold tracking-wider text-primary-700 uppercase">
                                            AI
                                        </span>
                                    </div>
                                    <div className="mx-1 h-5 w-px bg-zinc-200" />
                                    <input
                                        className="h-12 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-slate-400"
                                        name="q"
                                        defaultValue={filters.q ?? ''}
                                        placeholder="Kandidat Java Developer Jakarta berpengalaman 5 tahun"
                                    />
                                </div>
                                <Button className="h-12 rounded-lg bg-primary-600 px-8 text-white hover:bg-primary-700">
                                    Cari
                                </Button>
                            </div>
                        </div>

                        {aiSuggestions.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-medium text-slate-400">
                                    Coba:
                                </span>
                                {aiSuggestions.map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        type="button"
                                        onClick={() =>
                                            router.get(
                                                listingRoute(),
                                                {
                                                    ...currentQuery,
                                                    q: suggestion,
                                                },
                                                {
                                                    preserveScroll: true,
                                                    preserveState: true,
                                                },
                                            )
                                        }
                                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-primary-100 bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 transition hover:border-primary-300 hover:bg-primary-100"
                                    >
                                        <Sparkles className="size-3" />
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        ) : null}

                        <div className="flex flex-wrap items-center gap-3">
                            <FilterSelect
                                label="Skill"
                                name="skill_id"
                                onValueChange={submitFilters}
                                searchable
                                value={filters.skill_id ?? ''}
                                options={[
                                    { value: '', label: 'Skill' },
                                    ...filterOptions.skills,
                                ]}
                            />
                            <FilterSelect
                                label="Lokasi"
                                name="location"
                                onValueChange={submitFilters}
                                searchable
                                value={filters.location ?? ''}
                                options={[
                                    { value: '', label: 'Lokasi' },
                                    ...filterOptions.locations,
                                ]}
                            />
                            <FilterSelect
                                label="Gaji"
                                name="salary"
                                onValueChange={submitFilters}
                                value={filters.salary ?? ''}
                                options={salaryOptions}
                            />
                            <FilterSelect
                                label="Pengalaman"
                                name="experience"
                                onValueChange={submitFilters}
                                value={filters.experience ?? ''}
                                options={experienceOptions}
                            />
                            <FilterSelect
                                label="Ketersediaan"
                                name="availability"
                                onValueChange={submitFilters}
                                value={filters.availability ?? ''}
                                options={availabilityOptions}
                            />
                            <div className="h-8 w-px bg-zinc-200" />
                            <Button
                                asChild
                                className="rounded-lg"
                                variant="secondary"
                            >
                                <Link href={listingRoute()}>
                                    {t('employer.talent_search.reset_filter')}
                                </Link>
                            </Button>
                            <input
                                type="hidden"
                                name="sort"
                                value={filters.sort ?? 'match'}
                            />
                        </div>
                    </form>

                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <p className="text-sm font-medium text-slate-500">
                            Menampilkan {candidates.from ?? 0}-
                            {candidates.to ?? 0} dari{' '}
                            {candidates.total || totalCandidates} kandidat
                            relevan
                        </p>
                        <button
                            className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600"
                            onClick={() =>
                                router.get(
                                    listingRoute(),
                                    {
                                        ...filters,
                                        sort:
                                            filters.sort === 'recent'
                                                ? 'match'
                                                : 'recent',
                                    },
                                    {
                                        preserveScroll: true,
                                        preserveState: true,
                                    },
                                )
                            }
                            type="button"
                        >
                            Urutkan:{' '}
                            {filters.sort === 'recent'
                                ? 'Terbaru'
                                : 'Paling Sesuai AI'}
                            <ListFilter className="size-4" />
                        </button>
                    </div>

                    <Deferred
                        data="aiRerankedCandidates"
                        fallback={
                            hasActiveAiFilter ? (
                                <div className="flex items-center gap-3 rounded-lg border border-primary-100 bg-primary-50 px-4 py-3.5">
                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-100">
                                        <Sparkles className="size-4 animate-pulse text-primary-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-primary-700">
                                            AI sedang menganalisis kandidat...
                                        </p>
                                        <p className="mt-0.5 text-xs text-primary-500">
                                            Menyusun ulang berdasarkan relevansi
                                            query, skill, dan pengalaman
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3.5">
                                    <SlidersHorizontal className="size-4 shrink-0 text-slate-400" />
                                    <p className="text-sm text-slate-500">
                                        Ketik query untuk mengaktifkan
                                        perankingan AI
                                    </p>
                                </div>
                            )
                        }
                    >
                        {effectiveSource === 'ai' ? (
                            <div className="flex items-center gap-3 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3.5">
                                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                                    <Sparkles className="size-4 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-emerald-800">
                                        Diurutkan oleh AI
                                    </p>
                                    <p className="mt-0.5 text-xs text-emerald-600">
                                        Kandidat disusun ulang dari kombinasi
                                        query, filter aktif, kecocokan skill,
                                        senioritas, riwayat pengalaman, lokasi,
                                        gaji, dan preferensi kerja. Gunakan skor
                                        sebagai bantuan awal, lalu validasi dari
                                        detail profil kandidat.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3.5">
                                <Info className="size-4 shrink-0 text-slate-400" />
                                <div>
                                    <p className="text-sm font-medium text-slate-600">
                                        Menggunakan skor standar
                                    </p>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        AI belum meranking ulang hasil, sehingga
                                        urutan memakai perhitungan profil,
                                        skill, pengalaman, posisi, preferensi
                                        kerja, dan industri yang tersedia.
                                    </p>
                                </div>
                            </div>
                        )}
                    </Deferred>

                    <div className="space-y-4">
                        {displayCandidates.length ? (
                            displayCandidates.map((candidate) => (
                                <CandidateCard
                                    candidate={candidate}
                                    key={candidate.id}
                                />
                            ))
                        ) : (
                            <div className="rounded-lg border border-zinc-200 bg-white p-10 text-center shadow-sm">
                                <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                    <SlidersHorizontal className="size-6" />
                                </div>
                                <h2 className="mt-4 text-lg font-semibold">
                                    Belum ada kandidat cocok
                                </h2>
                                <p className="mt-2 text-sm text-slate-500">
                                    Ubah kata kunci, skill, lokasi, atau rentang
                                    pengalaman untuk memperluas hasil.
                                </p>
                            </div>
                        )}
                    </div>

                    <Pagination links={candidates.links} />
                </div>
            </div>
        </>
    );
}

function CandidateCard({ candidate }: { candidate: TalentCandidate }) {
    const { t } = useTranslate();
    const getInitials = useInitials();
    const availabilityTone =
        candidate.availability === 'none'
            ? 'text-green-700'
            : candidate.availability
              ? 'text-secondary-700'
              : 'text-slate-600';
    const availabilityLabel = formatAvailability(candidate.availability, t);
    const scoreTone =
        candidate.match_score >= 70
            ? {
                  ring: 'border-emerald-200 bg-emerald-50 text-emerald-700',
                  bar: 'bg-emerald-500',
                  label: 'Kuat',
              }
            : candidate.match_score >= 40
              ? {
                    ring: 'border-amber-200 bg-amber-50 text-amber-700',
                    bar: 'bg-amber-500',
                    label: 'Perlu cek',
                }
              : {
                    ring: 'border-rose-200 bg-rose-50 text-rose-700',
                    bar: 'bg-rose-500',
                    label: 'Rendah',
                };
    const topSkills = candidate.skills.slice(0, 8);
    const hiddenSkillCount = Math.max(
        0,
        candidate.skills.length - topSkills.length,
    );
    const primaryExperience = candidate.experiences[0];
    const primaryEducation = candidate.educations[0];

    return (
        <article className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition hover:border-primary-200 hover:shadow-md">
            <div className="grid lg:grid-cols-[minmax(0,1fr)_248px]">
                <div className="min-w-0 p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                        <Avatar className="size-16 shrink-0 rounded-lg">
                            <AvatarImage
                                className="rounded-lg object-cover"
                                src={candidate.avatar_url ?? undefined}
                                alt={candidate.name}
                            />
                            <AvatarFallback className="rounded-lg bg-slate-900 text-lg font-bold text-white">
                                {getInitials(candidate.name)}
                            </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                                <div className="min-w-0 flex-1">
                                    <h2 className="truncate text-xl leading-tight font-bold text-slate-950">
                                        {candidate.name}
                                    </h2>
                                    <p className="mt-1 line-clamp-2 text-sm font-medium text-slate-600">
                                        {candidate.headline ||
                                            'Headline belum dilengkapi'}
                                    </p>
                                </div>
                                <div className="flex shrink-0 flex-wrap gap-1.5">
                                    {candidate.profile_completion >= 80 ? (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                                            <BadgeCheck className="size-3.5" />
                                            Profil lengkap
                                        </span>
                                    ) : null}
                                    {candidate.is_shortlisted ? (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-semibold text-primary-700">
                                            <UserCheck className="size-3.5" />
                                            Shortlisted
                                        </span>
                                    ) : null}
                                </div>
                            </div>

                            <div className="mt-4 grid gap-2 rounded-lg border border-slate-100 bg-slate-50/70 p-3 sm:grid-cols-2 xl:grid-cols-4">
                                <TalentMeta
                                    icon={MapPin}
                                    label="Lokasi"
                                    text={candidate.location || '-'}
                                />
                                <TalentMeta
                                    icon={BriefcaseBusiness}
                                    label="Pengalaman"
                                    text={`${candidate.max_years_exp || 0} tahun`}
                                />
                                <TalentMeta
                                    icon={Banknote}
                                    label="Ekspektasi"
                                    text={candidate.salary_range}
                                />
                                <TalentMeta
                                    className={availabilityTone}
                                    icon={
                                        availabilityTone.includes('green')
                                            ? CalendarCheck
                                            : Clock3
                                    }
                                    label="Ketersediaan"
                                    text={availabilityLabel}
                                />
                            </div>

                            <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)]">
                                <div className="rounded-lg border border-slate-100 p-3">
                                    <div className="mb-2 flex items-center justify-between gap-3">
                                        <p className="text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                                            Skill kandidat
                                        </p>
                                        {candidate.skills.length ? (
                                            <span className="text-xs text-slate-400">
                                                {candidate.skills.length} skill
                                            </span>
                                        ) : null}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {topSkills.length ? (
                                            <>
                                                {topSkills.map(
                                                    (skill, index) => (
                                                        <Badge
                                                            className={cn(
                                                                'rounded-md border-transparent px-2.5 py-1',
                                                                index < 3
                                                                    ? 'bg-primary-50 text-primary-700'
                                                                    : 'bg-slate-100 text-slate-600',
                                                            )}
                                                            key={skill.name}
                                                            variant="outline"
                                                        >
                                                            {skill.name}
                                                            {skill.years_exp ? (
                                                                <span className="ml-1 text-[10px] text-slate-400">
                                                                    {
                                                                        skill.years_exp
                                                                    }
                                                                    th
                                                                </span>
                                                            ) : null}
                                                        </Badge>
                                                    ),
                                                )}
                                                {hiddenSkillCount > 0 ? (
                                                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                                                        +{hiddenSkillCount}
                                                    </span>
                                                ) : null}
                                            </>
                                        ) : (
                                            <span className="text-sm text-slate-500">
                                                Skill belum dilengkapi
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="grid gap-3">
                                    <CandidateFact
                                        icon={BriefcaseBusiness}
                                        label="Pengalaman terbaru"
                                        title={
                                            primaryExperience?.job_title ||
                                            'Belum ada pengalaman'
                                        }
                                        meta={[
                                            primaryExperience?.company_name,
                                            primaryExperience?.start_date
                                                ? `${primaryExperience.start_date} - ${
                                                      primaryExperience.is_current
                                                          ? 'Sekarang'
                                                          : primaryExperience.end_date ||
                                                            '-'
                                                  }`
                                                : null,
                                        ]}
                                    />
                                    <CandidateFact
                                        icon={GraduationCap}
                                        label="Pendidikan"
                                        title={
                                            primaryEducation?.degree ||
                                            'Belum ada pendidikan'
                                        }
                                        meta={[
                                            primaryEducation?.field_of_study,
                                            primaryEducation?.institution,
                                            primaryEducation?.end_year
                                                ? String(
                                                      primaryEducation.end_year,
                                                  )
                                                : null,
                                        ]}
                                    />
                                </div>
                            </div>

                            {candidate.match_reason ? (
                                <div className="mt-5 border-t border-slate-100 pt-4">
                                    <p className="max-w-3xl text-sm leading-6 text-slate-600">
                                        <span className="font-semibold text-primary-700">
                                            Alasan AI:
                                        </span>{' '}
                                        {candidate.match_reason}
                                    </p>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>

                <aside className="border-t border-slate-200 bg-slate-50/80 p-5 lg:border-t-0 lg:border-l">
                    <div className="flex items-start justify-between gap-3 lg:block">
                        <div>
                            <div
                                className={cn(
                                    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold',
                                    scoreTone.ring,
                                )}
                            >
                                <Sparkles className="size-3.5" />
                                {candidate.match_source === 'ai' ||
                                candidate.match_source === 'ai_match_score'
                                    ? 'AI Match'
                                    : 'Auto Match'}
                            </div>
                            <div className="mt-4 flex items-end gap-2">
                                <span className="text-4xl font-bold tracking-tight text-slate-950">
                                    {candidate.match_score}
                                </span>
                                <span className="pb-1 text-sm font-semibold text-slate-500">
                                    %
                                </span>
                            </div>
                            <p className="mt-1 text-sm font-semibold text-slate-700">
                                {scoreTone.label}
                            </p>
                        </div>

                        <ScoreBreakdownPopover candidate={candidate} />
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                        <div
                            className={cn('h-full rounded-full', scoreTone.bar)}
                            style={{ width: `${candidate.match_score}%` }}
                        />
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-2 text-xs text-slate-600 lg:grid-cols-1">
                        <ScoreMetric
                            label="Profil"
                            value={`${candidate.profile_completion}% lengkap`}
                        />
                        <ScoreMetric
                            label="Riwayat apply"
                            value={`${candidate.company_applications_count} lamaran`}
                        />
                    </div>

                    <div className="mt-5 grid gap-2">
                        <Button
                            asChild
                            className="h-10 rounded-lg bg-primary-600 hover:bg-primary-700"
                        >
                            <Link href={talentSearchShow(candidate.id)}>
                                <Eye className="size-4" />
                                Detail
                            </Link>
                        </Button>
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                asChild
                                className="h-10 rounded-lg border-primary-200 text-primary-700 hover:bg-primary-50"
                                variant="outline"
                            >
                                <Link
                                    as="button"
                                    href={
                                        candidate.is_shortlisted
                                            ? talentSearchUnshortlist(
                                                  candidate.id,
                                              )
                                            : talentSearchShortlist(
                                                  candidate.id,
                                              )
                                    }
                                    method={
                                        candidate.is_shortlisted
                                            ? 'delete'
                                            : 'post'
                                    }
                                    preserveScroll
                                >
                                    <UserCheck className="size-4" />
                                    {candidate.is_shortlisted
                                        ? 'Batal'
                                        : 'Shortlist'}
                                </Link>
                            </Button>
                            <Button
                                asChild
                                className="h-10 rounded-lg border-primary-200 text-primary-700 hover:bg-primary-50"
                                variant="outline"
                            >
                                <Link
                                    as="button"
                                    href={talentSearchContact(candidate.id)}
                                    method="post"
                                >
                                    <MessageCircle className="size-4" />
                                    Hubungi
                                </Link>
                            </Button>
                        </div>
                        <Button
                            asChild
                            className={cn(
                                'h-10 rounded-lg',
                                candidate.is_saved
                                    ? 'bg-primary-50 text-primary-700 hover:bg-primary-100'
                                    : 'bg-white text-slate-700 hover:bg-slate-100',
                            )}
                            variant="secondary"
                        >
                            <Link
                                as="button"
                                href={
                                    candidate.is_saved
                                        ? talentSearchUnsave(candidate.id)
                                        : talentSearchSave(candidate.id)
                                }
                                method={candidate.is_saved ? 'delete' : 'post'}
                                preserveScroll
                            >
                                {candidate.is_saved ? (
                                    <BookmarkCheck className="size-4" />
                                ) : (
                                    <Bookmark className="size-4" />
                                )}
                                {candidate.is_saved ? 'Tersimpan' : 'Simpan'}
                            </Link>
                        </Button>
                    </div>
                </aside>
            </div>
        </article>
    );
}

function ScoreBreakdownPopover({ candidate }: { candidate: TalentCandidate }) {
    const visibleBreakdown =
        candidate.score_breakdown?.filter((item) => item.raw_pct > 0) ?? [];

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-primary-200 hover:text-primary-700"
                >
                    <Gauge className="size-3.5" />
                    Rincian
                </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 p-0">
                <div className="border-b px-4 py-3">
                    <p className="text-sm font-semibold text-zinc-900">
                        Rincian Penilaian
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                        {candidate.match_source === 'ai' ||
                        candidate.match_source === 'ai_match_score'
                            ? 'Skor dihitung oleh AI'
                            : 'Skor otomatis berdasarkan profil'}
                    </p>
                </div>
                <div className="px-4 py-3">
                    {visibleBreakdown.length > 0 ? (
                        <div className="space-y-2.5">
                            {visibleBreakdown.map((item) => (
                                <div key={item.label}>
                                    <div className="mb-1 flex items-center justify-between text-xs">
                                        <span className="font-medium text-zinc-700">
                                            {item.label}
                                        </span>
                                        <span className="text-slate-500 tabular-nums">
                                            {item.raw_pct}%{' '}
                                            <span className="text-slate-400">
                                                x{item.weight}%
                                            </span>
                                        </span>
                                    </div>
                                    <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
                                        <div
                                            className={cn(
                                                'h-full rounded-full transition-all',
                                                item.raw_pct >= 70
                                                    ? 'bg-emerald-500'
                                                    : item.raw_pct >= 40
                                                      ? 'bg-amber-400'
                                                      : 'bg-rose-400',
                                            )}
                                            style={{
                                                width: `${item.raw_pct}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                            <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs font-semibold text-zinc-800">
                                <span>Total</span>
                                <span>{candidate.match_score}%</span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs leading-5 text-slate-500">
                            Breakdown belum tersedia. Gunakan skor total dan
                            detail profil sebagai validasi awal.
                        </p>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}

function CandidateFact({
    icon: Icon,
    label,
    title,
    meta,
}: {
    icon: typeof BriefcaseBusiness;
    label: string;
    title: string;
    meta: Array<string | number | null | undefined>;
}) {
    const visibleMeta = meta.filter(Boolean);

    return (
        <div className="flex min-w-0 gap-3 rounded-lg border border-slate-100 bg-white p-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                <Icon className="size-4" />
            </div>
            <div className="min-w-0">
                <p className="text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                    {label}
                </p>
                <p className="mt-0.5 line-clamp-1 text-sm font-semibold text-slate-800">
                    {title}
                </p>
                {visibleMeta.length ? (
                    <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                        {visibleMeta.join(' · ')}
                    </p>
                ) : null}
            </div>
        </div>
    );
}

function ScoreMetric({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-2 first:border-t-0 first:pt-0">
            <span>{label}</span>
            <span className="font-semibold text-slate-800">{value}</span>
        </div>
    );
}

function FilterSelect({
    label,
    name,
    value,
    options,
    onValueChange,
    searchable = false,
}: {
    label: string;
    name: string;
    value: string;
    options: Option[];
    onValueChange?: (field: FilterField, value: string) => void;
    searchable?: boolean;
}) {
    if (searchable) {
        return (
            <SearchableFilterSelect
                label={label}
                name={name}
                onValueChange={onValueChange}
                value={value}
                options={options}
            />
        );
    }

    return (
        <select
            className="h-11 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold shadow-sm transition outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            defaultValue={value}
            name={name}
            onChange={(event) =>
                onValueChange?.(name as FilterField, event.currentTarget.value)
            }
        >
            {options.map((option) => (
                <option key={`${name}-${option.value}`} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
}

function AiGuideItem({
    icon: Icon,
    number,
    title,
    text,
}: {
    icon: typeof BrainCircuit;
    number: string;
    title: string;
    text: string;
}) {
    return (
        <div className="flex gap-3 px-4 py-4 sm:px-5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-primary-100 bg-white text-primary-600 shadow-sm">
                <Icon className="size-4" />
            </div>
            <div className="min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-slate-400">
                        {number}
                    </span>
                    <p className="text-sm font-semibold text-slate-900">
                        {title}
                    </p>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-600">{text}</p>
            </div>
        </div>
    );
}

function SearchableFilterSelect({
    label,
    name,
    onValueChange,
    value,
    options,
}: {
    label: string;
    name: string;
    onValueChange?: (field: FilterField, value: string) => void;
    value: string;
    options: Option[];
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedValue, setSelectedValue] = useState(value);

    useEffect(() => {
        setSelectedValue(value);
    }, [value]);

    const selectedOption =
        options.find((option) => option.value === selectedValue) ?? options[0];

    const filteredOptions = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        if (!normalizedQuery) {
            return options;
        }

        return options.filter((option) =>
            option.label.toLowerCase().includes(normalizedQuery),
        );
    }, [options, query]);

    function handleSelect(nextValue: string) {
        setSelectedValue(nextValue);
        setOpen(false);
        setQuery('');
        onValueChange?.(name as FilterField, nextValue);
    }

    return (
        <Popover
            open={open}
            onOpenChange={(nextOpen) => {
                setOpen(nextOpen);

                if (!nextOpen) {
                    setQuery('');
                }
            }}
        >
            <PopoverTrigger asChild>
                <button
                    aria-expanded={open}
                    className={cn(
                        'flex h-11 min-w-[170px] items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold shadow-sm transition outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100',
                        !selectedValue && 'text-slate-500',
                    )}
                    role="combobox"
                    type="button"
                >
                    <span className="truncate">{selectedOption?.label}</span>
                    <ChevronsUpDown className="ml-2 size-4 shrink-0 text-slate-400" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                className="w-[--radix-popover-trigger-width] p-0"
            >
                <div className="border-b px-3 py-2">
                    <input
                        autoFocus
                        className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={`Cari ${label.toLowerCase()}...`}
                        value={query}
                    />
                </div>
                <div className="max-h-64 overflow-y-auto py-1">
                    {filteredOptions.length ? (
                        filteredOptions.map((option) => (
                            <button
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-zinc-100"
                                key={`${name}-${option.value}`}
                                onClick={() => handleSelect(option.value)}
                                type="button"
                            >
                                <Check
                                    className={cn(
                                        'size-4 text-primary-600',
                                        option.value === selectedValue
                                            ? 'opacity-100'
                                            : 'opacity-0',
                                    )}
                                />
                                <span className="truncate">{option.label}</span>
                            </button>
                        ))
                    ) : (
                        <p className="px-3 py-4 text-center text-sm text-slate-500">
                            Tidak ditemukan.
                        </p>
                    )}
                </div>
            </PopoverContent>
            <input name={name} type="hidden" value={selectedValue} />
        </Popover>
    );
}

function TalentMeta({
    icon: Icon,
    label,
    text,
    className,
}: {
    icon: typeof MapPin;
    label?: string;
    text: string;
    className?: string;
}) {
    return (
        <span className={cn('flex min-w-0 items-start gap-2', className)}>
            <Icon className="mt-0.5 size-4 shrink-0" />
            <span className="min-w-0">
                {label ? (
                    <span className="block text-[10px] font-bold tracking-wide text-slate-400 uppercase">
                        {label}
                    </span>
                ) : null}
                <span className="block truncate text-sm font-medium">
                    {text}
                </span>
            </span>
        </span>
    );
}

function Pagination({
    links,
}: {
    links: Array<{ url: string | null; label: string; active: boolean }>;
}) {
    const previous = links[0];
    const next = links[links.length - 1];
    const visible = links.slice(1, -1);

    if (links.length <= 3) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-6">
            <PageLink link={previous} />
            {visible.map((link) => (
                <PageLink key={`${link.label}-${link.url}`} link={link} />
            ))}
            <PageLink link={next} />
        </div>
    );
}

function PageLink({
    link,
}: {
    link?: { url: string | null; label: string; active: boolean };
}) {
    if (!link) {
        return null;
    }

    const label = cleanLabel(link.label);

    if (!link.url) {
        return (
            <span className="inline-flex size-11 items-center justify-center rounded-lg border border-zinc-200 text-sm text-slate-400">
                {label}
            </span>
        );
    }

    return (
        <Link
            className={cn(
                'inline-flex size-11 items-center justify-center rounded-lg border border-zinc-200 text-sm font-semibold transition hover:bg-zinc-100',
                link.active &&
                    'border-primary-600 bg-primary-600 text-white hover:bg-primary-600',
            )}
            href={link.url}
        >
            {label}
        </Link>
    );
}

function cleanLabel(label: string) {
    if (/laquo|previous|Sebelumnya/i.test(label)) {
        return '‹';
    }

    if (/raquo|next|Berikutnya/i.test(label)) {
        return '›';
    }

    return label;
}

EmployerTalentSearch.layout = {
    breadcrumbs: [
        {
            title: 'Cari Bakat',
            href: talentSearchIndex(),
        },
    ],
};
