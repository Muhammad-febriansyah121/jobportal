import { Head, Link, router, useForm } from '@inertiajs/react';
import { useTranslate } from '@/hooks/use-translate';
import {
    Award,
    Bot,
    Briefcase,
    CalendarDays,
    CheckCircle2,
    CircleSlash,
    ClipboardCheck,
    Clock3,
    Copy,
    Download,
    FileText,
    Gauge,
    Headphones,
    HelpCircle,
    Pencil,
    Play,
    Plus,
    ShieldCheck,
    Sparkles,
    Star,
    ThumbsUp,
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/candidate/candidate-form';
import EmployerAiInterviewManualReviewController from '@/actions/App/Http/Controllers/Employer/EmployerAiInterviewManualReviewController';
import { cn } from '@/lib/utils';
import { show as showJob } from '@/routes/employer/jobs';

type ManualReview = {
    id: number;
    rating: number;
    decision: 'hire' | 'maybe' | 'reject';
    notes?: string | null;
    reviewer_id: number;
    reviewer_name: string;
    is_mine: boolean;
    created_at?: string | null;
    updated_at?: string | null;
};

type EmployerAiInterviewShowProps = {
    manual_reviews: ManualReview[];
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
    manual_reviews,
}: EmployerAiInterviewShowProps) {
    const { t } = useTranslate();
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
    const [rejectRescheduleReason, setRejectRescheduleReason] = useState('');

    const handleDeleteRecording = (): void => {
        setProcessingAction('delete-recording');
        router.delete(
            EmployerAiInterviewController.deleteRecording.url(session.id),
            {
                preserveScroll: true,
                onSuccess: () => {
                    setRecordingDeleteOpen(false);
                    toast.success(t('employer.ai_interview_show.recording_deleted'));
                },
                onError: () =>
                    toast.error(t('employer.ai_interview_show.recording_delete_failed')),
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
        session.interview_mode === 'text'
            ? t('employer.ai_interview_show.mode_text')
            : t('employer.ai_interview_show.mode_voice');
    const applicationStatusLabel = applicationStatus
        ? applicationStatus.replaceAll('_', ' ')
        : t('employer.ai_interview_show.not_available');
    const answeredResponses = session.responses.filter(
        (response) => response.answer_text,
    ).length;
    const recommendation =
        session.analysis?.recommendation ?? t('employer.ai_interview_show.awaiting_ai');
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
                    toast.success(t('employer.ai_interview_show.advance_success')),
                onError: (errors) => {
                    toast.error(
                        resolveErrorMessage(
                            errors,
                            t('employer.ai_interview_show.advance_failed'),
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
                    toast.success(t('employer.ai_interview_show.talent_pool_success')),
                onError: (errors) => {
                    toast.error(
                        resolveErrorMessage(
                            errors,
                            t('employer.ai_interview_show.talent_pool_failed'),
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
                onSuccess: () => toast.success(t('employer.ai_interview_show.reject_success')),
                onError: (errors) => {
                    toast.error(
                        resolveErrorMessage(errors, t('employer.ai_interview_show.reject_failed')),
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
        toast.success(t('employer.ai_interview_show.copy_link_success'));
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
                    toast.success(t('employer.ai_interview_show.share_success')),
                onError: (errors) => {
                    toast.error(
                        resolveErrorMessage(
                            errors,
                            t('employer.ai_interview_show.share_failed'),
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
                            t('employer.ai_interview_show.approve_reschedule_failed'),
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
                    toast.success(t('employer.ai_interview_show.reject_reschedule_success'));
                    setRejectRescheduleReason('');
                },
                onError: (errors) => {
                    toast.error(
                        resolveErrorMessage(
                            errors,
                            t('employer.ai_interview_show.reject_reschedule_failed'),
                        ),
                    );
                },
                onFinish: () => setProcessingAction(null),
            },
        );
    };

    return (
        <>
            <Head title={t('employer.ai_interview_show.head_title', { name: session.candidate.name })} />

            <div className="min-h-screen p-4 md:p-6">
                <div className="mx-auto max-w-7xl space-y-6">
                    <div className="overflow-hidden rounded-4xl border bg-white shadow-sm">
                        <div className="grid gap-8 p-5 sm:p-7 lg:grid-cols-[1fr_360px] lg:p-8">
                            <div className="space-y-6">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <Heading
                                        title={t('employer.ai_interview_show.section_title')}
                                        description={`${session.candidate.name} · ${session.job.title ?? '-'}`}
                                    />
                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        {session.job.id ? (
                                            <Button variant="outline" asChild>
                                                <Link
                                                    href={showJob(
                                                        session.job.id,
                                                    )}
                                                >
                                                    {t('employer.ai_interview_show.back_to_job')}
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
                                                {t('employer.ai_interview_show.download_pdf')}
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
                                                t('employer.ai_interview_show.no_headline')}
                                        </p>
                                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                            <HeroFact
                                                icon={Briefcase}
                                                label={t('employer.ai_interview_show.label_job')}
                                                value={session.job.title ?? '-'}
                                            />
                                            <HeroFact
                                                icon={CalendarDays}
                                                label={t('employer.ai_interview_show.label_schedule')}
                                                value={
                                                    session.scheduled_at ?? '-'
                                                }
                                            />
                                            <HeroFact
                                                icon={Headphones}
                                                label={t('employer.ai_interview_show.label_mode')}
                                                value={
                                                    session.interview_mode ===
                                                    'text'
                                                        ? interviewModeLabel
                                                        : `${interviewModeLabel} · ${session.voice ?? 'marin'}`
                                                }
                                            />
                                            <HeroFact
                                                icon={Clock3}
                                                label={t('employer.ai_interview_show.label_duration')}
                                                value={t('employer.ai_interview_show.duration_value', { minutes: session.duration_minutes ?? 0 })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <ManualReviewSummary
                                sessionId={session.id}
                                reviews={manual_reviews}
                                t={t}
                            />
                        </div>
                    </div>

                    <details className="group rounded-3xl border bg-white p-5 shadow-sm">
                        <summary className="flex cursor-pointer items-center justify-between gap-3 list-none [&::-webkit-details-marker]:hidden">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                                    <Bot className="size-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">
                                        {t('employer.ai_interview_show.ai_analysis_title')}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {t('employer.ai_interview_show.ai_analysis_desc')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span
                                    className={cn(
                                        'rounded-full px-3 py-1 text-xs font-semibold',
                                        getScoreTone(score),
                                    )}
                                >
                                    {t('employer.ai_interview_show.match_score_short', { score })}
                                </span>
                                <span className="text-xs text-muted-foreground transition group-open:rotate-180">▾</span>
                            </div>
                        </summary>
                        <div className="mt-5 grid gap-4 rounded-2xl border border-primary-100 bg-primary-50/60 p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-semibold tracking-[0.22em] text-primary-600 uppercase">
                                        Match Score
                                    </p>
                                    <p className="mt-2 text-5xl font-semibold tracking-tight">
                                        {score}
                                        <span className="text-base text-muted-foreground">
                                            /100
                                        </span>
                                    </p>
                                </div>
                                <span
                                    className={cn(
                                        'rounded-2xl px-3 py-2 text-xs font-semibold',
                                        getScoreTone(score),
                                    )}
                                >
                                    {score >= 80
                                        ? t('employer.ai_interview_show.score_label_strong')
                                        : score >= 60
                                          ? t('employer.ai_interview_show.score_label_review')
                                          : t('employer.ai_interview_show.score_label_need')}
                                </span>
                            </div>
                            <ProgressBar value={score} />
                            <p className="text-sm leading-6 text-slate-600">
                                {recommendation}
                            </p>
                        </div>
                    </details>

                    {session.recording_url ? (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between gap-3">
                                <CardTitle>{t('employer.ai_interview_review.recording_title')}</CardTitle>
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
                                            {t('employer.ai_interview_show.delete_recording_btn')}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>
                                                {t('employer.ai_interview_show.delete_recording_title')}
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                                {t('employer.ai_interview_show.delete_recording_desc')}
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel
                                                disabled={
                                                    processingAction ===
                                                    'delete-recording'
                                                }
                                            >
                                                {t('employer.ai_interview_show.cancel')}
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
                                                    ? t('employer.ai_interview_show.deleting')
                                                    : t('employer.ai_interview_show.delete_recording_btn')}
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
                                    {t('employer.ai_interview_show.recording_note')}
                                </p>
                            </CardContent>
                        </Card>
                    ) : null}

                    <div className="grid gap-4 md:grid-cols-3">
                        <MetricCard
                            icon={FileText}
                            label={t('employer.ai_interview_show.label_answers')}
                            value={`${answeredResponses}/${session.responses.length}`}
                            description={t('employer.ai_interview_show.description_answers')}
                        />
                        <MetricCard
                            icon={TrendingUp}
                            label={t('employer.ai_interview_show.label_scorecard')}
                            value={Object.keys(scorecard).length.toString()}
                            description={t('employer.ai_interview_show.description_scorecard')}
                        />
                        <MetricCard
                            icon={ShieldCheck}
                            label={t('employer.ai_interview_show.label_status')}
                            value={applicationStatusLabel}
                            description={t('employer.ai_interview_show.description_status')}
                        />
                    </div>

                    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
                        <div className="space-y-5">
                            <Card className="overflow-hidden border-primary-200 bg-linear-to-br from-primary-50 via-white to-white">
                                <CardHeader>
                                    <SectionTitle
                                        icon={Sparkles}
                                        eyebrow="AI Verdict"
                                        title={t('employer.ai_interview_show.section_verdict')}
                                    />
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm leading-7 text-slate-700">
                                        {session.analysis?.summary ??
                                            t('employer.ai_interview_show.analysis_empty')}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <SectionTitle
                                        icon={ClipboardCheck}
                                        eyebrow="Interview Evidence"
                                        title={t('employer.ai_interviews.show.section_playback_title')}
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
                                                                {t('employer.ai_interview_show.question_label', { number: index + 1 })}
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
                                                        {response.ai_score ?? '-'}
                                                    </Badge>
                                                </div>
                                                <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-7 whitespace-pre-line text-slate-700">
                                                    {response.answer_text ?? '-'}
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
                                        title={t('employer.ai_interviews.show.section_scorecard_title')}
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
                                            {t('employer.ai_interview_show.scorecard_empty')}
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
                                        title={t('employer.ai_interview_show.recruiter_actions')}
                                    />
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {session.reschedule?.requested_at ? (
                                        <div className="rounded-2xl border border-secondary-200 bg-secondary-50 p-4 text-sm">
                                            <p className="font-semibold text-secondary-900">
                                                {t('employer.ai_interview_show.reschedule_request')}
                                            </p>
                                            <p className="mt-1 text-secondary-800">
                                                {t('employer.ai_interview_show.reschedule_submitted')}{' '}
                                                {
                                                    session.reschedule
                                                        .requested_at
                                                }
                                            </p>
                                            <p className="mt-1 text-secondary-800">
                                                {t('employer.ai_interview_show.reschedule_proposed')}{' '}
                                                {session.reschedule
                                                    .proposed_at ?? '-'}
                                            </p>
                                            <p className="mt-2 text-secondary-900">
                                                {session.reschedule.reason ??
                                                    t('employer.ai_interview_show.reschedule_no_reason')}
                                            </p>
                                            <p className="mt-2 text-xs font-medium tracking-wide text-secondary-700 uppercase">
                                                {t('employer.ai_interview_show.reschedule_status')}{' '}
                                                {(
                                                    session.reschedule.status ??
                                                    'pending'
                                                ).replaceAll('_', ' ')}
                                            </p>
                                            {session.reschedule
                                                .rejected_reason ? (
                                                <p className="mt-1 text-xs text-red-700">
                                                    {t('employer.ai_interview_show.reschedule_rejection_note')}{' '}
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
                                                {t('employer.ai_interview_show.timeline_reschedule')}
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {(
                                                    [
                                                        [
                                                            'all',
                                                            t('employer.ai_interview_show.timeline_all'),
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
                                                    {t('employer.ai_interview_show.timeline_latest')}
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
                                                    {t('employer.ai_interview_show.timeline_oldest')}
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
                                                                    t('employer.ai_interview_show.timeline_system')}
                                                            </p>
                                                            {event.scheduled_at ? (
                                                                <p className="mt-1 text-slate-600">
                                                                    {t('employer.ai_interview_show.timeline_schedule')}{' '}
                                                                    {
                                                                        event.scheduled_at
                                                                    }
                                                                </p>
                                                            ) : null}
                                                            {event.reason ? (
                                                                <p className="mt-1 text-slate-600">
                                                                    {t('employer.ai_interview_show.timeline_note')}{' '}
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
                                                    {t('employer.ai_interview_show.timeline_no_events')}
                                                </p>
                                            )}
                                        </div>
                                    ) : null}
                                    {hasPendingReschedule ? (
                                        <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-3">
                                            <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                                                {t('employer.ai_interview_show.final_schedule_label')}
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
                                                    {t('employer.ai_interview_show.use_candidate_time')}
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
                                                        ? t('employer.ai_interview_show.approving')
                                                        : t('employer.ai_interview_show.approve_reschedule')}
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
                                                            ? t('employer.ai_interview_show.rejecting')
                                                            : t('employer.ai_interview_show.reject_reschedule')}
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>
                                                            {t('employer.ai_interview_show.reject_reschedule_title')}
                                                        </AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            {t('employer.ai_interview_show.reject_reschedule_desc')}
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
                                                        placeholder={t('employer.ai_interview_show.reject_reason_default')}
                                                        className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                                    />
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>
                                                            {t('employer.ai_interview_show.cancel')}
                                                        </AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={
                                                                handleRejectReschedule
                                                            }
                                                            disabled={
                                                                !rejectRescheduleReason.trim()
                                                            }
                                                        >
                                                            {t('employer.ai_interview_show.reject_reschedule')}
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
                                                    ? t('employer.ai_interview_show.advancing')
                                                    : t('employer.ai_interview_show.advance_btn')}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>
                                                    {t('employer.ai_interview_show.advance_title')}
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    {t('employer.ai_interview_show.advance_desc', { name: session.candidate.name })}
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>
                                                    {t('employer.ai_interview_show.cancel')}
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={
                                                        handleAdvanceToUser
                                                    }
                                                >
                                                    {t('employer.ai_interview_show.confirm_yes')}
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
                                            {t('employer.ai_interview_show.open_review')}
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
                                                        ? t('employer.ai_interview_show.sharing')
                                                        : t('employer.ai_interview_show.share_team')}
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>
                                                        {t('employer.ai_interview_show.share_title')}
                                                    </AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        {t('employer.ai_interview_show.share_desc')}
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>
                                                        {t('employer.ai_interview_show.cancel')}
                                                    </AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={
                                                            handleShareReview
                                                        }
                                                    >
                                                        {t('employer.ai_interview_show.confirm_yes')}
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
                                            {t('employer.ai_interview_show.copy_link')}
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
                                                    ? t('employer.ai_interview_show.saving')
                                                    : t('employer.ai_interview_show.save_talent_pool')}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>
                                                    {t('employer.ai_interview_show.talent_pool_title')}
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    {t('employer.ai_interview_show.talent_pool_desc', { name: session.candidate.name })}
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>
                                                    {t('employer.ai_interview_show.cancel')}
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={
                                                        handleSaveToTalentPool
                                                    }
                                                >
                                                    {t('employer.ai_interview_show.confirm_yes')}
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
                                                    ? t('employer.ai_interview_show.rejecting_candidate')
                                                    : t('employer.ai_interview_show.reject_candidate')}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>
                                                    {t('employer.ai_interview_show.reject_title')}
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    {t('employer.ai_interview_show.reject_desc', { name: session.candidate.name })}
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>
                                                    {t('employer.ai_interview_show.cancel')}
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={handleReject}
                                                    className="bg-red-600 text-white hover:bg-red-700"
                                                >
                                                    {t('employer.ai_interview_show.confirm_reject')}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                    {applicationStatus ? (
                                        <div className="rounded-2xl bg-slate-50 p-3 text-center text-xs text-muted-foreground">
                                            {t('employer.ai_interview_show.current_status_label')}
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
                                title={t('employer.ai_interview_show.strengths')}
                                items={session.analysis?.strengths ?? []}
                                type="strength"
                            />
                            <InsightList
                                title={t('employer.ai_interview_show.growth_areas')}
                                items={session.analysis?.weaknesses ?? []}
                                type="growth"
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
    const { t } = useTranslate();
    const entries = Object.entries(scorecard);

    return (
        <Card>
            <CardHeader>
                <SectionTitle
                    icon={Award}
                    eyebrow="Skill Radar"
                    title={t('employer.ai_interviews.show.section_skill_breakdown_title')}
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
                        {t('employer.ai_interview_show.no_breakdown')}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

type DecisionTone = {
    label: string;
    icon: LucideIcon;
    badgeClass: string;
    cardClass: string;
};

function decisionTone(decision: ManualReview['decision'], t: (k: string) => string): DecisionTone {
    if (decision === 'hire') {
        return {
            label: t('employer.ai_interview_show.review_decision_hire'),
            icon: ThumbsUp,
            badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
            cardClass: 'border-emerald-200 bg-emerald-50/40',
        };
    }

    if (decision === 'reject') {
        return {
            label: t('employer.ai_interview_show.review_decision_reject'),
            icon: CircleSlash,
            badgeClass: 'border-rose-200 bg-rose-50 text-rose-700',
            cardClass: 'border-rose-200 bg-rose-50/40',
        };
    }

    return {
        label: t('employer.ai_interview_show.review_decision_maybe'),
        icon: HelpCircle,
        badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
        cardClass: 'border-amber-200 bg-amber-50/40',
    };
}

function ManualReviewSummary({
    sessionId,
    reviews,
    t,
}: {
    sessionId: number;
    reviews: ManualReview[];
    t: (key: string, replacements?: Record<string, string | number>) => string;
}) {
    const myReview = reviews.find((review) => review.is_mine) ?? null;
    const teamReviews = reviews.filter((review) => !review.is_mine);

    return (
        <div className="rounded-3xl border border-border bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold tracking-[0.22em] text-primary-600 uppercase">
                        {t('employer.ai_interview_show.review_eyebrow')}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                        {t('employer.ai_interview_show.review_title')}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {t('employer.ai_interview_show.review_description')}
                    </p>
                </div>
                <ReviewFormDialog
                    sessionId={sessionId}
                    review={myReview}
                    t={t}
                    trigger={
                        myReview ? (
                            <Button variant="outline" size="sm" className="gap-2">
                                <Pencil className="size-4" />
                                {t('employer.ai_interview_show.review_btn_edit')}
                            </Button>
                        ) : (
                            <Button size="sm" className="gap-2">
                                <Plus className="size-4" />
                                {t('employer.ai_interview_show.review_btn_create')}
                            </Button>
                        )
                    }
                />
            </div>

            {myReview ? (
                <div className="mt-4">
                    <ReviewCard sessionId={sessionId} review={myReview} t={t} />
                </div>
            ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-border bg-muted/30 p-5 text-center">
                    <p className="text-sm text-muted-foreground">
                        {t('employer.ai_interview_show.review_empty_title')}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {t('employer.ai_interview_show.review_empty_desc')}
                    </p>
                </div>
            )}

            {teamReviews.length > 0 ? (
                <div className="mt-5 space-y-3 border-t pt-4">
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        {t('employer.ai_interview_show.review_team_title', { count: teamReviews.length })}
                    </p>
                    <div className="space-y-3">
                        {teamReviews.map((review) => (
                            <ReviewCard key={review.id} sessionId={sessionId} review={review} t={t} />
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function ReviewCard({
    sessionId,
    review,
    t,
}: {
    sessionId: number;
    review: ManualReview;
    t: (key: string, replacements?: Record<string, string | number>) => string;
}) {
    const tone = decisionTone(review.decision, t);
    const ToneIcon = tone.icon;

    function handleDelete() {
        router.delete(EmployerAiInterviewManualReviewController.destroy.url([sessionId, review.id]), {
            preserveScroll: true,
        });
    }

    return (
        <div className={cn('rounded-2xl border p-4', tone.cardClass)}>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-full border bg-white text-sm font-semibold text-foreground">
                        {review.reviewer_name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-foreground">
                            {review.reviewer_name}
                            {review.is_mine ? (
                                <span className="ml-2 text-xs font-normal text-muted-foreground">
                                    ({t('employer.ai_interview_show.review_you')})
                                </span>
                            ) : null}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {review.updated_at ?? review.created_at ?? ''}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn('gap-1', tone.badgeClass)}>
                        <ToneIcon className="size-3.5" />
                        {tone.label}
                    </Badge>
                    <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((value) => (
                            <Star
                                key={value}
                                className={cn(
                                    'size-4',
                                    value <= review.rating
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'text-muted-foreground/40',
                                )}
                            />
                        ))}
                    </div>
                </div>
            </div>
            {review.notes ? (
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-foreground/80">
                    {review.notes}
                </p>
            ) : null}
            {review.is_mine ? (
                <div className="mt-3 flex justify-end gap-2">
                    <ReviewFormDialog
                        sessionId={sessionId}
                        review={review}
                        t={t}
                        trigger={
                            <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                                <Pencil className="size-3.5" />
                                {t('employer.ai_interview_show.review_btn_edit_short')}
                            </Button>
                        }
                    />
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700">
                                <Trash2 className="size-3.5" />
                                {t('employer.ai_interview_show.review_btn_delete')}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    {t('employer.ai_interview_show.review_delete_title')}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    {t('employer.ai_interview_show.review_delete_desc')}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>
                                    {t('employer.ai_interview_show.cancel')}
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleDelete}
                                    className="bg-rose-600 text-white hover:bg-rose-700"
                                >
                                    {t('employer.ai_interview_show.review_btn_delete')}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            ) : null}
        </div>
    );
}

function ReviewFormDialog({
    sessionId,
    review,
    trigger,
    t,
}: {
    sessionId: number;
    review: ManualReview | null;
    trigger: React.ReactNode;
    t: (key: string, replacements?: Record<string, string | number>) => string;
}) {
    const [open, setOpen] = useState(false);
    const form = useForm({
        rating: review?.rating ?? 0,
        decision: (review?.decision ?? 'maybe') as ManualReview['decision'],
        notes: review?.notes ?? '',
    });

    useEffect(() => {
        if (open) {
            form.setData({
                rating: review?.rating ?? 0,
                decision: (review?.decision ?? 'maybe') as ManualReview['decision'],
                notes: review?.notes ?? '',
            });
            form.clearErrors();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, review?.id]);

    function submit(event: React.FormEvent) {
        event.preventDefault();
        form.post(EmployerAiInterviewManualReviewController.store.url(sessionId), {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                toast.success(t('employer.ai_interview_show.review_saved_toast'));
            },
        });
    }

    const decisions: Array<{ value: ManualReview['decision']; icon: LucideIcon; key: string }> = [
        { value: 'hire', icon: ThumbsUp, key: 'employer.ai_interview_show.review_decision_hire' },
        { value: 'maybe', icon: HelpCircle, key: 'employer.ai_interview_show.review_decision_maybe' },
        { value: 'reject', icon: CircleSlash, key: 'employer.ai_interview_show.review_decision_reject' },
    ];

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <form onSubmit={submit} className="space-y-5">
                    <DialogHeader>
                        <DialogTitle>
                            {review
                                ? t('employer.ai_interview_show.review_dialog_edit_title')
                                : t('employer.ai_interview_show.review_dialog_create_title')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('employer.ai_interview_show.review_dialog_desc')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2">
                        <Label>{t('employer.ai_interview_show.review_rating_label')}</Label>
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((value) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => form.setData('rating', value)}
                                    className="rounded-md p-1 transition hover:bg-muted"
                                    aria-label={String(value)}
                                >
                                    <Star
                                        className={cn(
                                            'size-7 transition',
                                            value <= form.data.rating
                                                ? 'fill-amber-400 text-amber-400'
                                                : 'text-muted-foreground/40 hover:text-amber-300',
                                        )}
                                    />
                                </button>
                            ))}
                            <span className="ml-2 text-sm text-muted-foreground">
                                {form.data.rating > 0
                                    ? t('employer.ai_interview_show.review_rating_value', { value: form.data.rating })
                                    : t('employer.ai_interview_show.review_rating_empty')}
                            </span>
                        </div>
                        {form.errors.rating ? (
                            <p className="text-xs text-red-600">{form.errors.rating}</p>
                        ) : null}
                    </div>

                    <div className="space-y-2">
                        <Label>{t('employer.ai_interview_show.review_decision_label')}</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {decisions.map(({ value, icon: Icon, key }) => {
                                const active = form.data.decision === value;

                                return (
                                    <button
                                        type="button"
                                        key={value}
                                        onClick={() => form.setData('decision', value)}
                                        className={cn(
                                            'flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-medium transition',
                                            active
                                                ? 'border-primary-400 bg-primary-50 text-primary-700'
                                                : 'border-border bg-white text-muted-foreground hover:border-primary-200 hover:text-foreground',
                                        )}
                                    >
                                        <Icon className="size-4" />
                                        {t(key)}
                                    </button>
                                );
                            })}
                        </div>
                        {form.errors.decision ? (
                            <p className="text-xs text-red-600">{form.errors.decision}</p>
                        ) : null}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="review-notes">
                            {t('employer.ai_interview_show.review_notes_label')}
                        </Label>
                        <Textarea
                            id="review-notes"
                            value={form.data.notes}
                            onChange={(event) => form.setData('notes', event.target.value)}
                            placeholder={t('employer.ai_interview_show.review_notes_placeholder')}
                            className="min-h-32"
                        />
                        {form.errors.notes ? (
                            <p className="text-xs text-red-600">{form.errors.notes}</p>
                        ) : null}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={form.processing}
                        >
                            {t('employer.ai_interview_show.cancel')}
                        </Button>
                        <Button type="submit" disabled={form.processing || form.data.rating === 0}>
                            {t('employer.ai_interview_show.review_btn_save')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function InsightList({ title, items, type }: { title: string; items: string[]; type: 'strength' | 'growth' }) {
    const { t } = useTranslate();
    const isStrength = type === 'strength';

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
                        {t('employer.ai_interview_show.no_insight')}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
