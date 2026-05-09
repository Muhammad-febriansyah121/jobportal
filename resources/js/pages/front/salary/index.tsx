import { Head, router, useForm } from '@inertiajs/react';
import {
    BarChart3,
    MapPin,
    Search,
    Send,
    TrendingUpIcon,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import HomeLayout from '@/layouts/front/home-layout';
import { useTranslate } from '@/hooks/use-translate';
import { store as salarySubmissionStore } from '@/routes/salary/submissions';

type SalaryInsight = {
    id: number;
    job_title: string;
    industry: string | null;
    location_city: string | null;
    salary_min: number | null;
    salary_max: number | null;
    qualification: string | null;
    experience_years: string | null;
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
        sub_industry_id: string;
        location: string;
    };
    industries: Array<{ id: number; name: string }>;
    subIndustries: Array<{ id: number; industry_id: number; name: string }>;
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

function groupByIndustry(
    insights: SalaryInsight[],
    fallbackLabel: string,
): Array<{ industry: string; rows: SalaryInsight[] }> {
    const groups = new Map<string, SalaryInsight[]>();

    insights.forEach((insight) => {
        const key = insight.industry ?? fallbackLabel;
        const list = groups.get(key);

        if (list) {
            list.push(insight);
        } else {
            groups.set(key, [insight]);
        }
    });

    return Array.from(groups.entries()).map(([industry, rows]) => ({
        industry,
        rows,
    }));
}

function SalaryTable({ insights }: { insights: SalaryInsight[] }) {
    const { t } = useTranslate();
    const fallbackIndustry = t('front.salary.industry_other');
    const groups = useMemo(
        () => groupByIndustry(insights, fallbackIndustry),
        [insights, fallbackIndustry],
    );

    return (
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            {/* Range caption */}
            <div className="hidden items-center justify-end border-b bg-white px-5 py-2 sm:flex">
                <span className="text-xs font-semibold text-primary">
                    ▸ {t('front.salary.range_caption')}
                </span>
            </div>

            {/* Header row */}
            <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_1fr] items-center gap-2 bg-primary px-5 py-3 text-[11px] font-bold tracking-wider text-white uppercase sm:grid">
                <span></span>
                <span className="text-center">
                    {t('front.salary.col_qualification')}
                </span>
                <span className="text-center leading-tight">
                    {t('front.salary.col_experience')}
                    <br />
                    <span className="text-[10px] opacity-90">
                        {t('front.salary.col_experience_unit')}
                    </span>
                </span>
                <span className="text-center">
                    {t('front.salary.col_min')}
                </span>
                <span className="text-center">
                    {t('front.salary.col_max')}
                </span>
            </div>

            {groups.map((group) => (
                <div key={group.industry}>
                    {/* Industry banner */}
                    <div className="bg-primary-dark px-5 py-2.5 text-sm font-bold tracking-wider text-white uppercase">
                        {group.industry}
                    </div>

                    {/* Rows */}
                    {group.rows.map((row, index) => (
                        <div
                            key={row.id}
                            className={`flex flex-col gap-2 border-b border-border/60 px-5 py-3 sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr_1fr] sm:items-center sm:gap-2 ${
                                index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                            }`}
                        >
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-foreground">
                                    {row.job_title}
                                </p>
                                {row.location_city && (
                                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                                        <MapPin className="size-3 shrink-0" />
                                        {row.location_city}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center justify-between text-sm sm:justify-center">
                                <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase sm:hidden">
                                    {t('front.salary.col_qualification')}
                                </span>
                                <span className="font-medium text-foreground">
                                    {row.qualification ?? '-'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm sm:justify-center">
                                <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase sm:hidden">
                                    {t('front.salary.col_experience')}
                                </span>
                                <span className="font-medium text-foreground">
                                    {row.experience_years ?? '-'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm sm:justify-center">
                                <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase sm:hidden">
                                    {t('front.salary.col_min')}
                                </span>
                                <span className="font-bold text-foreground tabular-nums">
                                    {formatMoney(row.salary_min)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm sm:justify-center">
                                <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase sm:hidden">
                                    {t('front.salary.col_max')}
                                </span>
                                <span className="font-bold text-foreground tabular-nums">
                                    {formatMoney(row.salary_max)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ))}
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
    const { t } = useTranslate();
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
                    ? t('front.salary.pagination_showing', { from: String(from), to: String(to), total: String(total) })
                    : t('front.salary.pagination_total', { total: String(total) })}
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
    subIndustries,
    insights,
}: SalaryPageProps) {
    const { t } = useTranslate();
    const [search, setSearch] = useState(filters.search);
    const [location, setLocation] = useState(filters.location);
    const [industryId, setIndustryId] = useState(filters.industry_id);
    const [subIndustryId, setSubIndustryId] = useState(filters.sub_industry_id);

    const hasActiveFilters =
        filters.search || filters.industry_id || filters.sub_industry_id || filters.location;

    const filteredSubIndustries = useMemo(() => {
        if (!industryId) {
            return [];
        }

        return subIndustries.filter((sub) => String(sub.industry_id) === industryId);
    }, [industryId, subIndustries]);

    function applyFilters(overrides?: Partial<typeof filters>) {
        const params = {
            search,
            industry_id: industryId,
            sub_industry_id: subIndustryId,
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
        setSubIndustryId('');
        setLocation('');
        router.get('/salary');
    }

    return (
        <HomeLayout>
            <Head title={t('front.salary.head_title')} />

            {/* Hero */}
            <section className="relative overflow-hidden bg-white pt-20 pb-4 text-center">
                <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
                <div className="relative mx-auto max-w-3xl px-4">
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary">
                        <TrendingUpIcon className="size-3.5" />
                        {t('front.salary.hero_badge')}
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                        {t('front.salary.hero_title_prefix')}{' '}
                        <span className="text-primary">{t('front.salary.hero_title_highlight')}</span>{' '}
                        {t('front.salary.hero_title_suffix')}
                    </h1>
                    <p className="mt-4 text-base text-muted-foreground">
                        {t('front.salary.hero_subtitle')}
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
                                placeholder={t('front.salary.search_placeholder')}
                                type="text"
                                value={search}
                            />
                        </div>
                        <button
                            className="h-11 rounded-xl bg-primary px-6 text-sm font-semibold text-white transition hover:bg-primary/90 active:scale-95"
                            type="submit"
                        >
                            {t('front.salary.search_button')}
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
                                setSubIndustryId('');
                                applyFilters({ industry_id: e.target.value, sub_industry_id: '' });
                            }}
                            value={industryId}
                        >
                            <option value="">{t('front.salary.filter_all_industries')}</option>
                            {industries.map((ind) => (
                                <option key={ind.id} value={String(ind.id)}>
                                    {ind.name}
                                </option>
                            ))}
                        </select>

                        <select
                            className="h-9 rounded-lg border border-border bg-white px-3 text-sm text-foreground shadow-sm transition outline-none focus:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
                            onChange={(e) => {
                                setSubIndustryId(e.target.value);
                                applyFilters({ sub_industry_id: e.target.value });
                            }}
                            value={subIndustryId}
                            disabled={!industryId || filteredSubIndustries.length === 0}
                        >
                            <option value="">{t('front.salary.filter_all_sub_industries')}</option>
                            {filteredSubIndustries.map((sub) => (
                                <option key={sub.id} value={String(sub.id)}>
                                    {sub.name}
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
                                placeholder={t('front.salary.filter_city_placeholder')}
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
                                {t('front.salary.reset_filter')}
                            </button>
                        )}

                        <span className="ml-auto text-sm text-muted-foreground">
                            <span className="font-semibold text-foreground">
                                {insights.total}
                            </span>{' '}
                            {t('front.salary.salary_data')}
                        </span>
                    </div>

                    {/* Cards grid */}
                    {insights.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white py-20 text-center">
                            <BarChart3 className="size-12 text-muted-foreground/30" />
                            <p className="mt-3 text-base font-semibold text-foreground">
                                {t('front.salary.empty_title')}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {t('front.salary.empty_subtitle')}
                            </p>
                            <button
                                className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
                                onClick={clearFilters}
                            >
                                {t('front.salary.reset_filter')}
                            </button>
                        </div>
                    ) : (
                        <SalaryTable insights={insights.data} />
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

                    {/* Kontribusi Data Gaji Anda dihide dulu — komponen SalarySubmissionSection masih tersedia untuk dipakai lagi nanti */}
                </div>
            </section>
        </HomeLayout>
    );
}

function SalarySubmissionSection({
    industries,
}: {
    industries: Array<{ id: number; name: string }>;
}) {
    const { t } = useTranslate();
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        job_title: '',
        industry_id: '',
        company_name: '',
        location_city: '',
        employment_type: '',
        years_experience: '',
        monthly_salary: '',
        is_anonymous: true as boolean,
        contributor_name: '',
        contributor_email: '',
    });

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        post(salarySubmissionStore().url, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(t('front.salary.submission.success'));
                reset();
                setOpen(false);
            },
            onError: () => {
                toast.error(t('front.salary.submission.error'));
            },
        });
    }

    return (
        <div className="mt-12 overflow-hidden rounded-2xl border border-primary/20 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-primary/15 bg-gradient-to-r from-primary/5 to-primary/10 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-lg font-bold text-foreground">
                        {t('front.salary.submission.title')}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {t('front.salary.submission.subtitle')}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setOpen((prev) => !prev)}
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
                >
                    <Send className="size-4" />
                    {open
                        ? t('front.salary.submission.close_form')
                        : t('front.salary.submission.open_form')}
                </button>
            </div>

            {open ? (
                <form
                    className="grid gap-4 p-6 sm:grid-cols-2"
                    onSubmit={handleSubmit}
                >
                    <Field label={t('front.salary.submission.field_job_title')} error={errors.job_title} required>
                        <input
                            type="text"
                            value={data.job_title}
                            onChange={(e) => setData('job_title', e.target.value)}
                            placeholder={t('front.salary.submission.placeholder_job_title')}
                            className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                    </Field>

                    <Field label={t('front.salary.submission.field_industry')} error={errors.industry_id}>
                        <select
                            value={data.industry_id}
                            onChange={(e) => setData('industry_id', e.target.value)}
                            className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="">{t('front.salary.submission.placeholder_industry')}</option>
                            {industries.map((ind) => (
                                <option key={ind.id} value={String(ind.id)}>
                                    {ind.name}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field label={t('front.salary.submission.field_company')} error={errors.company_name}>
                        <input
                            type="text"
                            value={data.company_name}
                            onChange={(e) => setData('company_name', e.target.value)}
                            placeholder={t('front.salary.submission.placeholder_company')}
                            className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                    </Field>

                    <Field label={t('front.salary.submission.field_city')} error={errors.location_city}>
                        <input
                            type="text"
                            value={data.location_city}
                            onChange={(e) => setData('location_city', e.target.value)}
                            placeholder={t('front.salary.submission.placeholder_city')}
                            className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                    </Field>

                    <Field label={t('front.salary.submission.field_employment_type')} error={errors.employment_type}>
                        <select
                            value={data.employment_type}
                            onChange={(e) => setData('employment_type', e.target.value)}
                            className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="">{t('front.salary.submission.placeholder_employment_type')}</option>
                            <option value="full_time">{t('front.salary.submission.employment_full_time')}</option>
                            <option value="part_time">{t('front.salary.submission.employment_part_time')}</option>
                            <option value="contract">{t('front.salary.submission.employment_contract')}</option>
                            <option value="internship">{t('front.salary.submission.employment_internship')}</option>
                            <option value="freelance">{t('front.salary.submission.employment_freelance')}</option>
                        </select>
                    </Field>

                    <Field label={t('front.salary.submission.field_experience_years')} error={errors.years_experience}>
                        <input
                            type="number"
                            min={0}
                            max={60}
                            value={data.years_experience}
                            onChange={(e) => setData('years_experience', e.target.value)}
                            placeholder="0"
                            className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                    </Field>

                    <Field label={t('front.salary.submission.field_monthly_salary')} error={errors.monthly_salary} required>
                        <input
                            type="number"
                            min={500000}
                            value={data.monthly_salary}
                            onChange={(e) => setData('monthly_salary', e.target.value)}
                            placeholder={t('front.salary.submission.placeholder_monthly_salary')}
                            className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                    </Field>

                    <div className="sm:col-span-2 flex items-start gap-3 rounded-lg bg-muted/40 p-3">
                        <input
                            id="salary-anonymous"
                            type="checkbox"
                            checked={data.is_anonymous}
                            onChange={(e) => setData('is_anonymous', e.target.checked)}
                            className="mt-0.5 size-4 rounded border-border text-primary focus:ring-primary/30"
                        />
                        <label htmlFor="salary-anonymous" className="text-sm text-muted-foreground">
                            {t('front.salary.submission.anonymous_label')}
                        </label>
                    </div>

                    {!data.is_anonymous ? (
                        <>
                            <Field label={t('front.salary.submission.field_contributor_name')} error={errors.contributor_name}>
                                <input
                                    type="text"
                                    value={data.contributor_name}
                                    onChange={(e) => setData('contributor_name', e.target.value)}
                                    className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                />
                            </Field>
                            <Field label={t('front.salary.submission.field_contributor_email')} error={errors.contributor_email}>
                                <input
                                    type="email"
                                    value={data.contributor_email}
                                    onChange={(e) => setData('contributor_email', e.target.value)}
                                    className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                />
                            </Field>
                        </>
                    ) : null}

                    <div className="sm:col-span-2 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="h-10 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-muted-foreground transition hover:border-primary/30 hover:text-primary"
                        >
                            {t('front.salary.submission.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:opacity-60"
                        >
                            <Send className="size-4" />
                            {processing
                                ? t('front.salary.submission.submitting')
                                : t('front.salary.submission.submit')}
                        </button>
                    </div>
                </form>
            ) : null}
        </div>
    );
}

function Field({
    label,
    children,
    required,
    error,
}: {
    label: string;
    children: React.ReactNode;
    required?: boolean;
    error?: string;
}) {
    return (
        <label className="space-y-1.5 text-left">
            <span className="text-xs font-semibold text-foreground">
                {label}
                {required ? <span className="ml-1 text-red-500">*</span> : null}
            </span>
            {children}
            {error ? <p className="text-xs text-red-500">{error}</p> : null}
        </label>
    );
}
