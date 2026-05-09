import { Head, Link, router } from '@inertiajs/react';
import {
    BadgeCheck,
    Banknote,
    Check,
    Bookmark,
    BookmarkCheck,
    BriefcaseBusiness,
    CalendarCheck,
    ChevronsUpDown,
    Clock3,
    ListFilter,
    MapPin,
    Search,
    SlidersHorizontal,
    Sparkles,
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
                                    { v: 'all', label: 'Semua', count: poolTotalCount },
                                    { v: 'saved', label: 'Tersimpan', count: savedCandidatesCount },
                                    { v: 'shortlisted', label: 'Shortlisted', count: shortlistedCount },
                                ] as const
                            ).map((opt) => {
                                const active = (filters.pool ?? 'all') === opt.v;

                                return (
                                    <Link
                                        key={opt.v}
                                        href={talentPoolIndex({ query: { ...currentQuery, pool: opt.v } })}
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
                                                active ? 'bg-primary-600 text-white' : 'bg-zinc-100 text-zinc-700',
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
                        <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center">
                                <div className="flex min-h-12 flex-1 items-center gap-3 px-2">
                                    <Search className="size-5 text-primary-600" />
                                    <Sparkles className="size-6 text-primary-600" />
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

                        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                            <Sparkles className="size-4 text-slate-500" />
                            {aiSuggestions.map((suggestion) => (
                                <span key={suggestion}>{suggestion}</span>
                            ))}
                        </div>

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
                                <Link href={listingRoute()}>{t('employer.talent_search.reset_filter')}</Link>
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

                    <div className="rounded-lg border border-primary-100 bg-primary-50 px-4 py-3 text-sm font-semibold text-primary-700">
                        {recommendationSource === 'ai'
                            ? 'Rekomendasi diurutkan ulang oleh AI berdasarkan query dan data kandidat.'
                            : 'AI belum aktif atau gagal merespons, sementara memakai skor computed dari profil dan skill.'}
                    </div>

                    <div className="space-y-4">
                        {candidates.data.length ? (
                            candidates.data.map((candidate) => (
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

    return (
        <article className="relative rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="absolute top-[-14px] right-[-12px] flex size-14 items-center justify-center rounded-full border-4 border-white bg-primary-600 text-sm font-bold text-white shadow-sm">
                {candidate.match_score}%
            </div>

            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex min-w-0 flex-1 gap-5">
                    <Avatar className="size-20 rounded-lg">
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
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-xl leading-tight font-bold">
                                {candidate.name}
                            </h2>
                            {candidate.profile_completion >= 80 ? (
                                <BadgeCheck className="size-5 text-blue-500" />
                            ) : null}
                        </div>
                        <p className="mt-1 text-sm font-medium text-slate-600">
                            {candidate.headline}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                            {candidate.skills.length ? (
                                candidate.skills.map((skill, index) => (
                                    <Badge
                                        className={cn(
                                            'rounded-lg border-transparent',
                                            index < 3
                                                ? 'bg-primary-50 text-primary-700'
                                                : 'bg-slate-100 text-slate-600',
                                        )}
                                        key={skill.name}
                                        variant="outline"
                                    >
                                        {skill.name}
                                    </Badge>
                                ))
                            ) : (
                                <span className="text-sm text-slate-500">
                                    Skill belum dilengkapi
                                </span>
                            )}
                        </div>

                        {candidate.experiences.length > 0 ? (
                            <div className="mt-4 space-y-1.5 rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                                <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                                    Pengalaman
                                </p>
                                {candidate.experiences.map((exp, index) => (
                                    <p
                                        key={`${exp.job_title}-${index}`}
                                        className="text-sm text-slate-700"
                                    >
                                        <span className="font-semibold">
                                            {exp.job_title || '-'}
                                        </span>
                                        {exp.company_name ? (
                                            <span className="text-slate-500">
                                                {' '}
                                                · {exp.company_name}
                                            </span>
                                        ) : null}
                                        {exp.start_date ? (
                                            <span className="text-xs text-slate-400">
                                                {' '}
                                                ({exp.start_date} -{' '}
                                                {exp.is_current
                                                    ? 'Sekarang'
                                                    : exp.end_date || '-'})
                                            </span>
                                        ) : null}
                                    </p>
                                ))}
                            </div>
                        ) : null}

                        {candidate.educations.length > 0 ? (
                            <div className="mt-2 space-y-1.5 rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                                <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                                    Pendidikan
                                </p>
                                {candidate.educations.map((edu, index) => (
                                    <p
                                        key={`${edu.institution}-${index}`}
                                        className="text-sm text-slate-700"
                                    >
                                        <span className="font-semibold">
                                            {edu.degree || '-'}
                                        </span>
                                        {edu.field_of_study ? (
                                            <span className="text-slate-500">
                                                {' '}
                                                · {edu.field_of_study}
                                            </span>
                                        ) : null}
                                        {edu.institution ? (
                                            <span className="text-slate-500">
                                                {' '}
                                                — {edu.institution}
                                            </span>
                                        ) : null}
                                        {edu.end_year ? (
                                            <span className="text-xs text-slate-400">
                                                {' '}
                                                ({edu.end_year})
                                            </span>
                                        ) : null}
                                    </p>
                                ))}
                            </div>
                        ) : null}

                        <div className="mt-5 flex flex-wrap gap-x-7 gap-y-3 text-sm text-slate-500">
                            <TalentMeta
                                icon={MapPin}
                                text={candidate.location || '-'}
                            />
                            <TalentMeta
                                icon={Banknote}
                                text={candidate.salary_range}
                            />
                            <TalentMeta
                                icon={BriefcaseBusiness}
                                text={`${candidate.max_years_exp || 0} Tahun`}
                            />
                            <TalentMeta
                                className={availabilityTone}
                                icon={
                                    availabilityTone.includes('green')
                                        ? CalendarCheck
                                        : Clock3
                                }
                                text={availabilityLabel}
                            />
                        </div>
                        {candidate.match_reason ? (
                            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-500">
                                <span className="font-semibold text-primary-700">
                                    Alasan AI:
                                </span>{' '}
                                {candidate.match_reason}
                            </p>
                        ) : null}
                    </div>
                </div>

                <div className="grid w-full gap-3 sm:w-40">
                    <Button
                        asChild
                        className="rounded-lg bg-primary-600 hover:bg-primary-700"
                    >
                        <Link href={talentSearchShow(candidate.id)}>
                            Lihat Detail
                        </Link>
                    </Button>
                    {candidate.is_shortlisted ? (
                        <Button
                            asChild
                            className="rounded-lg border-primary-200 text-primary-700 hover:bg-primary-50"
                            variant="outline"
                        >
                            <Link
                                as="button"
                                href={talentSearchUnshortlist(candidate.id)}
                                method="delete"
                                preserveScroll
                            >
                                Shortlisted
                            </Link>
                        </Button>
                    ) : (
                        <Button
                            asChild
                            className="rounded-lg border-primary-200 text-primary-700 hover:bg-primary-50"
                            variant="outline"
                        >
                            <Link
                                as="button"
                                href={talentSearchShortlist(candidate.id)}
                                method="post"
                                preserveScroll
                            >
                                Shortlist
                            </Link>
                        </Button>
                    )}
                    <Button
                        asChild
                        className="rounded-lg border-primary-200 text-primary-700 hover:bg-primary-50"
                        variant="outline"
                    >
                        <Link
                            as="button"
                            href={talentSearchContact(candidate.id)}
                            method="post"
                        >
                            Hubungi
                        </Link>
                    </Button>
                    {candidate.is_saved ? (
                        <Button
                            asChild
                            className="rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100"
                            variant="secondary"
                        >
                            <Link
                                as="button"
                                href={talentSearchUnsave(candidate.id)}
                                method="delete"
                                preserveScroll
                            >
                                <BookmarkCheck className="size-4" />
                                Tersimpan
                            </Link>
                        </Button>
                    ) : (
                        <Button
                            asChild
                            className="rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                            variant="secondary"
                        >
                            <Link
                                as="button"
                                href={talentSearchSave(candidate.id)}
                                method="post"
                                preserveScroll
                            >
                                <Bookmark className="size-4" />
                                Simpan
                            </Link>
                        </Button>
                    )}
                </div>
            </div>
        </article>
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
    text,
    className,
}: {
    icon: typeof MapPin;
    text: string;
    className?: string;
}) {
    return (
        <span className={cn('inline-flex items-center gap-2', className)}>
            <Icon className="size-4" />
            {text}
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
