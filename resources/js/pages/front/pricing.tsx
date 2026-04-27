import { Head, Link } from '@inertiajs/react';
import {
    CheckIcon,
    ChevronDownIcon,
    MinusIcon,
    SparklesIcon,
    XIcon,
} from 'lucide-react';
import { useState } from 'react';
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
    talent_search_quota: number;
    features: PlanFeature[];
};

type Props = {
    plans: Plan[];
};

function formatPrice(price: number): string {
    if (price === 0) {
        return 'Gratis';
    }

    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(price);
}

function formatDuration(days: number): string {
    if (days === 14) {
        return '14 Hari';
    }

    if (days === 30) {
        return '1 Bulan';
    }

    if (days === 90) {
        return '3 Bulan';
    }

    if (days === 180) {
        return '6 Bulan';
    }

    if (days === 365) {
        return '1 Tahun';
    }

    return `${days} Hari`;
}

const POPULAR_SLUG = 'medium';

const faqs = [
    {
        q: 'Apakah saya bisa upgrade atau downgrade paket?',
        a: 'Ya, kamu bisa upgrade ke paket yang lebih tinggi kapan saja. Sisa masa aktif paket lama akan diperhitungkan secara proporsional.',
    },
    {
        q: 'Metode pembayaran apa saja yang diterima?',
        a: 'Kami menerima transfer bank, virtual account, kartu kredit/debit, serta dompet digital seperti GoPay, OVO, dan Dana.',
    },
    {
        q: 'Apakah ada refund jika saya tidak puas?',
        a: 'Kami menawarkan garansi uang kembali dalam 7 hari setelah pembelian jika kamu belum menggunakan fitur berbayar apapun.',
    },
    {
        q: 'Apakah lowongan saya langsung tayang setelah membeli paket?',
        a: 'Ya, setelah pembayaran dikonfirmasi lowongan kamu langsung aktif dan bisa dilihat oleh kandidat di platform kami.',
    },
    {
        q: 'Apa perbedaan Job Posting Reguler dan Premium?',
        a: 'Job Posting Premium ditampilkan di bagian teratas hasil pencarian dan mendapat label "Premium" sehingga lebih banyak dilihat oleh kandidat.',
    },
    {
        q: 'Apakah paket Gratis perlu kartu kredit?',
        a: 'Tidak. Paket Gratis (Trial) bisa langsung digunakan tanpa memasukkan informasi pembayaran apapun.',
    },
];

function FaqList() {
    const [open, setOpen] = useState<number | null>(null);

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

const comparisonRows = [
    {
        label: 'Masa Aktif',
        get: (p: Plan) => formatDuration(p.duration_days),
    },
    {
        label: 'Job Posting Aktif',
        get: (p: Plan) => `${p.active_jobs_limit} lowongan`,
    },
    {
        label: 'Recruiter Seat',
        get: (p: Plan) => `${p.recruiter_seat_limit} akun`,
    },
    {
        label: 'AI Screening',
        get: (p: Plan) =>
            p.ai_screening_quota === 0 ? null : `${p.ai_screening_quota}x`,
    },
    {
        label: 'Talent Search',
        get: (p: Plan) => `${p.talent_search_quota}x`,
    },
    {
        label: 'Unlimited Lamaran',
        get: (_: Plan) => true,
    },
];

export default function Pricing({ plans }: Props) {
    const topPlans = plans.filter((p) => p.slug !== 'gratis-trial');
    const freePlan = plans.find((p) => p.slug === 'gratis-trial');

    return (
        <HomeLayout>
            <Head title="Pricing" />

            {/* Hero */}
            <section className="relative overflow-hidden bg-white pt-20 pb-4 text-center">
                <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
                <div className="relative mx-auto max-w-3xl px-4">
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary">
                        <SparklesIcon className="size-3.5" />
                        Harga Transparan, Tanpa Biaya Tersembunyi
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                        Paket untuk Setiap Skala Bisnis
                    </h1>
                    <p className="mt-4 text-base text-muted-foreground">
                        Mulai gratis, upgrade kapan saja sesuai kebutuhan
                        rekrutmen kamu.
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
                                                ✦ Terpopuler
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
                                                {formatPrice(plan.price)}
                                            </span>
                                            {plan.price > 0 && (
                                                <span
                                                    className={`ml-1 text-sm ${isPopular ? 'text-white/60' : 'text-muted-foreground'}`}
                                                >
                                                    /
                                                    {formatDuration(
                                                        plan.duration_days,
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                        <p
                                            className={`mt-1 text-xs ${isPopular ? 'text-white/60' : 'text-muted-foreground'}`}
                                        >
                                            {formatDuration(plan.duration_days)}{' '}
                                            masa aktif
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
                                        Pilih Paket
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
                                        Gratis
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
                                Mulai Gratis
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
                            Perbandingan Lengkap
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Pilih paket yang paling sesuai dengan kebutuhan tim
                            rekrutmen kamu.
                        </p>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[600px]">
                                <thead>
                                    <tr>
                                        <th className="w-44 border-b border-border px-6 py-5 text-left text-sm font-semibold text-muted-foreground">
                                            Fitur
                                        </th>
                                        {plans.map((plan) => (
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
                                                        ? 'Gratis'
                                                        : formatPrice(
                                                              plan.price,
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
                                            {plans.map((plan) => {
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
                                        {plans.map((plan) => (
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
                                                        ? 'Mulai Gratis'
                                                        : 'Pilih Paket'}
                                                </Link>
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="bg-white py-16">
                <div className="mx-auto max-w-2xl px-4">
                    <div className="mb-10 text-center">
                        <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                            Pertanyaan yang Sering Diajukan
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Belum menemukan jawaban? Hubungi kami di{' '}
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
