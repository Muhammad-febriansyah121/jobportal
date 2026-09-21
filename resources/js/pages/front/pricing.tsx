import { Head, Link } from '@inertiajs/react';
import {
    ArrowRightIcon,
    BotIcon,
    BriefcaseIcon,
    CalendarDaysIcon,
    CheckIcon,
    ChevronDownIcon,
    InfinityIcon,
    MinusIcon,
    SendIcon,
    SparklesIcon,
    StarIcon,
    TargetIcon,
    XIcon,
    ZapIcon,
} from 'lucide-react';
import { useState, type ComponentType } from 'react';
import { useTranslate } from '@/hooks/use-translate';
import HomeLayout from '@/layouts/front/home-layout';
import { register } from '@/routes';

type PlanFeature = {
    label: string;
    included: boolean;
};

type Plan = {
    id: number;
    name: string;
    slug: string;
    price: number;
    duration_days: number;
    active_jobs_limit: number;
    recruiter_seat_limit: number;
    ai_screening_quota: number;
    ai_interview_quota: number;
    talent_search_quota: number;
    features: PlanFeature[];
};

type CandidateMenu = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    ai_interview_quota: number;
    cv_builder_quota: number;
    validity_days: number;
    features: string[];
};

type Props = {
    plans: Plan[];
    candidateMenus: CandidateMenu[];
};

type TranslateFn = (key: string, replacements?: Record<string, string | number>) => string;

function formatPrice(price: number, t: TranslateFn): string {
    if (price === 0) {
        return t('front.pricing.free');
    }

    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(price);
}

function formatDuration(days: number, t: TranslateFn): string {
    if (days === 14) {
        return t('front.pricing.duration_14_days');
    }

    if (days === 365) {
        return t('front.pricing.duration_1_year');
    }

    if (days > 0 && days % 30 === 0) {
        const months = days / 30;

        if (months === 1) {
            return t('front.pricing.duration_1_month');
        }

        if (months === 3) {
            return t('front.pricing.duration_3_months');
        }

        if (months === 6) {
            return t('front.pricing.duration_6_months');
        }

        return t('front.pricing.duration_n_months', { months });
    }

    return t('front.pricing.duration_n_days', { days });
}

const POPULAR_SLUG = 'medium';

type IconType = ComponentType<{ className?: string; strokeWidth?: number }>;

function getFeatureIcon(label: string): IconType {
    const lower = label.toLowerCase();

    if (lower.includes('masa aktif') || lower.includes('hari') || lower.includes('bulan ')) {
        return CalendarDaysIcon;
    }

    if (lower.includes('job posting') || lower.includes('lowongan')) {
        return BriefcaseIcon;
    }

    if (lower.includes('job invitation') || lower.includes('undangan')) {
        return SendIcon;
    }

    if (lower.includes('interview ai') || lower.includes('ai interview')) {
        return BotIcon;
    }

    if (lower.includes('job matching') || lower.includes('matching')) {
        return TargetIcon;
    }

    if (lower.includes('unlimited')) {
        return InfinityIcon;
    }

    return CheckIcon;
}


function FaqList() {
    const { t } = useTranslate();
    const [open, setOpen] = useState<number | null>(null);

    const faqs = [
        {
            q: t('front.pricing.faq_upgrade_q'),
            a: t('front.pricing.faq_upgrade_a'),
        },
        {
            q: t('front.pricing.faq_payment_q'),
            a: t('front.pricing.faq_payment_a'),
        },
        {
            q: t('front.pricing.faq_refund_q'),
            a: t('front.pricing.faq_refund_a'),
        },
        {
            q: t('front.pricing.faq_publish_q'),
            a: t('front.pricing.faq_publish_a'),
        },
        {
            q: t('front.pricing.faq_premium_q'),
            a: t('front.pricing.faq_premium_a'),
        },
        {
            q: t('front.pricing.faq_freeplan_q'),
            a: t('front.pricing.faq_freeplan_a'),
        },
    ];

    return (
        <div className="divide-y divide-border rounded-2xl border border-border">
            {faqs.map((faq, i) => (
                <div key={i}>
                    <button
                        type="button"
                        onClick={() => setOpen(open === i ? null : i)}
                        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-gray-50"
                    >
                        <span className="text-sm font-semibold text-foreground">
                            {faq.q}
                        </span>
                        <ChevronDownIcon
                            className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`}
                        />
                    </button>
                    {open === i && (
                        <div className="px-6 pb-5">
                            <p className="text-sm leading-relaxed text-muted-foreground">
                                {faq.a}
                            </p>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

export default function Pricing({ plans, candidateMenus }: Props) {
    const { t } = useTranslate();

    const paidPlans = plans
        .filter((p) => p.slug !== 'gratis-trial' && p.slug !== 'enterprise')
        .sort((a, b) => a.price - b.price);
    const enterprisePlan = plans.find((p) => p.slug === 'enterprise');
    const topPlans = enterprisePlan ? [...paidPlans, enterprisePlan] : paidPlans;
    const freePlan = plans.find((p) => p.slug === 'gratis-trial');
    const comparisonPlans = plans.filter((p) => p.slug !== 'enterprise');

    const comparisonRows = [
        {
            label: t('front.pricing.row_active_period'),
            get: (p: Plan) => formatDuration(p.duration_days, t),
        },
        {
            label: t('front.pricing.row_active_jobs'),
            get: (p: Plan) => t('front.pricing.value_jobs', { count: p.active_jobs_limit }),
        },
        {
            label: t('front.pricing.row_recruiter_seat'),
            get: (p: Plan) => t('front.pricing.value_accounts', { count: p.recruiter_seat_limit }),
        },
        {
            label: 'Interview AI',
            get: (p: Plan) =>
                p.ai_interview_quota === 0 ? null : `${p.ai_interview_quota}x`,
        },
        {
            label: 'Job Invitation',
            get: (p: Plan) => `${p.talent_search_quota}x`,
        },
        {
            label: 'Job Matching',
            get: (_: Plan) => true,
        },
        {
            label: t('front.pricing.row_unlimited_applications'),
            get: (_: Plan) => true,
        },
    ];

    return (
        <HomeLayout>
            <Head title={t('front.pricing.head_title')} />

            {/* Hero */}
            <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-white to-white pt-32 pb-12 text-center md:pt-36">
                <div className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
                <div className="pointer-events-none absolute top-40 left-10 hidden h-32 w-32 rounded-full bg-blue-400/10 blur-3xl md:block" />
                <div className="pointer-events-none absolute top-20 right-10 hidden h-40 w-40 rounded-full bg-indigo-400/10 blur-3xl md:block" />
                <div className="relative mx-auto max-w-4xl px-4">
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/80 px-4 py-1.5 text-xs font-semibold text-primary shadow-sm backdrop-blur">
                        <SparklesIcon className="size-3.5" />
                        {t('front.pricing.hero_badge')}
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
                        {t('front.pricing.hero_title')}
                    </h1>
                    <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
                        {t('front.pricing.hero_subtitle')}
                    </p>
                </div>
            </section>

            {/* Main pricing cards */}
            <section className="bg-white pb-12">
                <div className="mx-auto max-w-6xl px-4">
                    <div className="grid grid-cols-1 gap-6 pt-6 sm:grid-cols-2 lg:grid-cols-6">
                        {topPlans.map((plan, index) => {
                            const isPopular = plan.slug === POPULAR_SLUG;
                            const isEnterprise = plan.slug === 'enterprise';
                            const total = topPlans.length;
                            const isLastOrphan =
                                total % 2 === 1 && index === total - 1;
                            const lgStart =
                                total === 5 && index === 3
                                    ? 'lg:col-start-2'
                                    : total === 5 && index === 4
                                      ? 'lg:col-start-4'
                                      : total === 4 && index === 3
                                        ? 'lg:col-start-3'
                                        : '';

                            return (
                                <div
                                    key={plan.id}
                                    className={`group relative flex min-w-0 flex-col rounded-3xl p-6 transition-all duration-300 sm:p-7 lg:col-span-2 ${lgStart} ${
                                        isLastOrphan ? 'sm:col-span-2 sm:max-w-md sm:justify-self-center lg:max-w-none lg:justify-self-stretch' : ''
                                    } ${
                                        isPopular
                                            ? 'bg-gradient-to-br from-primary via-primary to-[#0F4C94] text-white shadow-2xl shadow-primary/30'
                                            : isEnterprise
                                              ? 'border-2 border-dashed border-primary/40 bg-gradient-to-br from-primary/5 via-white to-primary/5 hover:-translate-y-1 hover:border-primary/60 hover:shadow-xl'
                                              : 'border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl'
                                    }`}
                                >
                                    {isPopular && (
                                        <>
                                            <div className="pointer-events-none absolute -top-10 left-1/2 h-32 w-48 -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
                                            <div className="absolute -top-3.5 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap">
                                                <span className="inline-flex items-center gap-1 rounded-full bg-white px-3.5 py-1 text-[11px] font-bold text-primary shadow-lg shadow-primary/20">
                                                    <StarIcon
                                                        className="size-3 fill-amber-400 text-amber-400"
                                                        strokeWidth={1.5}
                                                    />
                                                    {t('front.pricing.popular_badge')}
                                                </span>
                                            </div>
                                        </>
                                    )}

                                    <div className="relative mb-6">
                                        <div className="flex items-center justify-between gap-2">
                                            <p
                                                className={`text-[11px] font-bold tracking-[0.18em] uppercase ${isPopular ? 'text-white/70' : 'text-primary'}`}
                                            >
                                                {plan.name}
                                            </p>
                                            {!isEnterprise &&
                                                plan.duration_days >= 90 && (
                                                    <span
                                                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                            isPopular
                                                                ? 'bg-white/15 text-white'
                                                                : 'bg-emerald-50 text-emerald-700'
                                                        }`}
                                                    >
                                                        <ZapIcon
                                                            className="size-2.5"
                                                            strokeWidth={3}
                                                        />
                                                        Hemat
                                                    </span>
                                                )}
                                            {isEnterprise && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                                                    Custom
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-4 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
                                            {isEnterprise ? (
                                                <span className="text-[1.75rem] leading-none font-extrabold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                                                    Hubungi Kami
                                                </span>
                                            ) : (
                                                <span
                                                    className={`text-[1.75rem] leading-none font-extrabold tracking-tight sm:text-3xl lg:text-4xl ${isPopular ? 'text-white' : 'text-foreground'}`}
                                                >
                                                    {formatPrice(
                                                        plan.price,
                                                        t,
                                                    )}
                                                </span>
                                            )}
                                        </div>

                                        <p
                                            className={`mt-2 text-xs ${isPopular ? 'text-white/60' : 'text-muted-foreground'}`}
                                        >
                                            {isEnterprise
                                                ? 'Harga sesuai kebutuhan tim Anda'
                                                : t(
                                                      'front.pricing.duration_active',
                                                      {
                                                          duration:
                                                              formatDuration(
                                                                  plan.duration_days,
                                                                  t,
                                                              ),
                                                      },
                                                  )}
                                        </p>
                                    </div>

                                    <div
                                        className={`relative mb-6 border-t pt-5 ${isPopular ? 'border-white/15' : 'border-slate-100'}`}
                                    >
                                        <ul className="flex flex-1 flex-col gap-3.5">
                                            {plan.features.map((f) => {
                                                const Icon = getFeatureIcon(
                                                    f.label,
                                                );

                                                return (
                                                    <li
                                                        key={f.label}
                                                        className="flex items-start gap-3 text-sm"
                                                    >
                                                        {f.included ? (
                                                            <>
                                                                <span
                                                                    className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md ${isPopular ? 'bg-white/15 text-white' : 'bg-primary/10 text-primary'}`}
                                                                >
                                                                    <Icon
                                                                        className="size-3"
                                                                        strokeWidth={
                                                                            2.5
                                                                        }
                                                                    />
                                                                </span>
                                                                <span
                                                                    className={`leading-snug ${isPopular ? 'text-white/95' : 'text-slate-700'}`}
                                                                >
                                                                    {f.label}
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span
                                                                    className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md ${isPopular ? 'bg-white/10 text-white/40' : 'bg-slate-100 text-slate-400'}`}
                                                                >
                                                                    <XIcon
                                                                        className="size-3"
                                                                        strokeWidth={
                                                                            3
                                                                        }
                                                                    />
                                                                </span>
                                                                <span
                                                                    className={`leading-snug line-through ${isPopular ? 'text-white/50' : 'text-muted-foreground/70'}`}
                                                                >
                                                                    {f.label}
                                                                </span>
                                                            </>
                                                        )}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>

                                    <Link
                                        href={
                                            isEnterprise
                                                ? '/contact'
                                                : register({
                                                      query: {
                                                          type: 'employer',
                                                      },
                                                  })
                                        }
                                        className={`group/btn relative mt-auto flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all active:scale-[0.98] ${
                                            isPopular
                                                ? 'bg-white text-primary shadow-md hover:bg-white/95 hover:shadow-lg'
                                                : isEnterprise
                                                  ? 'border border-primary/30 bg-white text-primary hover:border-primary hover:bg-primary hover:text-white'
                                                  : 'bg-primary text-white hover:bg-[#0F4C94] hover:shadow-md'
                                        }`}
                                    >
                                        {isEnterprise
                                            ? 'Hubungi Tim Sales'
                                            : t('front.pricing.choose_plan')}
                                        <ArrowRightIcon className="size-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                                    </Link>
                                </div>
                            );
                        })}
                    </div>

                    {/* Free plan strip */}
                    {freePlan && (
                        <div className="group relative mt-8 overflow-hidden rounded-2xl border border-dashed border-emerald-300 bg-gradient-to-br from-emerald-50/80 to-white p-6 transition-all hover:border-emerald-400 hover:shadow-md">
                            <div className="pointer-events-none absolute -top-8 -right-8 size-32 rounded-full bg-emerald-200/30 blur-3xl" />
                            <div className="relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                                <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                                            <SparklesIcon className="size-4" />
                                        </span>
                                        <p className="text-base font-bold text-foreground">
                                            {freePlan.name}
                                        </p>
                                        <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold text-white">
                                            {t('front.pricing.free')}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                        {freePlan.features
                                            .filter((f) => f.included)
                                            .map((f) => f.label)
                                            .join(' · ')}
                                    </p>
                                </div>
                                <Link
                                    href={register({
                                        query: { type: 'employer' },
                                    })}
                                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-5 py-2.5 text-sm font-bold text-emerald-700 shadow-sm transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-md"
                                >
                                    {t('front.pricing.start_free')}
                                    <ArrowRightIcon className="size-3.5" />
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Comparison table */}
            <section className="bg-gray-50 py-16">
                <div className="mx-auto max-w-6xl px-4">
                    <div className="mb-10 text-center">
                        <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                            {t('front.pricing.compare_title')}
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {t('front.pricing.compare_subtitle')}
                        </p>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[600px]">
                                <thead>
                                    <tr>
                                        <th className="w-44 border-b border-border px-6 py-5 text-left text-sm font-semibold text-muted-foreground">
                                            {t('front.pricing.feature_col')}
                                        </th>
                                        {comparisonPlans.map((plan) => (
                                            <th
                                                key={plan.id}
                                                className={`border-b border-border px-4 py-5 text-center ${
                                                    plan.slug === POPULAR_SLUG
                                                        ? 'bg-primary/5'
                                                        : ''
                                                }`}
                                            >
                                                <p
                                                    className={`text-sm font-bold ${plan.slug === POPULAR_SLUG ? 'text-primary' : 'text-foreground'}`}
                                                >
                                                    {plan.name}
                                                </p>
                                                <p
                                                    className={`mt-0.5 text-xs font-medium ${plan.slug === POPULAR_SLUG ? 'text-primary/70' : 'text-muted-foreground'}`}
                                                >
                                                    {plan.price === 0
                                                        ? t('front.pricing.free')
                                                        : formatPrice(
                                                              plan.price,
                                                              t,
                                                          )}
                                                </p>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {comparisonRows.map((row, i) => (
                                        <tr
                                            key={row.label}
                                            className={
                                                i % 2 === 1
                                                    ? 'bg-gray-50/60'
                                                    : 'bg-white'
                                            }
                                        >
                                            <td className="px-6 py-4 text-sm font-medium text-foreground">
                                                {row.label}
                                            </td>
                                            {comparisonPlans.map((plan) => {
                                                const val = row.get(plan);

                                                return (
                                                    <td
                                                        key={plan.id}
                                                        className={`px-4 py-4 text-center text-sm ${plan.slug === POPULAR_SLUG ? 'bg-primary/5' : ''}`}
                                                    >
                                                        {val === true ? (
                                                            <CheckIcon
                                                                className="mx-auto size-5 text-primary"
                                                                strokeWidth={
                                                                    2.5
                                                                }
                                                            />
                                                        ) : val === null ? (
                                                            <MinusIcon className="mx-auto size-4 text-muted-foreground/30" />
                                                        ) : (
                                                            <span
                                                                className={`font-medium ${plan.slug === POPULAR_SLUG ? 'text-primary' : 'text-foreground'}`}
                                                            >
                                                                {val as string}
                                                            </span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}

                                    {/* CTA row */}
                                    <tr className="border-t border-border">
                                        <td className="px-6 py-5" />
                                        {comparisonPlans.map((plan) => (
                                            <td
                                                key={plan.id}
                                                className={`px-4 py-5 text-center ${plan.slug === POPULAR_SLUG ? 'bg-primary/5' : ''}`}
                                            >
                                                <Link
                                                    href={register({
                                                        query: {
                                                            type: 'employer',
                                                        },
                                                    })}
                                                    className={`inline-block rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                                                        plan.slug ===
                                                        POPULAR_SLUG
                                                            ? 'bg-primary text-white hover:bg-primary/90'
                                                            : 'border border-border bg-white text-foreground hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {plan.price === 0
                                                        ? t('front.pricing.start_free')
                                                        : t('front.pricing.choose_plan')}
                                                </Link>
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Keterangan fitur */}
                    <div className="mt-8 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
                        <h3 className="text-base font-bold text-foreground sm:text-lg">
                            Keterangan Fitur
                        </h3>
                        <dl className="mt-5 grid gap-5 sm:grid-cols-2">
                            <div>
                                <dt className="text-sm font-semibold text-primary">
                                    Job Invitation
                                </dt>
                                <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                    Cari resume online jobseeker/kandidat yang
                                    potensial dan tawarkan pekerjaan. Untuk
                                    privasi kandidat, email dan nomor WhatsApp
                                    di-hide pada halaman pencarian (akan tampil
                                    setelah kandidat menerima undangan).
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-semibold text-primary">
                                    Interview AI
                                </dt>
                                <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                    Bisa melakukan interview dengan AI untuk
                                    melakukan screening kandidat lebih dulu
                                    sebelum interview manusia.
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-semibold text-primary">
                                    Job Matching
                                </dt>
                                <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                    Melakukan pencocokan otomatis antara
                                    kebutuhan lowongan dengan lamaran yang
                                    di-apply oleh kandidat.
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-semibold text-primary">
                                    Unlimited Job Applications
                                </dt>
                                <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                    Tidak ada batasan jumlah lamaran yang
                                    diterima per lowongan, semua kandidat
                                    yang melamar bisa kamu kelola.
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </section>

            {/* Buat Jobseeker */}
            {candidateMenus.length > 0 && (
                <section className="bg-white py-16">
                    <div className="mx-auto max-w-4xl px-4">
                        <div className="mb-10 text-center">
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary">
                                <SparklesIcon className="size-3.5" />
                                Buat Jobseeker
                            </div>
                            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                                Paket untuk Pencari Kerja
                            </h2>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Tingkatkan peluang lolos interview dengan latihan AI.
                            </p>
                        </div>

                        <div className="grid gap-5 sm:grid-cols-1 md:grid-cols-2">
                            {candidateMenus.map((menu) => (
                                <div
                                    key={menu.id}
                                    className="relative flex flex-col rounded-2xl border border-border bg-white p-6 shadow-sm transition-all hover:shadow-md"
                                >
                                    <div className="mb-5">
                                        <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
                                            {menu.name}
                                        </p>
                                        <div className="mt-3">
                                            <span className="text-4xl font-extrabold text-foreground">
                                                {formatPrice(menu.price, t)}
                                            </span>
                                            {menu.validity_days > 0 && (
                                                <span className="ml-1 text-sm text-muted-foreground">
                                                    /{' '}
                                                    {formatDuration(
                                                        menu.validity_days,
                                                        t,
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                        {menu.description && (
                                            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                                                {menu.description}
                                            </p>
                                        )}
                                    </div>

                                    <ul className="mb-6 flex flex-1 flex-col gap-3">
                                        {menu.features.map((feature) => (
                                            <li
                                                key={feature}
                                                className="flex items-start gap-2.5 text-sm"
                                            >
                                                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                                    <CheckIcon
                                                        className="size-2.5"
                                                        strokeWidth={3}
                                                    />
                                                </span>
                                                <span className="text-foreground">
                                                    {feature}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>

                                    <Link
                                        href={register({
                                            query: { type: 'candidate' },
                                        })}
                                        className="block w-full rounded-xl bg-primary py-3 text-center text-sm font-bold text-white transition-all hover:bg-primary/90 active:scale-[0.98]"
                                    >
                                        Daftar &amp; Topup
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* FAQ */}
            <section className="bg-white py-16">
                <div className="mx-auto max-w-2xl px-4">
                    <div className="mb-10 text-center">
                        <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                            {t('front.pricing.faq_title')}
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {t('front.pricing.faq_contact')}{' '}
                            <a
                                href="mailto:support@karivia.id"
                                className="text-primary hover:underline"
                            >
                                support@karivia.id
                            </a>
                        </p>
                    </div>
                    <FaqList />
                </div>
            </section>
        </HomeLayout>
    );
}
