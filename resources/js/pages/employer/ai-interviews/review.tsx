import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    Award,
    Bot,
    Briefcase,
    CheckCircle2,
    ChevronDown,
    ClipboardList,
    Clock3,
    Download,
    FileText,
    Flame,
    Gauge,
    LineChart,
    Mail,
    MessageSquareText,
    Mic,
    PieChart,
    ShieldCheck,
    Sparkles,
    Star,
    Target,
    Timer,
    TrendingUp,
    Type,
    User,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import EmployerAiInterviewController from '@/actions/App/Http/Controllers/Employer/EmployerAiInterviewController';
import { ProgressBar } from '@/components/candidate/candidate-ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { show as showJob } from '@/routes/employer/jobs';

type Response = {
    id: number;
    order: number;
    question?: string | null;
    category?: string | null;
    rubric?: string | null;
    weight?: number | null;
    answer_text?: string | null;
    ai_score?: number | null;
    ai_analysis?: string | null;
    word_count: number;
    is_skipped: boolean;
    is_short: boolean;
    is_strong: boolean;
    answered_at?: string | null;
};

type CategoryScore = {
    category: string;
    label: string;
    total: number;
    answered: number;
    avg_score: number | null;
    status: 'good' | 'medium' | 'low' | 'pending';
};

type Metrics = {
    total_questions: number;
    answered_count: number;
    skipped_count: number;
    response_rate: number;
    total_words: number;
    avg_words: number;
    shortest_words: number;
    longest_words: number;
    avg_response_score: number | null;
    duration_seconds: number | null;
};

type ReviewProps = {
    company: {
        id: number;
        name: string;
    };
    session: {
        id: number;
        status: string;
        interview_mode?: string | null;
        interview_language?: string | null;
        scheduled_at?: string | null;
        started_at?: string | null;
        completed_at?: string | null;
        duration_minutes?: number | null;
        voice?: string | null;
        recording_url?: string | null;
        live_transcript?: string | null;
        job: {
            id?: number | null;
            title?: string | null;
        };
        application?: {
            id?: number | null;
            status?: string | null;
        } | null;
        candidate: {
            id?: number | null;
            name: string;
            headline?: string | null;
            email?: string | null;
        };
        responses: Response[];
        analysis?: {
            fit_score?: number | null;
            recommendation?: string | null;
            summary?: string | null;
            strengths: string[];
            weaknesses: string[];
            technical_scorecard: Record<string, number>;
        } | null;
        metrics: Metrics;
        category_scores: CategoryScore[];
        flags: string[];
        highlights: string[];
    };
};

type TranscriptLine = {
    speaker: 'ai' | 'candidate';
    text: string;
};

function parseTranscript(raw: string): TranscriptLine[] {
    return raw
        .split('\n')
        .filter((line) => line.trim() !== '')
        .map((line): TranscriptLine | null => {
            if (line.startsWith('AI:')) {
                return {
                    speaker: 'ai',
                    text: line.replace(/^AI:\s*/, '').trim(),
                };
            }
            if (line.startsWith('Kandidat:')) {
                return {
                    speaker: 'candidate',
                    text: line.replace(/^Kandidat:\s*/, '').trim(),
                };
            }
            return null;
        })
        .filter((line): line is TranscriptLine => line !== null);
}

function formatDuration(seconds: number | null | undefined): string {
    if (!seconds || seconds <= 0) {
        return '—';
    }
    const minutes = Math.floor(seconds / 60);
    const sec = seconds % 60;
    if (minutes === 0) {
        return `${sec} dtk`;
    }
    return `${minutes} mnt ${sec.toString().padStart(2, '0')} dtk`;
}

export default function EmployerAiInterviewReview({
    company,
    session,
}: ReviewProps) {
    const [activeTab, setActiveTab] = useState('overview');

    const score = session.analysis?.fit_score ?? 0;
    const scorecard = Object.entries(session.analysis?.technical_scorecard ?? {});
    const status = session.application?.status ?? session.status;

    const transcriptLines = useMemo(
        () =>
            session.live_transcript
                ? parseTranscript(session.live_transcript)
                : [],
        [session.live_transcript],
    );

    const modeLabel = session.interview_mode === 'text' ? 'Teks' : 'Voice AI';
    const langLabel =
        session.interview_language === 'en' ? 'English' : 'Bahasa Indonesia';
    const verdict = verdictFromScore(score);

    return (
        <>
            <Head title={`Review · ${session.candidate.name}`} />

            <div className="min-h-screen bg-white p-4 md:p-6">
                <div className="mx-auto max-w-6xl space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                            {session.job.id ? (
                                <Link
                                    href={showJob(session.job.id).url}
                                    className="inline-flex items-center gap-1 hover:text-foreground"
                                >
                                    <ArrowLeft className="size-3.5" />
                                    Lowongan
                                </Link>
                            ) : null}
                            <span aria-hidden>·</span>
                            <span>{company.name}</span>
                            <span aria-hidden>·</span>
                            <Badge variant="outline" className="capitalize">
                                <ShieldCheck className="size-3" />
                                {status.replace('_', ' ')}
                            </Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                asChild
                            >
                                <a
                                    href={EmployerAiInterviewController.downloadReportPdf.url(
                                        session.id,
                                    )}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <Download className="size-4" />
                                    Download PDF
                                </a>
                            </Button>
                        </div>
                    </div>

                    <Card className="overflow-hidden border-0 bg-gradient-to-br from-[#01296A] via-[#0a3a8a] to-[#0a4ba5] text-white shadow-lg">
                        <CardContent className="grid gap-6 p-6 md:grid-cols-[auto_1fr_auto] md:items-center md:gap-8 md:p-8">
                            <ScoreRing score={score} />
                            <div className="space-y-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge className="border-0 bg-white/15 text-white">
                                        AI Interview Review
                                    </Badge>
                                    <Badge
                                        className={cn(
                                            'border-0 text-white',
                                            verdict.bg,
                                        )}
                                    >
                                        {verdict.label}
                                    </Badge>
                                </div>
                                <h1 className="text-2xl font-bold leading-tight md:text-3xl">
                                    {session.candidate.name}
                                </h1>
                                <p className="text-sm text-white/80">
                                    {[
                                        session.candidate.headline,
                                        session.candidate.email,
                                    ]
                                        .filter(Boolean)
                                        .join(' · ')}
                                </p>
                                <p className="text-sm font-medium text-white/90">
                                    Posisi:{' '}
                                    <span className="font-semibold">
                                        {session.job.title ?? '—'}
                                    </span>
                                </p>
                            </div>
                            <div className="flex flex-col gap-2 md:items-end">
                                <Badge className="border-0 bg-white/10 text-white">
                                    <Mic className="size-3" />
                                    {modeLabel} · {langLabel}
                                </Badge>
                                {session.completed_at ? (
                                    <Badge className="border-0 bg-white/10 text-white">
                                        <Clock3 className="size-3" />
                                        Selesai {session.completed_at}
                                    </Badge>
                                ) : null}
                                {session.candidate.email ? (
                                    <a
                                        href={`mailto:${session.candidate.email}`}
                                        className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-xs font-medium text-white/90 transition hover:bg-white/20"
                                    >
                                        <Mail className="size-3" />
                                        Hubungi kandidat
                                    </a>
                                ) : null}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                        <KpiCard
                            icon={Star}
                            label="Avg Skor Jawaban"
                            value={
                                session.metrics.avg_response_score !== null
                                    ? `${session.metrics.avg_response_score}`
                                    : '—'
                            }
                            tone={
                                session.metrics.avg_response_score !== null
                                    ? toneFromScore(
                                          session.metrics.avg_response_score,
                                      )
                                    : 'neutral'
                            }
                        />
                        <KpiCard
                            icon={ClipboardList}
                            label="Response Rate"
                            value={`${session.metrics.response_rate}%`}
                            tone={
                                session.metrics.response_rate >= 90
                                    ? 'good'
                                    : session.metrics.response_rate >= 60
                                      ? 'medium'
                                      : 'low'
                            }
                        />
                        <KpiCard
                            icon={MessageSquareText}
                            label="Pertanyaan"
                            value={`${session.metrics.answered_count}/${session.metrics.total_questions}`}
                        />
                        <KpiCard
                            icon={Type}
                            label="Total Kata"
                            value={`${session.metrics.total_words.toLocaleString('id-ID')}`}
                            sub={`avg ${session.metrics.avg_words}`}
                        />
                        <KpiCard
                            icon={Timer}
                            label="Durasi"
                            value={formatDuration(
                                session.metrics.duration_seconds,
                            )}
                            sub={
                                session.duration_minutes
                                    ? `alokasi ${session.duration_minutes} mnt`
                                    : undefined
                            }
                        />
                        <KpiCard
                            icon={Flame}
                            label="Skip / Pendek"
                            value={`${session.metrics.skipped_count} / ${session.responses.filter((r) => r.is_short).length}`}
                            tone={
                                session.metrics.skipped_count +
                                    session.responses.filter((r) => r.is_short)
                                        .length >
                                0
                                    ? 'warning'
                                    : 'good'
                            }
                        />
                    </div>

                    {(session.flags.length > 0 ||
                        session.highlights.length > 0) && (
                        <div className="grid gap-3 lg:grid-cols-2">
                            {session.highlights.length > 0 ? (
                                <SignalCard
                                    tone="positive"
                                    icon={CheckCircle2}
                                    title="Sinyal positif"
                                    items={session.highlights}
                                />
                            ) : null}
                            {session.flags.length > 0 ? (
                                <SignalCard
                                    tone="warning"
                                    icon={AlertTriangle}
                                    title="Perlu perhatian"
                                    items={session.flags}
                                />
                            ) : null}
                        </div>
                    )}

                    {session.recording_url ? (
                        <Card>
                            <CardHeader className="pb-3">
                                <SectionTitle
                                    icon={Mic}
                                    eyebrow="Recording"
                                    title="Rekaman Interview"
                                />
                            </CardHeader>
                            <CardContent>
                                <video
                                    src={session.recording_url}
                                    controls
                                    preload="metadata"
                                    className="max-h-[480px] w-full rounded-xl border bg-black"
                                />
                            </CardContent>
                        </Card>
                    ) : null}

                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="h-auto w-full justify-start gap-1 bg-muted/40 p-1">
                            <TabsTrigger
                                value="overview"
                                className="gap-2 data-[state=active]:bg-background"
                            >
                                <Sparkles className="size-3.5" />
                                Ringkasan
                            </TabsTrigger>
                            <TabsTrigger
                                value="responses"
                                className="gap-2 data-[state=active]:bg-background"
                            >
                                <FileText className="size-3.5" />
                                Per Pertanyaan ({session.responses.length})
                            </TabsTrigger>
                            {transcriptLines.length > 0 && (
                                <TabsTrigger
                                    value="transcript"
                                    className="gap-2 data-[state=active]:bg-background"
                                >
                                    <MessageSquareText className="size-3.5" />
                                    Transkrip
                                </TabsTrigger>
                            )}
                            <TabsTrigger
                                value="meta"
                                className="gap-2 data-[state=active]:bg-background"
                            >
                                <ClipboardList className="size-3.5" />
                                Detail Sesi
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent
                            value="overview"
                            className="mt-4 grid gap-5 lg:grid-cols-[1.4fr_1fr]"
                        >
                            <div className="space-y-5">
                                <Card>
                                    <CardHeader>
                                        <SectionTitle
                                            icon={Sparkles}
                                            eyebrow="Executive brief"
                                            title="Ringkasan AI"
                                        />
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <p className="text-sm leading-7 text-foreground/85">
                                            {session.analysis?.summary ??
                                                'Ringkasan AI belum tersedia untuk sesi ini.'}
                                        </p>
                                        {session.analysis?.recommendation ? (
                                            <div className="rounded-lg border bg-muted/30 p-3 text-sm leading-6">
                                                <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                                                    Rekomendasi AI
                                                </p>
                                                <p className="mt-1 font-medium">
                                                    {
                                                        session.analysis
                                                            .recommendation
                                                    }
                                                </p>
                                            </div>
                                        ) : null}
                                    </CardContent>
                                </Card>

                                {session.category_scores.length > 0 ? (
                                    <Card>
                                        <CardHeader>
                                            <SectionTitle
                                                icon={Gauge}
                                                eyebrow="Per kategori"
                                                title="Performa per Kategori"
                                            />
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            {session.category_scores.map(
                                                (item) => (
                                                    <CategoryScoreRow
                                                        key={item.category}
                                                        item={item}
                                                    />
                                                ),
                                            )}
                                        </CardContent>
                                    </Card>
                                ) : null}

                                {scorecard.length > 0 ? (
                                    <Card>
                                        <CardHeader>
                                            <SectionTitle
                                                icon={PieChart}
                                                eyebrow="Technical scorecard"
                                                title="Kompetensi Teknis"
                                            />
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {scorecard.map(([label, value]) => (
                                                <div key={label}>
                                                    <div className="mb-1.5 flex items-center justify-between gap-2 text-xs font-semibold tracking-wider uppercase">
                                                        <span>
                                                            {label.replace(
                                                                /[_-]+/g,
                                                                ' ',
                                                            )}
                                                        </span>
                                                        <span
                                                            className={cn(
                                                                'font-bold',
                                                                value >= 80
                                                                    ? 'text-emerald-600'
                                                                    : value >=
                                                                        60
                                                                      ? 'text-amber-600'
                                                                      : 'text-rose-600',
                                                            )}
                                                        >
                                                            {value}/100
                                                        </span>
                                                    </div>
                                                    <ProgressBar
                                                        value={value}
                                                    />
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                ) : null}
                            </div>

                            <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
                                <InsightCard
                                    title="Kekuatan"
                                    icon={CheckCircle2}
                                    items={session.analysis?.strengths ?? []}
                                    tone="success"
                                />
                                <InsightCard
                                    title="Area Validasi"
                                    icon={TrendingUp}
                                    items={session.analysis?.weaknesses ?? []}
                                    tone="warning"
                                />
                                <Card className="border-[#01296A]/20 bg-[#eff4ff]/60">
                                    <CardContent className="space-y-3 p-5">
                                        <div className="flex size-10 items-center justify-center rounded-xl bg-[#01296A]/15 text-[#01296A]">
                                            <Target className="size-5" />
                                        </div>
                                        <div className="space-y-1">
                                            <h2 className="text-base font-semibold">
                                                Kalibrasi keputusan
                                            </h2>
                                            <p className="text-xs leading-6 text-foreground/70">
                                                Skor AI adalah sinyal awal —
                                                pertimbangkan kebutuhan tim,
                                                kultur, dan interview lanjutan
                                                sebelum mengambil keputusan
                                                final.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </aside>
                        </TabsContent>

                        <TabsContent
                            value="responses"
                            className="mt-4 space-y-3"
                        >
                            {session.responses.map((response) => (
                                <ResponseCard
                                    key={response.id}
                                    response={response}
                                />
                            ))}
                        </TabsContent>

                        {transcriptLines.length > 0 && (
                            <TabsContent value="transcript" className="mt-4">
                                <Card>
                                    <CardHeader>
                                        <SectionTitle
                                            icon={MessageSquareText}
                                            eyebrow="Live transcript"
                                            title="Rekaman percakapan"
                                        />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3 rounded-xl bg-slate-50 p-4">
                                            {transcriptLines.map(
                                                (line, index) => (
                                                    <div
                                                        key={index}
                                                        className={cn(
                                                            'flex gap-3',
                                                            line.speaker ===
                                                                'candidate' &&
                                                                'flex-row-reverse',
                                                        )}
                                                    >
                                                        <div
                                                            className={cn(
                                                                'flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white',
                                                                line.speaker ===
                                                                    'ai'
                                                                    ? 'bg-[#01296A]'
                                                                    : 'bg-slate-500',
                                                            )}
                                                        >
                                                            {line.speaker ===
                                                            'ai' ? (
                                                                <Bot className="size-4" />
                                                            ) : (
                                                                <User className="size-4" />
                                                            )}
                                                        </div>
                                                        <div
                                                            className={cn(
                                                                'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-6',
                                                                line.speaker ===
                                                                    'ai'
                                                                    ? 'rounded-tl-sm bg-[#eff4ff] text-[#01296A]'
                                                                    : 'rounded-tr-sm border bg-white text-foreground shadow-sm',
                                                            )}
                                                        >
                                                            <p className="mb-1 text-[10px] font-semibold tracking-wider opacity-60 uppercase">
                                                                {line.speaker ===
                                                                'ai'
                                                                    ? 'AI Interviewer'
                                                                    : session
                                                                          .candidate
                                                                          .name}
                                                            </p>
                                                            {line.text}
                                                        </div>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        )}

                        <TabsContent
                            value="meta"
                            className="mt-4 grid gap-3 md:grid-cols-2"
                        >
                            <MetaItem
                                icon={Briefcase}
                                label="Posisi"
                                value={session.job.title ?? '—'}
                            />
                            <MetaItem
                                icon={ShieldCheck}
                                label="Status sesi"
                                value={session.status.replace('_', ' ')}
                                capitalize
                            />
                            <MetaItem
                                icon={Mic}
                                label="Mode interview"
                                value={`${modeLabel} · ${langLabel}`}
                            />
                            <MetaItem
                                icon={Clock3}
                                label="Mulai"
                                value={session.started_at ?? '—'}
                            />
                            <MetaItem
                                icon={Clock3}
                                label="Selesai"
                                value={session.completed_at ?? '—'}
                            />
                            <MetaItem
                                icon={Timer}
                                label="Alokasi durasi"
                                value={
                                    session.duration_minutes
                                        ? `${session.duration_minutes} menit`
                                        : '—'
                                }
                            />
                            <MetaItem
                                icon={LineChart}
                                label="Durasi aktual"
                                value={formatDuration(
                                    session.metrics.duration_seconds,
                                )}
                            />
                            <MetaItem
                                icon={Type}
                                label="Avg / Total kata"
                                value={`${session.metrics.avg_words} / ${session.metrics.total_words.toLocaleString('id-ID')}`}
                            />
                            <MetaItem
                                icon={Award}
                                label="Jawaban terpanjang"
                                value={`${session.metrics.longest_words} kata`}
                            />
                            <MetaItem
                                icon={Award}
                                label="Jawaban terpendek"
                                value={`${session.metrics.shortest_words} kata`}
                            />
                            {session.voice ? (
                                <MetaItem
                                    icon={Bot}
                                    label="AI Voice"
                                    value={session.voice}
                                    capitalize
                                />
                            ) : null}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </>
    );
}

function ScoreRing({ score }: { score: number }) {
    const radius = 56;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="relative mx-auto inline-flex size-36 items-center justify-center md:size-40">
            <svg
                width="100%"
                height="100%"
                viewBox="0 0 144 144"
                className="-rotate-90"
            >
                <circle
                    cx="72"
                    cy="72"
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="10"
                />
                <circle
                    cx="72"
                    cy="72"
                    r={radius}
                    fill="none"
                    stroke="white"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
            </svg>
            <div className="absolute flex flex-col items-center text-white">
                <span className="text-5xl font-black leading-none">
                    {score}
                </span>
                <span className="mt-1 text-[10px] font-semibold tracking-[0.2em] text-white/70 uppercase">
                    Fit Score
                </span>
            </div>
        </div>
    );
}

function KpiCard({
    icon: Icon,
    label,
    value,
    sub,
    tone = 'neutral',
}: {
    icon: LucideIcon;
    label: string;
    value: string;
    sub?: string;
    tone?: 'good' | 'medium' | 'low' | 'warning' | 'neutral';
}) {
    const toneClass = {
        good: 'text-emerald-600',
        medium: 'text-amber-600',
        low: 'text-rose-600',
        warning: 'text-rose-600',
        neutral: 'text-foreground',
    }[tone];
    return (
        <Card>
            <CardContent className="space-y-1 p-3 md:p-4">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                    <Icon className="size-3" />
                    {label}
                </div>
                <p className={cn('text-lg font-bold leading-tight', toneClass)}>
                    {value}
                </p>
                {sub ? (
                    <p className="text-[10px] text-muted-foreground">{sub}</p>
                ) : null}
            </CardContent>
        </Card>
    );
}

function CategoryScoreRow({ item }: { item: CategoryScore }) {
    const score = item.avg_score ?? 0;
    const styles = {
        good: {
            badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
            track: 'bg-emerald-100',
            fill: 'bg-emerald-500',
        },
        medium: {
            badge: 'bg-amber-100 text-amber-800 border-amber-200',
            track: 'bg-amber-100',
            fill: 'bg-amber-500',
        },
        low: {
            badge: 'bg-rose-100 text-rose-800 border-rose-200',
            track: 'bg-rose-100',
            fill: 'bg-rose-500',
        },
        pending: {
            badge: 'bg-slate-100 text-slate-700 border-slate-200',
            track: 'bg-slate-100',
            fill: 'bg-slate-400',
        },
    }[item.status];

    return (
        <div className="rounded-lg border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold capitalize">
                        {item.label}
                    </p>
                    <Badge variant="outline" className="text-[10px]">
                        {item.answered}/{item.total} terjawab
                    </Badge>
                </div>
                <Badge className={cn('text-xs', styles.badge)}>
                    {item.avg_score !== null ? `${item.avg_score}/100` : '—'}
                </Badge>
            </div>
            <div className={cn('mt-2 h-1.5 rounded-full', styles.track)}>
                <div
                    className={cn(
                        'h-full rounded-full transition-all',
                        styles.fill,
                    )}
                    style={{ width: `${score}%` }}
                />
            </div>
        </div>
    );
}

function SignalCard({
    tone,
    icon: Icon,
    title,
    items,
}: {
    tone: 'positive' | 'warning';
    icon: LucideIcon;
    title: string;
    items: string[];
}) {
    const styles = {
        positive: {
            border: 'border-emerald-200',
            bg: 'bg-emerald-50/40',
            iconBg: 'bg-emerald-100 text-emerald-700',
            dot: 'bg-emerald-500',
            label: 'text-emerald-700',
        },
        warning: {
            border: 'border-amber-200',
            bg: 'bg-amber-50/40',
            iconBg: 'bg-amber-100 text-amber-700',
            dot: 'bg-amber-500',
            label: 'text-amber-700',
        },
    }[tone];
    return (
        <Card className={cn(styles.border, styles.bg)}>
            <CardContent className="flex gap-3 py-4">
                <span
                    className={cn(
                        'flex size-9 shrink-0 items-center justify-center rounded-md',
                        styles.iconBg,
                    )}
                >
                    <Icon className="size-4" />
                </span>
                <div className="space-y-2">
                    <p
                        className={cn(
                            'text-xs font-semibold tracking-wider uppercase',
                            styles.label,
                        )}
                    >
                        {title}
                    </p>
                    <ul className="space-y-1.5 text-sm leading-6">
                        {items.map((item, index) => (
                            <li
                                key={index}
                                className="flex items-start gap-2"
                            >
                                <span
                                    className={cn(
                                        'mt-1.5 size-1.5 shrink-0 rounded-full',
                                        styles.dot,
                                    )}
                                    aria-hidden
                                />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
}

function SectionTitle({
    icon: Icon,
    eyebrow,
    title,
}: {
    icon: LucideIcon;
    eyebrow: string;
    title: string;
}) {
    return (
        <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#01296A]/10 text-[#01296A]">
                <Icon className="size-4" />
            </div>
            <div>
                <p className="text-[10px] font-semibold tracking-[0.18em] text-[#01296A] uppercase">
                    {eyebrow}
                </p>
                <CardTitle className="mt-0.5 text-base">{title}</CardTitle>
            </div>
        </div>
    );
}

function InsightCard({
    title,
    icon: Icon,
    items,
    tone,
}: {
    title: string;
    icon: LucideIcon;
    items: string[];
    tone: 'success' | 'warning';
}) {
    return (
        <Card>
            <CardHeader>
                <SectionTitle
                    icon={Icon}
                    eyebrow={
                        tone === 'success'
                            ? 'Positive signals'
                            : 'Follow-up notes'
                    }
                    title={title}
                />
            </CardHeader>
            <CardContent>
                {items.length > 0 ? (
                    <ul className="space-y-2 text-sm">
                        {items.map((item, index) => (
                            <li
                                key={`${item}-${index}`}
                                className="flex gap-2.5 rounded-lg bg-muted/40 p-3 leading-6 text-foreground/85"
                            >
                                <span
                                    className={cn(
                                        'mt-1.5 size-1.5 shrink-0 rounded-full',
                                        tone === 'success'
                                            ? 'bg-emerald-500'
                                            : 'bg-amber-500',
                                    )}
                                />
                                {item}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        Belum ada insight.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

function ResponseCard({ response }: { response: Response }) {
    const [open, setOpen] = useState(false);
    const score = response.ai_score;
    const scoreClass =
        score === null || score === undefined
            ? 'bg-slate-100 text-slate-700'
            : score >= 80
              ? 'bg-emerald-100 text-emerald-800'
              : score >= 60
                ? 'bg-amber-100 text-amber-800'
                : 'bg-rose-100 text-rose-800';

    return (
        <div
            className={cn(
                'overflow-hidden rounded-xl border bg-background transition',
                response.is_skipped && 'border-rose-200 bg-rose-50/30',
            )}
        >
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="flex w-full items-start gap-3 p-4 text-left transition hover:bg-muted/30"
            >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                    {response.order}
                </span>
                <div className="flex-1 space-y-1.5">
                    <p className="text-sm font-medium leading-snug">
                        {response.question ?? 'Pertanyaan tidak tersedia'}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                        {response.category ? (
                            <Badge
                                variant="outline"
                                className="text-[10px] capitalize"
                            >
                                {response.category.replace(/_/g, ' ')}
                            </Badge>
                        ) : null}
                        {response.weight ? (
                            <Badge
                                variant="outline"
                                className="text-[10px] text-muted-foreground"
                            >
                                Bobot {response.weight}%
                            </Badge>
                        ) : null}
                        {response.is_skipped ? (
                            <Badge className="bg-rose-100 text-[10px] text-rose-800">
                                Tidak dijawab
                            </Badge>
                        ) : (
                            <>
                                <Badge
                                    variant="outline"
                                    className="text-[10px]"
                                >
                                    {response.word_count} kata
                                </Badge>
                                {response.is_short ? (
                                    <Badge className="bg-amber-100 text-[10px] text-amber-800">
                                        Singkat
                                    </Badge>
                                ) : null}
                                {response.is_strong ? (
                                    <Badge className="bg-emerald-100 text-[10px] text-emerald-800">
                                        Elaboratif
                                    </Badge>
                                ) : null}
                            </>
                        )}
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    <Badge
                        className={cn(
                            'min-w-[3rem] justify-center text-xs font-semibold',
                            scoreClass,
                        )}
                    >
                        {score !== null && score !== undefined
                            ? `${score}`
                            : '—'}
                    </Badge>
                    <ChevronDown
                        className={cn(
                            'size-4 text-muted-foreground transition',
                            open && 'rotate-180',
                        )}
                    />
                </div>
            </button>
            {open ? (
                <div className="space-y-3 border-t bg-muted/10 p-4">
                    {response.rubric ? (
                        <div className="rounded-lg border border-dashed bg-background px-3 py-2 text-xs leading-5 text-muted-foreground">
                            <span className="font-semibold text-foreground">
                                Rubrik:
                            </span>{' '}
                            {response.rubric}
                        </div>
                    ) : null}
                    <div>
                        <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                            Jawaban kandidat
                        </p>
                        <p className="mt-1 rounded-lg border bg-background p-3 text-sm leading-7 whitespace-pre-line">
                            {response.answer_text ?? (
                                <span className="text-muted-foreground italic">
                                    Belum ada jawaban.
                                </span>
                            )}
                        </p>
                    </div>
                    {response.ai_analysis ? (
                        <div className="flex gap-2.5 rounded-lg border border-[#01296A]/15 bg-[#eff4ff]/60 px-3 py-2">
                            <Sparkles className="mt-0.5 size-3.5 shrink-0 text-[#01296A]" />
                            <p className="text-sm leading-6 text-foreground/85">
                                {response.ai_analysis}
                            </p>
                        </div>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}

function MetaItem({
    icon: Icon,
    label,
    value,
    capitalize: cap,
}: {
    icon: LucideIcon;
    label: string;
    value: string;
    capitalize?: boolean;
}) {
    return (
        <div className="flex items-start gap-3 rounded-lg border bg-background p-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                    {label}
                </p>
                <p
                    className={cn(
                        'mt-0.5 text-sm font-medium',
                        cap && 'capitalize',
                    )}
                >
                    {value}
                </p>
            </div>
        </div>
    );
}

function verdictFromScore(score: number): { label: string; bg: string } {
    if (score >= 80) {
        return { label: 'Strong fit', bg: 'bg-emerald-500/30' };
    }
    if (score >= 60) {
        return { label: 'Potensial', bg: 'bg-amber-500/30' };
    }
    if (score >= 40) {
        return { label: 'Perlu validasi', bg: 'bg-orange-500/30' };
    }
    return { label: 'Tidak match', bg: 'bg-rose-500/30' };
}

function toneFromScore(
    score: number,
): 'good' | 'medium' | 'low' | 'neutral' {
    if (score >= 80) {
        return 'good';
    }
    if (score >= 60) {
        return 'medium';
    }
    return 'low';
}
