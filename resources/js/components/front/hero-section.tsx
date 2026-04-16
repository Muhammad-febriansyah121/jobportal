import { useState } from 'react';
import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

const quickFilters = [
    { label: 'Butuh Cepat', icon: '⚡' },
    { label: 'Top Company', icon: '🏆' },
    { label: 'Kerja Remote', icon: '💻' },
    { label: 'MT / ODP', icon: '🎓' },
    { label: 'Fresh Graduate', icon: '🌱' },
];

const stats = [
    { value: '12.000+', label: 'Lowongan Aktif' },
    { value: '800+', label: 'Perusahaan' },
    { value: '200K+', label: 'Kandidat Terdaftar' },
];

const categories = [
    { label: 'Semua Pekerjaan' },
    { label: 'Admin & Ops' },
    { label: 'Ads & Digital Marketing' },
    { label: 'Architecture & Design' },
    { label: 'Art, Media & Communications' },
    { label: 'Business, Sales & Commercial' },
    { label: 'Customer Service' },
    { label: 'Data & Analytics' },
    { label: 'Education' },
    { label: 'Engineering & IT' },
    { label: 'Finance & Accounting' },
    { label: 'HR & Recruitment' },
];

const filterDropdowns = ['Level', 'Jenis', 'Tipe', 'Fasilitas', 'Lokasi', 'Gaji', 'Metode'];

const jobCards = [
    {
        id: 1,
        initials: 'TC',
        color: 'bg-blue-500',
        title: 'Senior Full-Stack Developer (Laravel + React)',
        company: 'TechCorp Indonesia',
        type: 'Full-Time',
        location: 'Jakarta Selatan',
        salary: 'Rp 12–18 jt',
        badge: null,
    },
    {
        id: 2,
        initials: 'TE',
        color: 'bg-green-500',
        title: 'DevOps Engineer',
        company: 'TechEdu Indonesia',
        type: 'Full-Time',
        location: 'Remote',
        salary: 'Rp 10–15 jt',
        badge: null,
    },
    {
        id: 3,
        initials: 'KR',
        color: 'bg-purple-500',
        title: 'UI/UX Designer',
        company: 'Kreasi Digital Nusantara',
        type: 'Full-Time',
        location: 'Bandung',
        salary: 'Negotiable',
        badge: null,
    },
    {
        id: 4,
        initials: 'PT',
        color: 'bg-orange-500',
        title: 'Product Manager – Fintech',
        company: 'PT Finansial Maju',
        type: 'Full-Time',
        location: 'Jakarta Pusat',
        salary: 'Rp 15–25 jt',
        badge: 'Butuh Cepat',
    },
    {
        id: 5,
        initials: 'DC',
        color: 'bg-cyan-500',
        title: 'Data Scientist (AI/ML)',
        company: 'DataCore Solutions',
        type: 'Full-Time',
        location: 'Remote',
        salary: 'Rp 14–20 jt',
        badge: null,
    },
    {
        id: 6,
        initials: 'GO',
        color: 'bg-rose-500',
        title: 'Growth Marketing Specialist',
        company: 'GoOnline Digital Agency',
        type: 'Full-Time',
        location: 'Surabaya',
        salary: 'Rp 8–12 jt',
        badge: 'Top Company',
    },
];

export default function HeroSection() {
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState(0);
    const [showAllCategories, setShowAllCategories] = useState(false);

    const visibleCategories = showAllCategories ? categories : categories.slice(0, 5);

    return (
        <section className="bg-background">
            {/* Hero Heading */}
            <div className="mx-auto max-w-6xl px-4 pt-12 pb-6 text-center">
                <h1 className="text-3xl font-bold leading-tight text-foreground sm:text-4xl md:text-[2.75rem]">
                    Temukan karir impianmu dari ribuan
                    <br className="hidden sm:block" /> lowongan terverifikasi.{' '}
                    <span className="text-primary">AI kami</span>
                    <br className="hidden sm:block" />
                    mencocokkan profil kamu dengan pekerjaan yang tepat.
                </h1>

                {/* Stats */}
                <div className="mt-6 flex items-center justify-center gap-8">
                    {stats.map((s) => (
                        <div key={s.label} className="text-center">
                            <p className="text-xl font-bold text-foreground sm:text-2xl">{s.value}</p>
                            <p className="text-xs text-muted-foreground">{s.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Filters */}
            <div className="mx-auto max-w-6xl px-4 pb-4">
                <div className="flex items-center justify-center gap-2 overflow-x-auto pb-1">
                    {quickFilters.map((f) => (
                        <button
                            key={f.label}
                            className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-white px-4 py-1.5 text-xs font-medium text-foreground shadow-xs transition hover:border-primary hover:text-primary"
                        >
                            <span>{f.icon}</span>
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Search Bar */}
            <div className="mx-auto max-w-6xl px-4 pb-3">
                <div className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 shadow-sm">
                    <input
                        type="text"
                        placeholder="Search by job title, company, & skills"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                    <button className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white transition hover:bg-primary/90">
                        <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                        </svg>
                    </button>
                    <div className="h-5 w-px shrink-0 bg-border" />
                    <Button variant="outline" size="sm" className="shrink-0 rounded-lg text-xs">
                        Tersimpan
                    </Button>
                    <Button size="sm" className="shrink-0 rounded-lg text-xs">
                        Tandaai Filter
                    </Button>
                </div>
            </div>

            {/* Filter Dropdowns */}
            <div className="mx-auto max-w-6xl px-4 pb-5">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {filterDropdowns.map((f) => (
                        <button
                            key={f}
                            className="flex shrink-0 items-center gap-1 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary hover:text-primary"
                        >
                            {f}
                            <svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    ))}
                    <div className="ml-auto flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                        <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M6 12h12M9 17h6" />
                        </svg>
                        Urutkan Berdasarkan
                        <button className="ml-1 font-medium text-foreground hover:text-primary">
                            Paling relevan
                        </button>
                        <svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Category Pills */}
            <div className="mx-auto max-w-6xl px-4 pb-6">
                <div className="flex flex-wrap items-center gap-2">
                    {visibleCategories.map((cat, i) => (
                        <button
                            key={cat.label}
                            onClick={() => setActiveCategory(i)}
                            className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                                activeCategory === i
                                    ? 'bg-primary text-white shadow-sm'
                                    : 'border border-border bg-white text-foreground hover:border-primary hover:text-primary'
                            }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                    <button
                        onClick={() => setShowAllCategories((v) => !v)}
                        className="flex items-center gap-1 rounded-full border border-border bg-white px-4 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary hover:text-primary"
                    >
                        {showAllCategories ? 'Tutup' : 'Lihat Semua'}
                        <svg
                            className={`size-3 transition-transform ${showAllCategories ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Job Cards */}
            <div className="mx-auto max-w-6xl px-4 pb-12">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {jobCards.map((job) => (
                        <Link
                            key={job.id}
                            href={`/jobs/${job.id}`}
                            className="group flex flex-col gap-3 rounded-xl border border-border bg-white p-4 shadow-xs transition hover:border-primary/40 hover:shadow-sm"
                        >
                            <div className="flex items-start justify-between gap-2">
                                {/* Avatar */}
                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${job.color} text-sm font-bold text-white`}>
                                    {job.initials}
                                </div>
                                {job.badge && (
                                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                                        {job.badge}
                                    </span>
                                )}
                            </div>

                            <div>
                                <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
                                    {job.title}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground">{job.company}</p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                    {job.type}
                                </span>
                                <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                    <svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21s-7-6.686-7-11a7 7 0 1 1 14 0c0 4.314-7 11-7 11z" />
                                        <circle cx="12" cy="10" r="2" strokeWidth={2} />
                                    </svg>
                                    {job.location}
                                </span>
                                <span className="ml-auto text-[10px] font-medium text-foreground">
                                    {job.salary}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="mt-8 text-center">
                    <Button variant="outline" className="rounded-full px-8">
                        Lihat Lebih Banyak Lowongan
                    </Button>
                </div>
            </div>
        </section>
    );
}
