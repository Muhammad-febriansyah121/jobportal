import { Link, usePage } from '@inertiajs/react';
import { motion } from 'motion/react';
import { useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Marquee } from '@/components/ui/marquee';
import { NumberTicker } from '@/components/ui/number-ticker';
import { useTranslate } from '@/hooks/use-translate';
import { login } from '@/routes';
import {
    index as careerResourcesIndex,
    show as careerResourcesShow,
} from '@/routes/career-resources';
import { save, unsave } from '@/routes/candidate/jobs';
import { index as jobsIndex, show } from '@/routes/jobs';

type HeroJob = {
    id: number;
    slug: string;
    title: string;
    is_anonymous: boolean;
    company?: string | null;
    type: string;
    work_mode: string;
    location: string;
    salary: string;
    is_saved: boolean;
};

type Industry = {
    id: number;
    name: string;
    jobs_count: number;
};

type Stats = {
    active_jobs: number;
    active_companies: number;
    total_candidates: number;
};

type RegisteredCompany = {
    id: number;
    name: string;
    slug: string;
    logo_url: string | null;
    hq_city: string | null;
    is_verified: boolean;
};

type CareerResourceItem = {
    id: number;
    title: string;
    slug: string;
    type: string;
    category?: string | null;
    thumbnail_path?: string | null;
    published_at?: string | null;
};

type FaqItem = {
    id: number;
    title: string;
    description: string;
};

type HeroSectionProps = {
    jobs: HeroJob[];
    stats: Stats;
    industries: Industry[];
    registeredCompanies: RegisteredCompany[];
    latestCareerResources: CareerResourceItem[];
    faqs: FaqItem[];
};

type PageProps = {
    auth?: { user?: { role?: string } | null };
};

const ease = [0.22, 1, 0.36, 1] as const;

const heroContainer = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};
const heroItem = {
    hidden: { opacity: 0, y: 22 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease } },
};
const heroRight = {
    hidden: { opacity: 0, x: 48 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.75, delay: 0.35, ease } },
};

const fadeUp = {
    hidden: { opacity: 0, y: 32 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};
const staggerWrap = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08, delayChildren: 0.06 } },
};
const staggerChild = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};
const slideInLeft = {
    hidden: { opacity: 0, x: -44 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.65, ease } },
};
const slideInRight = {
    hidden: { opacity: 0, x: 44 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.65, ease } },
};
const vp = { once: true, amount: 0.15 } as const;

const popularSearches = [
    'Software Engineer',
    'Marketing',
    'UI/UX Designer',
    'Data Analyst',
    'Finance',
];

type Testimonial = {
    id: number;
    name: string;
    role: string;
    company: string;
    avatar: string;
    rating: number;
    text: string;
};

const TESTIMONIALS: Testimonial[] = [
    { id: 1, name: 'Rizky Pratama', role: 'Software Engineer', company: 'Tokopedia', avatar: 'RP', rating: 5, text: 'Dalam 2 minggu pakai Karivia langsung dapat 3 panggilan interview. AI matching-nya benar-benar akurat sesuai skill saya!' },
    { id: 2, name: 'Sari Dewi', role: 'Product Manager', company: 'Gojek', avatar: 'SD', rating: 5, text: 'Fitur AI Interview Simulator sangat membantu persiapan interview saya. Skor meningkat dari 65 ke 89 sebelum interview asli.' },
    { id: 3, name: 'Budi Santoso', role: 'Data Analyst', company: 'Traveloka', avatar: 'BS', rating: 5, text: 'CV saya langsung dioptimasi AI dan bisa dilihat HR lebih banyak. Proses lamaran jauh lebih mudah dan transparan.' },
    { id: 4, name: 'Anisa Rahmawati', role: 'UX Designer', company: 'Shopee', avatar: 'AR', rating: 5, text: 'Karivia membantu saya pindah dari agency ke startup impian. Rekomendasi lowongannya sangat relevan dengan portfolio saya.' },
    { id: 5, name: 'Dimas Arya', role: 'Backend Developer', company: 'Bukalapak', avatar: 'DA', rating: 5, text: 'Transparansi gaji di setiap lowongan sangat membantu negosiasi. Tidak perlu tebak-tebakan lagi soal salary range.' },
    { id: 6, name: 'Putri Handayani', role: 'Marketing Manager', company: 'Grab', avatar: 'PH', rating: 5, text: 'Dashboard lamaran real-time bikin saya tahu persis di tahap mana setiap aplikasi. Tidak ada lagi ghosting dari recruiter!' },
    { id: 7, name: 'Fajar Nugroho', role: 'DevOps Engineer', company: 'Tiket.com', avatar: 'FN', rating: 5, text: 'AI Skill Assessment-nya membantu saya tahu gap skill apa yang perlu diisi. Sekarang sudah naik level ke senior engineer.' },
    { id: 8, name: 'Maya Kusuma', role: 'HR Specialist', company: 'BCA', avatar: 'MK', rating: 4, text: 'Sebagai HR, Karivia memudahkan kami menemukan kandidat berkualitas. Screening AI menghemat waktu kami 70% dibanding sebelumnya.' },
    { id: 9, name: 'Hendra Wijaya', role: 'Finance Analyst', company: 'Mandiri', avatar: 'HW', rating: 5, text: 'Fresh graduate tapi bisa bersaing dengan kandidat berpengalaman berkat rekomendasi skill dan panduan karir dari AI Karivia.' },
    { id: 10, name: 'Lina Octavia', role: 'Content Strategist', company: 'Kompas', avatar: 'LO', rating: 5, text: 'Pindah kota dan cari kerja baru terasa mudah. Filter lokasi dan remote work-nya sangat membantu proses relokasi saya.' },
];

const AVATAR_BG_COLORS = [
    'bg-violet-500', 'bg-blue-500', 'bg-emerald-500',
    'bg-rose-500', 'bg-amber-500', 'bg-cyan-500',
    'bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 'bg-pink-500',
];

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
    const { t } = useTranslate();
    const bgColor = AVATAR_BG_COLORS[(testimonial.id - 1) % AVATAR_BG_COLORS.length];
    return (
        <div className="relative w-76 shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">
            {/* Top accent */}
            <div className="absolute top-0 left-0 h-0.5 w-full bg-linear-to-r from-primary/70 via-blue-400/50 to-transparent" />

            {/* Header: quote + stars */}
            <div className="mb-3 flex items-center justify-between">
                <svg className="size-6 text-primary/12" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <svg key={i} className={`size-3 ${i < testimonial.rating ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    ))}
                </div>
            </div>

            {/* Review text */}
            <p className="mb-5 text-[13px] leading-relaxed text-gray-600">{testimonial.text}</p>

            {/* Author */}
            <div className="flex items-center gap-3 border-t border-gray-50 pt-4">
                <div className={`flex size-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-sm ${bgColor}`}>
                    {testimonial.avatar}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="truncate text-[11px] text-gray-400">{testimonial.role} · {testimonial.company}</p>
                </div>
                <div className="shrink-0 rounded-full bg-emerald-50 p-1" title={t('home.hero.card.verified')}>
                    <svg className="size-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.403 12.652a3 3 0 000-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.883l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                    </svg>
                </div>
            </div>
        </div>
    );
}

const workModeStyle: Record<string, string> = {
    Remote: 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-200',
    Hybrid: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200',
    Onsite: 'bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200',
};

type StepKey = '1' | '2' | '3';

const STEP_KEYS: { number: string; key: StepKey }[] = [
    { number: '01', key: '1' },
    { number: '02', key: '2' },
    { number: '03', key: '3' },
];

function getIndustryIcon(name: string): React.ReactNode {
    const n = name.toLowerCase();

    if (n.includes('tech') || n.includes('software') || n.includes('it ')) {
        return (
            <svg
                className="size-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
            </svg>
        );
    }

    if (n.includes('financ') || n.includes('bank')) {
        return (
            <svg
                className="size-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
            </svg>
        );
    }

    if (n.includes('health')) {
        return (
            <svg
                className="size-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
            </svg>
        );
    }

    if (n.includes('educat')) {
        return (
            <svg
                className="size-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                />
            </svg>
        );
    }

    if (n.includes('retail') || n.includes('commerce')) {
        return (
            <svg
                className="size-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
            </svg>
        );
    }

    if (n.includes('logistic') || n.includes('transport')) {
        return (
            <svg
                className="size-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
                />
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1"
                />
            </svg>
        );
    }

    if (n.includes('manufactur')) {
        return (
            <svg
                className="size-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
            </svg>
        );
    }

    if (
        n.includes('media') ||
        n.includes('entertainment') ||
        n.includes('creative')
    ) {
        return (
            <svg
                className="size-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
            </svg>
        );
    }

    if (n.includes('energy') || n.includes('mining')) {
        return (
            <svg
                className="size-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                />
            </svg>
        );
    }

    if (n.includes('construct') || n.includes('real estate')) {
        return (
            <svg
                className="size-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
            </svg>
        );
    }

    if (n.includes('hospital') || n.includes('tourism')) {
        return (
            <svg
                className="size-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
            </svg>
        );
    }

    if (n.includes('government') || n.includes('public')) {
        return (
            <svg
                className="size-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                />
            </svg>
        );
    }

    if (n.includes('agricultur')) {
        return (
            <svg
                className="size-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
            </svg>
        );
    }

    if (n.includes('non-profit') || n.includes('ngo')) {
        return (
            <svg
                className="size-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
            </svg>
        );
    }

    return (
        <svg
            className="size-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
        </svg>
    );
}

function getIndustryColor(name: string): { bg: string; text: string } {
    const n = name.toLowerCase();
    if (n.includes('tech') || n.includes('software') || n.includes('it '))
        return { bg: 'bg-blue-50', text: 'text-blue-600' };
    if (n.includes('financ') || n.includes('bank'))
        return { bg: 'bg-emerald-50', text: 'text-emerald-600' };
    if (n.includes('health'))
        return { bg: 'bg-rose-50', text: 'text-rose-600' };
    if (n.includes('educat'))
        return { bg: 'bg-amber-50', text: 'text-amber-600' };
    if (n.includes('retail') || n.includes('commerce'))
        return { bg: 'bg-orange-50', text: 'text-orange-600' };
    if (n.includes('logistic') || n.includes('transport'))
        return { bg: 'bg-cyan-50', text: 'text-cyan-600' };
    if (n.includes('manufactur'))
        return { bg: 'bg-slate-100', text: 'text-slate-600' };
    if (n.includes('media') || n.includes('entertainment') || n.includes('creative'))
        return { bg: 'bg-purple-50', text: 'text-purple-600' };
    if (n.includes('energy') || n.includes('mining'))
        return { bg: 'bg-yellow-50', text: 'text-yellow-600' };
    if (n.includes('construct') || n.includes('real estate'))
        return { bg: 'bg-stone-100', text: 'text-stone-600' };
    if (n.includes('hospital') || n.includes('tourism'))
        return { bg: 'bg-teal-50', text: 'text-teal-600' };
    if (n.includes('government') || n.includes('public'))
        return { bg: 'bg-indigo-50', text: 'text-indigo-600' };
    if (n.includes('agricultur'))
        return { bg: 'bg-lime-50', text: 'text-lime-600' };
    if (n.includes('non-profit') || n.includes('ngo'))
        return { bg: 'bg-pink-50', text: 'text-pink-600' };
    return { bg: 'bg-primary/8', text: 'text-primary' };
}

function CompanyCard({ company }: { company: RegisteredCompany }) {
    const initials = company.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
        <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-xs">
            {company.logo_url ? (
                <img
                    src={company.logo_url}
                    alt={company.name}
                    className="size-9 rounded-xl object-cover"
                />
            ) : (
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary-400 text-[11px] font-bold text-white">
                    {initials}
                </div>
            )}
            <div className="min-w-0">
                <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold text-gray-800">
                        {company.name}
                    </span>
                    {company.is_verified && (
                        <svg
                            className="size-3.5 shrink-0 text-blue-500"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                        </svg>
                    )}
                </div>
                {company.hq_city && (
                    <span className="text-[11px] text-gray-400">
                        {company.hq_city}
                    </span>
                )}
            </div>
        </div>
    );
}

const RESOURCE_TYPE_META: Record<
    string,
    { labelKey: string; color: string; bg: string; gradient: string; icon: string }
> = {
    article: {
        labelKey: 'home.resources.type.article',
        color: 'text-sky-700',
        bg: 'bg-sky-50',
        gradient: 'from-sky-400/80 via-blue-500/60 to-indigo-600/80',
        icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 12h6m-6-4h4',
    },
    guide: {
        labelKey: 'home.resources.type.guide',
        color: 'text-emerald-700',
        bg: 'bg-emerald-50',
        gradient: 'from-emerald-400/80 via-teal-500/60 to-cyan-600/80',
        icon: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25',
    },
    video: {
        labelKey: 'home.resources.type.video',
        color: 'text-rose-700',
        bg: 'bg-rose-50',
        gradient: 'from-rose-400/80 via-pink-500/60 to-fuchsia-600/80',
        icon: 'M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
    },
    template: {
        labelKey: 'home.resources.type.template',
        color: 'text-violet-700',
        bg: 'bg-violet-50',
        gradient: 'from-violet-400/80 via-purple-500/60 to-indigo-600/80',
        icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    },
};

const AVATAR_COLORS = [
    'bg-red-500', 'bg-blue-500', 'bg-violet-500',
    'bg-emerald-500', 'bg-orange-500', 'bg-pink-500',
];

function companyInitials(name: string): string {
    return name.split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase();
}

type HeroIllustrationProps = {
    job?: HeroJob | null;
    stats: Stats;
    companies: RegisteredCompany[];
};

function HeroIllustration({ job, stats, companies }: HeroIllustrationProps) {
    const topCompanies = companies.slice(0, 4);
    const { t } = useTranslate();

    return (
        <div className="relative mx-auto h-65 w-full max-w-85 select-none sm:h-105 sm:max-w-105 lg:mx-0 lg:h-125 lg:max-w-115">
            {/* Ambient glow */}
            <div className="absolute inset-0">
                <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/6 blur-[80px]" />
            </div>

            {/* Decorative dots grid */}
            <div className="absolute top-4 right-4 hidden grid-cols-4 gap-1.5 opacity-20 sm:grid">
                {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className="size-1 rounded-full bg-primary" />
                ))}
            </div>
            <div className="absolute bottom-14 left-2 hidden grid-cols-3 gap-1.5 opacity-15 sm:grid">
                {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="size-1 rounded-full bg-gray-400" />
                ))}
            </div>

            {/* ── Card 1: Job Match (top-left) ── */}
            <div
                className="absolute top-0 left-0 w-52 rounded-2xl border border-gray-100 bg-white p-3 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.12)] sm:w-64 sm:p-3.5 lg:w-72 lg:p-4"
                style={{ transform: 'rotate(-2.5deg)', animation: 'heroFloat1 5s ease-in-out infinite' }}
            >
                <div className="mb-2 flex items-start justify-between gap-2 sm:mb-3">
                    <div className="flex items-center gap-2">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary text-xs font-black text-white shadow-sm sm:size-10 sm:text-sm">
                            {job ? companyInitials(job.company ?? 'K') : 'TK'}
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-gray-900 sm:text-xs">
                                {job?.company ?? 'Tokopedia'}
                            </p>
                            <p className="text-[10px] text-gray-400 sm:text-[11px]">
                                {job ? `${job.location} · ${job.work_mode}` : 'Jakarta · Remote'}
                            </p>
                        </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-600 ring-1 ring-emerald-200/60 ring-inset sm:px-2.5 sm:py-1 sm:text-[10px]">
                        98% match
                    </span>
                </div>
                <p className="truncate text-xs font-bold text-gray-900 sm:text-sm">
                    {job?.title ?? 'Senior Product Manager'}
                </p>
                <div className="mt-1.5 flex items-center justify-between gap-2 sm:mt-2">
                    <span className="truncate text-[10px] text-gray-500 sm:text-[11px]">
                        {job?.salary && job.salary !== 'Salary tidak ditampilkan' ? job.salary : 'Rp 20jt – 35jt / bln'}
                    </span>
                    <span className="shrink-0 rounded-full bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold text-blue-600 sm:px-2 sm:text-[10px]">
                        {job?.type ?? 'Full-time'}
                    </span>
                </div>
                <div className="mt-2 h-px bg-gray-100 sm:mt-3" />
                <div className="mt-2 flex gap-1.5 sm:mt-3">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] text-gray-500 sm:text-[10px]">AI Matched</span>
                    <span className="rounded-full bg-primary/8 px-2 py-0.5 text-[9px] text-primary sm:text-[10px]">Top Pick</span>
                </div>
            </div>

            {/* ── Card 2: AI Interview Score (center-right) ── */}
            <div
                className="absolute top-28 right-0 hidden w-48 rounded-2xl border border-gray-100 bg-white p-3 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.12)] sm:block sm:top-36 sm:w-52 lg:w-60 lg:p-4"
                style={{ transform: 'rotate(2deg)', animation: 'heroFloat2 5.5s ease-in-out infinite' }}
            >
                <div className="mb-2 flex items-center gap-2 sm:mb-3">
                    <div className="flex size-6 items-center justify-center rounded-lg bg-primary/10 sm:size-7">
                        <svg className="size-3.5 text-primary sm:size-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                        </svg>
                    </div>
                    <span className="text-[10px] font-bold text-gray-700 sm:text-xs">AI Interview Score</span>
                </div>
                <div className="mb-1.5 flex items-end gap-1 sm:mb-2">
                    <span className="text-3xl font-black tracking-tight text-primary sm:text-4xl">89</span>
                    <span className="mb-1 text-xs font-medium text-gray-400 sm:mb-1.5 sm:text-sm">/100</span>
                </div>
                <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-gray-100 sm:mb-3 sm:h-2">
                    <div className="h-full rounded-full bg-linear-to-r from-primary to-blue-400" style={{ width: '89%' }} />
                </div>
                <div className="rounded-xl bg-gray-50 p-2 sm:p-2.5">
                    <p className="text-[10px] leading-relaxed text-gray-500 sm:text-[11px]">
                        "{t('home.hero.card.score_quote')}"
                    </p>
                </div>
            </div>

            {/* ── Card 4: Live Stats (bottom-right) ── */}
            <div
                className="absolute right-2 bottom-16 hidden w-44 rounded-2xl border border-gray-100 bg-white p-3 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.10)] sm:block sm:right-4 sm:bottom-20 lg:w-48 lg:p-3.5"
                style={{ animation: 'heroFloat4 4.8s ease-in-out infinite' }}
            >
                <div className="mb-2.5 flex items-center gap-1.5">
                    <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
                    <span className="text-[10px] font-bold text-gray-700">{t('home.hero.card.platform_active')}</span>
                </div>
                <div className="mb-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-400">{t('home.hero.card.jobs')}</span>
                        <span className="text-[11px] font-bold text-primary">
                            {stats.active_jobs > 0 ? `${stats.active_jobs.toLocaleString('id')}+` : '1.000+'}
                        </span>
                    </div>
                    <div className="h-px bg-gray-50" />
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-400">{t('home.hero.stats.companies')}</span>
                        <span className="text-[11px] font-bold text-primary">
                            {stats.active_companies > 0 ? `${stats.active_companies.toLocaleString('id')}+` : '500+'}
                        </span>
                    </div>
                    <div className="h-px bg-gray-50" />
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-400">{t('home.hero.stats.candidates')}</span>
                        <span className="text-[11px] font-bold text-primary">
                            {stats.total_candidates > 0 ? `${stats.total_candidates.toLocaleString('id')}+` : '10.000+'}
                        </span>
                    </div>
                </div>
                {topCompanies.length > 0 && (
                    <div className="flex items-center gap-1.5">
                        <div className="flex -space-x-1.5">
                            {topCompanies.map((c, i) =>
                                c.logo_url ? (
                                    <img
                                        key={c.id}
                                        src={c.logo_url}
                                        alt={c.name}
                                        className="size-6 rounded-full border-2 border-white object-cover"
                                        style={{ zIndex: topCompanies.length - i }}
                                    />
                                ) : (
                                    <div
                                        key={c.id}
                                        className={`flex size-6 items-center justify-center rounded-full border-2 border-white text-[7px] font-bold text-white ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}
                                        style={{ zIndex: topCompanies.length - i }}
                                    >
                                        {companyInitials(c.name)}
                                    </div>
                                )
                            )}
                        </div>
                        <span className="text-[9px] text-gray-400">& lainnya</span>
                    </div>
                )}
            </div>

            {/* ── Card 3: Notification (bottom-left) ── */}
            <div
                className="absolute bottom-0 left-3 w-52 rounded-2xl border border-gray-100 bg-white p-2.5 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.12)] sm:bottom-4 sm:left-4 sm:w-60 sm:p-3.5 lg:w-64"
                style={{ animation: 'heroFloat3 6s ease-in-out infinite' }}
            >
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 sm:size-9">
                        <svg className="size-3.5 text-emerald-500 sm:size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-bold text-gray-900 sm:text-xs">{t('home.hero.card.application_seen_title')}</p>
                        <p className="text-[10px] text-gray-400 sm:text-[11px]">
                            {job?.company ?? 'Gojek'} · {t('home.hero.card.minutes_ago', { count: 2 })}
                        </p>
                    </div>
                    <div className="size-2 shrink-0 animate-pulse rounded-full bg-emerald-400" />
                </div>
            </div>

            {/* Float keyframes */}
            <style>{`
                @keyframes heroFloat1 {
                    0%, 100% { transform: rotate(-2.5deg) translateY(0px); }
                    50%       { transform: rotate(-2.5deg) translateY(-10px); }
                }
                @keyframes heroFloat2 {
                    0%, 100% { transform: rotate(2deg) translateY(0px); }
                    50%       { transform: rotate(2deg) translateY(-12px); }
                }
                @keyframes heroFloat3 {
                    0%, 100% { transform: translateY(0px); }
                    50%       { transform: translateY(-8px); }
                }
                @keyframes heroFloat4 {
                    0%, 100% { transform: translateY(0px); }
                    50%       { transform: translateY(-10px); }
                }
            `}</style>
        </div>
    );
}

export default function HeroSection({
    jobs,
    stats,
    industries,
    registeredCompanies,
    latestCareerResources,
    faqs,
}: HeroSectionProps) {
    const [search, setSearch] = useState('');
    const [openFaqId, setOpenFaqId] = useState<number | null>(null);
    const [location, setLocation] = useState('');
    const { auth } = usePage<PageProps>().props;
    const isCandidate = auth?.user?.role === 'candidate';
    const industryScrollRef = useRef<HTMLDivElement>(null);
    const { t } = useTranslate();

    const steps = useMemo(
        () =>
            STEP_KEYS.map((step) => ({
                number: step.number,
                title: t(`home.steps.${step.key}.title`),
                desc: t(`home.steps.${step.key}.desc`),
            })),
        [t],
    );

    function scrollIndustry(dir: 'left' | 'right') {
        industryScrollRef.current?.scrollBy({ left: dir === 'right' ? 320 : -320, behavior: 'smooth' });
    }

    const featuredJobs = jobs.slice(0, 6);

    return (
        <>
            {/* ── Hero ── */}
            <section className="relative overflow-hidden bg-white px-4 pt-16 pb-20">
                {/* Dot grid */}
                <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                        backgroundImage: 'radial-gradient(#01296a20 1px, transparent 1px)',
                        backgroundSize: '26px 26px',
                    }}
                />
                {/* Primary blur blobs */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -top-32 -right-32 h-120 w-120 rounded-full bg-primary/15 blur-[130px]" />
                    <div className="absolute -bottom-24 -left-24 h-95 w-95 rounded-full bg-primary/10 blur-[120px]" />
                    <div className="absolute top-1/3 left-1/3 h-60 w-60 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-300/15 blur-[100px]" />
                </div>

                <div className="relative mx-auto max-w-6xl">
                    <div className="grid items-center gap-12 lg:grid-cols-2">
                        {/* ── Left column ── */}
                        <motion.div
                            className="text-center lg:text-left"
                            variants={heroContainer}
                            initial="hidden"
                            animate="visible"
                        >
                            <motion.div variants={heroItem} className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
                                <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                                <span className="text-[11px] font-semibold tracking-widest text-primary uppercase">
                                    {t('home.badge')}
                                </span>
                            </motion.div>

                            <motion.h1 variants={heroItem} className="text-5xl leading-[1.15] font-extrabold tracking-tight text-gray-900 sm:text-6xl md:text-[3.75rem]">
                                {t('home.hero.title_line1')}
                                <br />
                                <span className="bg-linear-to-r from-primary to-primary-400 bg-clip-text text-transparent">
                                    {t('home.hero.title_line2')}
                                </span>
                            </motion.h1>

                            <motion.p variants={heroItem} className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-gray-500 lg:mx-0">
                                {t('home.hero.subtitle')}
                            </motion.p>

                            {/* AI Feature Pills */}
                            <motion.div variants={heroItem} className="mt-5 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                                {[
                                    `✦ ${t('home.hero.feature.simulator')}`,
                                    `✦ ${t('home.hero.feature.cv_parse')}`,
                                    `✦ ${t('home.hero.feature.matching')}`,
                                ].map((feat) => (
                                    <span
                                        key={feat}
                                        className="rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-[11px] font-medium text-primary"
                                    >
                                        {feat}
                                    </span>
                                ))}
                            </motion.div>

                            {/* Search Bar */}
                            <motion.div variants={heroItem} className="mt-8 flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg shadow-gray-100/80 sm:flex-row">
                                <div className="flex min-w-0 flex-1 items-center gap-3 px-5 py-3.5">
                                    <svg
                                        className="size-4 shrink-0 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                                        />
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder={t('home.hero.search.placeholder_role')}
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        className="min-w-0 flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
                                    />
                                </div>
                                <div className="hidden h-auto w-px bg-gray-200 sm:block" />
                                <div className="block h-px w-full bg-gray-100 sm:hidden" />
                                <div className="flex min-w-0 flex-1 items-center gap-3 px-5 py-3.5">
                                    <svg
                                        className="size-4 shrink-0 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder={t('home.hero.search.placeholder_location')}
                                        value={location}
                                        onChange={(e) =>
                                            setLocation(e.target.value)
                                        }
                                        className="min-w-0 flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
                                    />
                                </div>
                                <div className="shrink-0 p-2">
                                    <Button
                                        asChild
                                        className="w-full rounded-xl px-7 text-sm font-semibold whitespace-nowrap sm:w-auto"
                                    >
                                        <Link
                                            href={jobsIndex.url({
                                                query: {
                                                    search: search || undefined,
                                                    location:
                                                        location || undefined,
                                                },
                                            })}
                                        >
                                            {t('home.hero.search.cta')} →
                                        </Link>
                                    </Button>
                                </div>
                            </motion.div>

                            {/* Popular Searches */}
                            <motion.div variants={heroItem} className="mt-5 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                                <span className="text-xs text-gray-400">
                                    {t('home.hero.popular')}
                                </span>
                                {popularSearches.map((term) => (
                                    <Link
                                        key={term}
                                        href={jobsIndex.url({
                                            query: { search: term },
                                        })}
                                        className="rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] font-medium text-gray-600 shadow-xs transition-all duration-150 hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                                    >
                                        {term}
                                    </Link>
                                ))}
                            </motion.div>

                            {/* Stats Strip */}
                            <motion.div variants={heroItem} className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 lg:justify-start">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-bold text-gray-900">
                                        {stats.active_jobs.toLocaleString('id')}+
                                    </span>
                                    <span className="text-xs text-gray-500">{t('home.hero.stats.jobs')}</span>
                                </div>
                                <span className="h-3.5 w-px bg-gray-300" />
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-bold text-gray-900">
                                        {stats.active_companies.toLocaleString('id')}+
                                    </span>
                                    <span className="text-xs text-gray-500">{t('home.hero.stats.companies')}</span>
                                </div>
                                <span className="h-3.5 w-px bg-gray-300" />
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-bold text-gray-900">
                                        {stats.total_candidates.toLocaleString('id')}+
                                    </span>
                                    <span className="text-xs text-gray-500">{t('home.hero.stats.candidates')}</span>
                                </div>
                            </motion.div>
                        </motion.div>

                        {/* ── Right column: illustration ── */}
                        <motion.div
                            className="flex justify-center lg:justify-end"
                            variants={heroRight}
                            initial="hidden"
                            animate="visible"
                        >
                            <HeroIllustration
                                job={jobs[0] ?? null}
                                stats={stats}
                                companies={registeredCompanies}
                            />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ── Registered Companies Marquee ── */}
            {registeredCompanies.length > 0 && (
                <section className="overflow-hidden border-b border-gray-100 bg-white py-12">
                    <motion.div
                        className="mx-auto mb-8 max-w-5xl px-4 text-center"
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={vp}
                    >
                        <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
                            {t('home.companies.trusted')}
                        </p>
                    </motion.div>

                    <div className="relative">
                        {/* Fade edges */}
                        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-linear-to-r from-white to-transparent" />
                        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-linear-to-l from-white to-transparent" />

                        <Marquee
                            pauseOnHover
                            repeat={4}
                            className="[--duration:35s] [--gap:0.75rem]"
                        >
                            {registeredCompanies.map((company) => (
                                <CompanyCard
                                    key={company.id}
                                    company={company}
                                />
                            ))}
                        </Marquee>

                        {registeredCompanies.length > 3 && (
                            <Marquee
                                reverse
                                pauseOnHover
                                repeat={4}
                                className="mt-3 [--duration:30s] [--gap:0.75rem]"
                            >
                                {[...registeredCompanies]
                                    .reverse()
                                    .map((company) => (
                                        <CompanyCard
                                            key={company.id}
                                            company={company}
                                        />
                                    ))}
                            </Marquee>
                        )}
                    </div>
                </section>
            )}

            {/* ── Browse by Industry ── */}
            {industries.length > 0 && (
                <section className="bg-white py-14">
                    <motion.div
                        className="mx-auto mb-8 max-w-5xl px-4"
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={vp}
                    >
                        <div className="flex items-end justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                                    {t('home.industry.title')}
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    {t('home.industry.subtitle')}
                                </p>
                            </div>
                            {/* Arrow buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => scrollIndustry('left')}
                                    className="flex size-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-xs transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                                    aria-label={t('home.industry.scroll_left')}
                                >
                                    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => scrollIndustry('right')}
                                    className="flex size-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-xs transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                                    aria-label={t('home.industry.scroll_right')}
                                >
                                    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Horizontal scroll — contained in max-w-5xl */}
                    <div className="mx-auto max-w-5xl px-4">
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-linear-to-l from-white to-transparent" />
                            <motion.div
                                ref={industryScrollRef}
                                className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                                variants={staggerWrap}
                                initial="hidden"
                                whileInView="visible"
                                viewport={vp}
                            >
                            {industries.map((industry) => {
                                const color = getIndustryColor(industry.name);
                                return (
                                    <motion.div key={industry.id} variants={staggerChild} className="shrink-0">
                                    <Link
                                        href={jobsIndex.url({ query: { industry_id: industry.id } })}
                                        className="group relative flex h-52 w-44 flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
                                    >
                                        <div className={`flex size-12 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110 ${color.bg} ${color.text}`}>
                                            {getIndustryIcon(industry.name)}
                                        </div>
                                        <div className="mt-4 flex min-h-[3.4rem] flex-col">
                                            <p className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900 transition-colors group-hover:text-primary">
                                                {industry.name}
                                            </p>
                                            <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-gray-400">
                                                {industry.jobs_count} {t('home.industry.jobs_count')}
                                            </p>
                                        </div>
                                        <div className="mt-auto flex items-center gap-1.5 border-t border-gray-100 pt-3 text-xs font-semibold text-gray-400 transition-colors group-hover:text-primary">
                                            {t('home.industry.explore')}
                                            <svg className="size-3.5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </Link>
                                    </motion.div>
                                );
                            })}
                            </motion.div>
                        </div>
                    </div>
                </section>
            )}

            {/* ── Featured Jobs ── */}
            <section className="bg-white px-4 py-16">
                <div className="mx-auto max-w-5xl">
                    <motion.div
                        className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={vp}
                    >
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                                {t('home.jobs.title')}
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                {t('home.jobs.subtitle')}
                            </p>
                        </div>
                        <Link
                            href={jobsIndex.url()}
                            className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary transition hover:text-primary/80"
                        >
                            {t('home.jobs.see_all')}
                            <svg
                                className="size-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                />
                            </svg>
                        </Link>
                    </motion.div>

                    {featuredJobs.length > 0 ? (
                        <motion.div
                            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                            variants={staggerWrap}
                            initial="hidden"
                            whileInView="visible"
                            viewport={vp}
                        >
                            {featuredJobs.map((job) => {
                                const initials = job.is_anonymous
                                    ? '?'
                                    : (job.company ?? 'K')
                                        .split(' ')
                                        .map((p) => p[0])
                                        .join('')
                                        .slice(0, 2)
                                        .toUpperCase();

                                const modeStyle =
                                    workModeStyle[job.work_mode] ??
                                    'bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200';

                                return (
                                    <motion.div
                                        key={job.id}
                                        variants={staggerChild}
                                        className="group relative flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                                    >
                                        {/* Stretched link — covers entire card */}
                                        <Link
                                            href={show(job.slug)}
                                            className="absolute inset-0 rounded-2xl"
                                            aria-label={job.title}
                                        />

                                        {/* Header */}
                                        <div className="flex items-start gap-3">
                                            <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl text-[13px] font-bold shadow-sm ${job.is_anonymous ? 'bg-amber-100 text-amber-600' : 'bg-linear-to-br from-primary to-primary-400 text-white'}`}>
                                                {initials}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="line-clamp-2 text-sm leading-snug font-semibold text-gray-900 transition-colors group-hover:text-primary">
                                                    {job.title}
                                                </p>
                                                <p className="mt-0.5 truncate text-xs text-gray-400">
                                                    {job.is_anonymous ? t('home.jobs.anonymous_company') : (job.company ?? t('home.jobs.company_fallback'))}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Badges */}
                                        <div className="flex flex-wrap gap-1.5">
                                            <span
                                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${modeStyle}`}
                                            >
                                                {job.work_mode}
                                            </span>
                                            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-medium text-gray-500 ring-1 ring-gray-200 ring-inset">
                                                {job.type}
                                            </span>
                                        </div>

                                        {/* Location */}
                                        {job.location && (
                                            <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                                <svg
                                                    className="size-3.5 shrink-0"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                                    />
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                                    />
                                                </svg>
                                                {job.location}
                                            </div>
                                        )}

                                        {/* Footer */}
                                        <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3">
                                            <span className="text-xs font-semibold text-gray-800">
                                                {job.salary}
                                            </span>
                                            {/* Save button sits above the stretched link */}
                                            {isCandidate ? (
                                                job.is_saved ? (
                                                    <Link
                                                        href={unsave(job.id)}
                                                        method="delete"
                                                        as="button"
                                                        className="relative z-10 flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                                                    >
                                                        <svg
                                                            className="size-3.5"
                                                            fill="currentColor"
                                                            viewBox="0 0 20 20"
                                                        >
                                                            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                                                        </svg>
                                                        {t('home.jobs.saved')}
                                                    </Link>
                                                ) : (
                                                    <Link
                                                        href={save(job.id)}
                                                        method="post"
                                                        as="button"
                                                        className="relative z-10 flex items-center gap-1 text-[11px] font-medium text-gray-400 hover:text-primary"
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
                                                                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                                                            />
                                                        </svg>
                                                        Simpan
                                                    </Link>
                                                )
                                            ) : (
                                                <Link
                                                    href={login()}
                                                    className="relative z-10 flex items-center gap-1 text-[11px] font-medium text-gray-400 hover:text-primary"
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
                                                            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                                                        />
                                                    </svg>
                                                    {t('home.jobs.save')}
                                                </Link>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-16 text-center">
                            <p className="text-sm text-gray-400">
                                {t('home.jobs.empty')}
                            </p>
                        </div>
                    )}
                </div>
            </section>

            {/* ── Latest Career Resources ── */}
            {latestCareerResources.length > 0 && (
                <section className="bg-gray-50/60 px-4 py-16">
                    <div className="mx-auto max-w-5xl">
                        <motion.div
                            className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"
                            variants={fadeUp}
                            initial="hidden"
                            whileInView="visible"
                            viewport={vp}
                        >
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                                    {t('home.resources.title')}
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    {t('home.resources.subtitle')}
                                </p>
                            </div>
                            <Link
                                href={careerResourcesIndex.url()}
                                className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary transition hover:text-primary/80"
                            >
                                {t('home.jobs.see_all')}
                                <svg
                                    className="size-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5l7 7-7 7"
                                    />
                                </svg>
                            </Link>
                        </motion.div>

                        <motion.div
                            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
                            variants={staggerWrap}
                            initial="hidden"
                            whileInView="visible"
                            viewport={vp}
                        >
                            {latestCareerResources.map((resource) => {
                                const fallbackMeta = {
                                    labelKey: '',
                                    color: 'text-gray-600',
                                    bg: 'bg-gray-100',
                                    gradient: 'from-gray-400/80 via-gray-500/60 to-gray-600/80',
                                    icon: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25',
                                };
                                const meta = RESOURCE_TYPE_META[resource.type] ?? fallbackMeta;
                                const metaLabel = meta.labelKey ? t(meta.labelKey) : resource.type;
                                const ctaLabel = resource.type === 'video' ? t('home.resources.cta.watch') : resource.type === 'template' ? t('home.resources.cta.download') : t('home.resources.cta.read');
                                return (
                                    <motion.div key={resource.id} variants={staggerChild}>
                                    <Link
                                        href={careerResourcesShow.url(resource.slug)}
                                        className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5"
                                    >
                                        {/* Thumbnail */}
                                        <div className="relative h-44 overflow-hidden">
                                            {resource.thumbnail_path ? (
                                                <>
                                                    <img
                                                        src={`/storage/${resource.thumbnail_path}`}
                                                        alt={resource.title}
                                                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                                    />
                                                    <div className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent" />
                                                </>
                                            ) : (
                                                <div className={`relative flex h-full items-center justify-center overflow-hidden bg-linear-to-br ${meta.gradient}`}>
                                                    <div className="absolute -top-6 -right-6 h-28 w-28 rounded-full bg-white/10" />
                                                    <div className="absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-white/10" />
                                                    <div className="relative flex flex-col items-center gap-2">
                                                        <div className="flex size-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                                                            <svg className="size-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d={meta.icon} />
                                                            </svg>
                                                        </div>
                                                        <span className="text-[10px] font-bold tracking-widest text-white/80 uppercase">{metaLabel}</span>
                                                    </div>
                                                </div>
                                            )}
                                            {/* Type pill */}
                                            <div className="absolute top-3 left-3">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide shadow-sm ${resource.thumbnail_path ? 'bg-white/90 backdrop-blur-sm ' + meta.color : 'bg-white/25 text-white backdrop-blur-sm'}`}>
                                                    {metaLabel}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Body */}
                                        <div className="flex flex-1 flex-col p-4">
                                            {/* Category + date */}
                                            <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
                                                {resource.category && (
                                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.bg} ${meta.color}`}>
                                                        {resource.category}
                                                    </span>
                                                )}
                                                {resource.published_at && (
                                                    <span className="text-[10px] text-gray-400">
                                                        {new Date(resource.published_at).toLocaleDateString('id-ID', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric',
                                                        })}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Title */}
                                            <h3 className="line-clamp-2 flex-1 text-sm font-bold leading-snug text-gray-900 transition-colors group-hover:text-primary">
                                                {resource.title}
                                            </h3>

                                            {/* CTA row */}
                                            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                                                <span className={`text-[11px] font-semibold ${meta.color}`}>{ctaLabel} {t('home.resources.cta_more')}</span>
                                                <div className={`flex size-7 items-center justify-center rounded-full transition-transform duration-200 group-hover:translate-x-0.5 ${meta.bg}`}>
                                                    <svg className={`size-3.5 ${meta.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    </div>
                </section>
            )}

            {/* ── AI Interview Simulator ── */}
            <section className="overflow-hidden bg-white px-4 py-20">
                <div className="mx-auto max-w-5xl">
                    <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
                        {/* Left: text */}
                        <motion.div
                            variants={slideInLeft}
                            initial="hidden"
                            whileInView="visible"
                            viewport={vp}
                        >
                            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5">
                                <svg className="size-3.5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                                </svg>
                                <span className="text-[11px] font-semibold tracking-widest text-primary uppercase">{t('home.ai_interview.badge')}</span>
                            </div>
                            <h2 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-4xl">
                                {t('home.ai_interview.title_prefix')}{' '}
                                <span className="bg-linear-to-r from-primary to-blue-500 bg-clip-text text-transparent">
                                    {t('home.ai_interview.title_highlight')}
                                </span>
                            </h2>
                            <p className="mt-4 text-sm leading-relaxed text-gray-500">
                                {t('home.ai_interview.description')}
                            </p>
                            <ul className="mt-8 flex flex-col gap-5">
                                <li className="flex items-start gap-4">
                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet-50">
                                        <svg className="size-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">{t('home.ai_interview.behavioral.title')}</p>
                                        <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{t('home.ai_interview.behavioral.desc')}</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-4">
                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                                        <svg className="size-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">{t('home.ai_interview.skill.title')}</p>
                                        <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{t('home.ai_interview.skill.desc')}</p>
                                    </div>
                                </li>
                            </ul>
                            <div className="mt-8">
                                <Link
                                    href={isCandidate ? '/candidate/ai-interviews' : login()}
                                    className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/25 transition hover:bg-primary/90"
                                >
                                    {t('home.ai_interview.cta')}
                                    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            </div>
                        </motion.div>

                        {/* Right: interview report mock */}
                        <motion.div
                            className="relative"
                            variants={slideInRight}
                            initial="hidden"
                            whileInView="visible"
                            viewport={vp}
                        >
                            <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-linear-to-br from-primary/6 to-blue-100/40 blur-2xl" />
                            <div className="relative rounded-3xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-100/80">
                                {/* Header */}
                                <div className="mb-5 flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-[10px] font-medium tracking-widest text-gray-400 uppercase">{t('home.ai_interview.report.label')}</p>
                                        <p className="mt-1 text-sm font-bold text-gray-900">{t('home.ai_interview.report.title')}</p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <div className="flex items-baseline gap-0.5">
                                            <span className="text-3xl font-black text-primary">88</span>
                                            <span className="text-sm font-medium text-gray-400">/100</span>
                                        </div>
                                        <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">{t('home.ai_interview.report.match_score')}</p>
                                    </div>
                                </div>

                                {/* Skill bars */}
                                <div className="mb-5 space-y-3">
                                    <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">{t('home.ai_interview.report.proficiency')}</p>
                                    {[
                                        { label: 'Leadership', value: 82 },
                                        { label: 'Tech Expertise', value: 65 },
                                        { label: 'Communication', value: 78 },
                                    ].map((s) => (
                                        <div key={s.label}>
                                            <div className="mb-1 flex items-center justify-between">
                                                <span className="text-[11px] font-medium text-gray-500">{s.label}</span>
                                                <span className="text-[11px] font-bold text-gray-700">{s.value}%</span>
                                            </div>
                                            <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                                                <div className="h-full rounded-full bg-linear-to-r from-primary to-blue-400" style={{ width: `${s.value}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Behavioral analysis */}
                                <div className="rounded-2xl bg-primary p-4">
                                    <div className="mb-2.5 flex items-center gap-2">
                                        <div className="flex size-6 items-center justify-center rounded-lg bg-white/20">
                                            <svg className="size-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                            </svg>
                                        </div>
                                        <span className="text-xs font-bold text-white">{t('home.ai_interview.report.behavior')}</span>
                                    </div>
                                    <p className="text-[11px] leading-relaxed text-white/80">
                                        {t('home.ai_interview.report.behavior_text')}
                                    </p>
                                    <div className="mt-3 rounded-xl bg-white/10 p-2.5">
                                        <p className="text-[10px] font-semibold tracking-widest text-white/50 uppercase">{t('home.ai_interview.report.subtext')}</p>
                                        <p className="mt-1 text-[11px] leading-relaxed text-white/70">
                                            {t('home.ai_interview.report.subtext_text')}
                                        </p>
                                    </div>
                                </div>

                                {/* Status bar */}
                                <div className="mt-4 flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
                                    <div className="flex items-center gap-2">
                                        <div className="flex size-6 items-center justify-center rounded-full bg-primary/10">
                                            <svg className="size-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="flex items-end gap-0.5">
                                            {[2, 4, 3, 5, 2, 4, 3, 2].map((h, i) => (
                                                <div key={i} className="w-1 rounded-full bg-primary" style={{ height: `${h * 3}px` }} />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
                                        <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">{t('home.ai_interview.report.simulation_active')}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ── Fitur Utama Karivia ── */}
            <section className="bg-gray-50/60 px-4 py-20">
                <div className="mx-auto max-w-5xl">
                    <motion.div
                        className="mb-12 text-center"
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={vp}
                    >
                        <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">{t('home.features.title')}</h2>
                        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-gray-500">
                            {t('home.features.subtitle')}
                        </p>
                    </motion.div>

                    {/* Bento grid */}
                    <motion.div
                        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
                        variants={staggerWrap}
                        initial="hidden"
                        whileInView="visible"
                        viewport={vp}
                    >
                        {/* Card 1: Smart Job Matching — col-span-2 */}
                        <motion.div variants={staggerChild} className="overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:col-span-2">
                            <div className="mb-1 flex size-10 items-center justify-center rounded-2xl bg-primary/8">
                                <svg className="size-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z" />
                                </svg>
                            </div>
                            <h3 className="mt-3 text-base font-bold text-gray-900">{t('home.features.smart_matching.title')}</h3>
                            <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-gray-500">
                                {t('home.features.smart_matching.desc')}
                            </p>
                            <div className="mt-5 space-y-2 rounded-2xl border border-gray-100 bg-gray-50 p-3">
                                {jobs.slice(0, 3).map((job) => (
                                    <div key={job.id} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 shadow-xs">
                                        <div className="min-w-0">
                                            <p className="truncate text-xs font-semibold text-gray-800">{job.title}</p>
                                            <p className="truncate text-[10px] text-gray-400">{job.is_anonymous ? t('home.jobs.anonymous_company') : (job.company ?? t('home.jobs.company_fallback'))}</p>
                                        </div>
                                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${workModeStyle[job.work_mode] ?? 'bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200'}`}>
                                            {job.work_mode}
                                        </span>
                                    </div>
                                ))}
                                {jobs.length === 0 && (
                                    <p className="py-2 text-center text-xs text-gray-400">{t('home.features.smart_matching.empty')}</p>
                                )}
                            </div>
                        </motion.div>

                        {/* Card 2: AI Personal Coach — dark */}
                        <motion.div variants={staggerChild} className="relative overflow-hidden rounded-3xl bg-primary p-6 shadow-sm">
                            <div className="pointer-events-none absolute -top-10 -right-10 size-40 rounded-full bg-white/5 blur-3xl" />
                            <div className="mb-1 flex size-10 items-center justify-center rounded-2xl bg-white/15">
                                <svg className="size-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                </svg>
                            </div>
                            <h3 className="mt-3 text-base font-bold text-white">{t('home.features.coach.title')}</h3>
                            <p className="mt-2 text-xs leading-relaxed text-white/70">
                                {t('home.features.coach.desc')}
                            </p>
                            <Link
                                href={isCandidate ? '/candidate/career-coach' : login()}
                                className="mt-5 flex items-center justify-between rounded-xl bg-white/15 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/25"
                            >
                                {t('home.features.coach.cta')}
                                <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                            <div className="mt-5 space-y-2 opacity-70">
                                <div className="flex justify-end">
                                    <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-white/20 px-3 py-2">
                                        <p className="text-[10px] text-white">{t('home.features.coach.chat_user')}</p>
                                    </div>
                                </div>
                                <div className="flex">
                                    <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white/10 px-3 py-2">
                                        <p className="text-[10px] leading-relaxed text-white/80">{t('home.features.coach.chat_bot')}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Card 3: Trusted by Leaders */}
                        <motion.div variants={staggerChild} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="mb-1 flex size-10 items-center justify-center rounded-2xl bg-amber-50">
                                <svg className="size-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                </svg>
                            </div>
                            <h3 className="mt-3 text-base font-bold text-gray-900">{t('home.features.trusted.title')}</h3>
                            <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
                                {t('home.features.trusted.desc')}
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {registeredCompanies.slice(0, 5).map((company) => {
                                    const initials = company.name
                                        .split(' ')
                                        .map((w) => w[0])
                                        .join('')
                                        .slice(0, 2)
                                        .toUpperCase();
                                    return (
                                        <div key={company.id} className="flex size-9 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
                                            {company.logo_url ? (
                                                <img src={company.logo_url} alt={company.name} className="size-full object-cover" />
                                            ) : (
                                                <span className="text-[10px] font-bold text-gray-500">{initials}</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="mt-4 flex items-center gap-2.5">
                                <div className="flex -space-x-2">
                                    {['bg-rose-400', 'bg-violet-400', 'bg-blue-400', 'bg-emerald-400'].map((color, i) => (
                                        <div key={i} className={`flex size-7 items-center justify-center rounded-full border-2 border-white ${color} text-[9px] font-bold text-white`}>
                                            {String.fromCharCode(65 + i)}
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[11px] text-gray-500">
                                    {t('home.features.trusted.candidates', { count: stats.total_candidates.toLocaleString('id') })}
                                </p>
                            </div>
                        </motion.div>

                        {/* Card 4: Career Growth Analytics — dark, col-span-2 */}
                        <motion.div variants={staggerChild} className="relative overflow-hidden rounded-3xl bg-gray-900 p-6 shadow-sm sm:col-span-2">
                            <div className="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full bg-primary/20 blur-3xl" />
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
                                    <div className="mb-1 flex size-10 items-center justify-center rounded-2xl bg-white/10">
                                        <svg className="size-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                                        </svg>
                                    </div>
                                    <h3 className="mt-3 text-base font-bold text-white">{t('home.features.analytics.title')}</h3>
                                    <p className="mt-2 text-xs leading-relaxed text-gray-400">
                                        {t('home.features.analytics.desc')}
                                    </p>
                                    <ul className="mt-4 space-y-2">
                                        {[t('home.features.analytics.tag1'), t('home.features.analytics.tag2')].map((item) => (
                                            <li key={item} className="flex items-center gap-2 text-xs text-gray-300">
                                                <div className="size-1.5 shrink-0 rounded-full bg-primary-400" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                {/* Bar chart — industries by job count */}
                                <div className="flex items-end justify-around gap-1.5 rounded-2xl bg-white/5 px-4 pb-3 pt-6">
                                    {(() => {
                                        const chartData = industries.slice(0, 7);
                                        const maxCount = Math.max(...chartData.map((ind) => ind.jobs_count), 1);
                                        return chartData.map((ind, i) => (
                                            <div key={ind.id} className="flex flex-1 flex-col items-center gap-1.5" title={ind.name}>
                                                <div
                                                    className="w-full rounded-t-lg transition-all"
                                                    style={{
                                                        height: `${Math.max(Math.round((ind.jobs_count / maxCount) * 90), 8)}px`,
                                                        background: i === chartData.length - 1
                                                            ? 'linear-gradient(to top, #3B82F6, #93C5FD)'
                                                            : 'rgba(255,255,255,0.15)',
                                                    }}
                                                />
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* ── How It Works ── */}
            <section className="bg-gray-50 px-4 py-16">
                <div className="mx-auto max-w-5xl">
                    <motion.div
                        className="mb-12 text-center"
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={vp}
                    >
                        <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                            {t('home.steps.title')}
                        </h2>
                        <p className="mt-2 text-sm text-gray-500">
                            {t('home.steps.subtitle')}
                        </p>
                    </motion.div>

                    <motion.div
                        className="relative grid grid-cols-1 gap-10 sm:grid-cols-3"
                        variants={staggerWrap}
                        initial="hidden"
                        whileInView="visible"
                        viewport={vp}
                    >
                        {/* Connector line (desktop only) */}
                        <div className="pointer-events-none absolute top-5 left-[calc(16.67%+1.25rem)] hidden w-[calc(66.67%-2.5rem)] border-t-2 border-dashed border-gray-200 sm:block" />

                        {steps.map((step) => (
                            <motion.div
                                key={step.number}
                                variants={staggerChild}
                                className="relative flex flex-col items-center text-center sm:items-start sm:text-left"
                            >
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white shadow-md shadow-primary/25">
                                    {step.number}
                                </div>
                                <h3 className="mt-4 text-base font-semibold text-gray-900">
                                    {step.title}
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                                    {step.desc}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>

                    <div className="mt-12 text-center">
                        <Button asChild className="rounded-full px-8">
                            <Link
                                href={
                                    isCandidate ? '/candidate/profile' : login()
                                }
                            >
                                {t('home.steps.cta')} →
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* ── Employer CTA ── */}
            <section className="px-4 py-16">
                <div className="mx-auto max-w-5xl">
                    <div className="relative overflow-hidden rounded-3xl bg-gray-900 px-8 py-14 md:px-14">
                        <div className="pointer-events-none absolute inset-0 overflow-hidden">
                            <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-primary/25 blur-[80px]" />
                            <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-primary-500/15 blur-[80px]" />
                        </div>

                        <div className="relative grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
                            {/* Left */}
                            <motion.div
                                variants={slideInLeft}
                                initial="hidden"
                                whileInView="visible"
                                viewport={vp}
                            >
                                <span className="inline-block rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-semibold tracking-widest text-white/80 uppercase">
                                    {t('home.employer_cta.badge')}
                                </span>
                                <h2 className="mt-4 text-3xl leading-tight font-extrabold text-white sm:text-4xl">
                                    {t('home.employer_cta.title_line1')}
                                    <br />
                                    <span className="text-primary-400">
                                        {t('home.employer_cta.title_line2')}
                                    </span>
                                </h2>
                                <p className="mt-4 text-sm leading-relaxed text-gray-300">
                                    {t('home.employer_cta.description')}
                                </p>
                                <ul className="mt-6 flex flex-col gap-3">
                                    {[
                                        t('home.employer_cta.bullet1'),
                                        t('home.employer_cta.bullet2'),
                                        t('home.employer_cta.bullet3'),
                                    ].map((item) => (
                                        <li
                                            key={item}
                                            className="flex items-center gap-3 text-sm text-gray-200"
                                        >
                                            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/30 text-[10px] font-bold text-primary-400">
                                                ✓
                                            </span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-8 flex flex-wrap gap-3">
                                    <Button
                                        asChild
                                        className="rounded-full px-8"
                                    >
                                        <Link href="/employer/jobs/create">
                                            {t('home.employer_cta.cta_post')}
                                        </Link>
                                    </Button>
                                    <Link
                                        href="/pricing"
                                        className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-6 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10"
                                    >
                                        {t('home.employer_cta.cta_pricing')} →
                                    </Link>
                                </div>
                            </motion.div>

                            {/* Right – Metric cards */}
                            <motion.div
                                className="grid grid-cols-2 gap-3"
                                variants={slideInRight}
                                initial="hidden"
                                whileInView="visible"
                                viewport={vp}
                            >
                                {[
                                    {
                                        label: t('home.employer_cta.metric.candidates'),
                                        value: `${stats.total_candidates.toLocaleString('id')}+`,
                                        icon: (
                                            <svg
                                                className="size-5 text-primary-400"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1.5}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                                                />
                                            </svg>
                                        ),
                                    },
                                    {
                                        label: t('home.employer_cta.metric.companies'),
                                        value: `${stats.active_companies.toLocaleString('id')}+`,
                                        icon: (
                                            <svg
                                                className="size-5 text-primary-400"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1.5}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
                                                />
                                            </svg>
                                        ),
                                    },
                                    {
                                        label: t('home.employer_cta.metric.matching'),
                                        value: t('home.employer_cta.metric.matching_value'),
                                        icon: (
                                            <svg
                                                className="size-5 text-primary-400"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1.5}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
                                                />
                                            </svg>
                                        ),
                                    },
                                    {
                                        label: t('home.employer_cta.metric.process'),
                                        value: t('home.employer_cta.metric.process_value'),
                                        icon: (
                                            <svg
                                                className="size-5 text-primary-400"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1.5}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                        ),
                                    },
                                ].map((card) => (
                                    <div
                                        key={card.label}
                                        className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
                                    >
                                        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/20">
                                            {card.icon}
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold text-white">
                                                {card.value}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {card.label}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Testimonials ── */}
            <section className="overflow-hidden bg-gray-50/60 py-16">
                <motion.div
                    className="mx-auto mb-10 max-w-2xl px-4 text-center"
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={vp}
                >
                    <p className="mb-2 text-xs font-semibold tracking-widest text-primary uppercase">{t('home.testimonials.eyebrow')}</p>
                    <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                        {t('home.testimonials.title')}
                    </h2>
                    <p className="mt-2 text-sm text-gray-500">
                        {t('home.testimonials.subtitle')}
                    </p>
                </motion.div>

                <div className="relative flex flex-col gap-3">
                    {/* Fade edges */}
                    <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-linear-to-r from-gray-50/60 to-transparent" />
                    <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-linear-to-l from-gray-50/60 to-transparent" />

                    <Marquee pauseOnHover repeat={3} className="[--duration:40s] [--gap:0.75rem]">
                        {TESTIMONIALS.slice(0, 5).map((t) => (
                            <TestimonialCard key={t.id} testimonial={t} />
                        ))}
                    </Marquee>
                    <Marquee reverse pauseOnHover repeat={3} className="[--duration:45s] [--gap:0.75rem]">
                        {TESTIMONIALS.slice(5).map((t) => (
                            <TestimonialCard key={t.id} testimonial={t} />
                        ))}
                    </Marquee>
                </div>
            </section>

            {/* ── FAQ ── */}
            {faqs.length > 0 && (
                <section className="bg-white px-4 py-16">
                    <div className="mx-auto max-w-3xl">
                        <motion.div
                            className="mb-10 text-center"
                            variants={fadeUp}
                            initial="hidden"
                            whileInView="visible"
                            viewport={vp}
                        >
                            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                                {t('home.faq.title')}
                            </h2>
                            <p className="mt-2 text-sm text-gray-500">
                                {t('home.faq.subtitle')}
                            </p>
                        </motion.div>

                        <motion.div
                            className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white shadow-sm"
                            variants={staggerWrap}
                            initial="hidden"
                            whileInView="visible"
                            viewport={vp}
                        >
                            {faqs.map((faq) => {
                                const isOpen = openFaqId === faq.id;
                                return (
                                    <motion.div key={faq.id} variants={staggerChild}>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setOpenFaqId(
                                                    isOpen ? null : faq.id,
                                                )
                                            }
                                            className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-gray-50/60"
                                        >
                                            <span className="text-sm font-semibold text-gray-900">
                                                {faq.title}
                                            </span>
                                            <span
                                                className={`flex size-6 shrink-0 items-center justify-center rounded-full border border-gray-200 transition-transform duration-200 ${isOpen ? 'rotate-45 border-primary/30 bg-primary/5 text-primary' : 'text-gray-400'}`}
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
                                        {isOpen && (
                                            <div className="px-6 pb-5">
                                                <p className="text-sm leading-relaxed text-gray-500">
                                                    {faq.description}
                                                </p>
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    </div>
                </section>
            )}
        </>
    );
}
