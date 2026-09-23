import { Head, Link } from '@inertiajs/react';
import {
    BadgeCheck,
    Bot,
    Briefcase,
    CalendarDays,
    CheckCircle2,
    Clock3,
    ExternalLink,
    MessageSquare,
    Mic,
    Timer,
} from 'lucide-react';
import { StatusBadge } from '@/components/candidate/candidate-ui';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';
import { show as interviewShow } from '@/routes/candidate/ai-interviews';
import {
    show as applicationShow,
    index,
} from '@/routes/candidate/applications';
import { show as jobShow } from '@/routes/candidate/jobs';

type ApplicationShowProps = {
    application: {
        id: number;
        status: string;
        status_label: string;
        email_status?: string | null;
        email_status_label?: string | null;
        email_sent_at?: string | null;
        cover_letter?: string | null;
        screening_answers: Record<string, string>;
        applied_at?: string | null;
        cv_url?: string | null;
        job: {
            id?: number | null;
            slug?: string | null;
            detail_url?: string | null;
            title?: string | null;
            company?: string | null;
            company_verified: boolean;
            work_mode?: string | null;
            job_type?: string | null;
            experience_level?: string | null;
        };
        histories: Array<{
            id: number;
            from_status?: string | null;
            to_status: string;
            to_status_label: string;
            changed_by?: string | null;
            note?: string | null;
            created_at?: string | null;
        }>;
        interviews: Array<{
            id: number;
            scheduled_at?: string | null;
            mode: string;
            location_url?: string | null;
            status: string;
        }>;
        ai_interviews: Array<{
            id: number;
            status: string;
            interview_mode: string;
            scheduled_at?: string | null;
            duration_minutes?: number | null;
            meeting_url?: string | null;
            candidate_confirmed_at?: string | null;
            started_at?: string | null;
            completed_at?: string | null;
        }>;
    };
};

export default function CandidateApplicationShow({
    application,
}: ApplicationShowProps) {
    const { t } = useTranslate();
    const AI_INTERVIEW_STATUS: Record<
        string,
        { label: string; color: string; bg: string; ring: string }
    > = {
        scheduled: {
            label: t('candidate.applications.ai_status_scheduled'),
            color: 'text-blue-700',
            bg: 'bg-blue-50',
            ring: 'ring-blue-200',
        },
        in_progress: {
            label: t('candidate.applications.ai_status_in_progress'),
            color: 'text-secondary-700',
            bg: 'bg-secondary-50',
            ring: 'ring-secondary-200',
        },
        completed: {
            label: t('candidate.applications.ai_status_completed'),
            color: 'text-emerald-700',
            bg: 'bg-emerald-50',
            ring: 'ring-emerald-200',
        },
        cancelled: {
            label: t('candidate.applications.ai_status_cancelled'),
            color: 'text-red-600',
            bg: 'bg-red-50',
            ring: 'ring-red-200',
        },
    };
    const hasAiInterviews = application.ai_interviews.length > 0;
    const hasManualInterviews = application.interviews.length > 0;
    const hasAnyInterview = hasAiInterviews || hasManualInterviews;
    const latestAiInterview = hasAiInterviews
        ? application.ai_interviews[0]
        : null;
    const latestAiInterviewStatus = latestAiInterview
        ? (AI_INTERVIEW_STATUS[latestAiInterview.status] ??
          AI_INTERVIEW_STATUS['scheduled'])
        : null;

    return (
        <>
            <Head title={t('candidate.applications.show_title')} />
            <div className="space-y-6 p-4 md:p-6">
                {/* Page header */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <Heading
                        title={
                            application.job.title ??
                            t('candidate.applications.show_title')
                        }
                        description={`${application.job.company ?? t('candidate.applications.fallback_company')} · ${application.applied_at ?? '-'}`}
                    />
                    <div className="flex flex-wrap gap-2">
                        {application.job.slug ? (
                            <Button asChild variant="outline">
                                <Link href={jobShow(application.job.slug)}>
                                    {t(
                                        'candidate.applications.btn_job_detail',
                                    )}
                                </Link>
                            </Button>
                        ) : null}
                        {application.job.detail_url ? (
                            <Button asChild variant="outline">
                                <Link href={application.job.detail_url}>
                                    <ExternalLink className="size-4" />
                                    Detail lowongan
                                </Link>
                            </Button>
                        ) : null}
                    </div>
                </div>

                {/* Status + Cover letter */}
                <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {t(
                                    'candidate.applications.status_card_title',
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <StatusBadge
                                status={application.status}
                                label={application.status_label}
                            />
                            {application.email_status_label ? (
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                                    <p className="font-semibold text-slate-800">
                                        Pengiriman CV ke perusahaan
                                    </p>
                                    <p className="mt-1 text-slate-600">
                                        {application.email_status_label}
                                        {application.email_sent_at
                                            ? ' · ' + application.email_sent_at
                                            : ''}
                                    </p>
                                </div>
                            ) : null}
                            <Info label={t('candidate.applications.info_cv')}>
                                {application.cv_url ? (
                                    <a
                                        className="text-primary underline-offset-4 hover:underline"
                                        href={application.cv_url}
                                        target="_blank"
                                    >
                                        {t(
                                            'candidate.applications.btn_view_cv',
                                        )}
                                    </a>
                                ) : (
                                    '-'
                                )}
                            </Info>
                            <Info
                                label={t(
                                    'candidate.applications.info_work_mode',
                                )}
                            >
                                {application.job.work_mode ?? '-'}
                            </Info>
                            <Info
                                label={t('candidate.applications.info_type')}
                            >
                                {application.job.job_type ?? '-'}
                            </Info>

                            {latestAiInterview ? (
                                <div className="rounded-xl border bg-muted/20 p-4">
                                    <div className="mb-3 flex items-center justify-between gap-2">
                                        <p className="flex items-center gap-2 text-sm font-semibold">
                                            <Bot className="size-4 text-primary-500" />
                                            {t(
                                                'candidate.applications.ai_summary_title',
                                            )}
                                        </p>
                                        <span
                                            className={cn(
                                                'rounded-full px-2 py-0.5 text-xs font-medium',
                                                latestAiInterviewStatus?.bg,
                                                latestAiInterviewStatus?.color,
                                            )}
                                        >
                                            {latestAiInterviewStatus?.label}
                                        </span>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <Info
                                            label={t(
                                                'candidate.applications.info_schedule',
                                            )}
                                        >
                                            {latestAiInterview.scheduled_at ??
                                                t(
                                                    'candidate.applications.schedule_undefined',
                                                )}
                                        </Info>
                                        <Info
                                            label={t(
                                                'candidate.applications.info_mode',
                                            )}
                                        >
                                            {latestAiInterview.interview_mode ===
                                            'text'
                                                ? t(
                                                      'candidate.applications.mode_text',
                                                  )
                                                : t('candidate.ai_interview_show.voice_ai')}
                                        </Info>
                                        <Info
                                            label={t(
                                                'candidate.applications.info_duration',
                                            )}
                                        >
                                            {latestAiInterview.duration_minutes
                                                ? t(
                                                      'candidate.applications.duration_minutes',
                                                      {
                                                          minutes:
                                                              latestAiInterview.duration_minutes,
                                                      },
                                                  )
                                                : '-'}
                                        </Info>
                                    </div>

                                    <div className="mt-3">
                                        <Button
                                            asChild
                                            size="sm"
                                            variant="outline"
                                        >
                                            <Link
                                                href={interviewShow(
                                                    latestAiInterview.id,
                                                )}
                                            >
                                                <Bot className="size-4" />
                                                {t(
                                                    'candidate.applications.btn_open_ai_interview',
                                                )}
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {t(
                                    'candidate.applications.cover_letter_title',
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {application.cover_letter ? (
                                /<[a-z][^>]*>/i.test(
                                    application.cover_letter,
                                ) ? (
                                    <div
                                        className="prose prose-sm max-w-none text-sm leading-7 text-muted-foreground [&_li]:my-1 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5"
                                        dangerouslySetInnerHTML={{
                                            __html: application.cover_letter,
                                        }}
                                    />
                                ) : (
                                    <p className="text-sm leading-6 whitespace-pre-line text-muted-foreground">
                                        {application.cover_letter}
                                    </p>
                                )
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    -
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* AI Interview Schedule — prominent section */}
                {hasAiInterviews ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Bot className="size-5 text-primary-500" />
                            <h3 className="text-base font-semibold">
                                {t(
                                    'candidate.applications.ai_schedule_section_title',
                                )}
                            </h3>
                        </div>

                        <div className="space-y-4">
                            {application.ai_interviews.map((session) => {
                                const cfg =
                                    AI_INTERVIEW_STATUS[session.status] ??
                                    AI_INTERVIEW_STATUS['scheduled'];
                                const isVoice =
                                    session.interview_mode !== 'text';
                                const isCompleted =
                                    session.status === 'completed';
                                const isActive =
                                    session.status === 'in_progress';

                                const timeline = [
                                    {
                                        label: t(
                                            'candidate.applications.timeline_scheduled',
                                        ),
                                        time: session.scheduled_at,
                                        done: true,
                                    },
                                    {
                                        label: t(
                                            'candidate.applications.timeline_candidate_confirmed',
                                        ),
                                        time: session.candidate_confirmed_at,
                                        done: !!session.candidate_confirmed_at,
                                    },
                                    {
                                        label: t(
                                            'candidate.applications.timeline_started',
                                        ),
                                        time: session.started_at,
                                        done: !!session.started_at,
                                    },
                                    {
                                        label: t(
                                            'candidate.applications.timeline_completed',
                                        ),
                                        time: session.completed_at,
                                        done: !!session.completed_at,
                                    },
                                ];

                                return (
                                    <Card
                                        key={session.id}
                                        className={cn(
                                            'overflow-hidden border shadow-sm',
                                            isActive &&
                                                'ring-2 ring-secondary-400',
                                        )}
                                    >
                                        {/* Colored top bar */}
                                        <div
                                            className={cn(
                                                'flex items-center justify-between gap-3 px-5 py-3',
                                                cfg.bg,
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={cn(
                                                        'inline-flex size-2 rounded-full',
                                                        isActive
                                                            ? 'animate-pulse bg-secondary-500'
                                                            : isCompleted
                                                              ? 'bg-emerald-500'
                                                              : 'bg-blue-500',
                                                    )}
                                                />
                                                <span
                                                    className={cn(
                                                        'text-sm font-semibold',
                                                        cfg.color,
                                                    )}
                                                >
                                                    {cfg.label}
                                                </span>
                                            </div>
                                            <span
                                                className={cn(
                                                    'rounded-full px-2.5 py-0.5 text-xs font-medium ring-1',
                                                    cfg.bg,
                                                    cfg.color,
                                                    cfg.ring,
                                                )}
                                            >
                                                {isVoice
                                                    ? t('candidate.ai_interview_show.voice_ai')
                                                    : t(
                                                          'candidate.applications.mode_text_short',
                                                      )}
                                            </span>
                                        </div>

                                        <CardContent className="pt-5">
                                            <div className="grid gap-6 md:grid-cols-[1fr_auto]">
                                                {/* Left: schedule info */}
                                                <div className="space-y-5">
                                                    {/* Datetime + duration */}
                                                    <div className="flex flex-wrap gap-5">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                                                                <CalendarDays className="size-4 text-muted-foreground" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                                                                    {t(
                                                                        'candidate.applications.label_schedule',
                                                                    )}
                                                                </p>
                                                                <p className="text-sm font-semibold text-foreground">
                                                                    {session.scheduled_at ??
                                                                        t(
                                                                            'candidate.applications.schedule_undefined',
                                                                        )}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {session.duration_minutes ? (
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                                                                    <Timer className="size-4 text-muted-foreground" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                                                                        {t(
                                                                            'candidate.applications.label_duration',
                                                                        )}
                                                                    </p>
                                                                    <p className="text-sm font-semibold text-foreground">
                                                                        {t(
                                                                            'candidate.applications.duration_minutes',
                                                                            {
                                                                                minutes:
                                                                                    session.duration_minutes,
                                                                            },
                                                                        )}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ) : null}

                                                        <div className="flex items-center gap-2.5">
                                                            <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                                                                {isVoice ? (
                                                                    <Mic className="size-4 text-muted-foreground" />
                                                                ) : (
                                                                    <MessageSquare className="size-4 text-muted-foreground" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                                                                    {t(
                                                                        'candidate.applications.label_mode',
                                                                    )}
                                                                </p>
                                                                <p className="text-sm font-semibold text-foreground">
                                                                    {isVoice
                                                                        ? t('candidate.ai_interview_show.voice_ai')
                                                                        : t(
                                                                              'candidate.applications.mode_text',
                                                                          )}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Mode description */}
                                                    <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                                                        {isVoice ? (
                                                            <span>
                                                                <strong className="text-foreground">
                                                                    {t('candidate.ai_interview_show.voice_ai')}:
                                                                </strong>{' '}
                                                                {t(
                                                                    'candidate.applications.mode_voice_description',
                                                                )}
                                                            </span>
                                                        ) : (
                                                            <span>
                                                                <strong className="text-foreground">
                                                                    {t(
                                                                        'candidate.applications.mode_text_label',
                                                                    )}
                                                                    :
                                                                </strong>{' '}
                                                                {t(
                                                                    'candidate.applications.mode_text_description',
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Timeline */}
                                                    <div>
                                                        <p className="mb-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                                            {t(
                                                                'candidate.applications.label_timeline',
                                                            )}
                                                        </p>
                                                        <ol className="relative space-y-0 border-l-2 border-border pl-6">
                                                            {timeline.map(
                                                                (step, i) => (
                                                                    <li
                                                                        key={i}
                                                                        className={cn(
                                                                            'relative pb-5 last:pb-0',
                                                                        )}
                                                                    >
                                                                        {/* Dot */}
                                                                        <span
                                                                            className={cn(
                                                                                'absolute -left-[1.8rem] flex size-5 items-center justify-center rounded-full ring-4 ring-background',
                                                                                step.done
                                                                                    ? 'bg-emerald-500'
                                                                                    : 'border-2 border-muted-foreground/25 bg-white',
                                                                            )}
                                                                        >
                                                                            {step.done ? (
                                                                                <CheckCircle2 className="size-3 text-white" />
                                                                            ) : null}
                                                                        </span>
                                                                        <div className="flex min-w-0 items-center justify-between gap-2">
                                                                            <span
                                                                                className={cn(
                                                                                    'text-sm',
                                                                                    step.done
                                                                                        ? 'font-medium text-foreground'
                                                                                        : 'text-muted-foreground',
                                                                                )}
                                                                            >
                                                                                {
                                                                                    step.label
                                                                                }
                                                                            </span>
                                                                            {step.time ? (
                                                                                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                                                                                    {
                                                                                        step.time
                                                                                    }
                                                                                </span>
                                                                            ) : (
                                                                                <span className="shrink-0 text-xs text-muted-foreground/40">
                                                                                    {t(
                                                                                        'candidate.applications.timeline_waiting',
                                                                                    )}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </li>
                                                                ),
                                                            )}
                                                        </ol>
                                                    </div>
                                                </div>

                                                {/* Right: CTA */}
                                                <div className="flex flex-col items-stretch gap-3 md:min-w-40">
                                                    {isCompleted ? (
                                                        <div className="flex flex-col items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-5 text-center">
                                                            <BadgeCheck className="size-8 text-emerald-500" />
                                                            <p className="text-sm font-semibold text-emerald-700">
                                                                {t(
                                                                    'candidate.applications.interview_completed',
                                                                )}
                                                            </p>
                                                            <p className="text-xs text-emerald-600">
                                                                {
                                                                    session.completed_at
                                                                }
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col gap-2">
                                                            <Button
                                                                asChild
                                                                className="bg-primary-500 text-white hover:bg-primary-600"
                                                            >
                                                                <Link
                                                                    href={interviewShow(
                                                                        session.id,
                                                                    )}
                                                                >
                                                                    {isActive ? (
                                                                        <>
                                                                            <Mic className="size-4" />
                                                                            {t(
                                                                                'candidate.applications.btn_continue_interview',
                                                                            )}
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Bot className="size-4" />
                                                                            {t(
                                                                                'candidate.applications.btn_start_interview',
                                                                            )}
                                                                        </>
                                                                    )}
                                                                </Link>
                                                            </Button>
                                                            {session.meeting_url ? (
                                                                <Button
                                                                    asChild
                                                                    variant="outline"
                                                                    size="sm"
                                                                >
                                                                    <a
                                                                        href={
                                                                            session.meeting_url
                                                                        }
                                                                        target="_blank"
                                                                    >
                                                                        <ExternalLink className="size-3.5" />
                                                                        {t(
                                                                            'candidate.applications.btn_meeting_link',
                                                                        )}
                                                                    </a>
                                                                </Button>
                                                            ) : null}
                                                        </div>
                                                    )}

                                                    {isCompleted ? (
                                                        <Button
                                                            asChild
                                                            variant="outline"
                                                            size="sm"
                                                        >
                                                            <Link
                                                                href={interviewShow(
                                                                    session.id,
                                                                )}
                                                            >
                                                                {t(
                                                                    'candidate.applications.btn_view_result',
                                                                )}
                                                            </Link>
                                                        </Button>
                                                    ) : null}

                                                    <div className="rounded-lg border border-dashed p-3 text-center">
                                                        <Clock3 className="mx-auto size-4 text-muted-foreground" />
                                                        <p className="mt-1.5 text-xs text-muted-foreground">
                                                            {t(
                                                                'candidate.applications.prepare_hint',
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                ) : null}

                {/* Manual interviews (if any) */}
                {hasManualInterviews ? (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Briefcase className="size-4 text-muted-foreground" />
                                {t(
                                    'candidate.applications.manual_interview_title',
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {application.interviews.map((interview) => (
                                <div
                                    className="rounded-lg border p-3"
                                    key={`manual-${interview.id}`}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="font-medium">
                                            {interview.scheduled_at}
                                        </p>
                                        <StatusBadge
                                            status={interview.status}
                                        />
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {interview.mode}
                                    </p>
                                    {interview.location_url ? (
                                        <a
                                            className="text-sm text-primary underline-offset-4 hover:underline"
                                            href={interview.location_url}
                                            target="_blank"
                                        >
                                            {t(
                                                'candidate.applications.btn_open_interview_link',
                                            )}
                                        </a>
                                    ) : null}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ) : null}

                {/* No interviews at all */}
                {!hasAnyInterview ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <Bot className="size-10 text-muted-foreground/30" />
                            <p className="mt-3 text-sm font-medium text-muted-foreground">
                                {t(
                                    'candidate.applications.empty_interviews_title',
                                )}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {t(
                                    'candidate.applications.empty_interviews_description',
                                )}
                            </p>
                        </CardContent>
                    </Card>
                ) : null}

                {/* Status history */}
                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {t(
                                    'candidate.applications.status_history_title',
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {application.histories.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>
                                                {t(
                                                    'candidate.applications.col_status',
                                                )}
                                            </TableHead>
                                            <TableHead>
                                                {t(
                                                    'candidate.applications.col_note',
                                                )}
                                            </TableHead>
                                            <TableHead className="text-right">
                                                {t(
                                                    'candidate.applications.col_date',
                                                )}
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {application.histories.map(
                                            (history) => (
                                                <TableRow key={history.id}>
                                                    <TableCell className="font-medium">
                                                        <StatusBadge
                                                            status={
                                                                history.to_status
                                                            }
                                                            label={
                                                                history.to_status_label
                                                            }
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {history.note ?? '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right text-sm text-muted-foreground tabular-nums">
                                                        {history.created_at}
                                                    </TableCell>
                                                </TableRow>
                                            ),
                                        )}
                                    </TableBody>
                                </Table>
                            ) : (
                                <p className="px-4 py-6 text-sm text-muted-foreground">
                                    {t(
                                        'candidate.applications.empty_history',
                                    )}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

function Info({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium">{children}</span>
        </div>
    );
}

CandidateApplicationShow.layout = ({ application }: ApplicationShowProps) => ({
    breadcrumbs: [
        {
            title: 'Lamaran Saya',
            href: index(),
        },
        {
            title: application.job.title ?? 'Detail Lamaran',
            href: applicationShow(application.id),
        },
    ],
});
