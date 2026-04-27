import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Award,
    Bot,
    Briefcase,
    CalendarDays,
    CheckCircle2,
    ClipboardCheck,
    Clock3,
    Copy,
    Download,
    FileText,
    Gauge,
    Headphones,
    Play,
    ShieldCheck,
    Sparkles,
    Trash2,
    TrendingUp,
    UserCheck,
    Users,
    X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import EmployerAiInterviewController from '@/actions/App/Http/Controllers/Employer/EmployerAiInterviewController';
import { ProgressBar } from '@/components/candidate/candidate-ui';
import Heading from '@/components/heading';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { show as showJob } from '@/routes/employer/jobs';

type EmployerAiInterviewShowProps = {
    session: {
        id: number;
        status: string;
        interview_mode?: string | null;
        scheduled_at?: string | null;
        duration_minutes?: number | null;
        meeting_url?: string | null;
        voice?: string | null;
        started_at?: string | null;
        completed_at?: string | null;
        recording_url?: string | null;
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
        reschedule?: {
            requested_at?: string | null;
            proposed_at?: string | null;
            proposed_at_input?: string | null;
            reason?: string | null;
            status?: string | null;
            reviewed_at?: string | null;
            rejected_reason?: string | null;
        } | null;
        responses: Array<{
            id: number;
            question?: string | null;
            category?: string | null;
            rubric?: string | null;
            weight?: number | null;
            answer_text?: string | null;
            ai_score?: number | null;
            ai_analysis?: string | null;
        }>;
        analysis?: {
            fit_score?: number | null;
            recommendation?: string | null;
            summary?: string | null;
            strengths: string[];
            weaknesses: string[];
            technical_scorecard: Record<string, number>;
        } | null;
        reschedule_timeline?: Array<{
            action: string;
            actor_name?: string | null;
            scheduled_at?: string | null;
            reason?: string | null;
            created_at?: string | null;
        }>;
    };
};

export default function EmployerAiInterviewShow({
    session,
}: EmployerAiInterviewShowProps) {
    const [timelineSort, setTimelineSort] = useState<'desc' | 'asc'>(() => {
        if (typeof window === 'undefined') {
            return 'desc';
        }

        const sort = new URLSearchParams(window.location.search).get(
            'employer_timeline_sort',
        );

        return sort === 'asc' || sort === 'desc' ? sort : 'desc';
    });
    const [timelineFilter, setTimelineFilter] = useState<
        'all' | 'requested' | 'approved' | 'rejected'
    >(() => {
        if (typeof window === 'undefined') {
            return 'all';
        }

        const filter = new URLSearchParams(window.location.search).get(
            'employer_timeline_filter',
        );

        return filter === 'requested' ||
            filter === 'approved' ||
            filter === 'rejected'
            ? filter
            : 'all';
    });
    const [processingAction, setProcessingAction] = useState<
        | 'advance'
        | 'talent-pool'
        | 'reject'
        | 'share-review'
        | 'approve-reschedule'
        | 'reject-reschedule'
        | 'delete-recording'
        | null
    >(null);
    const [recordingDeleteOpen, setRecordingDeleteOpen] = useState(false);
    const [advanceOpen, setAdvanceOpen] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [talentPoolOpen, setTalentPoolOpen] = useState(false);
    const [shareReviewOpen, setShareReviewOpen] = useState(false);
    const [rejectRescheduleOpen, setRejectRescheduleOpen] = useState(false);
    const [rejectRescheduleReason, setRejectRescheduleReason] = useState(
        'Slot tersebut belum tersedia.',
    );

    const handleDeleteRecording = (): void => {
        setProcessingAction('delete-recording');
        router.delete(
            EmployerAiInterviewController.deleteRecording.url(session.id),
            {
                preserveScroll: true,
                onSuccess: () => {
                    setRecordingDeleteOpen(false);
                    toast.success('Rekaman interview berhasil dihapus.');
                },
                onError: () =>
                    toast.error('Gagal menghapus rekaman. Coba lagi.'),
                onFinish: () => setProcessingAction(null),
            },
        );
    };
    const score = session.analysis?.fit_score ?? 0;
    const scorecard: Record<string, number> =
        session.analysis?.technical_scorecard ?? {};
    const applicationStatus = session.application?.status ?? null;
    const isRejected = applicationStatus === 'rejected';
    const isAdvanced = ['offer', 'hired'].includes(applicationStatus ?? '');
    const isProcessing = processingAction !== null;
    const interviewModeLabel =
        session.interview_mode === 'text' ? 'Interview Teks' : 'Voice AI';
    const applicationStatusLabel = applicationStatus
        ? applicationStatus.replaceAll('_', ' ')
        : 'Belum tersedia';
    const answeredResponses = session.responses.filter(
        (response) => response.answer_text,
    ).length;
    const recommendation =
        session.analysis?.recommendation ?? 'Menunggu rekomendasi AI';
    const hasPendingReschedule =
        session.reschedule?.requested_at !== undefined &&
        session.reschedule?.requested_at !== null &&
        (session.reschedule?.status ?? 'pending') === 'pending';
    const timelineEvents = session.reschedule_timeline ?? [];
    const timelineCounts = {
        all: timelineEvents.length,
        requested: timelineEvents.filter(
            (event) => event.action === 'requested',
        ).length,
        approved: timelineEvents.filter((event) => event.action === 'approved')
            .length,
        rejected: timelineEvents.filter((event) => event.action === 'rejected')
            .length,
    };
    const filteredTimeline = timelineEvents
        .filter(
            (event) =>
                timelineFilter === 'all' || event.action === timelineFilter,
        )
        .slice()
        .sort((first, second) => {
            const firstDate = first.created_at
                ? new Date(first.created_at).getTime()
                : 0;
            const secondDate = second.created_at
                ? new Date(second.created_at).getTime()
                : 0;

            return timelineSort === 'desc'
                ? secondDate - firstDate
                : firstDate - secondDate;
        });
    const approveRescheduleForm = useForm({
        scheduled_at: session.reschedule?.proposed_at_input ?? '',
    });

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const params = new URLSearchParams(window.location.search);
        params.set('employer_timeline_filter', timelineFilter);
        params.set('employer_timeline_sort', timelineSort);

        const query = params.toString();
        const url = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;

        window.history.replaceState(window.history.state, '', url);
    }, [timelineFilter, timelineSort]);

    const handleAdvanceToUser = () => {
        setAdvanceOpen(false);
        setProcessingAction('advance');
        router.patch(
            EmployerAiInterviewController.advanceToUser.url(session.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () =>
                    toast.success(
                        'Kandidat berhasil diloloskan ke tahap user.',
                    ),
                onError: (errors) => {
                    toast.error(
                        resolveErrorMessage(
                            errors,
                            'Kandidat gagal diloloskan ke tahap user.',
                        ),
                    );
                },
                onFinish: () => setProcessingAction(null),
            },
        );
    };

    const handleSaveToTalentPool = () => {
        setTalentPoolOpen(false);
        setProcessingAction('talent-pool');
        router.post(
            EmployerAiInterviewController.saveToTalentPool.url(session.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () =>
                    toast.success('Kandidat berhasil disimpan ke Talent Pool.'),
                onError: (errors) => {
                    toast.error(
                        resolveErrorMessage(
                            errors,
                            'Kandidat gagal disimpan ke Talent Pool.',
                        ),
                    );
                },
                onFinish: () => setProcessingAction(null),
            },
        );
    };

    const handleReject = () => {
        setRejectOpen(false);
        setProcessingAction('reject');
        router.patch(
            EmployerAiInterviewController.reject.url(session.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Kandidat berhasil ditolak.'),
                onError: (errors) => {
                    toast.error(
                        resolveErrorMessage(errors, 'Kandidat gagal ditolak.'),
                    );
                },
                onFinish: () => setProcessingAction(null),
            },
        );
    };

    const handleCopyReviewLink = async () => {
        const url = new URL(
            EmployerAiInterviewController.review.url(session.id),
            window.location.origin,
        ).toString();

        await navigator.clipboard.writeText(url);
        toast.success('Link review berhasil disalin.');
    };

    const handleShareReview = () => {
        setShareReviewOpen(false);
        setProcessingAction('share-review');
        router.post(
            EmployerAiInterviewController.shareReview.url(session.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () =>
                    toast.success('Review berhasil dibagikan ke tim.'),
                onError: (errors) => {
                    toast.error(
                        resolveErrorMessage(
                            errors,
                            'Review gagal dibagikan ke tim.',
                        ),
                    );
                },
                onFinish: () => setProcessingAction(null),
            },
        );
    };

    const handleApproveReschedule = () => {
        setProcessingAction('approve-reschedule');
        approveRescheduleForm.patch(
            EmployerAiInterviewController.approveReschedule.url(session.id),
            {
                preserveScroll: true,
                onError: (errors) => {
                    toast.error(
                        resolveErrorMessage(
                            errors as Record<string, string>,
                            'Gagal menyetujui jadwal ulang.',
                        ),
                    );
                },
                onFinish: () => {
                    setProcessingAction(null);
                },
            },
        );
    };

    const handleUseProposedTime = () => {
        approveRescheduleForm.setData(
            'scheduled_at',
            session.reschedule?.proposed_at_input ?? '',
        );
    };

    const handleRejectReschedule = () => {
        if (!rejectRescheduleReason.trim()) {
            return;
        }

        setRejectRescheduleOpen(false);
        setProcessingAction('reject-reschedule');
        router.patch(
            EmployerAiInterviewController.rejectReschedule.url(session.id),
            { reason: rejectRescheduleReason },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Jadwal ulang berhasil ditolak.');
                    setRejectRescheduleReason('Slot tersebut belum tersedia.');
                },
                onError: (errors) => {
                    toast.error(
                        resolveErrorMessage(
                            errors,
                            'Gagal menolak jadwal ulang.',
                        ),
                    );
                },
                onFinish: () => setProcessingAction(null),
            },
        );
    };

    return (
        <>
            <Head title={`Hasil Interview AI - ${session.candidate.name}`} />

            <div className="min-h-screen p-4 md:p-6">
                <div className="mx-auto max-w-7xl space-y-6">
                    <div className="overflow-hidden rounded-4xl border bg-white shadow-sm">
                        <div className="grid gap-8 p-5 sm:p-7 lg:grid-cols-[1fr_360px] lg:p-8">
                            <div className="space-y-6">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <Heading
                                        title="Hasil Interview AI"
                                        description={`${session.candidate.name} · ${session.job.title ?? 'Lowongan'}`}
                                    />
                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        {session.job.id ? (
                                            <Button variant="outline" asChild>
                                                <Link
                                                    href={showJob(
                                                        session.job.id,
                                                    )}
                                                >
                                                    Kembali ke Lowongan
                                                </Link>
                                            </Button>
                                        ) : null}
                                        <Button
                                            className="bg-primary-500 text-white hover:bg-primary-600"
                                            asChild
                                        >
                                            <a
                                                href={EmployerAiInterviewController.downloadReportPdf.url(
                                                    session.id,
                                                )}
                                            >
                                                <Download className="size-4" />
                                                Unduh PDF
                                            </a>
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-[auto_1fr]">
                                    <div className="flex size-20 items-center justify-center rounded-3xl border bg-primary-50">
                                        <UserCheck className="size-9 text-primary-600" />
                                    </div>
                                    <div className="min-w-0 space-y-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                                                {session.candidate.name}
                                            </h2>
                                            <StatusPill
                                                label={session.status}
                                            />
                                            <StatusPill
                                                label={applicationStatusLabel}
                                                tone={
                                                    isRejected
                                                        ? 'danger'
                                                        : isAdvanced
                                                          ? 'success'
                                                          : 'neutral'
                                                }
                                            />
                                        </div>
                                        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                                            {session.candidate.headline ??
                                                session.candidate.email ??
                                                'Profil kandidat belum memiliki headline.'}
                                        </p>
                                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                            <HeroFact
                                                icon={Briefcase}
                                                label="Lowongan"
                                                value={session.job.title ?? '-'}
                                            />
                                            <HeroFact
                                                icon={CalendarDays}
                                                label="Jadwal"
                                                value={
                                                    session.scheduled_at ?? '-'
                                                }
                                            />
                                            <HeroFact
                                                icon={Headphones}
                                                label="Mode"
                                                value={
                                                    session.interview_mode ===
                                                    'text'
                                                        ? interviewModeLabel
                                                        : `${interviewModeLabel} · ${session.voice ?? 'marin'}`
                                                }
                                            />
                                            <HeroFact
                                                icon={Clock3}
                                                label="Durasi"
                                                value={`${session.duration_minutes ?? 0} menit`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-3xl border border-primary-100 bg-primary-50 p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-semibold tracking-[0.22em] text-primary-600 uppercase">
                                            Match Score
                                        </p>
                                        <p className="mt-3 text-6xl font-semibold tracking-tight">
                                            {score}
                                            <span className="text-xl text-muted-foreground">
                                                /100
                                            </span>
                                        </p>
                                    </div>
                                    <div
                                        className={cn(
                                            'rounded-2xl px-3 py-2 text-xs font-semibold',
                                            getScoreTone(score),
                                        )}
                                    >
                                        {score >= 80
                                            ? 'Strong Fit'
                                            : score >= 60
                                              ? 'Review Fit'
                                              : 'Need Review'}
                                    </div>
                                </div>
                                <div className="mt-6">
                                    <ProgressBar value={score} />
                                </div>
                                <p className="mt-4 text-sm leading-6 text-slate-600">
                                    {recommendation}
                                </p>
                            </div>
                        </div>
                    </div>

                    {session.recording_url ? (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between gap-3">
                                <CardTitle>Rekaman interview</CardTitle>
                                <AlertDialog
                                    open={recordingDeleteOpen}
                                    onOpenChange={setRecordingDeleteOpen}
                                >
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                                        >
                                            <Trash2 className="size-4" />
                                            Hapus rekaman
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>
                                                Hapus rekaman interview?
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                                File video rekaman akan dihapus
                                                permanen. Data jawaban,
                                                transkrip, dan analisis tetap
                                                tersimpan.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel
                                                disabled={
                                                    processingAction ===
                                                    'delete-recording'
                                                }
                                            >
                                                Batal
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={handleDeleteRecording}
                                                disabled={
                                                    processingAction ===
                                                    'delete-recording'
                                                }
                                                className="bg-red-600 text-white hover:bg-red-700"
                                            >
                                                {processingAction ===
                                                'delete-recording'
                                                    ? 'Menghapus...'
                                                    : 'Hapus rekaman'}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardHeader>
                            <CardContent>
                                <video
                                    src={session.recording_url}
                                    controls
                                    preload="metadata"
                                    className="max-h-120 w-full rounded-lg border border-border bg-black"
                                />
                                <p className="mt-2 text-xs text-muted-foreground">
                                    Rekaman direkam dari kamera & mikrofon
                                    kandidat selama sesi interview.
                                </p>
                            </CardContent>
                        </Card>
                    ) : null}

                    <div className="grid gap-4 md:grid-cols-3">
                        <MetricCard
                            icon={FileText}
                            label="Jawaban Terekam"
                            value={`${answeredResponses}/${session.responses.length}`}
                            description="Pertanyaan dengan respons kandidat"
                        />
                        <MetricCard
                            icon={TrendingUp}
                            label="Scorecard"
                            value={Object.keys(scorecard).length.toString()}
                            description="Kompetensi yang sudah dianalisis"
                        />
                        <MetricCard
                            icon={ShieldCheck}
                            label="Status Lamaran"
                            value={applicationStatusLabel}
                            description="Tahap seleksi lamaran kandidat"
                        />
                    </div>

                    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
                        <div className="space-y-5">
                            <Card className="overflow-hidden border-primary-200 bg-linear-to-br from-primary-50 via-white to-white">
                                <CardHeader>
                                    <SectionTitle
                                        icon={Sparkles}
                                        eyebrow="AI Verdict"
                                        title="Ringkasan Keputusan"
                                    />
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm leading-7 text-slate-700">
                                        {session.analysis?.summary ??
                                            'Analisis akan muncul setelah kandidat menyelesaikan interview.'}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <SectionTitle
                                        icon={ClipboardCheck}
                                        eyebrow="Interview Evidence"
                                        title="Playback & Transkrip"
                                    />
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    <div className="relative flex h-56 items-center justify-center overflow-hidden rounded-3xl bg-slate-100 shadow-inner sm:h-72">
                                        <div className="absolute inset-x-5 bottom-6 h-1.5 rounded-full bg-slate-300 sm:inset-x-8">
                                            <div className="h-1.5 w-2/3 rounded-full bg-primary-500" />
                                        </div>
                                        <button className="relative flex size-16 items-center justify-center rounded-full border border-slate-200 bg-white shadow-xl transition hover:scale-105 hover:bg-slate-50">
                                            <Play className="ml-1 size-7 fill-primary-600 text-primary-600" />
                                        </button>
                                        <Badge
                                            variant="secondary"
                                            className="absolute top-5 right-5"
                                        >
                                            {interviewModeLabel}
                                        </Badge>
                                    </div>
                                    {session.responses.map(
                                        (response, index) => (
                                            <div
                                                key={response.id}
                                                className="rounded-3xl border bg-white p-4 shadow-sm sm:p-5"
                                            >
                                                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                                                    <div>
                                                        <div className="flex flex-wrap gap-2">
                                                            <Badge variant="secondary">
                                                                Pertanyaan{' '}
                                                                {index + 1}
                                                            </Badge>
                                                            <Badge variant="outline">
                                                                {response.category ??
                                                                    'general'}
                                                            </Badge>
                                                        </div>
                                                        <p className="mt-3 font-medium">
                                                            {response.question}
                                                        </p>
                                                    </div>
                                                    <Badge variant="outline">
                                                        Skor{' '}
                                                        {response.ai_score ??
                                                            '-'}
                                                    </Badge>
                                                </div>
                                                <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-7 whitespace-pre-line text-slate-700">
                                                    {response.answer_text ??
                                                        'Belum ada jawaban.'}
                                                </p>
                                                {response.ai_analysis ? (
                                                    <p className="mt-3 rounded-2xl border border-primary-100 bg-primary-50 p-4 text-sm leading-6 text-primary-900">
                                                        {response.ai_analysis}
                                                    </p>
                                                ) : null}
                                            </div>
                                        ),
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <SectionTitle
                                        icon={Gauge}
                                        eyebrow="Competency Matrix"
                                        title="Detailed Technical Scorecard"
                                    />
                                </CardHeader>
                                <CardContent>
                                    {Object.keys(scorecard).length > 0 ? (
                                        <div className="grid gap-4 md:grid-cols-2">
                                            {Object.entries(scorecard).map(
                                                ([label, value]) => (
                                                    <ScoreLine
                                                        key={label}
                                                        label={label}
                                                        value={value}
                                                    />
                                                ),
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            Scorecard detail akan muncul setelah
                                            kandidat menyelesaikan interview.
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-5 xl:sticky xl:top-6 xl:self-start">
                            <Card className="overflow-hidden border-slate-200 shadow-xl shadow-slate-950/5">
                                <div className="h-1.5 bg-linear-to-r from-primary-500 via-secondary-400 to-sky-400" />
                                <CardHeader>
                                    <SectionTitle
                                        icon={Bot}
                                        eyebrow="Recruiter Control"
                                        title="Tindakan Recruiter"
                                    />
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {session.reschedule?.requested_at ? (
                                        <div className="rounded-2xl border border-secondary-200 bg-secondary-50 p-4 text-sm">
                                            <p className="font-semibold text-secondary-900">
                                                Permintaan Jadwal Ulang
                                            </p>
                                            <p className="mt-1 text-secondary-800">
                                                Diajukan:{' '}
                                                {
                                                    session.reschedule
                                                        .requested_at
                                                }
                                            </p>
                                            <p className="mt-1 text-secondary-800">
                                                Usulan waktu:{' '}
                                                {session.reschedule
                                                    .proposed_at ?? '-'}
                                            </p>
                                            <p className="mt-2 text-secondary-900">
                                                {session.reschedule.reason ??
                                                    'Tanpa catatan alasan.'}
                                            </p>
                                            <p className="mt-2 text-xs font-medium tracking-wide text-secondary-700 uppercase">
                                                Status:{' '}
                                                {(
                                                    session.reschedule.status ??
                                                    'pending'
                                                ).replaceAll('_', ' ')}
                                            </p>
                                            {session.reschedule
                                                .rejected_reason ? (
                                                <p className="mt-1 text-xs text-red-700">
                                                    Catatan penolakan:{' '}
                                                    {
                                                        session.reschedule
                                                            .rejected_reason
                                                    }
                                                </p>
                                            ) : null}
                                        </div>
                                    ) : null}
                                    {session.reschedule_timeline &&
                                    session.reschedule_timeline.length > 0 ? (
                                        <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs">
                                            <p className="font-semibold tracking-wide text-slate-600 uppercase">
                                                Timeline Reschedule
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {(
                                                    [
                                                        [
                                                            'all',
                                                            'Semua',
                                                            timelineCounts.all,
                                                        ],
                                                        [
                                                            'requested',
                                                            'Requested',
                                                            timelineCounts.requested,
                                                        ],
                                                        [
                                                            'approved',
                                                            'Approved',
                                                            timelineCounts.approved,
                                                        ],
                                                        [
                                                            'rejected',
                                                            'Rejected',
                                                            timelineCounts.rejected,
                                                        ],
                                                    ] as const
                                                ).map(
                                                    ([value, label, count]) => (
                                                        <button
                                                            key={value}
                                                            type="button"
                                                            onClick={() =>
                                                                setTimelineFilter(
                                                                    value,
                                                                )
                                                            }
                                                            className={cn(
                                                                'rounded-md border px-2 py-1 text-[11px] font-medium',
                                                                timelineFilter ===
                                                                    value
                                                                    ? 'border-slate-400 bg-slate-900 text-white'
                                                                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100',
                                                            )}
                                                        >
                                                            {label} ({count})
                                                        </button>
                                                    ),
                                                )}
                                            </div>
                                            <div className="flex gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setTimelineSort('desc')
                                                    }
                                                    className={cn(
                                                        'rounded-md border px-2 py-1 text-[11px] font-medium',
                                                        timelineSort === 'desc'
                                                            ? 'border-slate-400 bg-slate-900 text-white'
                                                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100',
                                                    )}
                                                >
                                                    Terbaru
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setTimelineSort('asc')
                                                    }
                                                    className={cn(
                                                        'rounded-md border px-2 py-1 text-[11px] font-medium',
                                                        timelineSort === 'asc'
                                                            ? 'border-slate-400 bg-slate-900 text-white'
                                                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100',
                                                    )}
                                                >
                                                    Terlama
                                                </button>
                                            </div>
                                            {filteredTimeline.length > 0 ? (
                                                filteredTimeline.map(
                                                    (event, index) => (
                                                        <div
                                                            key={`${event.action}-${event.created_at ?? index}`}
                                                            className="rounded-lg border border-slate-200 bg-white p-2"
                                                        >
                                                            <p className="font-semibold text-slate-800 capitalize">
                                                                {event.action.replaceAll(
                                                                    '_',
                                                                    ' ',
                                                                )}
                                                            </p>
                                                            <p className="mt-1 text-slate-500">
                                                                {event.created_at ??
                                                                    '-'}{' '}
                                                                ·{' '}
                                                                {event.actor_name ??
                                                                    'Sistem'}
                                                            </p>
                                                            {event.scheduled_at ? (
                                                                <p className="mt-1 text-slate-600">
                                                                    Jadwal:{' '}
                                                                    {
                                                                        event.scheduled_at
                                                                    }
                                                                </p>
                                                            ) : null}
                                                            {event.reason ? (
                                                                <p className="mt-1 text-slate-600">
                                                                    Catatan:{' '}
                                                                    {
                                                                        event.reason
                                                                    }
                                                                </p>
                                                            ) : null}
                                                        </div>
                                                    ),
                                                )
                                            ) : (
                                                <p className="rounded-lg border border-dashed border-slate-300 bg-white p-2 text-slate-500">
                                                    Tidak ada event untuk filter
                                                    ini.
                                                </p>
                                            )}
                                        </div>
                                    ) : null}
                                    {hasPendingReschedule ? (
                                        <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-3">
                                            <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                                                Jadwal final (opsional override)
                                            </p>
                                            <input
                                                type="datetime-local"
                                                className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm"
                                                value={
                                                    approveRescheduleForm.data
                                                        .scheduled_at
                                                }
                                                onChange={(event) =>
                                                    approveRescheduleForm.setData(
                                                        'scheduled_at',
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                            {approveRescheduleForm.errors
                                                .scheduled_at ? (
                                                <p className="text-xs text-red-600">
                                                    {
                                                        approveRescheduleForm
                                                            .errors.scheduled_at
                                                    }
                                                </p>
                                            ) : null}
                                            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                                                <Button
                                                    className="h-10 w-full"
                                                    disabled={isProcessing}
                                                    onClick={
                                                        handleUseProposedTime
                                                    }
                                                    variant="outline"
                                                >
                                                    Pakai Usulan Kandidat
                                                </Button>
                                                <Button
                                                    className="h-10 w-full"
                                                    disabled={isProcessing}
                                                    onClick={
                                                        handleApproveReschedule
                                                    }
                                                    variant="secondary"
                                                >
                                                    {processingAction ===
                                                    'approve-reschedule'
                                                        ? 'Menyetujui...'
                                                        : 'Setujui Reschedule'}
                                                </Button>
                                            </div>
                                            <AlertDialog
                                                open={rejectRescheduleOpen}
                                                onOpenChange={
                                                    setRejectRescheduleOpen
                                                }
                                            >
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        className="h-11 w-full"
                                                        disabled={isProcessing}
                                                        variant="outline"
                                                    >
                                                        {processingAction ===
                                                        'reject-reschedule'
                                                            ? 'Menolak...'
                                                            : 'Tolak Reschedule'}
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>
                                                            Tolak permintaan
                                                            jadwal ulang?
                                                        </AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Tulis alasan
                                                            penolakan. Kandidat
                                                            akan mendapat
                                                            notifikasi.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <textarea
                                                        rows={3}
                                                        value={
                                                            rejectRescheduleReason
                                                        }
                                                        onChange={(e) =>
                                                            setRejectRescheduleReason(
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="Mis: slot tersebut belum tersedia..."
                                                        className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                                    />
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>
                                                            Batal
                                                        </AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={
                                                                handleRejectReschedule
                                                            }
                                                            disabled={
                                                                !rejectRescheduleReason.trim()
                                                            }
                                                        >
                                                            Tolak Reschedule
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    ) : null}
                                    <AlertDialog
                                        open={advanceOpen}
                                        onOpenChange={setAdvanceOpen}
                                    >
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                className="h-12 w-full bg-primary-600 text-base hover:bg-primary-700"
                                                disabled={
                                                    isProcessing ||
                                                    isRejected ||
                                                    isAdvanced
                                                }
                                            >
                                                <Users className="size-4" />
                                                {processingAction === 'advance'
                                                    ? 'Memproses...'
                                                    : 'Loloskan ke User'}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>
                                                    Loloskan kandidat ke tahap
                                                    User?
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Kandidat{' '}
                                                    <strong>
                                                        {session.candidate.name}
                                                    </strong>{' '}
                                                    akan dipindahkan ke tahap
                                                    User Interview. Status
                                                    lamaran akan diperbarui.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>
                                                    Batal
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={
                                                        handleAdvanceToUser
                                                    }
                                                >
                                                    Ya, Loloskan
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                    <Button
                                        className="h-12 w-full text-base"
                                        variant="secondary"
                                        asChild
                                    >
                                        <Link
                                            href={EmployerAiInterviewController.review.url(
                                                session.id,
                                            )}
                                        >
                                            <FileText className="size-4" />
                                            Buka Review User
                                        </Link>
                                    </Button>
                                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                                        <AlertDialog
                                            open={shareReviewOpen}
                                            onOpenChange={setShareReviewOpen}
                                        >
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    className="h-11 w-full"
                                                    disabled={isProcessing}
                                                    variant="outline"
                                                >
                                                    <Users className="size-4" />
                                                    {processingAction ===
                                                    'share-review'
                                                        ? 'Membagikan...'
                                                        : 'Bagikan ke Tim'}
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>
                                                        Bagikan hasil review ke
                                                        tim?
                                                    </AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Anggota tim yang
                                                        memiliki akses akan bisa
                                                        melihat hasil interview
                                                        AI kandidat ini.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>
                                                        Batal
                                                    </AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={
                                                            handleShareReview
                                                        }
                                                    >
                                                        Ya, Bagikan
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                        <Button
                                            className="h-11 w-full"
                                            onClick={handleCopyReviewLink}
                                            variant="outline"
                                        >
                                            <Copy className="size-4" />
                                            Salin Link
                                        </Button>
                                    </div>
                                    <AlertDialog
                                        open={talentPoolOpen}
                                        onOpenChange={setTalentPoolOpen}
                                    >
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                className="h-12 w-full text-base"
                                                disabled={isProcessing}
                                                variant="outline"
                                            >
                                                <CheckCircle2 className="size-4" />
                                                {processingAction ===
                                                'talent-pool'
                                                    ? 'Menyimpan...'
                                                    : 'Simpan ke Talent Pool'}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>
                                                    Simpan ke Talent Pool?
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    <strong>
                                                        {session.candidate.name}
                                                    </strong>{' '}
                                                    akan ditambahkan ke Talent
                                                    Pool perusahaan kamu untuk
                                                    dipertimbangkan di lowongan
                                                    lain.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>
                                                    Batal
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={
                                                        handleSaveToTalentPool
                                                    }
                                                >
                                                    Ya, Simpan
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                    <AlertDialog
                                        open={rejectOpen}
                                        onOpenChange={setRejectOpen}
                                    >
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                className="h-12 w-full text-base text-red-600 hover:text-red-700"
                                                disabled={
                                                    isProcessing || isRejected
                                                }
                                                variant="ghost"
                                            >
                                                <X className="size-4" />
                                                {processingAction === 'reject'
                                                    ? 'Menolak...'
                                                    : 'Tolak Kandidat'}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>
                                                    Tolak kandidat ini?
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    <strong>
                                                        {session.candidate.name}
                                                    </strong>{' '}
                                                    akan ditolak dari proses
                                                    rekrutmen. Tindakan ini
                                                    tidak bisa dibatalkan.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>
                                                    Batal
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={handleReject}
                                                    className="bg-red-600 text-white hover:bg-red-700"
                                                >
                                                    Ya, Tolak Kandidat
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                    {applicationStatus ? (
                                        <div className="rounded-2xl bg-slate-50 p-3 text-center text-xs text-muted-foreground">
                                            Status lamaran saat ini
                                            <span className="mt-1 block font-semibold text-slate-900 capitalize">
                                                {applicationStatus.replaceAll(
                                                    '_',
                                                    ' ',
                                                )}
                                            </span>
                                        </div>
                                    ) : null}
                                </CardContent>
                            </Card>

                            <InsightList
                                title="Kekuatan"
                                items={session.analysis?.strengths ?? []}
                            />
                            <InsightList
                                title="Area Pengembangan"
                                items={session.analysis?.weaknesses ?? []}
                            />
                            <SkillBreakdown scorecard={scorecard} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

function resolveErrorMessage(
    errors: Record<string, string>,
    fallback: string,
): string {
    return Object.values(errors)[0] ?? fallback;
}

function getScoreTone(score: number): string {
    if (score >= 80) {
        return 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200';
    }

    if (score >= 60) {
        return 'bg-secondary-100 text-secondary-700 ring-1 ring-secondary-200';
    }

    return 'bg-red-100 text-red-700 ring-1 ring-red-200';
}

function HeroFact({
    icon: Icon,
    label,
    value,
}: {
    icon: LucideIcon;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-2xl border bg-white p-3 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                <Icon className="size-3.5" />
                {label}
            </div>
            <p className="mt-2 line-clamp-2 text-sm font-medium text-foreground">
                {value}
            </p>
        </div>
    );
}

function MetricCard({
    icon: Icon,
    label,
    value,
    description,
}: {
    icon: LucideIcon;
    label: string;
    value: string;
    description: string;
}) {
    return (
        <Card className="overflow-hidden border-slate-200 bg-white/85 shadow-sm backdrop-blur">
            <CardContent className="flex items-center gap-4 p-4 sm:p-5">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
                    <Icon className="size-5" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        {label}
                    </p>
                    <p className="mt-1 truncate text-xl font-semibold capitalize">
                        {value}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {description}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

function StatusPill({
    label,
    tone = 'neutral',
}: {
    label: string;
    tone?: 'neutral' | 'success' | 'danger';
}) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1',
                tone === 'success' &&
                    'bg-emerald-100 text-emerald-700 ring-emerald-200',
                tone === 'danger' && 'bg-red-100 text-red-700 ring-red-200',
                tone === 'neutral' &&
                    'bg-slate-100 text-slate-700 ring-slate-200',
            )}
        >
            {label.replaceAll('_', ' ')}
        </span>
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
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
                <Icon className="size-5" />
            </div>
            <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-primary-600 uppercase">
                    {eyebrow}
                </p>
                <CardTitle className="mt-1 text-lg">{title}</CardTitle>
            </div>
        </div>
    );
}

function ScoreLine({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                <span className="font-medium capitalize">
                    {label.replaceAll('_', ' ')}
                </span>
                <span className="font-semibold text-primary-600">
                    {value}/100
                </span>
            </div>
            <ProgressBar value={value} />
        </div>
    );
}

function SkillBreakdown({ scorecard }: { scorecard: Record<string, number> }) {
    const entries = Object.entries(scorecard);

    return (
        <Card>
            <CardHeader>
                <SectionTitle
                    icon={Award}
                    eyebrow="Skill Radar"
                    title="Skill Breakdown"
                />
            </CardHeader>
            <CardContent className="space-y-4">
                {entries.length > 0 ? (
                    entries.map(([label, value]) => (
                        <div key={label} className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                                <Sparkles className="size-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase">
                                    <span>{label.replaceAll('_', ' ')}</span>
                                    <span>{value}%</span>
                                </div>
                                <ProgressBar value={value} />
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground">
                        Belum ada breakdown.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

function InsightList({ title, items }: { title: string; items: string[] }) {
    const isStrength = title === 'Kekuatan';

    return (
        <Card className="overflow-hidden">
            <CardHeader>
                <SectionTitle
                    icon={isStrength ? CheckCircle2 : TrendingUp}
                    eyebrow={isStrength ? 'Positive Signals' : 'Growth Notes'}
                    title={title}
                />
            </CardHeader>
            <CardContent>
                {items.length > 0 ? (
                    <ul className="space-y-3 text-sm text-muted-foreground">
                        {items.map((item) => (
                            <li
                                key={item}
                                className="flex gap-3 rounded-2xl bg-slate-50 p-3"
                            >
                                <span
                                    className={cn(
                                        'mt-1 size-2 rounded-full',
                                        isStrength
                                            ? 'bg-emerald-500'
                                            : 'bg-primary-500',
                                    )}
                                />
                                <span>{item}</span>
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
