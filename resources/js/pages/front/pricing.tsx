import { Head, Link } from '@inertiajs/react';
import {
    CheckIcon,
    ChevronDownIcon,
    MinusIcon,
    SparklesIcon,
    XIcon,
} from 'lucide-react';
import { useState } from 'react';
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

    if (days === 30) {
        return t('front.pricing.duration_1_month');
    }

    if (days === 90) {
        return t('front.pricing.duration_3_months');
    }

    if (days === 180) {
        return t('front.pricing.duration_6_months');
    }

    if (days === 365) {
        return t('front.pricing.duration_1_year');
    }

    return t('front.pricing.duration_n_days', { days });
}

const POPULAR_SLUG = 'medium';

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

    const topPlans = plans.filter(
        (p) => p.slug !== 'gratis-trial' && p.slug !== 'enterprise',
    );
    const freePlan = plans.find((p) => p.slug === 'gratis-trial');
    const enterprisePlan = plans.find((p) => p.slug === 'enterprise');
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
            <section className="relative overflow-hidden bg-white pt-20 pb-4 text-center">
                <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
                <div className="relative mx-auto max-w-3xl px-4">
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary">
                        <SparklesIcon className="size-3.5" />
                        {t('front.pricing.hero_badge')}
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                        {t('front.pricing.hero_title')}
                    </h1>
                    <p className="mt-4 text-base text-muted-foreground">
                        {t('front.pricing.hero_subtitle')}
                    </p>
                </div>
            </section>

            {/* Main pricing cards */}
            <section className="bg-white py-12">
                <div className="mx-auto max-w-6xl px-4">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {topPlans.map((plan) => {
                            const isPopular = plan.slug === POPULAR_SLUG;

                            return (
                                <div
                                    key={plan.id}
                                    className={`relative flex flex-col rounded-2xl border p-6 transition-all ${
                                        isPopular
                                            ? 'border-primary bg-primary text-white shadow-2xl shadow-primary/25'
                                            : 'border-border bg-white shadow-sm hover:shadow-md'
                                    }`}
                                >
                                    {isPopular && (
                                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-primary shadow-sm">
                                                ✦ {t('front.pricing.popular_badge')}
                                            </span>
                                        </div>
                                    )}

                                    <div className="mb-5">
                                        <p
                                            className={`text-xs font-bold tracking-widest uppercase ${isPopular ? 'text-white/70' : 'text-muted-foreground'}`}
                                        >
                                            {plan.name}
                                        </p>
                                        <div className="mt-3">
                                            <span
                                                className={`text-4xl font-extrabold ${isPopular ? 'text-white' : 'text-foreground'}`}
                                            >
                                                {formatPrice(plan.price, t)}
                                            </span>
                                            {plan.price > 0 && (
                                                <span
                                                    className={`ml-1 text-sm ${isPopular ? 'text-white/60' : 'text-muted-foreground'}`}
                                                >
                                                    /
                                                    {formatDuration(
                                                        plan.duration_days,
                                                        t,
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                        <p
                                            className={`mt-1 text-xs ${isPopular ? 'text-white/60' : 'text-muted-foreground'}`}
                                        >
                                            {t('front.pricing.duration_active', {
                                                duration: formatDuration(plan.duration_days, t),
                                            })}
                                        </p>
                                    </div>

                                    <ul className="mb-6 flex flex-1 flex-col gap-3">
                                        {plan.features.map((f) => (
                                            <li
                                                key={f.label}
                                                className="flex items-start gap-2.5 text-sm"
                                            >
                                                {f.included ? (
                                                    <>
                                                        <span
                                                            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${isPopular ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}`}
                                                        >
                                                            <CheckIcon
                                                                className="size-2.5"
                                                                strokeWidth={3}
                                                            />
                                                        </span>
                                                        <span
                                                            className={
                                                                isPopular
                                                                    ? 'text-white/90'
                                                                    : 'text-foreground'
                                                            }
                                                        >
                                                            {f.label}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span
                                                            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${isPopular ? 'bg-white/10 text-white/60' : 'bg-gray-100 text-gray-400'}`}
                                                        >
                                                            <XIcon
                                                                className="size-2.5"
                                                                strokeWidth={3}
                                                            />
                                                        </span>
                                                        <span
                                                            className={`line-through ${isPopular ? 'text-white/50' : 'text-muted-foreground/60'}`}
                                                        >
                                                            {f.label}
                                                        </span>
                                                    </>
                                                )}
                                            </li>
                                        ))}
                                    </ul>

                                    <Link
                                        href={register({
                                            query: { type: 'employer' },
                                        })}
                                        className={`block w-full rounded-xl py-3 text-center text-sm font-bold transition-all active:scale-[0.98] ${
                                            isPopular
                                                ? 'bg-white text-primary hover:bg-white/90'
                                                : 'bg-primary text-white hover:bg-primary/90'
                                        }`}
                                    >
                                        {t('front.pricing.choose_plan')}
                                    </Link>
                                </div>
                            );
                        })}
                    </div>

                    {/* Free plan strip */}
                    {freePlan && (
                        <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl border border-dashed border-border bg-gray-50 px-8 py-5 sm:flex-row">
                            <div>
                                <p className="font-semibold text-foreground">
                                    {freePlan.name}
                                    <span className="ml-2 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                                        {t('front.pricing.free')}
                                    </span>
                                </p>
                                <p className="mt-0.5 text-sm text-muted-foreground">
                                    {freePlan.features
                                        .filter((f) => f.included)
                                        .map((f) => f.label)
                                        .join(' · ')}
                                </p>
                            </div>
                            <Link
                                href={register({ query: { type: 'employer' } })}
                                className="shrink-0 rounded-xl border border-border bg-white px-6 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-gray-100"
                            >
                                {t('front.pricing.start_free')}
                            </Link>
                        </div>
                    )}

                    {/* Enterprise plan strip */}
                    {enterprisePlan && (
                        <div className="mt-4 flex flex-col items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-primary/5 px-8 py-5 sm:flex-row">
                            <div>
                                <p className="font-semibold text-foreground">
                                    {enterprisePlan.name}
                                    <span className="ml-2 rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-white">
                                        Costume Plan
                                    </span>
                                </p>
                                <p className="mt-0.5 text-sm text-muted-foreground">
                                    {enterprisePlan.features
                                        .filter((f) => f.included)
                                        .map((f) => f.label)
                                        .join(' · ')}
                                </p>
                            </div>
                            <Link
                                href="/contact"
                                className="shrink-0 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
                            >
                                Hubungi Tim Sales
                            </Link>
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
