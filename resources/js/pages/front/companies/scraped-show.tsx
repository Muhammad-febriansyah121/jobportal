import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    BriefcaseBusiness,
    Building2,
    Clock3,
    Globe2,
    MapPin,
    Sparkles,
    Wallet,
    type LucideIcon,
} from 'lucide-react';
import HomeLayout from '@/layouts/front/home-layout';
import { useTranslate } from '@/hooks/use-translate';
import { index as companiesIndex } from '@/routes/companies';

type ScrapedCompanyPageProps = {
    company: {
        id: number;
        name: string;
        logo_url: string | null;
        website: string | null;
        profile: string | null;
        location: string;
        open_jobs_count: number;
    };
    jobs: Array<{
        id: number;
        title: string;
        location: string;
        work_mode: string;
        job_type: string;
        salary: string;
        published_at: string | null;
        detail_url: string;
    }>;
};

function companyInitials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase() ?? '')
        .join('');
}

export default function ScrapedCompanyShow({
    company,
    jobs,
}: ScrapedCompanyPageProps) {
    const { t } = useTranslate();
    const initials = companyInitials(company.name);

    return (
        <HomeLayout>
            <Head title={company.name} />

            <main className="bg-[#f7f8fa] px-4 pt-24 pb-12 md:px-6 md:pt-28 md:pb-16">
                <div className="mx-auto max-w-7xl">
                    <Link
                        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-primary-600"
                        href={companiesIndex().url}
                    >
                        <ArrowLeft className="size-4" />
                        {t('front.companies.scraped.back')}
                    </Link>

                    <section className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white text-slate-950">
                        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[42%] bg-[#eaf4ff] lg:block">
                            <img
                                alt=""
                                className="absolute right-[-4%] bottom-0 h-[100%] w-auto max-w-none object-contain object-right-bottom"
                                src="/images/karivia-buildings.png"
                            />
                        </div>

                        <div className="relative grid lg:grid-cols-[minmax(0,1fr)_300px]">
                            <div className="relative bg-white/95 px-6 py-7 md:px-10 md:py-8">
                                <div className="flex items-start justify-between gap-5">
                                    <p className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.16em] text-primary-600 uppercase">
                                        <Sparkles className="size-3.5" />
                                        {t('front.companies.scraped.eyebrow')}
                                    </p>
                                </div>

                                <div className="mt-7 flex min-w-0 items-start gap-5">
                                    {company.logo_url ? (
                                        <img
                                            alt={company.name}
                                            className="size-20 shrink-0 rounded-2xl border border-slate-200 bg-slate-50 object-contain p-2"
                                            src={company.logo_url}
                                        />
                                    ) : (
                                        <div className="inline-flex size-20 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-xl font-semibold text-slate-950">
                                            {initials || 'CO'}
                                        </div>
                                    )}

                                    <div className="min-w-0 pt-1">
                                        <h1 className="text-3xl leading-tight font-semibold tracking-[-0.03em] text-slate-950 md:text-4xl">
                                            {company.name}
                                        </h1>
                                        <p className="mt-3 line-clamp-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-[15px]">
                                            {company.profile ||
                                                t(
                                                    'front.companies.scraped.profile_empty',
                                                )}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-4 text-sm text-slate-600">
                                    <div className="flex flex-wrap gap-x-6 gap-y-3">
                                        <span className="inline-flex items-center gap-2">
                                            <MapPin className="size-4 text-primary-600" />
                                            {company.location ||
                                                t(
                                                    'front.companies.card_location_fallback',
                                                )}
                                        </span>
                                        <span className="inline-flex items-center gap-2">
                                            <BriefcaseBusiness className="size-4 text-primary-600" />
                                            {t(
                                                'front.companies.scraped.jobs_count',
                                                {
                                                    count: company.open_jobs_count,
                                                },
                                            )}
                                        </span>
                                    </div>

                                    {company.website ? (
                                        <a
                                            className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-primary-200 bg-white px-4 text-sm font-semibold text-primary-700 transition hover:bg-primary-50"
                                            href={company.website}
                                            rel="noreferrer"
                                            target="_blank"
                                        >
                                            <Globe2 className="size-4" />
                                            {t(
                                                'front.companies.scraped.visit_website',
                                            )}
                                            <ArrowRight className="size-3.5" />
                                        </a>
                                    ) : null}
                                </div>
                            </div>

                            <div className="relative z-10 m-3 rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-[0_8px_24px_rgba(15,76,148,0.08)] lg:my-5 lg:mr-5 lg:ml-0 lg:px-6 lg:py-6">
                                <p className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase">
                                    {t('front.companies.scraped.hero_openings')}
                                </p>
                                <p className="mt-3 text-5xl leading-none font-semibold tracking-[-0.06em] text-slate-950">
                                    {company.open_jobs_count}
                                </p>
                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                    {t(
                                        'front.companies.scraped.hero_openings_label',
                                    )}
                                </p>
                                <div className="mt-5 space-y-3 border-t border-slate-200 pt-4">
                                    <div className="flex items-start gap-3">
                                        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                                            <MapPin className="size-4" />
                                        </span>
                                        <div>
                                            <p className="text-xs text-slate-500">
                                                {t(
                                                    'front.companies.scraped.hero_location_label',
                                                )}
                                            </p>
                                            <p className="mt-1 text-sm font-semibold text-slate-800">
                                                {company.location ||
                                                    t(
                                                        'front.companies.card_location_fallback',
                                                    )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                                            <Building2 className="size-4" />
                                        </span>
                                        <div>
                                            <p className="text-xs text-slate-500">
                                                {t(
                                                    'front.companies.scraped.summary_source',
                                                )}
                                            </p>
                                            <p className="mt-1 text-sm leading-5 font-semibold text-slate-800">
                                                {t(
                                                    'front.companies.scraped.summary_source_value',
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
                        <section className="border border-slate-200 bg-white p-6 md:rounded-2xl md:p-8">
                            <p className="text-xs font-semibold tracking-[0.14em] text-slate-400 uppercase">
                                {t('front.companies.scraped.profile_label')}
                            </p>
                            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                                {t('front.companies.scraped.about_title')}
                            </h2>
                            <p className="mt-5 text-[15px] leading-8 whitespace-pre-line text-slate-600">
                                {company.profile ||
                                    t('front.companies.scraped.profile_empty')}
                            </p>
                        </section>

                        <aside className="h-fit border border-slate-200 bg-white p-6 md:rounded-2xl">
                            <p className="text-xs font-semibold tracking-[0.14em] text-slate-400 uppercase">
                                {t('front.companies.scraped.summary_label')}
                            </p>
                            <dl className="mt-5 divide-y divide-slate-200">
                                <SummaryItem
                                    icon={BriefcaseBusiness}
                                    label={t(
                                        'front.companies.scraped.summary_jobs',
                                    )}
                                    value={String(company.open_jobs_count)}
                                />
                                <SummaryItem
                                    icon={MapPin}
                                    label={t(
                                        'front.companies.scraped.summary_location',
                                    )}
                                    value={
                                        company.location ||
                                        t(
                                            'front.companies.card_location_fallback',
                                        )
                                    }
                                />
                                <SummaryItem
                                    icon={Building2}
                                    label={t(
                                        'front.companies.scraped.summary_source',
                                    )}
                                    value={t(
                                        'front.companies.scraped.summary_source_value',
                                    )}
                                />
                            </dl>
                        </aside>
                    </div>

                    <section className="mt-8 border border-slate-200 bg-white p-6 md:rounded-2xl md:p-8">
                        <div className="flex items-end justify-between gap-4 border-b border-slate-200 pb-5">
                            <div>
                                <p className="text-xs font-semibold tracking-[0.14em] text-slate-400 uppercase">
                                    {t('front.companies.scraped.jobs_label')}
                                </p>
                                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                                    {t('front.companies.scraped.jobs_title')}
                                </h2>
                            </div>
                            <span className="text-sm text-slate-500">
                                {company.open_jobs_count}
                            </span>
                        </div>

                        <div className="grid gap-4 pt-6 sm:grid-cols-2 xl:grid-cols-4">
                            {jobs.map((job) => (
                                <ScrapedJobCard
                                    company={company}
                                    job={job}
                                    key={job.id}
                                />
                            ))}
                        </div>
                    </section>
                </div>
            </main>
        </HomeLayout>
    );
}

function SummaryItem({
    icon: Icon,
    label,
    value,
}: {
    icon: LucideIcon;
    label: string;
    value: string;
}) {
    return (
        <div className="flex gap-3 py-4 first:pt-0 last:pb-0">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <Icon className="size-4" />
            </span>
            <div className="min-w-0">
                <dt className="text-xs text-slate-400">{label}</dt>
                <dd className="mt-1 text-sm leading-6 font-medium text-slate-800">
                    {value}
                </dd>
            </div>
        </div>
    );
}

function ScrapedJobCard({
    company,
    job,
}: {
    company: ScrapedCompanyPageProps['company'];
    job: ScrapedCompanyPageProps['jobs'][number];
}) {
    const { t } = useTranslate();
    const initials = companyInitials(company.name);

    return (
        <Link
            aria-label={`Lihat detail ${job.title}`}
            className="group flex min-h-[330px] flex-col rounded-[20px] border border-slate-200 bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-[0_12px_28px_rgba(15,76,148,0.1)] focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:outline-none"
            href={job.detail_url}
        >
            <div className="flex items-start justify-between gap-3">
                <span className="inline-flex items-center gap-1 rounded-lg border border-primary-100 bg-primary-50 px-2.5 py-1 text-[11px] font-bold tracking-wide text-primary-700 uppercase">
                    <Sparkles className="size-3.5" />
                    {t('front.companies.scraped.job_badge')}
                </span>
                <BriefcaseBusiness className="size-5 shrink-0 text-slate-300 transition-colors group-hover:text-primary-500" />
            </div>

            <div className="mt-4 flex items-start gap-3.5">
                {company.logo_url ? (
                    <img
                        alt={company.name}
                        className="size-14 shrink-0 rounded-2xl border border-primary-100 bg-primary-50 object-contain p-1.5"
                        src={company.logo_url}
                    />
                ) : (
                    <div className="inline-flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-sm font-bold text-primary-700">
                        {initials || 'CO'}
                    </div>
                )}
                <div className="min-w-0 pt-0.5">
                    <h3 className="line-clamp-2 text-[17px] leading-[1.15] font-semibold tracking-[-0.02em] text-slate-900 transition-colors group-hover:text-primary-600">
                        {job.title}
                    </h3>
                    <p className="mt-1 truncate text-sm text-slate-500">
                        {company.name}
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
                            t('front.companies.card_location_fallback')}
                    </span>
                </p>
                <p className="flex items-center gap-2 font-semibold text-slate-700">
                    <Wallet className="size-4 shrink-0 text-slate-500" />
                    <span className="truncate">{job.salary}</span>
                </p>
            </div>

            <div className="mt-auto flex items-center gap-1.5 border-t border-slate-200 pt-3 text-xs text-slate-500">
                <Clock3 className="size-3.5" />
                <span>
                    {job.published_at ||
                        t('front.companies.scraped.recently_posted')}
                </span>
            </div>

            <span className="mt-4 inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-primary-200 bg-white px-3 text-xs font-semibold text-primary-700 transition group-hover:bg-primary-600 group-hover:text-white">
                {t('front.companies.scraped.view_detail')}
                <ArrowRight className="size-3.5" />
            </span>
        </Link>
    );
}
