import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    Calendar,
    Eye,
    MapPin,
    Rocket,
    Sparkles,
    Target,
    Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import HomeLayout from '@/layouts/front/home-layout';

type Faq = { id: number; title: string; description: string };

type AboutProps = {
    about_title: string;
    about_tagline: string;
    about_description: string;
    about_founded_year: string;
    about_employee_count: string;
    about_headquarters: string;
    about_hero_image: string;
    about_office_image: string;
    about_vision: string;
    about_mission: string;
    about_story: string;
    about_values: string;
    faqs: Faq[];
};

function FaqItem({ faq }: { faq: Faq }) {
    const [open, setOpen] = useState(false);

    return (
        <div
            className={`overflow-hidden rounded-2xl transition-all duration-200 ${open ? 'bg-primary/[0.02]' : 'bg-white'}`}
        >
            <button
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-gray-50/60"
            >
                <span className="text-sm font-semibold text-foreground sm:text-base">
                    {faq.title}
                </span>
                <span
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full transition-transform duration-200 ${open ? 'rotate-45 bg-primary/5 text-primary' : 'text-gray-400'}`}
                >
                    <svg
                        className="size-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                        />
                    </svg>
                </span>
            </button>
            {open && (
                <div className="px-6 pb-5">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        {faq.description}
                    </p>
                </div>
            )}
        </div>
    );
}

function ProseBlock({
    html,
    className = '',
}: {
    html: string;
    className?: string;
}) {
    return (
        <div
            className={`prose max-w-none prose-slate prose-headings:font-bold prose-headings:text-foreground prose-h2:text-xl prose-h3:text-base prose-p:leading-relaxed prose-p:text-muted-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-li:text-muted-foreground ${className}`}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}

const VALUE_COLORS = [
    {
        bg: 'bg-primary/5',
        border: 'border-primary/20',
        num: 'bg-primary',
        accent: 'bg-primary/10',
        text: 'text-primary',
    },
    {
        bg: 'bg-primary-50',
        border: 'border-primary-200',
        num: 'bg-primary-500',
        accent: 'bg-primary-50',
        text: 'text-primary-600',
    },
    {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        num: 'bg-emerald-600',
        accent: 'bg-emerald-50',
        text: 'text-emerald-700',
    },
    {
        bg: 'bg-violet-50',
        border: 'border-violet-200',
        num: 'bg-violet-600',
        accent: 'bg-violet-50',
        text: 'text-violet-700',
    },
    {
        bg: 'bg-sky-50',
        border: 'border-sky-200',
        num: 'bg-sky-600',
        accent: 'bg-sky-50',
        text: 'text-sky-700',
    },
    {
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        num: 'bg-rose-500',
        accent: 'bg-rose-50',
        text: 'text-rose-600',
    },
];

function ValuesGrid({ html }: { html: string }) {
    const items = useMemo(() => {
        const div = document.createElement('div');
        div.innerHTML = html;

        return Array.from(div.querySelectorAll('p, li'))
            .filter((el) => el.textContent?.trim())
            .map((el) => {
                const innerHTML = el.innerHTML;
                const strongMatch = innerHTML.match(/<strong>(.*?)<\/strong>/);
                const title = strongMatch ? strongMatch[1] : null;
                const bodyHtml = title
                    ? innerHTML
                          .replace(/<strong>.*?<\/strong>/, '')
                          .replace(/^\s*[\u2014\u2013-]\s*/, '')
                          .trim()
                    : innerHTML;
                return { title, bodyHtml };
            });
    }, [html]);

    if (items.length === 0) {
        return <ProseBlock html={html} />;
    }

    const cols =
        items.length <= 2
            ? 'md:grid-cols-2'
            : items.length === 3
              ? 'md:grid-cols-3'
              : 'sm:grid-cols-2';

    return (
        <div className={`grid gap-5 ${cols}`}>
            {items.map(({ title, bodyHtml }, i) => {
                const c = VALUE_COLORS[i % VALUE_COLORS.length];

                return (
                    <div
                        key={i}
                        className={`group flex flex-col gap-4 rounded-2xl p-6 transition-all duration-200 hover:-translate-y-0.5 ${c.bg}`}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white ${c.num}`}
                            >
                                {String(i + 1).padStart(2, '0')}
                            </div>
                            {title && (
                                <p className="text-base leading-snug font-bold text-foreground">
                                    {title}
                                </p>
                            )}
                        </div>
                        {bodyHtml ? (
                            <p
                                className="text-sm leading-relaxed text-muted-foreground"
                                dangerouslySetInnerHTML={{ __html: bodyHtml }}
                            />
                        ) : !title ? (
                            <div
                                className="text-sm leading-relaxed text-foreground [&_strong]:font-bold [&_strong]:text-foreground"
                                dangerouslySetInnerHTML={{ __html: bodyHtml }}
                            />
                        ) : null}
                    </div>
                );
            })}
        </div>
    );
}

export default function AboutPage({
    about_title,
    about_tagline,
    about_description,
    about_founded_year,
    about_employee_count,
    about_headquarters,
    about_hero_image,
    about_vision,
    about_mission,
    about_story,
    about_values,
    about_office_image,
    faqs,
}: AboutProps) {
    const title = about_title || 'Tentang Kami';

    const companyStats = [
        { icon: Calendar, label: 'Tahun Berdiri', value: about_founded_year },
        { icon: Users, label: 'Jumlah Karyawan', value: about_employee_count },
        { icon: MapPin, label: 'Kantor Pusat', value: about_headquarters },
    ].filter((s) => s.value);

    return (
        <HomeLayout>
            <Head title={title} />

            {/* ── Hero ── */}
            <section className="relative overflow-hidden bg-white">
                {/* Background decoration */}
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -top-40 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-b from-primary/10 to-transparent blur-3xl" />
                    <div className="absolute top-0 right-0 h-72 w-72 rounded-full bg-primary-50 blur-3xl" />
                    <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-primary/5 blur-2xl" />
                </div>

                <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-20 sm:px-6 lg:px-8">
                    <Link
                        href="/"
                        className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-primary"
                    >
                        <ArrowLeft className="size-4" /> Kembali ke Beranda
                    </Link>

                    <div className="grid gap-12 lg:grid-cols-[1fr_480px] lg:items-center">
                        <div>
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
                                <Sparkles className="size-3.5 text-primary" />
                                <span className="text-xs font-semibold text-primary">
                                    Platform Karier #1 Indonesia
                                </span>
                            </div>

                            <h1 className="text-4xl leading-tight font-extrabold text-foreground sm:text-5xl lg:text-6xl">
                                {title}
                            </h1>

                            {about_tagline && (
                                <p className="mt-4 text-lg font-medium text-primary sm:text-xl">
                                    {about_tagline}
                                </p>
                            )}

                            {about_description && (
                                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                                    {about_description}
                                </p>
                            )}

                            {companyStats.length > 0 && (
                                <div className="mt-8 flex flex-wrap gap-4">
                                    {companyStats.map((s) => (
                                        <div
                                            key={s.label}
                                            className="flex items-center gap-2.5 rounded-xl bg-white/80 px-4 py-2.5"
                                        >
                                            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                                                <s.icon className="size-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] tracking-wide text-muted-foreground uppercase">
                                                    {s.label}
                                                </p>
                                                <p className="text-sm font-bold text-foreground">
                                                    {s.value}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {about_hero_image ? (
                            <div className="relative">
                                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/20 to-primary-100/50 blur-xl" />
                                <img
                                    src={`/storage/${about_hero_image}`}
                                    alt={title}
                                    className="relative z-10 h-80 w-full rounded-3xl object-cover lg:h-96"
                                />
                            </div>
                        ) : (
                            <div className="flex h-80 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/10 to-primary-50 lg:h-96">
                                <Building2 className="size-24 text-primary/30" />
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* ── Vision & Mission ── */}
            {(about_vision || about_mission) && (
                <section className="bg-gray-50 px-4 py-16 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-6xl">
                        <div className="mb-10 text-center">
                            <p className="text-xs font-semibold tracking-widest text-primary uppercase">
                                Arah & Tujuan
                            </p>
                            <h2 className="mt-2 text-2xl font-extrabold text-foreground sm:text-3xl">
                                Visi & Misi
                            </h2>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            {about_vision && (
                                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 p-8 text-white">
                                    <div className="pointer-events-none absolute -top-8 -right-8 size-40 rounded-full bg-white/10 blur-2xl" />
                                    <div className="relative">
                                        <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-white/20">
                                            <Eye className="size-6 text-white" />
                                        </div>
                                        <p className="mb-3 text-xs font-semibold tracking-widest text-white/70 uppercase">
                                            Visi
                                        </p>
                                        <p className="text-base leading-relaxed font-medium text-white">
                                            {about_vision}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {about_mission && (
                                <div className="relative overflow-hidden rounded-3xl bg-white p-8">
                                    <div className="pointer-events-none absolute -top-8 -right-8 size-40 rounded-full bg-primary/5 blur-2xl" />
                                    <div className="relative">
                                        <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/10">
                                            <Target className="size-6 text-primary" />
                                        </div>
                                        <p className="mb-3 text-xs font-semibold tracking-widest text-primary uppercase">
                                            Misi
                                        </p>
                                        <ProseBlock html={about_mission} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* ── Story ── */}
            {about_story && (
                <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-6xl">
                        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
                            {about_office_image && (
                                <div className="relative order-last lg:order-first">
                                    <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-primary-50 to-primary/10 blur-xl" />
                                    <img
                                        src={`/storage/${about_office_image}`}
                                        alt="Kantor"
                                        className="relative z-10 h-72 w-full rounded-3xl object-cover lg:h-96"
                                    />
                                </div>
                            )}
                            <div
                                className={
                                    !about_office_image ? 'lg:col-span-2' : ''
                                }
                            >
                                <p className="mb-3 text-xs font-semibold tracking-widest text-primary uppercase">
                                    Latar Belakang
                                </p>
                                <h2 className="mb-6 text-2xl font-extrabold text-foreground sm:text-3xl">
                                    Cerita Kami
                                </h2>
                                <ProseBlock html={about_story} />
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* ── Values ── */}
            {about_values && (
                <section className="bg-gray-50 px-4 py-20 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-6xl">
                        <div className="mb-12 text-center">
                            <p className="text-xs font-semibold tracking-widest text-primary uppercase">
                                DNA Perusahaan
                            </p>
                            <h2 className="mt-2 text-2xl font-extrabold text-foreground sm:text-3xl">
                                Nilai-Nilai Kami
                            </h2>
                            <p className="mt-3 text-sm text-muted-foreground">
                                Prinsip yang menjadi landasan kami dalam setiap
                                langkah
                            </p>
                        </div>
                        <ValuesGrid html={about_values} />
                    </div>
                </section>
            )}

            {/* ── FAQ ── */}
            {faqs.length > 0 && (
                <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-3xl">
                        <div className="mb-10 text-center">
                            <p className="text-xs font-semibold tracking-widest text-primary uppercase">
                                FAQ
                            </p>
                            <h2 className="mt-2 text-2xl font-extrabold text-foreground sm:text-3xl">
                                Pertanyaan yang Sering Diajukan
                            </h2>
                            <p className="mt-3 text-sm text-muted-foreground">
                                Tidak menemukan jawaban?{' '}
                                <Link
                                    href="/contact"
                                    className="font-semibold text-primary hover:underline"
                                >
                                    Hubungi kami
                                </Link>
                                .
                            </p>
                        </div>
                        <div className="space-y-3">
                            {faqs.map((faq) => (
                                <FaqItem key={faq.id} faq={faq} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── CTA ── */}
            <section className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/80 px-4 py-16 sm:px-6 lg:px-8">
                <div className="pointer-events-none absolute -top-16 -left-16 size-64 rounded-full bg-white/10 blur-3xl" />
                <div className="pointer-events-none absolute -right-16 -bottom-16 size-64 rounded-full bg-primary-300/20 blur-3xl" />
                <div className="relative mx-auto max-w-2xl text-center">
                    <div className="mb-4 inline-flex size-14 items-center justify-center rounded-2xl bg-white/20">
                        <Rocket className="size-7 text-white" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
                        Siap Mulai Perjalanan Kariermu?
                    </h2>
                    <p className="mt-3 text-sm text-white/80 sm:text-base">
                        Bergabung dengan ratusan ribu pencari kerja yang telah
                        mempercayai Karivia.
                    </p>
                    <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                        <Link
                            href="/jobs"
                            className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-bold text-primary transition hover:bg-white/90"
                        >
                            Cari Lowongan
                        </Link>
                        <Link
                            href="/register"
                            className="inline-flex items-center justify-center rounded-full border-2 border-white/40 px-7 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                        >
                            Daftar Gratis
                        </Link>
                    </div>
                </div>
            </section>
        </HomeLayout>
    );
}
