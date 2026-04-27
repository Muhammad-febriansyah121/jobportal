import { Form, Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    BadgeCheck,
    Briefcase,
    Building2,
    CalendarDays,
    CheckCircle2,
    Clock,
    ExternalLink,
    GraduationCap,
    Hourglass,
    Lightbulb,
    Lock,
    Mail,
    MapPin,
    Monitor,
    PhoneCall,
    Sparkles,
    Timer,
    UserCircle2,
    UserCog,
    Video,
    XCircle,
} from 'lucide-react';
import type { ComponentType } from 'react';
import CandidateInterviewController from '@/actions/App/Http/Controllers/Candidate/CandidateInterviewController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';
import { index, show } from '@/routes/candidate/interviews';

type Participant = {
    id: number;
    name?: string | null;
    email?: string | null;
    role: string;
};

type InterviewShowProps = {
    interview: {
        id: number;
        application_id: number;
        application_status?: string | null;
        job_title?: string | null;
        company?: string | null;
        scheduled_at?: string | null;
        scheduled_at_iso?: string | null;
        created_at?: string | null;
        duration_minutes?: number | null;
        mode: string;
        mode_label?: string | null;
        location_url?: string | null;
        show_meeting_link: boolean;
        status: string;
        notes?: string | null;
        scheduler?: {
            name?: string | null;
            email?: string | null;
        } | null;
        participants: Participant[];
        application?: {
            id: number;
            status?: string | null;
            applied_at?: string | null;
        } | null;
        job?: {
            id: number;
            title?: string | null;
            description?: string | null;
            location_city?: string | null;
            location_province?: string | null;
            work_mode?: string | null;
            job_type?: string | null;
            experience_level?: string | null;
        } | null;
        company_detail?: {
            id: number;
            name?: string | null;
            logo_url?: string | null;
            description?: string | null;
            hq_city?: string | null;
            hq_province?: string | null;
            website?: string | null;
            is_verified?: boolean;
        } | null;
    };
};

const STATUS_CONFIG: Record<
    string,
    {
        label: string;
        badge: string;
        dot: string;
        ring: string;
    }
> = {
    scheduled: {
        label: 'candidate.interviews_show.status_scheduled',
        badge: 'bg-blue-100 text-blue-800 border-blue-200',
        dot: 'bg-blue-500',
        ring: 'ring-blue-200',
    },
    confirmed: {
        label: 'candidate.interviews_show.status_confirmed',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        dot: 'bg-emerald-500',
        ring: 'ring-emerald-200',
    },
    completed: {
        label: 'candidate.interviews_show.status_completed',
        badge: 'bg-slate-100 text-slate-700 border-slate-200',
        dot: 'bg-slate-500',
        ring: 'ring-slate-200',
    },
    cancelled: {
        label: 'candidate.interviews_show.status_cancelled',
        badge: 'bg-rose-100 text-rose-800 border-rose-200',
        dot: 'bg-rose-500',
        ring: 'ring-rose-200',
    },
    rescheduled: {
        label: 'candidate.interviews_show.status_rescheduled',
        badge: 'bg-amber-100 text-amber-800 border-amber-200',
        dot: 'bg-amber-500',
        ring: 'ring-amber-200',
    },
};

const ROLE_LABEL: Record<string, string> = {
    candidate: 'candidate.interviews_show.role_candidate',
    interviewer: 'candidate.interviews_show.role_interviewer',
    observer: 'candidate.interviews_show.role_observer',
    hiring_manager: 'candidate.interviews_show.role_hiring_manager',
    recruiter: 'candidate.interviews_show.role_recruiter',
};

const MODE_ICON: Record<string, ComponentType<{ className?: string }>> = {
    online: Video,
    offline: MapPin,
    onsite: MapPin,
    voice_ai: PhoneCall,
    text_ai: Monitor,
};

export default function CandidateInterviewShow({
    interview,
}: InterviewShowProps) {
    const { t } = useTranslate();
    const status = STATUS_CONFIG[interview.status] ?? STATUS_CONFIG.scheduled;
    const ModeIcon = MODE_ICON[interview.mode] ?? Monitor;
    const isUpcoming =
        interview.status === 'scheduled' || interview.status === 'confirmed';
    const isCompleted = interview.status === 'completed';
    const countdown = computeCountdown(interview.scheduled_at_iso ?? null, t);
    const meetingActionable =
        interview.show_meeting_link && Boolean(interview.location_url);

    return (
        <>
            <Head
                title={t('candidate.interviews_show.page_title', {
                    title: interview.job_title ?? '',
                })}
            />

            <div className="space-y-5 p-4 md:p-6">
                <Link
                    href={index().url}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
                >
                    <ArrowLeft className="size-4" />
                    {t('candidate.interviews_show.back_to_list')}
                </Link>

                <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#01296A] via-[#0a3a8a] to-[#0a4ba5] text-white shadow-lg">
                    <div className="flex flex-col gap-5 p-6 md:flex-row md:items-start md:gap-6 md:p-8">
                        <CompanyAvatar
                            name={
                                interview.company_detail?.name ??
                                interview.company
                            }
                            logoUrl={interview.company_detail?.logo_url}
                        />

                        <div className="flex-1 space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge className="border-0 bg-white/15 text-white capitalize">
                                    {t(
                                        'candidate.interviews_show.real_interview',
                                    )}
                                </Badge>
                                <span
                                    className={cn(
                                        'inline-flex items-center gap-1.5 rounded-full border bg-white/10 px-2.5 py-0.5 text-xs font-medium',
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'size-1.5 rounded-full',
                                            status.dot,
                                        )}
                                        aria-hidden
                                    />
                                    {t(status.label)}
                                </span>
                            </div>

                            <div className="space-y-1">
                                <h1 className="text-2xl leading-tight font-bold md:text-3xl">
                                    {interview.job_title ??
                                        t(
                                            'candidate.interviews_show.position_fallback',
                                        )}
                                </h1>
                                <p className="flex flex-wrap items-center gap-1.5 text-sm text-white/85">
                                    <Building2 className="size-4" />
                                    {interview.company_detail?.name ??
                                        interview.company ??
                                        '—'}
                                    {interview.company_detail?.is_verified ? (
                                        <BadgeCheck className="size-4 text-emerald-300" />
                                    ) : null}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-1 sm:grid-cols-4">
                                <HeroStat
                                    icon={CalendarDays}
                                    label={t(
                                        'candidate.interviews_show.hero_schedule',
                                    )}
                                    value={
                                        interview.scheduled_at ??
                                        t('candidate.interviews_show.waiting')
                                    }
                                />
                                <HeroStat
                                    icon={Timer}
                                    label={t(
                                        'candidate.interviews_show.hero_duration',
                                    )}
                                    value={
                                        interview.duration_minutes
                                            ? `${interview.duration_minutes} ${t('candidate.interviews_show.minute')}`
                                            : '—'
                                    }
                                />
                                <HeroStat
                                    icon={ModeIcon}
                                    label={t(
                                        'candidate.interviews_show.hero_mode',
                                    )}
                                    value={
                                        interview.mode_label ??
                                        capitalize(interview.mode)
                                    }
                                />
                                <HeroStat
                                    icon={Hourglass}
                                    label={t(
                                        'candidate.interviews_show.hero_time',
                                    )}
                                    value={countdown.label}
                                    accent={countdown.accent}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <StatusTimeline status={interview.status} t={t} />

                <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
                    <div className="space-y-5">
                        {meetingActionable ? (
                            <Card className="border-emerald-200 bg-emerald-50/40">
                                <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-start gap-3">
                                        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
                                            <Video className="size-5" />
                                        </span>
                                        <div>
                                            <p className="font-semibold">
                                                {t(
                                                    'candidate.interviews_show.link_location',
                                                )}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {t(
                                                    'candidate.interviews_show.link_hint',
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <Button asChild size="lg">
                                        <a
                                            href={interview.location_url ?? '#'}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <ExternalLink className="size-4" />
                                            {t(
                                                'candidate.interviews_show.open_link',
                                            )}
                                        </a>
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : null}

                        {interview.notes ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <UserCog className="size-4 text-[#01296A]" />
                                        {t(
                                            'candidate.interviews_show.notes_from_recruiter',
                                        )}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm leading-7 whitespace-pre-line text-foreground/85">
                                        {interview.notes}
                                    </p>
                                </CardContent>
                            </Card>
                        ) : null}

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Briefcase className="size-4 text-[#01296A]" />
                                    {t(
                                        'candidate.interviews_show.about_position',
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    {interview.job?.experience_level ? (
                                        <InfoChip
                                            icon={GraduationCap}
                                            label={formatLabel(
                                                interview.job.experience_level,
                                            )}
                                        />
                                    ) : null}
                                    {interview.job?.job_type ? (
                                        <InfoChip
                                            icon={Briefcase}
                                            label={formatLabel(
                                                interview.job.job_type,
                                            )}
                                        />
                                    ) : null}
                                    {interview.job?.work_mode ? (
                                        <InfoChip
                                            icon={Monitor}
                                            label={formatLabel(
                                                interview.job.work_mode,
                                            )}
                                        />
                                    ) : null}
                                    {interview.job?.location_city ||
                                    interview.job?.location_province ? (
                                        <InfoChip
                                            icon={MapPin}
                                            label={[
                                                interview.job.location_city,
                                                interview.job.location_province,
                                            ]
                                                .filter(Boolean)
                                                .join(', ')}
                                        />
                                    ) : null}
                                </div>

                                {interview.job?.description ? (
                                    <div className="prose-compact text-sm leading-7 whitespace-pre-line text-foreground/80">
                                        {truncateText(
                                            interview.job.description,
                                            600,
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        {t(
                                            'candidate.interviews_show.no_position_description',
                                        )}
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {interview.company_detail ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Building2 className="size-4 text-[#01296A]" />
                                        {t(
                                            'candidate.interviews_show.about_company',
                                        )}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <CompanyAvatar
                                            size="md"
                                            name={interview.company_detail.name}
                                            logoUrl={
                                                interview.company_detail
                                                    .logo_url
                                            }
                                        />
                                        <div className="space-y-0.5">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <p className="font-semibold">
                                                    {
                                                        interview.company_detail
                                                            .name
                                                    }
                                                </p>
                                                {interview.company_detail
                                                    .is_verified ? (
                                                    <Badge
                                                        variant="outline"
                                                        className="gap-1 text-[10px] text-emerald-700"
                                                    >
                                                        <BadgeCheck className="size-3" />
                                                        {t(
                                                            'candidate.interviews_show.verified',
                                                        )}
                                                    </Badge>
                                                ) : null}
                                            </div>
                                            {interview.company_detail.hq_city ||
                                            interview.company_detail
                                                .hq_province ? (
                                                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <MapPin className="size-3" />
                                                    {[
                                                        interview.company_detail
                                                            .hq_city,
                                                        interview.company_detail
                                                            .hq_province,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(', ')}
                                                </p>
                                            ) : null}
                                        </div>
                                        {interview.company_detail.website ? (
                                            <Button
                                                asChild
                                                size="sm"
                                                variant="outline"
                                                className="ml-auto shrink-0"
                                            >
                                                <a
                                                    href={
                                                        interview.company_detail
                                                            .website
                                                    }
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    <ExternalLink className="size-3.5" />
                                                    {t(
                                                        'candidate.interviews_show.website',
                                                    )}
                                                </a>
                                            </Button>
                                        ) : null}
                                    </div>

                                    {interview.company_detail.description ? (
                                        <p className="text-sm leading-7 text-foreground/80">
                                            {truncateText(
                                                interview.company_detail
                                                    .description,
                                                400,
                                            )}
                                        </p>
                                    ) : null}
                                </CardContent>
                            </Card>
                        ) : null}

                        <Card className="border-dashed bg-muted/30">
                            <CardContent className="flex items-start gap-3 py-4">
                                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                                    <Lock className="size-4 text-muted-foreground" />
                                </span>
                                <div className="space-y-0.5">
                                    <p className="text-sm font-semibold">
                                        {t(
                                            'candidate.interviews_show.no_result_title',
                                        )}
                                    </p>
                                    <p className="text-xs leading-5 text-muted-foreground">
                                        {t(
                                            'candidate.interviews_show.no_result_description',
                                        )}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <aside className="space-y-5">
                        <Card>
                            <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <UserCircle2 className="size-4 text-[#01296A]" />
                                    {t(
                                        'candidate.interviews_show.participants',
                                    )}
                                </CardTitle>
                                <Badge variant="secondary" className="text-xs">
                                    {interview.participants.length}
                                </Badge>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {interview.participants.length > 0 ? (
                                    interview.participants.map(
                                        (participant) => (
                                            <ParticipantRow
                                                key={participant.id}
                                                participant={participant}
                                                t={t}
                                            />
                                        ),
                                    )
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        {t(
                                            'candidate.interviews_show.participants_empty',
                                        )}
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {interview.scheduler ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <UserCog className="size-4 text-[#01296A]" />
                                        {t(
                                            'candidate.interviews_show.scheduled_by',
                                        )}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-start gap-3">
                                        <span className="flex size-9 items-center justify-center rounded-full bg-[#01296A]/10 text-sm font-semibold text-[#01296A]">
                                            {initialFromName(
                                                interview.scheduler.name,
                                            )}
                                        </span>
                                        <div className="min-w-0 flex-1 space-y-0.5">
                                            <p className="text-sm font-medium">
                                                {interview.scheduler.name ??
                                                    '—'}
                                            </p>
                                            {interview.scheduler.email ? (
                                                <a
                                                    href={`mailto:${interview.scheduler.email}`}
                                                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                                                >
                                                    <Mail className="size-3" />
                                                    {interview.scheduler.email}
                                                </a>
                                            ) : null}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : null}

                        {isUpcoming ? (
                            <Card className="border-[#01296A]/15 bg-gradient-to-br from-[#eff4ff] to-background">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Sparkles className="size-4 text-[#01296A]" />
                                        {t(
                                            'candidate.interviews_show.quick_actions',
                                        )}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {interview.status === 'scheduled' ? (
                                        <>
                                            <Form
                                                {...CandidateInterviewController.confirm.form(
                                                    interview.id,
                                                )}
                                                className="contents"
                                            >
                                                {({ processing }) => (
                                                    <Button
                                                        type="submit"
                                                        disabled={processing}
                                                        className="w-full"
                                                    >
                                                        <CheckCircle2 className="size-4" />
                                                        {processing
                                                            ? t(
                                                                  'candidate.form.saving',
                                                              )
                                                            : t(
                                                                  'candidate.interviews_show.confirm_attendance',
                                                              )}
                                                    </Button>
                                                )}
                                            </Form>
                                            <Form
                                                {...CandidateInterviewController.decline.form(
                                                    interview.id,
                                                )}
                                                className="contents"
                                            >
                                                {({ processing }) => (
                                                    <Button
                                                        type="submit"
                                                        variant="outline"
                                                        disabled={processing}
                                                        className="w-full"
                                                    >
                                                        <XCircle className="size-4" />
                                                        {processing
                                                            ? t(
                                                                  'candidate.form.saving',
                                                              )
                                                            : t(
                                                                  'candidate.interviews_show.decline_schedule',
                                                              )}
                                                    </Button>
                                                )}
                                            </Form>
                                        </>
                                    ) : (
                                        <p className="text-xs text-muted-foreground">
                                            {t(
                                                'candidate.interviews_show.already_confirmed',
                                            )}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        ) : null}

                        <Card className="border-blue-100 bg-blue-50/40">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base text-blue-900">
                                    <Lightbulb className="size-4" />
                                    {t('candidate.interviews_show.tips_title')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm leading-6 text-blue-900/85">
                                    {(isCompleted
                                        ? POST_INTERVIEW_TIPS
                                        : PRE_INTERVIEW_TIPS
                                    ).map((tip, index) => (
                                        <li
                                            key={index}
                                            className="flex items-start gap-2"
                                        >
                                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-blue-600" />
                                            <span>{t(tip)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </aside>
                </div>
            </div>
        </>
    );
}

const PRE_INTERVIEW_TIPS = [
    'candidate.interviews_show.tip_pre_1',
    'candidate.interviews_show.tip_pre_2',
    'candidate.interviews_show.tip_pre_3',
    'candidate.interviews_show.tip_pre_4',
    'candidate.interviews_show.tip_pre_5',
];

const POST_INTERVIEW_TIPS = [
    'candidate.interviews_show.tip_post_1',
    'candidate.interviews_show.tip_post_2',
    'candidate.interviews_show.tip_post_3',
    'candidate.interviews_show.tip_post_4',
];

function CompanyAvatar({
    name,
    logoUrl,
    size = 'lg',
}: {
    name?: string | null;
    logoUrl?: string | null;
    size?: 'md' | 'lg';
}) {
    const sizeClass = size === 'lg' ? 'size-16' : 'size-10';

    if (logoUrl) {
        return (
            <span
                className={cn(
                    'shrink-0 overflow-hidden rounded-xl bg-white',
                    sizeClass,
                )}
            >
                <img
                    src={logoUrl}
                    alt={name ?? 'Company'}
                    className="h-full w-full object-cover"
                />
            </span>
        );
    }

    return (
        <span
            className={cn(
                'flex shrink-0 items-center justify-center rounded-xl bg-white/15 text-2xl font-bold',
                sizeClass,
            )}
        >
            {initialFromName(name)}
        </span>
    );
}

function HeroStat({
    icon: Icon,
    label,
    value,
    accent,
}: {
    icon: ComponentType<{ className?: string }>;
    label: string;
    value: string;
    accent?: 'urgent' | 'positive';
}) {
    const accentClass =
        accent === 'urgent'
            ? 'text-amber-200'
            : accent === 'positive'
              ? 'text-emerald-200'
              : 'text-white';

    return (
        <div className="rounded-lg bg-white/10 p-3">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-white/65 uppercase">
                <Icon className="size-3" />
                {label}
            </div>
            <p className={cn('mt-1 text-sm font-semibold', accentClass)}>
                {value}
            </p>
        </div>
    );
}

function InfoChip({
    icon: Icon,
    label,
}: {
    icon: ComponentType<{ className?: string }>;
    label: string;
}) {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1 text-xs font-medium capitalize">
            <Icon className="size-3.5 text-muted-foreground" />
            {label}
        </span>
    );
}

function ParticipantRow({
    participant,
    t,
}: {
    participant: Participant;
    t: (key: string) => string;
}) {
    const roleLabel = ROLE_LABEL[participant.role]
        ? t(ROLE_LABEL[participant.role])
        : formatLabel(participant.role);
    const isCandidate = participant.role === 'candidate';

    return (
        <div className="flex items-start gap-3 rounded-lg border p-3">
            <span
                className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                    isCandidate
                        ? 'bg-[#01296A]/10 text-[#01296A]'
                        : 'bg-muted text-muted-foreground',
                )}
            >
                {initialFromName(participant.name)}
            </span>
            <div className="min-w-0 flex-1 space-y-0.5">
                <p className="truncate text-sm font-medium">
                    {participant.name ?? '—'}
                </p>
                {participant.email ? (
                    <p className="truncate text-xs text-muted-foreground">
                        {participant.email}
                    </p>
                ) : null}
            </div>
            <Badge variant="outline" className="shrink-0 text-[10px]">
                {roleLabel}
            </Badge>
        </div>
    );
}

function StatusTimeline({
    status,
    t,
}: {
    status: string;
    t: (key: string) => string;
}) {
    const steps: Array<{
        key: string;
        label: string;
        description: string;
        icon: ComponentType<{ className?: string }>;
    }> = [
        {
            key: 'invited',
            label: t('candidate.interviews_show.timeline_invited'),
            description: t('candidate.interviews_show.timeline_invited_desc'),
            icon: CalendarDays,
        },
        {
            key: 'confirmed',
            label: t('candidate.interviews_show.timeline_confirmed'),
            description: t('candidate.interviews_show.timeline_confirmed_desc'),
            icon: CheckCircle2,
        },
        {
            key: 'completed',
            label: t('candidate.interviews_show.timeline_completed'),
            description: t('candidate.interviews_show.timeline_completed_desc'),
            icon: Clock,
        },
        {
            key: 'result',
            label: t('candidate.interviews_show.timeline_result'),
            description: t('candidate.interviews_show.timeline_result_desc'),
            icon: Lock,
        },
    ];

    const currentIndex = (() => {
        if (status === 'completed') {
            return 2;
        }

        if (status === 'confirmed') {
            return 1;
        }

        if (status === 'scheduled' || status === 'rescheduled') {
            return 0;
        }

        if (status === 'cancelled') {
            return -1;
        }

        return 0;
    })();

    return (
        <div className="rounded-2xl border bg-background p-4 md:p-5">
            <ol className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isLocked = step.key === 'result';
                    const isDone =
                        !isLocked && currentIndex >= 0 && index <= currentIndex;
                    const isActive = !isLocked && index === currentIndex + 1;

                    return (
                        <li
                            key={step.key}
                            className="flex items-start gap-3 md:flex-col md:items-center md:text-center"
                        >
                            <span
                                className={cn(
                                    'flex size-9 shrink-0 items-center justify-center rounded-full ring-2 transition',
                                    isDone
                                        ? 'bg-emerald-500 text-white ring-emerald-200'
                                        : isActive
                                          ? 'bg-[#01296A] text-white ring-[#01296A]/20'
                                          : isLocked
                                            ? 'bg-muted text-muted-foreground ring-muted'
                                            : 'bg-muted/40 text-muted-foreground ring-muted',
                                )}
                            >
                                <Icon className="size-4" />
                            </span>
                            <div className="space-y-0.5 md:mt-1">
                                <p
                                    className={cn(
                                        'text-sm font-semibold',
                                        isLocked
                                            ? 'text-muted-foreground'
                                            : 'text-foreground',
                                    )}
                                >
                                    {step.label}
                                </p>
                                <p className="text-[11px] leading-4 text-muted-foreground">
                                    {step.description}
                                </p>
                            </div>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}

function computeCountdown(
    iso: string | null,
    t: (key: string, replacements?: Record<string, string | number>) => string,
): {
    label: string;
    accent?: 'urgent' | 'positive';
} {
    return computeCountdownInternal(iso, t);
}

function computeCountdownInternal(
    iso: string | null,
    t: (key: string, replacements?: Record<string, string | number>) => string,
): {
    label: string;
    accent?: 'urgent' | 'positive';
} {
    if (!iso) {
        return { label: t('candidate.interviews_show.not_scheduled') };
    }

    const target = new Date(iso).getTime();

    if (Number.isNaN(target)) {
        return { label: '—' };
    }

    const diff = target - Date.now();

    if (diff < -86_400_000) {
        return { label: t('candidate.interviews_show.passed') };
    }

    if (diff < 0) {
        return {
            label: t('candidate.interviews_show.today'),
            accent: 'positive',
        };
    }

    const minutes = Math.floor(diff / 60_000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days >= 2) {
        return {
            label: t('candidate.interviews_show.days_left', { count: days }),
        };
    }

    if (days === 1) {
        return {
            label: t('candidate.interviews_show.tomorrow'),
            accent: 'urgent',
        };
    }

    if (hours >= 2) {
        return {
            label: t('candidate.interviews_show.hours_left', { count: hours }),
            accent: 'urgent',
        };
    }

    if (minutes > 0) {
        return {
            label: t('candidate.interviews_show.minutes_left', {
                count: minutes,
            }),
            accent: 'urgent',
        };
    }

    return { label: t('candidate.interviews_show.soon'), accent: 'urgent' };
}

function initialFromName(name?: string | null): string {
    if (!name) {
        return '?';
    }

    const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);

    return parts.map((part) => part.charAt(0).toUpperCase()).join('') || '?';
}

function formatLabel(value?: string | null): string {
    if (!value) {
        return '';
    }

    return value.replace(/[_-]+/g, ' ').toLowerCase();
}

function capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function truncateText(text: string, max: number): string {
    if (text.length <= max) {
        return text;
    }

    return text.slice(0, max).trimEnd() + '…';
}

CandidateInterviewShow.layout = ({ interview }: InterviewShowProps) => ({
    breadcrumbs: [
        {
            title: 'Jadwal Interview',
            href: index(),
        },
        {
            title: interview.job_title ?? 'Detail',
            href: show(interview.id),
        },
    ],
});
