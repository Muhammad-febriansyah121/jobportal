import { Head, Link, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowRight,
    BadgeCheck,
    BarChart3,
    Brain,
    CheckCircle2,
    FileText,
    Lightbulb,
    ScanSearch,
    ShieldCheck,
    Sparkles,
    Target,
    Upload,
    Zap,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useRef, useState } from 'react';
import HomeLayout from '@/layouts/front/home-layout';
import { login, register } from '@/routes';
import type { Auth } from '@/types';

const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease },
});

const ANALYSIS_FEATURES = [
    { icon: BarChart3, color: 'bg-blue-50 text-blue-600', label: 'ATS Score', desc: 'Skor kompatibilitas dengan sistem pelacak lamaran kerja perusahaan.' },
    { icon: Target, color: 'bg-emerald-50 text-emerald-600', label: 'Keyword Match', desc: 'Analisis kata kunci yang relevan dengan posisi yang Anda lamar.' },
    { icon: Lightbulb, color: 'bg-amber-50 text-amber-600', label: 'Saran Perbaikan', desc: 'Rekomendasi spesifik untuk meningkatkan kekuatan CV Anda.' },
    { icon: Brain, color: 'bg-violet-50 text-violet-600', label: 'Behavioral Insight', desc: 'Analisis tone dan gaya penulisan CV Anda secara mendalam.' },
    { icon: ShieldCheck, color: 'bg-rose-50 text-rose-600', label: 'Deteksi Kelemahan', desc: 'Temukan celah dan kekurangan yang perlu diperbaiki sebelum melamar.' },
    { icon: Zap, color: 'bg-orange-50 text-orange-600', label: 'Analisis Instan', desc: 'Hasil analisis lengkap dalam hitungan detik, tanpa antrean.' },
];

const STEPS = [
    { n: '01', title: 'Upload CV', desc: 'Unggah file CV Anda dalam format PDF atau DOCX. Privasi Anda terjamin.' },
    { n: '02', title: 'AI Menganalisis', desc: 'Sistem AI kami memproses dan mengevaluasi setiap bagian CV secara menyeluruh.' },
    { n: '03', title: 'Terima Laporan', desc: 'Dapatkan laporan lengkap dengan skor, kelemahan, dan saran perbaikan konkret.' },
];

const TESTIMONIALS = [
    { name: 'Rafi A.', role: 'Software Engineer', company: 'Tokopedia', text: 'ATS Score saya naik dari 62 ke 89 setelah menerapkan saran dari AI Analyzer. Langsung dipanggil interview!' },
    { name: 'Sari M.', role: 'Product Manager', company: 'Gojek', text: 'Fitur keyword match sangat membantu saya menyesuaikan CV dengan job description secara presisi.' },
    { name: 'Budi P.', role: 'Data Analyst', company: 'Traveloka', text: 'Deteksi kelemahan CV membuka mata saya. Format dan konten yang saya kira sudah bagus ternyata perlu banyak perbaikan.' },
];

function PageHeader() {
    return (
        <div className="relative overflow-hidden bg-white pb-16 pt-20">
            {/* bg dots */}
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage: 'radial-gradient(#01296a18 1px, transparent 1px)',
                    backgroundSize: '26px 26px',
                }}
            />
            {/* blobs */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-primary/12 blur-[100px]" />
                <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-blue-300/15 blur-[90px]" />
            </div>

            <div className="relative mx-auto max-w-4xl px-4 text-center">
                <motion.div {...fadeUp(0)} className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
                    <Sparkles className="size-3.5 text-primary" />
                    <span className="text-[11px] font-semibold tracking-widest text-primary uppercase">AI-Powered CV Review</span>
                </motion.div>

                <motion.h1 {...fadeUp(0.08)} className="text-4xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-5xl md:text-[3.25rem]">
                    Analisis CV Anda{' '}
                    <span className="bg-linear-to-r from-primary to-blue-500 bg-clip-text text-transparent">
                        Secara Instan
                    </span>
                </motion.h1>

                <motion.p {...fadeUp(0.16)} className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-gray-500">
                    Tingkatkan peluang diterima kerja dengan laporan analisis CV berbasis AI. Dapatkan ATS score, deteksi kelemahan, keyword match, dan saran perbaikan konkret dalam hitungan detik.
                </motion.p>

                <motion.div {...fadeUp(0.24)} className="mt-7 flex flex-wrap items-center justify-center gap-3">
                    {['✓ Gratis & Cepat', '✓ Privasi Terjamin', '✓ Tanpa Registrasi*'].map((item) => (
                        <span key={item} className="rounded-full bg-gray-100 px-3.5 py-1 text-xs font-medium text-gray-600">
                            {item}
                        </span>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}

function UploadCard() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const [dragging, setDragging] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) setFileName(file.name);
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) setFileName(file.name);
    }

    const redirectTarget = auth?.user ? '/candidate/cvs/builder' : login.url();

    return (
        <motion.div
            {...fadeUp(0.1)}
            className="mx-auto max-w-2xl"
        >
            <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-8 shadow-xl shadow-gray-100/80 sm:p-10">
                {/* top accent */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1 rounded-t-3xl bg-linear-to-r from-primary to-blue-400" />

                <div className="mb-6 text-center">
                    <h2 className="text-xl font-bold text-gray-900">Upload CV Anda</h2>
                    <p className="mt-1.5 text-sm text-gray-500">Mendukung format PDF & DOCX, maks. 5MB</p>
                </div>

                {/* dropzone */}
                <div
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    className={`flex cursor-pointer flex-col items-center gap-4 rounded-2xl border-2 border-dashed px-6 py-12 transition-all duration-200 ${
                        dragging
                            ? 'border-primary bg-primary/5 scale-[1.01]'
                            : fileName
                            ? 'border-emerald-300 bg-emerald-50'
                            : 'border-gray-200 bg-gray-50 hover:border-primary/50 hover:bg-primary/5'
                    }`}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        className="hidden"
                        onChange={handleFileChange}
                    />

                    {fileName ? (
                        <>
                            <div className="flex size-16 items-center justify-center rounded-2xl bg-emerald-100">
                                <CheckCircle2 className="size-8 text-emerald-500" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-semibold text-emerald-700">{fileName}</p>
                                <p className="mt-1 text-xs text-emerald-500">File siap dianalisis</p>
                            </div>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setFileName(null); }}
                                className="text-xs text-gray-400 underline hover:text-gray-600"
                            >
                                Ganti file
                            </button>
                        </>
                    ) : (
                        <>
                            <div className={`flex size-16 items-center justify-center rounded-2xl transition-colors ${dragging ? 'bg-primary/15' : 'bg-gray-100'}`}>
                                <Upload className={`size-8 transition-colors ${dragging ? 'text-primary' : 'text-gray-400'}`} />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-semibold text-gray-700">
                                    {dragging ? 'Lepaskan file di sini' : 'Drag & drop CV Anda'}
                                </p>
                                <p className="mt-1 text-xs text-gray-400">atau klik untuk memilih file</p>
                            </div>
                            <div className="flex gap-2">
                                {['PDF', 'DOCX'].map((fmt) => (
                                    <span key={fmt} className="rounded-full bg-white px-3 py-0.5 text-[11px] font-semibold text-gray-500 ring-1 ring-gray-200 ring-inset">
                                        {fmt}
                                    </span>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* CTA */}
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Link
                        href={redirectTarget}
                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-primary/25 transition hover:bg-primary/90"
                    >
                        <ScanSearch className="size-4" />
                        Analisis CV Sekarang
                    </Link>
                    {!auth?.user && (
                        <Link
                            href={register.url()}
                            className="flex items-center justify-center gap-1.5 rounded-2xl border border-gray-200 px-5 py-3.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                        >
                            Daftar Gratis
                            <ArrowRight className="size-3.5" />
                        </Link>
                    )}
                </div>

                {!auth?.user && (
                    <p className="mt-4 flex items-start gap-1.5 text-[11px] text-gray-400">
                        <AlertCircle className="mt-px size-3 shrink-0" />
                        *Analisis penuh memerlukan akun. Daftar gratis untuk melihat laporan lengkap.
                    </p>
                )}
            </div>
        </motion.div>
    );
}

export default function CvAnalyzerPage() {
    return (
        <HomeLayout>
            <Head title="AI CV Analyzer — Analisis CV Otomatis dengan AI" />

            {/* ── Page Header ── */}
            <PageHeader />

            {/* ── Upload Card ── */}
            <section className="bg-gray-50/60 px-4 py-14">
                <UploadCard />
            </section>

            {/* ── Apa yang Dianalisis ── */}
            <section className="bg-white px-4 py-20">
                <div className="mx-auto max-w-5xl">
                    <motion.div {...fadeUp()} className="mb-12 text-center">
                        <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Apa yang Dianalisis AI?</h2>
                        <p className="mx-auto mt-3 max-w-xl text-sm text-gray-500">
                            Sistem AI kami mengevaluasi 6 dimensi kritis yang menentukan apakah CV Anda lolos seleksi rekruter.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {ANALYSIS_FEATURES.map((feat, i) => (
                            <motion.div
                                key={feat.label}
                                {...fadeUp(i * 0.07)}
                                className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                            >
                                <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${feat.color}`}>
                                    <feat.icon className="size-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">{feat.label}</p>
                                    <p className="mt-1 text-xs leading-relaxed text-gray-500">{feat.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Cara Kerja ── */}
            <section className="bg-gray-50/60 px-4 py-20">
                <div className="mx-auto max-w-4xl">
                    <motion.div {...fadeUp()} className="mb-12 text-center">
                        <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Cara Kerjanya</h2>
                        <p className="mt-3 text-sm text-gray-500">3 langkah sederhana untuk CV yang lebih kuat</p>
                    </motion.div>

                    <div className="relative grid grid-cols-1 gap-10 sm:grid-cols-3">
                        {/* Connector */}
                        <div className="pointer-events-none absolute top-5 left-[calc(16.67%+1.25rem)] hidden w-[calc(66.67%-2.5rem)] border-t-2 border-dashed border-gray-200 sm:block" />

                        {STEPS.map((step, i) => (
                            <motion.div key={step.n} {...fadeUp(i * 0.1)} className="flex flex-col items-center text-center sm:items-start sm:text-left">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white shadow-md shadow-primary/25">
                                    {step.n}
                                </div>
                                <h3 className="mt-4 text-base font-semibold text-gray-900">{step.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-gray-500">{step.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Sample Report Preview ── */}
            <section className="bg-white px-4 py-20">
                <div className="mx-auto max-w-5xl">
                    <motion.div {...fadeUp()} className="mb-12 text-center">
                        <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Contoh Laporan Analisis</h2>
                        <p className="mt-3 text-sm text-gray-500">Ini yang akan Anda dapatkan setelah CV dianalisis</p>
                    </motion.div>

                    <motion.div {...fadeUp(0.1)} className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl shadow-gray-100/80">
                        {/* Mock report header */}
                        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
                                    <FileText className="size-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">CV Analysis Report</p>
                                    <p className="text-[11px] text-gray-400">Muhammad Febrian · Software Engineer</p>
                                </div>
                            </div>
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600 ring-1 ring-emerald-200 ring-inset">
                                Selesai
                            </span>
                        </div>

                        <div className="grid grid-cols-1 divide-y divide-gray-100 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
                            {/* ATS Score */}
                            <div className="p-6">
                                <p className="mb-4 text-xs font-semibold tracking-widest text-gray-400 uppercase">ATS Score</p>
                                <div className="flex items-end gap-1">
                                    <span className="text-5xl font-black text-primary">87</span>
                                    <span className="mb-1.5 text-lg font-medium text-gray-400">/100</span>
                                </div>
                                <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                                    <div className="h-full rounded-full bg-linear-to-r from-primary to-blue-400" style={{ width: '87%' }} />
                                </div>
                                <p className="mt-2 text-xs text-gray-500">Di atas rata-rata (68/100)</p>

                                <div className="mt-4 space-y-2">
                                    {[
                                        { label: 'Format & Struktur', val: 92 },
                                        { label: 'Keyword Density', val: 81 },
                                        { label: 'Readability', val: 88 },
                                    ].map((m) => (
                                        <div key={m.label}>
                                            <div className="mb-1 flex justify-between text-[11px]">
                                                <span className="text-gray-500">{m.label}</span>
                                                <span className="font-semibold text-gray-700">{m.val}%</span>
                                            </div>
                                            <div className="h-1 overflow-hidden rounded-full bg-gray-100">
                                                <div className="h-full rounded-full bg-primary/60" style={{ width: `${m.val}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Strengths & Weaknesses */}
                            <div className="p-6">
                                <p className="mb-4 text-xs font-semibold tracking-widest text-gray-400 uppercase">Temuan Utama</p>
                                <div className="space-y-2.5">
                                    {[
                                        { type: 'good', text: 'Pengalaman kerja terdeskripsi dengan pencapaian kuantitatif' },
                                        { type: 'good', text: 'Skill teknis relevan dan up-to-date' },
                                        { type: 'warn', text: 'Ringkasan profil terlalu generik' },
                                        { type: 'warn', text: 'Tidak ada link portofolio atau GitHub' },
                                        { type: 'bad', text: 'Keyword "Agile" & "Scrum" tidak ditemukan' },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-start gap-2.5">
                                            <span className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                                                item.type === 'good' ? 'bg-emerald-100 text-emerald-600' :
                                                item.type === 'warn' ? 'bg-amber-100 text-amber-600' :
                                                'bg-rose-100 text-rose-600'
                                            }`}>
                                                {item.type === 'good' ? '✓' : item.type === 'warn' ? '!' : '✕'}
                                            </span>
                                            <p className="text-xs leading-relaxed text-gray-600">{item.text}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recommendations */}
                            <div className="p-6">
                                <p className="mb-4 text-xs font-semibold tracking-widest text-gray-400 uppercase">Rekomendasi AI</p>
                                <div className="space-y-3">
                                    {[
                                        { icon: Lightbulb, color: 'text-amber-500 bg-amber-50', tip: 'Tambahkan summary yang menonjolkan value unik Anda dalam 3 kalimat.' },
                                        { icon: Target, color: 'text-blue-500 bg-blue-50', tip: 'Sertakan kata kunci "Agile", "Sprint", "Scrum" di bagian experience.' },
                                        { icon: BadgeCheck, color: 'text-emerald-500 bg-emerald-50', tip: 'Tambahkan link GitHub atau portofolio untuk memperkuat kredibilitas.' },
                                    ].map((rec, i) => (
                                        <div key={i} className="flex items-start gap-3 rounded-xl bg-gray-50 p-3">
                                            <div className={`flex size-6 shrink-0 items-center justify-center rounded-lg ${rec.color}`}>
                                                <rec.icon className="size-3.5" />
                                            </div>
                                            <p className="text-xs leading-relaxed text-gray-600">{rec.tip}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-5 rounded-xl bg-primary p-3.5 text-center">
                                    <p className="text-xs font-semibold text-white">Lihat laporan lengkap</p>
                                    <p className="mt-0.5 text-[11px] text-white/70">Login untuk akses semua insight</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── Testimonials ── */}
            <section className="bg-gray-50/60 px-4 py-20">
                <div className="mx-auto max-w-5xl">
                    <motion.div {...fadeUp()} className="mb-12 text-center">
                        <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Apa Kata Mereka?</h2>
                        <p className="mt-3 text-sm text-gray-500">Ribuan kandidat sudah meningkatkan CV mereka</p>
                    </motion.div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        {TESTIMONIALS.map((t, i) => (
                            <motion.div
                                key={t.name}
                                {...fadeUp(i * 0.08)}
                                className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
                            >
                                <div className="flex text-amber-400">
                                    {Array.from({ length: 5 }).map((_, j) => (
                                        <svg key={j} className="size-4 fill-current" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                </div>
                                <p className="flex-1 text-sm leading-relaxed text-gray-600">"{t.text}"</p>
                                <div className="flex items-center gap-3 border-t border-gray-100 pt-3">
                                    <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                        {t.name[0]}
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-900">{t.name}</p>
                                        <p className="text-[11px] text-gray-400">{t.role} · {t.company}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Bottom CTA ── */}
            <section className="px-4 py-20">
                <div className="mx-auto max-w-4xl">
                    <motion.div
                        {...fadeUp()}
                        className="relative overflow-hidden rounded-3xl bg-gray-900 px-8 py-16 text-center md:px-16"
                    >
                        <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary/25 blur-[80px]" />
                        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-blue-500/15 blur-[80px]" />

                        <div className="relative">
                            <span className="inline-block rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-widest text-white/80 uppercase">
                                Mulai Sekarang
                            </span>
                            <h2 className="mt-5 text-3xl font-extrabold text-white sm:text-4xl">
                                CV Anda Sudah Optimal?
                                <br />
                                <span className="text-primary-400">Buktikan dengan AI.</span>
                            </h2>
                            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-gray-300">
                                Gratis untuk dicoba. Daftar dan dapatkan analisis CV pertama Anda dalam 30 detik.
                            </p>
                            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                                <Link
                                    href={register.url()}
                                    className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition hover:bg-primary/90"
                                >
                                    <ScanSearch className="size-4" />
                                    Analisis CV Gratis
                                </Link>
                                <Link
                                    href={login.url()}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-6 py-3 text-sm font-medium text-white/80 transition hover:bg-white/10"
                                >
                                    Sudah punya akun? Masuk →
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>
        </HomeLayout>
    );
}
