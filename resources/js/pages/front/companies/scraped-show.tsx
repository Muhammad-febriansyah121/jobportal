import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    BriefcaseBusiness,
    Clock3,
    Globe2,
    MapPin,
    Sparkles,
    Wallet,
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

export default function ScrapedCompanyShow({ company, jobs }: ScrapedCompanyPageProps) {
    const { t } = useTranslate();
    const initials = companyInitials(company.name);

    return (
        <HomeLayout>
            <Head title={company.name} />

            <main className="bg-[#f7f8fa] px-4 py-8 md:py-12">
                <div className="mx-auto max-w-6xl">
                    <Link
                        className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-primary-600"
                        href={companiesIndex().url}
                    >
                        <ArrowLeft className="size-4" />
                        {t('front.companies.scraped.back')}
                    </Link>

                    <section className="border-y border-slate-200 bg-white px-5 py-8 md:border md:px-10 md:py-10 md:rounded-2xl">
                        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
                            <div className="flex min-w-0 items-start gap-5">
                                {company.logo_url ? (
                                    <img
                                        alt={company.name}
                                        className="size-20 shrink-0 rounded-2xl border border-slate-200 bg-slate-50 object-contain p-2 md:size-24"
                                        src={company.logo_url}
                                    />
                                ) : (
                                    <div className="inline-flex size-20 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-xl font-semibold text-primary-700 md:size-24">
                                        {initials || 'CO'}
                                    </div>
                                )}

                                <div className="min-w-0 pt-1">
                                    <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.14em] text-primary-600 uppercase">
                                        <Sparkles className="size-3.5" />
                                        {t('front.companies.scraped.eyebrow')}
                                    </p>
                                    <h1 className="text-3xl leading-tight font-semibold tracking-tight text-slate-950 md:text-5xl">
                                        {company.name}
                                    </h1>
                                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                                        <span className="inline-flex items-center gap-2">
                                            <MapPin className="size-4 text-slate-400" />
                                            {company.location || t('front.companies.card_location_fallback')}
                                        </span>
                                        <span className="inline-flex items-center gap-2">
                                            <BriefcaseBusiness className="size-4 text-slate-400" />
                                            {t('front.companies.scraped.jobs_count', { count: company.open_jobs_count })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {company.website ? (
                                <a
                                    className="inline-flex shrink-0 items-center justify-center gap-2 self-start border-b border-slate-300 pb-1 text-sm font-medium text-slate-700 transition hover:border-primary-500 hover:text-primary-600"
                                    href={company.website}
                                    rel="noreferrer"
                                    target="_blank"
                                >
                                    <Globe2 className="size-4" />
                                    {t('front.companies.scraped.visit_website')}
                                </a>
                            ) : null}
                        </div>
                    </section>

                    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
                        <div className="space-y-8">
                            <section className="border border-slate-200 bg-white p-6 md:p-8 md:rounded-2xl">
                                <p className="text-xs font-semibold tracking-[0.14em] text-slate-400 uppercase">
                                    {t('front.companies.scraped.profile_label')}
                                </p>
                                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                                    {t('front.companies.scraped.about_title')}
                                </h2>
                                <p className="mt-5 whitespace-pre-line text-[15px] leading-8 text-slate-600">
                                    {company.profile || t('front.companies.scraped.profile_empty')}
                                </p>
                            </section>

                            <section className="border border-slate-200 bg-white p-6 md:p-8 md:rounded-2xl">
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

                                <div className="divide-y divide-slate-200">
                                    {jobs.map((job) => (
                                        <Link
                                            className="group block py-5 first:pt-6 last:pb-0"
                                            href={job.detail_url}
                                            key={job.id}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <h3 className="text-lg font-semibold leading-snug text-slate-900 transition group-hover:text-primary-600">
                                                    {job.title}
                                                </h3>
                                                <span className="shrink-0 text-xs text-slate-400">
                                                    {job.published_at || t('front.companies.scraped.recently_posted')}
                                                </span>
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <BriefcaseBusiness className="size-3.5 text-primary-500" />
                                                    {job.job_type}
                                                </span>
                                                <span className="inline-flex items-center gap-1.5">
                                                    <MapPin className="size-3.5 text-slate-400" />
                                                    {job.work_mode} · {job.location || t('front.companies.card_location_fallback')}
                                                </span>
                                                <span className="inline-flex items-center gap-1.5">
                                                    <Wallet className="size-3.5 text-slate-400" />
                                                    {job.salary}
                                                </span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        </div>

                        <aside className="h-fit border border-slate-200 bg-white p-6 md:rounded-2xl">
                            <p className="text-xs font-semibold tracking-[0.14em] text-slate-400 uppercase">
                                {t('front.companies.scraped.summary_label')}
                            </p>
                            <dl className="mt-5 divide-y divide-slate-200">
                                <SummaryItem
                                    label={t('front.companies.scraped.summary_jobs')}
                                    value={String(company.open_jobs_count)}
                                />
                                <SummaryItem
                                    label={t('front.companies.scraped.summary_location')}
                                    value={company.location || t('front.companies.card_location_fallback')}
                                />
                                <SummaryItem
                                    label={t('front.companies.scraped.summary_source')}
                                    value={t('front.companies.scraped.summary_source_value')}
                                />
                            </dl>
                        </aside>
                    </div>
                </div>
            </main>
        </HomeLayout>
    );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="py-4 first:pt-0 last:pb-0">
            <dt className="text-xs text-slate-400">{label}</dt>
            <dd className="mt-1 text-sm font-medium leading-6 text-slate-800">{value}</dd>
        </div>
    );
}
