import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    BriefcaseBusiness,
    CalendarDays,
    Check,
    Clock3,
    MapPin,
    Wallet,
} from 'lucide-react';
import HomeLayout from '@/layouts/front/home-layout';
import { index as jobsIndex } from '@/routes/jobs';
import type { Auth } from '@/types';

type ScrapedJob = {
    id: number;
    title: string;
    company: string | null;
    company_logo: string | null;
    location: string | null;
    work_mode: string;
    job_type: string;
    salary_range: string;
    published_at: string | null;
    description: string | null;
    requirements: string[];
    skills: string[];
    internal_apply_url: string | null;
    has_internal_apply: boolean;
};

function companyInitials(company: string | null): string {
    return (
        company
            ?.split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((word) => word[0]?.toUpperCase() ?? '')
            .join('') || 'CO'
    );
}

function MetaItem({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
}) {
    return (
        <div className="flex min-w-0 items-start gap-3">
            <Icon
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-primary-500"
            />
            <div className="min-w-0">
                <p className="text-xs text-slate-400">{label}</p>
                <p className="mt-1 truncate text-sm font-semibold text-slate-700">
                    {value}
                </p>
            </div>
        </div>
    );
}

export default function ScrapedJobShow({ job }: { job: ScrapedJob }) {
    const { auth } = usePage<{ auth?: Auth }>().props;
    const companyName = job.company ?? 'Perusahaan';
    const location = job.location || 'Lokasi fleksibel';
    const jobType = job.job_type || 'Full-time';
    const workMode = job.work_mode || 'On-site';
    const canApply = !auth?.user || auth.user.role === 'candidate';

    return (
        <HomeLayout>
            <Head title={`${job.title} — Karivia`} />

            <main className="min-h-screen bg-[#f7fbff] pt-28 pb-16 text-slate-900 sm:pt-32">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <nav
                        aria-label="Breadcrumb"
                        className="flex items-center gap-3 text-sm"
                    >
                        <Link
                            href={jobsIndex().url}
                            className="inline-flex min-h-11 items-center gap-2 font-semibold text-slate-500 transition hover:text-primary-600 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none"
                        >
                            <ArrowLeft aria-hidden="true" className="size-4" />
                            Lowongan
                        </Link>
                        <span aria-hidden="true" className="text-slate-300">
                            /
                        </span>
                        <span className="truncate text-slate-400">
                            Detail pekerjaan
                        </span>
                    </nav>

                    <header className="mt-5 rounded-2xl border border-slate-200 bg-white px-6 py-8 sm:px-10 sm:py-10">
                        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                            <div className="flex min-w-0 items-start gap-4 sm:gap-5">
                                {job.company_logo ? (
                                    <img
                                        src={job.company_logo}
                                        alt={`${companyName} logo`}
                                        className="size-16 shrink-0 rounded-2xl border border-slate-200 bg-white object-contain p-2 sm:size-20"
                                    />
                                ) : (
                                    <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-xl font-bold text-primary-600 sm:size-20 sm:text-2xl">
                                        {companyInitials(job.company)}
                                    </div>
                                )}

                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-primary-600">
                                        {companyName}
                                    </p>
                                    <h1 className="mt-2 max-w-3xl text-3xl leading-tight font-bold tracking-[-0.03em] text-slate-950 sm:text-4xl">
                                        {job.title}
                                    </h1>
                                    <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                                        <Clock3
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                        Diposting{' '}
                                        {job.published_at ?? 'baru-baru ini'}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                {canApply &&
                                job.has_internal_apply &&
                                job.internal_apply_url ? (
                                    <Link
                                        href={job.internal_apply_url}
                                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 text-sm font-bold text-white transition hover:bg-primary-700 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:outline-none"
                                    >
                                        Lamar via Karivia
                                    </Link>
                                ) : null}
                            </div>
                        </div>

                        <div className="mt-8 grid gap-6 border-t border-slate-100 pt-6 sm:grid-cols-2 lg:grid-cols-4">
                            <MetaItem
                                icon={BriefcaseBusiness}
                                label="Tipe pekerjaan"
                                value={jobType}
                            />
                            <MetaItem
                                icon={MapPin}
                                label="Lokasi kerja"
                                value={`${workMode} · ${location}`}
                            />
                            <MetaItem
                                icon={Wallet}
                                label="Kompensasi"
                                value={job.salary_range}
                            />
                            <MetaItem
                                icon={CalendarDays}
                                label="Diperbarui"
                                value={job.published_at ?? 'Baru diposting'}
                            />
                        </div>
                    </header>

                    <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
                        <article className="min-w-0 overflow-hidden rounded-2xl border border-t-2 border-slate-200 border-t-primary-500 bg-white px-6 py-8 sm:px-10 sm:py-9">
                            <div className="max-w-[68ch]">
                                <h2 className="text-xl font-bold tracking-tight text-slate-950">
                                    Tentang pekerjaan
                                </h2>
                                <div className="mt-5 text-[15px] leading-7 whitespace-pre-line text-slate-600">
                                    {job.description ||
                                        'Deskripsi pekerjaan belum tersedia.'}
                                </div>

                                {job.requirements.length > 0 && (
                                    <section className="mt-10 border-t border-slate-100 pt-8">
                                        <h2 className="text-xl font-bold tracking-tight text-slate-950">
                                            Persyaratan
                                        </h2>
                                        <ul className="mt-5 space-y-3 text-[15px] leading-7 text-slate-600">
                                            {job.requirements.map(
                                                (requirement) => (
                                                    <li
                                                        key={requirement}
                                                        className="flex gap-3"
                                                    >
                                                        <Check
                                                            aria-hidden="true"
                                                            className="mt-1 size-4 shrink-0 text-primary-500"
                                                        />
                                                        <span>
                                                            {requirement}
                                                        </span>
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                    </section>
                                )}
                            </div>
                        </article>

                        <aside className="space-y-5 lg:sticky lg:top-28">
                            <section className="rounded-2xl border border-slate-200 bg-white p-6">
                                <p className="text-xs font-bold tracking-[0.16em] text-slate-400 uppercase">
                                    Ringkasan
                                </p>
                                <dl className="mt-5 divide-y divide-slate-100">
                                    <div className="py-3 first:pt-0">
                                        <dt className="text-xs text-slate-400">
                                            Perusahaan
                                        </dt>
                                        <dd className="mt-1 text-sm font-semibold text-slate-700">
                                            {companyName}
                                        </dd>
                                    </div>
                                    <div className="py-3">
                                        <dt className="text-xs text-slate-400">
                                            Lokasi
                                        </dt>
                                        <dd className="mt-1 text-sm font-semibold text-slate-700">
                                            {location}
                                        </dd>
                                    </div>
                                    <div className="py-3 last:pb-0">
                                        <dt className="text-xs text-slate-400">
                                            Mode kerja
                                        </dt>
                                        <dd className="mt-1 text-sm font-semibold text-slate-700">
                                            {workMode}
                                        </dd>
                                    </div>
                                </dl>
                            </section>

                            {job.skills.length > 0 && (
                                <section className="rounded-2xl border border-slate-200 bg-white p-6">
                                    <h2 className="text-base font-bold text-slate-950">
                                        Skill terkait
                                    </h2>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {job.skills.map((skill) => (
                                            <span
                                                key={skill}
                                                className="rounded-full border border-primary-100 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </aside>
                    </div>
                </div>
            </main>
        </HomeLayout>
    );
}
