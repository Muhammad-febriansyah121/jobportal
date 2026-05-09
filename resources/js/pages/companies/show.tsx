import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    BadgeCheck,
    BriefcaseBusiness,
    Building2,
    Clock3,
    Flame,
    Globe,
    MapPin,
    MessageCircle,
    ShieldCheck,
    Star,
    TrendingUp,
    Users2,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslate } from '@/hooks/use-translate';
import HomeLayout from '@/layouts/front/home-layout';
import { cn } from '@/lib/utils';
import { login } from '@/routes';
import { store as storeCandidateCompanyReview } from '@/routes/candidate/companies/reviews';
import { index as companiesIndex, show as companyShow } from '@/routes/companies';
import { index as jobsIndex } from '@/routes/jobs';

type CompanyShowProps = {
    company: {
        id: number;
        name: string;
        slug: string;
        logo_url?: string | null;
        cover_url?: string | null;
        description?: string | null;
        culture?: string | null;
        benefits?: string | null;
        company_size?: string | null;
        website?: string | null;
        hq_city?: string | null;
        hq_province?: string | null;
        is_verified: boolean;
        trust_score?: number | null;
        response_rate?: number | null;
        median_response_hours?: number | null;
        industry?: string | null;
        open_jobs_count: number;
        badges: Array<{
            id: number;
            type: string;
            label: string;
            issued_at?: string | null;
        }>;
        offices: Array<{
            id: number;
            city: string;
            province: string;
            address?: string | null;
        }>;
        review_summary: {
            average_rating: number | null;
            total_reviews: number;
            recent_reviews: Array<{
                id: number;
                rating: number;
                title: string | null;
                review: string | null;
                employer_reply: string | null;
                employer_replied_at: string | null;
            }>;
        };
        review_access: {
            can_submit: boolean;
            my_review: {
                rating: number;
                title: string | null;
                review: string | null;
            } | null;
        };
    };
    jobs: Array<{
        id: number;
        slug: string;
        title: string;
        location: string;
        work_mode_label: string;
        job_type_label: string;
        experience_level: string;
        salary_range: string;
        published_at?: string | null;
    }>;
};

function splitListText(value?: string | null): string[] {
    if (!value) {
        return [];
    }

    return value
        .split('\n')
        .map((item) => item.trim().replace(/^[-•*]\s*/, ''))
        .filter(Boolean);
}

export default function CompanyShow({ company, jobs }: CompanyShowProps) {
    const { t } = useTranslate();
    const { auth } = usePage<{
        auth?: {
            user?: {
                role?: string | null;
            } | null;
        };
    }>().props;
    const isCandidate = auth?.user?.role === 'candidate';
    const isGuest = !auth?.user;
    const hq = [company.hq_city, company.hq_province]
        .filter(Boolean)
        .join(', ');
    const initials = company.name
        .split(' ')
        .map((word) => word[0] ?? '')
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const myReview = company.review_access.my_review;
    const reviewForm = useForm({
        rating: myReview?.rating ?? 5,
        title: myReview?.title ?? '',
        review: myReview?.review ?? '',
    });

    const metrics = [
        {
            label: t('companies.show.metric_response_rate'),
            value:
                company.response_rate !== null
                    ? `${company.response_rate}%`
                    : t('companies.show.metric_no_data'),
            helper: t('companies.show.metric_response_rate_helper'),
            icon: TrendingUp,
        },
        {
            label: t('companies.show.metric_avg_response'),
            value:
                company.median_response_hours != null
                    ? t('companies.show.metric_hours', { hours: company.median_response_hours })
                    : t('companies.show.metric_no_data'),
            helper: t('companies.show.metric_avg_response_helper'),
            icon: Clock3,
        },
        {
            label: t('companies.show.metric_active_jobs'),
            value: `${company.open_jobs_count}`,
            helper: t('companies.show.metric_active_jobs_helper'),
            icon: BriefcaseBusiness,
        },
    ];

    const cultureItems = splitListText(company.culture);
    const benefitItems = splitListText(company.benefits);

    const submitReview = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        reviewForm.post(storeCandidateCompanyReview(company.slug).url, {
            preserveScroll: true,
        });
    };

    return (
        <HomeLayout>
            <Head title={t('companies.show.page_title', { name: company.name })} />

            <section className="bg-slate-100/80 px-4 py-8 md:py-10">
                <div className="mx-auto max-w-6xl space-y-5">
                    <Link
                        className="inline-flex items-center text-xs font-semibold tracking-wide text-slate-500 transition hover:text-slate-700"
                        href={companiesIndex().url}
                    >
                        {t('companies.show.back')}
                    </Link>

                    <header className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md">
                        {/* Cover */}
                        <div
                            className={cn(
                                'bg-linear-to-135deg relative h-60 overflow-hidden from-primary-600 via-primary-500 to-slate-900 md:h-72',
                            )}
                            style={
                                company.cover_url
                                    ? {
                                          backgroundImage: `linear-gradient(135deg, rgba(30,77,150,0.92) 0%, rgba(15,23,42,0.90) 100%), url(${company.cover_url})`,
                                          backgroundSize: 'cover',
                                          backgroundPosition: 'center',
                                      }
                                    : undefined
                            }
                        >
                            {/* Texture overlays */}
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_10%_20%,rgba(255,255,255,0.18),transparent_50%),radial-gradient(ellipse_at_90%_80%,rgba(251,146,60,0.25),transparent_50%)]" />
                            <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-black/30 to-transparent" />

                            {/* Watermark company name */}
                            <p
                                aria-hidden
                                className="pointer-events-none absolute inset-x-0 bottom-2 truncate text-center text-[clamp(3rem,12vw,7rem)] font-black tracking-tighter text-white/[0.06] select-none"
                            >
                                {company.name}
                            </p>

                            {/* Content */}
                            <div className="relative flex h-full flex-col justify-between px-6 py-5 md:px-8 md:py-6">
                                <div className="flex items-center justify-between">
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold tracking-wider text-white/90 uppercase backdrop-blur-md">
                                        <Flame className="size-3" />
                                        {t('companies.show.hero_company_profile')}
                                    </span>

                                    {company.is_verified ? (
                                        <span className="inline-flex items-center gap-1 rounded-full border border-blue-300/30 bg-blue-500/20 px-2.5 py-1 text-[11px] font-semibold text-blue-100 backdrop-blur-md">
                                            <BadgeCheck className="size-3" />
                                            {t('companies.show.verified_badge')}
                                        </span>
                                    ) : null}
                                </div>

                                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                                    <div className="text-white">
                                        <h1 className="text-3xl font-black tracking-tight drop-shadow-sm md:text-4xl lg:text-5xl">
                                            {company.name}
                                        </h1>
                                        <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/80 md:text-[15px]">
                                            {company.description?.slice(
                                                0,
                                                130,
                                            ) ??
                                                t('companies.show.description_fallback', { company: company.name })}
                                        </p>
                                    </div>

                                    <div className="flex shrink-0 gap-2">
                                        <GlassInfo
                                            label={t('companies.show.hero_open_jobs')}
                                            value={`${company.open_jobs_count}`}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Company identity bar */}
                        <div className="px-5 py-5 md:px-8 md:py-6">
                            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-4">
                                    {/* Logo */}
                                    <div className="relative -mt-14 shrink-0">
                                        {company.logo_url ? (
                                            <img
                                                alt={company.name}
                                                className="size-20 rounded-2xl border-4 border-white object-cover shadow-md ring-1 ring-slate-200"
                                                src={company.logo_url}
                                            />
                                        ) : (
                                            <div className="inline-flex size-20 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-slate-200 to-slate-300 text-2xl font-black text-slate-600 shadow-md ring-1 ring-slate-200">
                                                {initials}
                                            </div>
                                        )}
                                    </div>

                                    <div className="min-w-0 space-y-1.5">
                                        <h2 className="truncate text-xl font-bold text-slate-900 md:text-2xl">
                                            {company.name}
                                        </h2>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500">
                                            <MetaItem
                                                icon={Building2}
                                                text={
                                                    company.industry ??
                                                    t('companies.show.industry_unknown')
                                                }
                                            />
                                            <span className="text-slate-300">
                                                ·
                                            </span>
                                            <MetaItem
                                                icon={MapPin}
                                                text={hq || 'Indonesia'}
                                            />
                                            <span className="text-slate-300">
                                                ·
                                            </span>
                                            <MetaItem
                                                icon={Users2}
                                                text={
                                                    company.company_size
                                                        ? t('companies.show.employees', { size: company.company_size })
                                                        : t('companies.show.size_unknown')
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex shrink-0 flex-wrap items-center gap-2 sm:ml-4">
                                    {company.website ? (
                                        <a
                                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                                            href={company.website}
                                            rel="noreferrer"
                                            target="_blank"
                                        >
                                            <Globe className="size-3.5" />
                                            {t('companies.show.website')}
                                        </a>
                                    ) : null}
                                    <Link
                                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-primary-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-primary-700"
                                        href={`${jobsIndex().url}?search=${encodeURIComponent(company.name)}`}
                                    >
                                        <BriefcaseBusiness className="size-3.5" />
                                        {t('companies.show.view_jobs')}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </header>

                    <div className="flex flex-wrap gap-2">
                        {company.is_verified ? (
                            <BadgeChip
                                icon={<BadgeCheck className="size-3.5" />}
                                label={t('companies.show.legal_verified')}
                                variant="blue"
                            />
                        ) : null}
                        <BadgeChip
                            icon={<BriefcaseBusiness className="size-3.5" />}
                            label={t('companies.show.open_jobs_label', { count: company.open_jobs_count })}
                            variant="orange"
                        />
                        {company.company_size ? (
                            <BadgeChip
                                icon={<Users2 className="size-3.5" />}
                                label={t('companies.show.employees_label', { size: company.company_size })}
                            />
                        ) : null}
                    </div>

                    <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
                        <div className="grid gap-3 md:grid-cols-3">
                            {metrics.map((item) => (
                                <div
                                    className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-primary-200 hover:shadow-md"
                                    key={item.label}
                                >
                                    <div className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-primary-400 to-primary-300 opacity-0 transition group-hover:opacity-100" />
                                    <div className="mb-4 inline-flex rounded-xl bg-primary-50 p-2.5 text-primary-600 ring-1 ring-primary-100">
                                        <item.icon className="size-4" />
                                    </div>
                                    <p className="text-[10px] font-bold tracking-[0.16em] text-slate-400 uppercase">
                                        {item.label}
                                    </p>
                                    <p className="mt-1.5 text-3xl leading-none font-black tracking-tight text-slate-900">
                                        {item.value}
                                    </p>
                                    <p className="mt-2.5 border-t border-slate-100 pt-2.5 text-xs text-slate-500">
                                        {item.helper}
                                    </p>
                                </div>
                            ))}
                        </div>

                    </div>

                    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                        <div className="space-y-4">
                            <Tabs
                                defaultValue="about"
                                className="space-y-4"
                            >
                                <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                                    <TabsList
                                        variant="line"
                                        className="h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0"
                                    >
                                        <TabsTrigger
                                            className="after:hidden data-[state=active]:rounded-xl data-[state=active]:bg-primary-50 data-[state=active]:text-primary-700"
                                            value="about"
                                        >
                                            {t('companies.show.tab_about')}
                                        </TabsTrigger>
                                        <TabsTrigger
                                            className="after:hidden data-[state=active]:rounded-xl data-[state=active]:bg-primary-50 data-[state=active]:text-primary-700"
                                            value="culture"
                                        >
                                            {t('companies.show.tab_culture')}
                                        </TabsTrigger>
                                        <TabsTrigger
                                            className="after:hidden data-[state=active]:rounded-xl data-[state=active]:bg-primary-50 data-[state=active]:text-primary-700"
                                            value="jobs"
                                        >
                                            {t('companies.show.tab_jobs', { count: company.open_jobs_count })}
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                <TabsContent value="about">
                                    <SectionCard title={t('companies.show.about_section_title')}>
                                        <p className="text-sm leading-7 text-slate-600">
                                            {company.description ||
                                                t('companies.show.description_fallback', { company: company.name })}
                                        </p>
                                    </SectionCard>
                                </TabsContent>

                                <TabsContent value="culture" className="space-y-4">
                                    <SectionCard title={t('companies.show.culture_section_title')}>
                                        {cultureItems.length > 0 ? (
                                            <ul className="space-y-2">
                                                {cultureItems.map((item) => (
                                                    <li
                                                        key={item}
                                                        className="flex items-start gap-2 text-sm text-slate-600"
                                                    >
                                                        <span className="mt-2 size-1.5 rounded-full bg-primary-500" />
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-sm leading-7 text-slate-500">
                                                {t('companies.show.culture_empty')}
                                            </p>
                                        )}
                                    </SectionCard>

                                    <SectionCard title={t('companies.show.benefits_section_title')}>
                                        {benefitItems.length > 0 ? (
                                            <ul className="space-y-2">
                                                {benefitItems.map((item) => (
                                                    <li
                                                        key={item}
                                                        className="flex items-start gap-2 text-sm text-slate-600"
                                                    >
                                                        <span className="mt-2 size-1.5 rounded-full bg-primary-500" />
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-sm leading-7 text-slate-500">
                                                {t('companies.show.benefits_empty')}
                                            </p>
                                        )}
                                    </SectionCard>
                                </TabsContent>

                                <TabsContent value="jobs">
                                    <SectionCard title={t('companies.show.jobs_section_title')}>
                                        <div className="mb-4 flex items-center justify-between">
                                            <p className="text-sm text-slate-500">
                                                {t('companies.show.jobs_latest_from', { company: company.name })}
                                            </p>
                                            <Link
                                                className="inline-flex items-center text-sm font-semibold text-primary-600 hover:text-primary-700"
                                                href={`${jobsIndex().url}?search=${encodeURIComponent(company.name)}`}
                                            >
                                                {t('companies.show.jobs_see_all')}
                                                <ArrowRight className="ml-1 size-4" />
                                            </Link>
                                        </div>

                                        {jobs.length === 0 ? (
                                            <p className="text-sm text-slate-500">
                                                {t('companies.show.jobs_empty')}
                                            </p>
                                        ) : (
                                            <div className="space-y-3">
                                                {jobs.map((job) => (
                                                    <article
                                                        className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-primary-200"
                                                        key={job.id}
                                                    >
                                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                            <div className="space-y-2">
                                                                <p className="text-lg font-bold text-slate-900">
                                                                    {job.title}
                                                                </p>
                                                                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                                                    <span className="inline-flex items-center gap-1">
                                                                        <MapPin className="size-3.5" />
                                                                        {job.location || 'Indonesia'}
                                                                    </span>
                                                                    <JobPill text={job.work_mode_label} />
                                                                    <JobPill text={job.job_type_label} />
                                                                    <JobPill text={job.experience_level} />
                                                                </div>
                                                            </div>

                                                            <div className="space-y-1 text-left sm:text-right">
                                                                <p className="text-sm font-bold text-primary-600">
                                                                    {job.salary_range}
                                                                </p>
                                                                <p className="text-xs text-slate-500">
                                                                    {job.published_at || t('companies.show.job_published_fallback')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </article>
                                                ))}
                                            </div>
                                        )}
                                    </SectionCard>
                                </TabsContent>

                                {false && (
                                <TabsContent value="reviews">
                                    <SectionCard title={t('companies.show.reviews_section_title')}>
                                        <div className="flex items-start justify-between gap-3">
                                            <p className="text-xs text-slate-500">
                                                {t('companies.show.reviews_count', {
                                                    count: company.review_summary.total_reviews,
                                                })}
                                            </p>
                                            <span className="inline-flex items-center gap-1 text-lg font-black text-primary-600">
                                                <Star className="size-5 fill-primary-400 text-primary-400" />
                                                {company.review_summary.average_rating ?? '-'}
                                            </span>
                                        </div>

                                        {company.review_summary.recent_reviews.length > 0 ? (
                                            <div className="mt-3 space-y-3">
                                                {company.review_summary.recent_reviews.map((review) => (
                                                    <div
                                                        className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                                                        key={review.id}
                                                    >
                                                        <p className="text-sm font-semibold text-slate-900">
                                                            {review.title || t('companies.show.review_fallback_title')}
                                                        </p>
                                                        <p className="mt-1 text-xs leading-6 text-slate-600">
                                                            {review.review ||
                                                                t('companies.show.review_fallback_body')}
                                                        </p>
                                                        {review.employer_reply ? (
                                                            <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 p-2">
                                                                <p className="text-[10px] font-semibold tracking-wider text-blue-700 uppercase">
                                                                    {t('companies.show.employer_reply_label', { company: company.name })}
                                                                </p>
                                                                <p className="mt-0.5 text-xs leading-5 whitespace-pre-wrap text-blue-900">
                                                                    {review.employer_reply}
                                                                </p>
                                                                {review.employer_replied_at ? (
                                                                    <p className="mt-0.5 text-[10px] text-blue-700">
                                                                        {review.employer_replied_at}
                                                                    </p>
                                                                ) : null}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="mt-3 text-sm text-slate-500">
                                                {t('companies.show.reviews_empty')}
                                            </p>
                                        )}

                                        {isCandidate ? (
                                            <div className="mt-4 border-t border-slate-200 pt-4">
                                                {company.review_access.can_submit ? (
                                                    <form className="space-y-2.5" onSubmit={submitReview}>
                                                        <p className="text-xs font-semibold text-slate-700">
                                                            {myReview
                                                                ? t('companies.show.review_form_title_update')
                                                                : t('companies.show.review_form_title_new')}
                                                        </p>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <label className="space-y-1 text-xs text-slate-600">
                                                                <span>{t('companies.show.review_form_rating')}</span>
                                                                <select
                                                                    className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm"
                                                                    onChange={(event) =>
                                                                        reviewForm.setData(
                                                                            'rating',
                                                                            Number(event.target.value),
                                                                        )
                                                                    }
                                                                    value={reviewForm.data.rating}
                                                                >
                                                                    {[5, 4, 3, 2, 1].map((value) => (
                                                                        <option key={value} value={value}>
                                                                            {t('companies.show.review_form_stars', { count: value })}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                {reviewForm.errors.rating ? (
                                                                    <p className="text-[11px] text-red-600">
                                                                        {reviewForm.errors.rating}
                                                                    </p>
                                                                ) : null}
                                                            </label>

                                                            <label className="space-y-1 text-xs text-slate-600">
                                                                <span>{t('companies.show.review_form_title_field')}</span>
                                                                <input
                                                                    className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm"
                                                                    maxLength={120}
                                                                    onChange={(event) =>
                                                                        reviewForm.setData('title', event.target.value)
                                                                    }
                                                                    placeholder={t('companies.show.review_form_title_placeholder')}
                                                                    value={reviewForm.data.title}
                                                                />
                                                            </label>
                                                        </div>

                                                        <label className="space-y-1 text-xs text-slate-600">
                                                            <span>{t('companies.show.review_form_review_field')}</span>
                                                            <textarea
                                                                className="min-h-24 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm"
                                                                maxLength={2000}
                                                                onChange={(event) =>
                                                                    reviewForm.setData('review', event.target.value)
                                                                }
                                                                placeholder={t('companies.show.review_form_review_placeholder')}
                                                                value={reviewForm.data.review}
                                                            />
                                                            {reviewForm.errors.review ? (
                                                                <p className="text-[11px] text-red-600">
                                                                    {reviewForm.errors.review}
                                                                </p>
                                                            ) : null}
                                                        </label>

                                                        <button
                                                            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary-600 px-3 text-xs font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                                                            disabled={reviewForm.processing}
                                                            type="submit"
                                                        >
                                                            {reviewForm.processing
                                                                ? t('companies.show.review_form_saving')
                                                                : myReview
                                                                  ? t('companies.show.review_form_update')
                                                                  : t('companies.show.review_form_submit')}
                                                        </button>
                                                    </form>
                                                ) : (
                                                    <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
                                                        {t('companies.show.review_locked')}
                                                    </p>
                                                )}
                                            </div>
                                        ) : isGuest ? (
                                            <div className="mt-4 border-t border-slate-200 pt-4">
                                                <Link
                                                    className="inline-flex h-9 items-center justify-center rounded-lg border border-primary-200 bg-primary-50 px-3 text-xs font-semibold text-primary-700 transition hover:bg-primary-100"
                                                    href={login({
                                                        query: {
                                                            redirect: companyShow(company.slug).url,
                                                        },
                                                    }).url}
                                                >
                                                    {t('companies.show.login_to_review')}
                                                </Link>
                                            </div>
                                        ) : null}
                                    </SectionCard>
                                </TabsContent>
                                )}
                            </Tabs>
                        </div>

                        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
                                <h4 className="text-base font-bold text-slate-900">
                                    {t('companies.show.hq_title')}
                                </h4>
                                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                                    <p className="font-semibold text-slate-900">
                                        {hq || t('companies.show.hq_location_unknown')}
                                    </p>
                                    <p className="mt-1 text-xs leading-6">
                                        {company.offices[0]?.address ||
                                            t('companies.show.hq_address_unknown')}
                                    </p>
                                </div>
                                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                                    <ShieldCheck className="size-3.5" />
                                    {t('companies.show.hq_verified_note')}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-primary-200 bg-linear-to-b from-primary-50 to-white p-4 shadow-sm md:p-5">
                                <p className="text-base font-bold text-primary-900">
                                    {t('companies.show.cta_title')}
                                </p>
                                <p className="mt-2 text-xs leading-6 text-primary-900/80">
                                    {t('companies.show.cta_subtitle', { company: company.name })}
                                </p>
                                <Link
                                    className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary-600 px-3 text-sm font-semibold text-white transition hover:bg-primary-700"
                                    href={`${jobsIndex().url}?search=${encodeURIComponent(company.name)}`}
                                >
                                    {t('companies.show.cta_find_jobs')}
                                </Link>
                                <button
                                    className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-xl border border-primary-200 bg-white px-3 text-sm font-semibold text-primary-700 transition hover:border-primary-300 hover:bg-primary-100"
                                    type="button"
                                >
                                    <MessageCircle className="mr-1.5 size-4" />
                                    {t('companies.show.cta_contact_hr')}
                                </button>
                            </div>
                        </aside>
                    </div>
                </div>
            </section>
        </HomeLayout>
    );
}

function BadgeChip({
    label,
    icon,
    variant = 'default',
}: {
    label: string;
    icon?: React.ReactNode;
    variant?: 'default' | 'blue' | 'green' | 'orange';
}) {
    const styles = {
        default: 'border-slate-200 bg-white text-slate-600',
        blue: 'border-blue-100 bg-blue-50 text-blue-700',
        green: 'border-emerald-100 bg-emerald-50 text-emerald-700',
        orange: 'border-primary-100 bg-primary-50 text-primary-700',
    };

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold shadow-sm',
                styles[variant],
            )}
        >
            {icon}
            {label}
        </span>
    );
}

function GlassInfo({ label, value }: { label: string; value: string }) {
    return (
        <div className="min-w-[72px] rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-center backdrop-blur-md">
            <p className="text-[9px] font-bold tracking-[0.18em] text-white/60 uppercase">
                {label}
            </p>
            <p className="mt-1 text-2xl leading-none font-black text-white">
                {value}
            </p>
        </div>
    );
}

function MetaItem({
    icon: Icon,
    text,
}: {
    icon: React.ComponentType<{ className?: string }>;
    text: string;
}) {
    return (
        <span className="inline-flex items-center gap-1.5">
            <Icon className="size-3.5 text-slate-400" />
            {text}
        </span>
    );
}

function SectionCard({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900">
                {title}
            </h3>
            <div className="mt-4">{children}</div>
        </section>
    );
}

function JobPill({ text }: { text: string }) {
    return (
        <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
            {text}
        </span>
    );
}

