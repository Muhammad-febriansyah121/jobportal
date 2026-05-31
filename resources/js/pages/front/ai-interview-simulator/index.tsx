import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    BadgeCheck,
    Bot,
    Brain,
    CheckCircle2,
    Lightbulb,
    Mic,
    PlayCircle,
    Smile,
    Sparkles,
    Target,
    Timer,
    Volume2,
    Waves,
    Zap,
} from 'lucide-react';
import { forwardRef } from 'react';
import HomeLayout from '@/layouts/front/home-layout';
import { Marquee } from '@/components/ui/marquee';
import { useTranslate } from '@/hooks/use-translate';
import { login, register } from '@/routes';
import type { Auth } from '@/types';

type MotionLikeProps<T extends HTMLElement> = React.HTMLAttributes<T> & {
    animate?: unknown;
    exit?: unknown;
    initial?: unknown;
    layoutId?: unknown;
    transition?: unknown;
    variants?: unknown;
    viewport?: unknown;
    whileInView?: unknown;
};

function stripMotionProps<T extends HTMLElement>({
    animate: _animate,
    exit: _exit,
    initial: _initial,
    layoutId: _layoutId,
    transition: _transition,
    variants: _variants,
    viewport: _viewport,
    whileInView: _whileInView,
    ...props
}: MotionLikeProps<T>): React.HTMLAttributes<T> {
    return props;
}

const MotionDiv = forwardRef<HTMLDivElement, MotionLikeProps<HTMLDivElement>>(
    function MotionDiv(props, ref) {
        return <div ref={ref} {...stripMotionProps(props)} />;
    },
);

const MotionH1 = forwardRef<HTMLHeadingElement, MotionLikeProps<HTMLHeadingElement>>(
    function MotionH1(props, ref) {
        return <h1 ref={ref} {...stripMotionProps(props)} />;
    },
);

const MotionP = forwardRef<HTMLParagraphElement, MotionLikeProps<HTMLParagraphElement>>(
    function MotionP(props, ref) {
        return <p ref={ref} {...stripMotionProps(props)} />;
    },
);

const motion = {
    div: MotionDiv,
    h1: MotionH1,
    p: MotionP,
};

const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease },
});

const FEATURE_ICONS = [
    { icon: Smile, color: 'bg-violet-50 text-violet-600', labelKey: 'front.ai_interview.feature_behavioral_label', descKey: 'front.ai_interview.feature_behavioral_desc' },
    { icon: Volume2, color: 'bg-blue-50 text-blue-600', labelKey: 'front.ai_interview.feature_voice_label', descKey: 'front.ai_interview.feature_voice_desc' },
    { icon: Brain, color: 'bg-emerald-50 text-emerald-600', labelKey: 'front.ai_interview.feature_skill_label', descKey: 'front.ai_interview.feature_skill_desc' },
    { icon: Target, color: 'bg-amber-50 text-amber-600', labelKey: 'front.ai_interview.feature_match_label', descKey: 'front.ai_interview.feature_match_desc' },
    { icon: Lightbulb, color: 'bg-rose-50 text-rose-600', labelKey: 'front.ai_interview.feature_feedback_label', descKey: 'front.ai_interview.feature_feedback_desc' },
    { icon: Zap, color: 'bg-orange-50 text-orange-600', labelKey: 'front.ai_interview.feature_realtime_label', descKey: 'front.ai_interview.feature_realtime_desc' },
];

function PageHeader() {
    const { t } = useTranslate();

    return (
        <div className="relative overflow-hidden bg-white pb-16 pt-20">
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage: 'radial-gradient(#01296a18 1px, transparent 1px)',
                    backgroundSize: '26px 26px',
                }}
            />
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-primary/12 blur-[100px]" />
                <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-blue-300/15 blur-[90px]" />
            </div>

            <div className="relative mx-auto max-w-4xl px-4 text-center">
                <motion.div {...fadeUp(0)} className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
                    <Sparkles className="size-3.5 text-primary" />
                    <span className="text-[11px] font-semibold tracking-widest text-primary uppercase">{t('front.ai_interview.hero_badge')}</span>
                </motion.div>

                <motion.h1 {...fadeUp(0.08)} className="text-4xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-5xl md:text-[3.25rem]">
                    {t('front.ai_interview.hero_title_prefix')}{' '}
                    <span className="bg-linear-to-r from-primary to-blue-500 bg-clip-text text-transparent">
                        {t('front.ai_interview.hero_title_highlight')}
                    </span>
                </motion.h1>

                <motion.p {...fadeUp(0.16)} className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-gray-500">
                    {t('front.ai_interview.hero_subtitle')}
                </motion.p>

                <motion.div {...fadeUp(0.24)} className="mt-7 flex flex-wrap items-center justify-center gap-3">
                    {[
                        t('front.ai_interview.tag_realtime'),
                        t('front.ai_interview.tag_unlimited'),
                        t('front.ai_interview.tag_personalized'),
                    ].map((item) => (
                        <span key={item} className="rounded-full bg-gray-100 px-3.5 py-1 text-xs font-medium text-gray-600">
                            ✓ {item}
                        </span>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}

function StartCard() {
    const { t } = useTranslate();
    const { auth } = usePage<{ auth: Auth }>().props;

    const startTarget = auth?.user ? '/candidate/ai-interviews' : login.url();

    return (
        <motion.div {...fadeUp(0.1)} className="mx-auto max-w-2xl">
            <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-8 shadow-xl shadow-gray-100/80 sm:p-10">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1 rounded-t-3xl bg-linear-to-r from-primary to-blue-400" />

                <div className="mb-6 text-center">
                    <h2 className="text-xl font-bold text-gray-900">{t('front.ai_interview.start_title')}</h2>
                    <p className="mt-1.5 text-sm text-gray-500">{t('front.ai_interview.start_desc')}</p>
                </div>

                <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-10">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className="relative">
                            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                            <div className="relative flex size-16 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/30">
                                <Mic className="size-8" />
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-700">{t('front.ai_interview.start_ready')}</p>
                            <p className="mt-1 text-xs text-gray-400">{t('front.ai_interview.start_hint')}</p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-2">
                            {[
                                t('front.ai_interview.modal_behavioral'),
                                t('front.ai_interview.modal_technical'),
                                t('front.ai_interview.modal_case'),
                            ].map((mode) => (
                                <span key={mode} className="rounded-full bg-white px-3 py-0.5 text-[11px] font-semibold text-gray-500 ring-1 ring-gray-200 ring-inset">
                                    {mode}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Link
                        href={startTarget}
                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-primary/25 transition hover:bg-primary/90"
                    >
                        <PlayCircle className="size-4" />
                        {t('front.ai_interview.btn_start')}
                    </Link>
                    {!auth?.user && (
                        <Link
                            href={register.url()}
                            className="flex items-center justify-center gap-1.5 rounded-2xl border border-gray-200 px-5 py-3.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                        >
                            {t('front.ai_interview.btn_register')}
                            <ArrowRight className="size-3.5" />
                        </Link>
                    )}
                </div>

                {!auth?.user && (
                    <p className="mt-4 flex items-start gap-1.5 text-[11px] text-gray-400">
                        <Sparkles className="mt-px size-3 shrink-0" />
                        {t('front.ai_interview.guest_note')}
                    </p>
                )}
            </div>
        </motion.div>
    );
}

export default function AiInterviewSimulatorPage() {
    const { t } = useTranslate();

    const features = FEATURE_ICONS.map((feat) => ({
        ...feat,
        label: t(feat.labelKey),
        desc: t(feat.descKey),
    }));

    const steps = [
        { n: '01', title: t('front.ai_interview.step1_title'), desc: t('front.ai_interview.step1_desc') },
        { n: '02', title: t('front.ai_interview.step2_title'), desc: t('front.ai_interview.step2_desc') },
        { n: '03', title: t('front.ai_interview.step3_title'), desc: t('front.ai_interview.step3_desc') },
    ];

    const testimonials = [
        { name: 'Rizky P.', text: 'Skor saya naik dari 65 ke 89. Latihan rutin via simulator bikin saya lebih tenang waktu interview asli.' },
        { name: 'Sari D.', text: 'Behavioral feedback-nya sangat detail. Saya tahu persis kata-kata mana yang terkesan kurang percaya diri.' },
        { name: 'Andi K.', text: 'Bisa latihan kapan saja tanpa batas. Insight skill match-nya membantu menutup celah pengetahuan saya.' },
        { name: 'Maya R.', text: 'Tips real-time-nya bikin saya berhenti pakai filler word "eee" dan "anu" tanpa sadar.' },
        { name: 'Bayu A.', text: 'Sesi technical mock-nya membantu saya membiasakan diri jelaskan algoritma dengan runtut.' },
        { name: 'Dinda S.', text: 'Laporan akhirnya jujur dan langsung to the point — saya tahu harus latihan apa berikutnya.' },
    ];

    return (
        <HomeLayout>
            <Head title={t('front.ai_interview.page_title')} />

            <PageHeader />

            <section className="bg-gray-50/60 px-4 py-14">
                <StartCard />
            </section>

            {/* Apa yang Dianalisis */}
            <section className="bg-white px-4 py-20">
                <div className="mx-auto max-w-5xl">
                    <motion.div {...fadeUp()} className="mb-12 text-center">
                        <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">{t('front.ai_interview.section_what_title')}</h2>
                        <p className="mx-auto mt-3 max-w-xl text-sm text-gray-500">{t('front.ai_interview.section_what_desc')}</p>
                    </motion.div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {features.map((feat, i) => (
                            <motion.div
                                key={feat.labelKey}
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

            {/* Cara Kerja */}
            <section className="bg-gray-50/60 px-4 py-20">
                <div className="mx-auto max-w-4xl">
                    <motion.div {...fadeUp()} className="mb-12 text-center">
                        <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">{t('front.ai_interview.section_how_title')}</h2>
                        <p className="mt-3 text-sm text-gray-500">{t('front.ai_interview.section_how_desc')}</p>
                    </motion.div>

                    <div className="relative grid grid-cols-1 gap-10 sm:grid-cols-3">
                        <div className="pointer-events-none absolute top-5 left-[calc(16.67%+1.25rem)] hidden w-[calc(66.67%-2.5rem)] border-t-2 border-dashed border-gray-200 sm:block" />

                        {steps.map((step, i) => (
                            <motion.div key={step.n} {...fadeUp(i * 0.1)} className="flex flex-col items-center text-center sm:items-start sm:text-left">
                                <div className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white shadow-md shadow-primary/25">
                                    {step.n}
                                </div>
                                <h3 className="mt-4 text-base font-semibold text-gray-900">{step.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-gray-500">{step.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Sample Report Preview */}
            <section className="bg-white px-4 py-20">
                <div className="mx-auto max-w-5xl">
                    <motion.div {...fadeUp()} className="mb-12 text-center">
                        <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">{t('front.ai_interview.section_sample_title')}</h2>
                        <p className="mt-3 text-sm text-gray-500">{t('front.ai_interview.section_sample_desc')}</p>
                    </motion.div>

                    <motion.div {...fadeUp(0.1)} className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl shadow-gray-100/80">
                        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
                                    <Bot className="size-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">{t('front.ai_interview.report_title')}</p>
                                    <p className="text-[11px] text-gray-400">Muhammad Febrian · Software Engineer</p>
                                </div>
                            </div>
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600 ring-1 ring-emerald-200 ring-inset">
                                {t('front.ai_interview.report_done')}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 divide-y divide-gray-100 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
                            {/* Match Score */}
                            <div className="p-6">
                                <p className="mb-4 text-xs font-semibold tracking-widest text-gray-400 uppercase">{t('front.ai_interview.report_score_label')}</p>
                                <div className="flex items-end gap-1">
                                    <span className="text-5xl font-black text-primary">88</span>
                                    <span className="mb-1.5 text-lg font-medium text-gray-400">/100</span>
                                </div>
                                <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                                    <div className="h-full rounded-full bg-linear-to-r from-primary to-blue-400" style={{ width: '88%' }} />
                                </div>
                                <p className="mt-2 text-xs text-gray-500">{t('front.ai_interview.report_above_avg', { avg: 71 })}</p>

                                <div className="mt-4 space-y-2">
                                    {[
                                        { label: t('front.ai_interview.metric_leadership'), val: 82 },
                                        { label: t('front.ai_interview.metric_tech'), val: 65 },
                                        { label: t('front.ai_interview.metric_communication'), val: 78 },
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

                            {/* Findings */}
                            <div className="p-6">
                                <p className="mb-4 text-xs font-semibold tracking-widest text-gray-400 uppercase">{t('front.ai_interview.report_findings')}</p>
                                <div className="space-y-2.5">
                                    {[
                                        { type: 'good', textKey: 'front.ai_interview.finding_good_1' },
                                        { type: 'good', textKey: 'front.ai_interview.finding_good_2' },
                                        { type: 'warn', textKey: 'front.ai_interview.finding_warn_1' },
                                        { type: 'warn', textKey: 'front.ai_interview.finding_warn_2' },
                                        { type: 'bad', textKey: 'front.ai_interview.finding_bad_1' },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-start gap-2.5">
                                            <span className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                                                item.type === 'good' ? 'bg-emerald-100 text-emerald-600' :
                                                item.type === 'warn' ? 'bg-amber-100 text-amber-600' :
                                                'bg-rose-100 text-rose-600'
                                            }`}>
                                                {item.type === 'good' ? '✓' : item.type === 'warn' ? '!' : '✕'}
                                            </span>
                                            <p className="text-xs leading-relaxed text-gray-600">{t(item.textKey)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recommendations */}
                            <div className="p-6">
                                <p className="mb-4 text-xs font-semibold tracking-widest text-gray-400 uppercase">{t('front.ai_interview.report_ai_recommendations')}</p>
                                <div className="space-y-3">
                                    {[
                                        { icon: Lightbulb, color: 'text-amber-500 bg-amber-50', textKey: 'front.ai_interview.tip_1' },
                                        { icon: Target, color: 'text-blue-500 bg-blue-50', textKey: 'front.ai_interview.tip_2' },
                                        { icon: BadgeCheck, color: 'text-emerald-500 bg-emerald-50', textKey: 'front.ai_interview.tip_3' },
                                    ].map((rec, i) => (
                                        <div key={i} className="flex items-start gap-3 rounded-xl bg-gray-50 p-3">
                                            <div className={`flex size-6 shrink-0 items-center justify-center rounded-lg ${rec.color}`}>
                                                <rec.icon className="size-3.5" />
                                            </div>
                                            <p className="text-xs leading-relaxed text-gray-600">{t(rec.textKey)}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-5 rounded-xl bg-primary p-3.5 text-center">
                                    <p className="text-xs font-semibold text-white">{t('front.ai_interview.btn_full_report')}</p>
                                    <p className="mt-0.5 text-[11px] text-white/70">{t('front.ai_interview.login_hint')}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Live transcript mock */}
            <section className="bg-gray-50/60 px-4 py-20">
                <div className="mx-auto max-w-5xl">
                    <motion.div {...fadeUp()} className="mb-12 text-center">
                        <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">{t('front.ai_interview.section_live_title')}</h2>
                        <p className="mt-3 text-sm text-gray-500">{t('front.ai_interview.section_live_desc')}</p>
                    </motion.div>

                    <motion.div {...fadeUp(0.1)} className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-3">
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                                        <Bot className="size-4 text-primary" />
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900">{t('front.ai_interview.transcript_title')}</span>
                                </div>
                                <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1">
                                    <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
                                    <span className="text-[10px] font-bold tracking-widest text-emerald-600 uppercase">{t('front.ai_interview.transcript_live')}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex gap-3">
                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">AI</div>
                                    <div className="flex-1 rounded-2xl rounded-tl-sm bg-gray-50 p-3">
                                        <p className="text-xs leading-relaxed text-gray-700">{t('front.ai_interview.transcript_q')}</p>
                                    </div>
                                </div>
                                <div className="flex flex-row-reverse gap-3">
                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">U</div>
                                    <div className="flex-1 rounded-2xl rounded-tr-sm bg-emerald-50 p-3">
                                        <p className="text-xs leading-relaxed text-gray-700">{t('front.ai_interview.transcript_a')}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
                                        <Lightbulb className="size-4 text-amber-500" />
                                    </div>
                                    <div className="flex-1 rounded-2xl rounded-tl-sm border border-amber-100 bg-amber-50/50 p-3">
                                        <p className="text-[11px] font-semibold tracking-wide text-amber-700 uppercase">{t('front.ai_interview.transcript_coach')}</p>
                                        <p className="mt-1 text-xs leading-relaxed text-gray-700">{t('front.ai_interview.transcript_coach_text')}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 flex items-center gap-3 rounded-2xl bg-gray-900 p-3">
                                <div className="flex size-9 items-center justify-center rounded-xl bg-primary">
                                    <Mic className="size-4 text-white" />
                                </div>
                                <div className="flex flex-1 items-center gap-1">
                                    {[10, 22, 14, 28, 18, 24, 16, 30, 20, 12, 26, 18].map((h, i) => (
                                        <span key={i} className="w-1 rounded-full bg-primary/70" style={{ height: `${h}px` }} />
                                    ))}
                                </div>
                                <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1">
                                    <Timer className="size-3 text-white/70" />
                                    <span className="text-[10px] font-semibold text-white/80">02:14</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 lg:col-span-2">
                            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                                <div className="mb-3 flex items-center gap-2">
                                    <Waves className="size-4 text-primary" />
                                    <span className="text-sm font-semibold text-gray-900">{t('front.ai_interview.signal_title')}</span>
                                </div>
                                <div className="space-y-3">
                                    {[
                                        { label: t('front.ai_interview.signal_confidence'), val: 86, color: 'bg-emerald-500' },
                                        { label: t('front.ai_interview.signal_clarity'), val: 78, color: 'bg-blue-500' },
                                        { label: t('front.ai_interview.signal_pace'), val: 64, color: 'bg-amber-500' },
                                        { label: t('front.ai_interview.signal_filler'), val: 22, color: 'bg-rose-500' },
                                    ].map((s) => (
                                        <div key={s.label}>
                                            <div className="mb-1 flex justify-between text-[11px]">
                                                <span className="text-gray-500">{s.label}</span>
                                                <span className="font-semibold text-gray-700">{s.val}%</span>
                                            </div>
                                            <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                                                <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.val}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-3xl border border-primary/15 bg-primary/5 p-6">
                                <div className="mb-3 flex items-center gap-2">
                                    <Sparkles className="size-4 text-primary" />
                                    <span className="text-sm font-semibold text-primary">{t('front.ai_interview.tips_title')}</span>
                                </div>
                                <p className="text-xs leading-relaxed text-gray-700">{t('front.ai_interview.tips_text')}</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="bg-white px-4 py-20">
                <div className="mx-auto max-w-6xl">
                    <motion.div {...fadeUp()} className="mb-12 text-center">
                        <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">{t('front.ai_interview.section_testimonials_title')}</h2>
                        <p className="mt-3 text-sm text-gray-500">{t('front.ai_interview.section_testimonials_desc')}</p>
                    </motion.div>

                    <div className="relative">
                        <Marquee pauseOnHover repeat={2} className="[--duration:60s]">
                            {testimonials.map((testimonial) => (
                                <div
                                    key={testimonial.name}
                                    className="flex w-[320px] shrink-0 flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
                                >
                                    <div className="flex text-amber-400">
                                        {Array.from({ length: 5 }).map((_, j) => (
                                            <svg key={j} className="size-4 fill-current" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        ))}
                                    </div>
                                    <p className="flex-1 text-sm leading-relaxed text-gray-600">"{testimonial.text}"</p>
                                    <div className="flex items-center gap-3 border-t border-gray-100 pt-3">
                                        <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                            {testimonial.name[0]}
                                        </div>
                                        <p className="text-xs font-semibold text-gray-900">{testimonial.name}</p>
                                    </div>
                                </div>
                            ))}
                        </Marquee>
                        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-linear-to-r from-white to-transparent" />
                        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-linear-to-l from-white to-transparent" />
                    </div>
                </div>
            </section>

            {/* Bottom CTA */}
            <section className="px-4 py-20">
                <div className="mx-auto max-w-4xl">
                    <motion.div {...fadeUp()} className="relative overflow-hidden rounded-3xl bg-gray-900 px-8 py-16 text-center md:px-16">
                        <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary/25 blur-[80px]" />
                        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-blue-500/15 blur-[80px]" />

                        <div className="relative">
                            <span className="inline-block rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-widest text-white/80 uppercase">
                                {t('front.ai_interview.cta_badge')}
                            </span>
                            <h2 className="mt-5 text-3xl font-extrabold text-white sm:text-4xl">
                                {t('front.ai_interview.cta_title_1')}
                                <br />
                                <span className="text-primary-400">{t('front.ai_interview.cta_title_2')}</span>
                            </h2>
                            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-gray-300">
                                {t('front.ai_interview.cta_desc')}
                            </p>
                            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                                <Link
                                    href={register.url()}
                                    className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition hover:bg-primary/90"
                                >
                                    <PlayCircle className="size-4" />
                                    {t('front.ai_interview.cta_btn_start')}
                                </Link>
                                <Link
                                    href={login.url()}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-6 py-3 text-sm font-medium text-white/80 transition hover:bg-white/10"
                                >
                                    {t('front.ai_interview.cta_btn_login')}
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>
        </HomeLayout>
    );
}
