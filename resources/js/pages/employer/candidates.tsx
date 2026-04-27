import { Head, Link, router, useForm } from '@inertiajs/react';
import { useTranslate } from '@/hooks/use-translate';
import {
    BarChart3,
    Bot,
    BriefcaseBusiness,
    CalendarClock,
    CheckCircle2,
    Loader2,
    Mail,
    MessageCircle,
    Mic,
    Plus,
    Search,
    Sparkles,
    Trash2,
    UserRound,
    Users,
    Video,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import EmployerAiInterviewController from '@/actions/App/Http/Controllers/Employer/EmployerAiInterviewController';
import EmployerInterviewController from '@/actions/App/Http/Controllers/Employer/EmployerInterviewController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { cleanPaginationLabel, shouldRenderPagination } from '@/lib/pagination';
import { show as showAiInterview } from '@/routes/employer/ai-interviews';
import { index, show as showCandidate } from '@/routes/employer/candidates';
import { compare as compareAiInterviews } from '@/routes/employer/jobs/ai-interviews';

type Option = {
    value: string;
    label: string;
};

type CandidateApplication = {
    id: number;
    status: string;
    status_label: string;
    applied_at: string;
    first_responded_at: string | null;
    ai_fit_score: number | null;
    ai_skill_match: {
        matched: string[];
        missing: string[];
    };
    cover_letter: string;
    candidate: {
        id: number | null;
        name: string;
        email: string | null;
        phone: string | null;
        whatsapp_phone: string | null;
        avatar_url: string | null;
        headline: string | null;
        preferred_role: string | null;
        location: string;
        expected_salary: string;
        work_mode_pref: string;
        availability: string;
        profile_completion: number;
        industry: string | null;
        skills: string[];
    };
    job: {
        id: number | null;
        title: string;
        status: string;
    };
    cv: {
        file_url: string;
        uploaded_at: string | null;
    } | null;
    latest_history: {
        to_status: string;
        note: string | null;
        created_at: string | null;
    } | null;
    interview: {
        status: string;
        mode: string;
        scheduled_at: string | null;
    } | null;
    interviews_count: number;
    latest_ai_session: {
        id: number;
        status: string;
        interview_mode?: string | null;
        scheduled_at?: string | null;
        completed_at?: string | null;
        fit_score?: number | null;
    } | null;
};

type InterviewQuestionForm = {
    question: string;
    category: string;
    rubric: string;
    weight: number;
    allow_ai_followup: boolean;
};

type BulkScheduleForm = {
    application_ids: number[];
    interview_mode: 'voice' | 'text';
    scheduled_at: string;
    duration_minutes: number;
    meeting_url: string;
    voice: string;
    questions: InterviewQuestionForm[];
};

type CandidatesPageProps = {
    company: {
        id: number;
        name: string;
    };
    google_calendar: {
        connected: boolean;
        email: string | null;
    };
    whatsapp_gateway: {
        configured: boolean;
        session_id: string | null;
        has_session: boolean;
    };
    filters: {
        search?: string;
        status?: string;
        job_id?: string;
        ai_interview_status?: string;
    };
    jobOptions: Option[];
    statusOptions: Option[];
    metrics: {
        total: number;
        shortlisted: number;
        interviews: number;
        average_ai_fit: number;
    };
    applications: {
        data: CandidateApplication[];
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
    selected_job: { id: number; title: string } | null;
    suggested_questions: InterviewQuestionForm[];
    status_counts: {
        all: number;
        applied: number;
        screened: number;
        shortlisted: number;
        interview: number;
        offer: number;
        hired: number;
        rejected: number;
        withdrawn: number;
    };
};

const ACTIVE_AI_INTERVIEW_STATUSES = ['pending', 'scheduled', 'in_progress'];

const QUESTION_CATEGORY_OPTIONS = [
    { value: 'behavioral', label: 'Behavioral' },
    { value: 'technical', label: 'Technical' },
    { value: 'problem_solving', label: 'Problem Solving' },
    { value: 'communication', label: 'Communication' },
    { value: 'leadership', label: 'Leadership' },
    { value: 'culture_fit', label: 'Culture Fit' },
] as const;

export default function EmployerCandidates({
    company,
    filters,
    jobOptions,
    statusOptions,
    metrics,
    applications,
    selected_job,
    suggested_questions,
    status_counts,
    google_calendar,
    whatsapp_gateway,
}: CandidatesPageProps) {
    const { t } = useTranslate();

    const STATUS_TABS: Array<{
        value: string;
        label: string;
        countKey: keyof CandidatesPageProps['status_counts'];
    }> = [
        { value: '', label: t('employer.candidates.tab_all'), countKey: 'all' },
        { value: 'applied', label: t('employer.candidates.tab_applied'), countKey: 'applied' },
        { value: 'screened', label: t('employer.candidates.tab_screened'), countKey: 'screened' },
        { value: 'shortlisted', label: t('employer.candidates.tab_shortlisted'), countKey: 'shortlisted' },
        { value: 'interview', label: t('employer.candidates.tab_interview'), countKey: 'interview' },
        { value: 'offer', label: t('employer.candidates.tab_offer'), countKey: 'offer' },
        { value: 'hired', label: t('employer.candidates.tab_hired'), countKey: 'hired' },
        { value: 'rejected', label: t('employer.candidates.tab_rejected'), countKey: 'rejected' },
        { value: 'withdrawn', label: t('employer.candidates.tab_withdrawn'), countKey: 'withdrawn' },
    ];

    const AI_INTERVIEW_STATUS_LABELS: Record<string, string> = {
        pending: t('employer.candidates.ai_pending'),
        scheduled: t('employer.candidates.ai_scheduled'),
        in_progress: t('employer.candidates.ai_in_progress'),
        completed: t('employer.candidates.ai_completed'),
        cancelled: t('employer.candidates.ai_cancelled'),
    };

    const WHATSAPP_TEMPLATES: Array<{
        key: WhatsappTemplateKey;
        label: string;
    }> = [
        { key: 'intro', label: t('employer.candidates.template_intro') },
        { key: 'interview', label: t('employer.candidates.template_interview') },
        { key: 'followup', label: t('employer.candidates.template_followup') },
    ];

    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [bulkOpen, setBulkOpen] = useState(false);
    const [interviewTarget, setInterviewTarget] =
        useState<CandidateApplication | null>(null);
    const [whatsappTarget, setWhatsappTarget] =
        useState<CandidateApplication | null>(null);
    const [whatsappMessage, setWhatsappMessage] = useState('');
    const [generatingMeet, setGeneratingMeet] = useState(false);
    const [sendingWhatsapp, setSendingWhatsapp] = useState(false);

    useEffect(() => {
        setSelectedIds([]);
    }, [
        filters.search,
        filters.status,
        filters.job_id,
        filters.ai_interview_status,
    ]);

    const baseQuestions = useMemo(
        () =>
            suggested_questions.length > 0
                ? suggested_questions
                : [emptyQuestion()],
        [suggested_questions],
    );

    const bulkForm = useForm<BulkScheduleForm>({
        application_ids: [],
        interview_mode: 'voice',
        scheduled_at: defaultDateTimeLocal(),
        duration_minutes: 30,
        meeting_url: '',
        voice: 'marin',
        questions: baseQuestions,
    });

    const interviewForm = useForm<{
        mode: 'online' | 'onsite';
        scheduled_at: string;
        duration_minutes: number;
        meeting_url: string;
        address: string;
        notes: string;
    }>({
        mode: 'online',
        scheduled_at: defaultDateTimeLocal(),
        duration_minutes: 60,
        meeting_url: '',
        address: '',
        notes: '',
    });

    const selectableApplications = useMemo(
        () =>
            applications.data.filter((application) => {
                const session = application.latest_ai_session;
                return !(
                    session != null &&
                    ACTIVE_AI_INTERVIEW_STATUSES.includes(session.status)
                );
            }),
        [applications.data],
    );

    const allSelectableSelected =
        selectableApplications.length > 0 &&
        selectableApplications.every((application) =>
            selectedIds.includes(application.id),
        );

    const toggleSelected = (id: number) => {
        setSelectedIds((current) =>
            current.includes(id)
                ? current.filter((value) => value !== id)
                : [...current, id],
        );
    };

    const toggleSelectAll = () => {
        if (allSelectableSelected) {
            setSelectedIds([]);
            return;
        }
        setSelectedIds(selectableApplications.map((app) => app.id));
    };

    const selectedApplicants = useMemo(
        () => applications.data.filter((app) => selectedIds.includes(app.id)),
        [applications.data, selectedIds],
    );

    const effectiveJob = useMemo<{ id: number; title: string } | null>(() => {
        if (selected_job) {
            return selected_job;
        }
        if (selectedApplicants.length === 0) {
            return null;
        }
        const jobIds = new Set(
            selectedApplicants
                .map((app) => app.job.id)
                .filter((id): id is number => id != null),
        );
        if (jobIds.size !== 1) {
            return null;
        }
        const first = selectedApplicants[0];
        return first.job.id != null
            ? { id: first.job.id, title: first.job.title }
            : null;
    }, [selected_job, selectedApplicants]);

    const selectionMixedJobs =
        !selected_job && selectedApplicants.length > 0 && effectiveJob === null;

    function navigateWithFilters(next: {
        search?: string;
        status?: string;
        job_id?: string;
        ai_interview_status?: string;
    }) {
        const merged = {
            search: next.search ?? filters.search ?? '',
            status: next.status ?? filters.status ?? '',
            job_id: next.job_id ?? filters.job_id ?? '',
            ai_interview_status:
                next.ai_interview_status ?? filters.ai_interview_status ?? '',
        };

        const url = index({ query: merged }).url;

        router.visit(url, {
            method: 'get',
            preserveScroll: true,
            preserveState: true,
            replace: false,
        });
    }

    function submitFilter(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);

        navigateWithFilters({
            search: formData.get('search')?.toString() ?? '',
            job_id: formData.get('job_id')?.toString() ?? '',
            ai_interview_status:
                formData.get('ai_interview_status')?.toString() ?? '',
        });
    }

    function setStatusTab(value: string) {
        navigateWithFilters({ status: value });
    }

    const openBulkDialog = () => {
        if (selectedIds.length === 0) {
            toast.error(t('employer.candidates.toast_select_one'));
            return;
        }
        if (!effectiveJob) {
            toast.error(t('employer.candidates.toast_same_job'));
            return;
        }
        bulkForm.setData({
            application_ids: selectedIds,
            interview_mode: 'voice',
            scheduled_at: defaultDateTimeLocal(),
            duration_minutes: 30,
            meeting_url: '',
            voice: 'marin',
            questions: baseQuestions.map((q) => ({ ...q })),
        });
        setBulkOpen(true);
    };

    const submitBulk = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!effectiveJob) {
            return;
        }
        bulkForm.setData('application_ids', selectedIds);
        bulkForm.post(
            EmployerAiInterviewController.storeBulk.url(effectiveJob.id),
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(t('employer.candidates.toast_bulk_success'));
                    setBulkOpen(false);
                    setSelectedIds([]);
                },
                onError: () => {
                    toast.error(t('employer.candidates.toast_bulk_error'));
                },
            },
        );
    };

    const updateBulkQuestion = (
        index: number,
        key: keyof InterviewQuestionForm,
        value: string | number | boolean,
    ) => {
        bulkForm.setData(
            'questions',
            bulkForm.data.questions.map((q, i) =>
                i === index ? { ...q, [key]: value } : q,
            ),
        );
    };

    const openInterviewDialog = (application: CandidateApplication) => {
        interviewForm.clearErrors();
        interviewForm.setData({
            mode: 'online',
            scheduled_at: defaultDateTimeLocal(),
            duration_minutes: 60,
            meeting_url: '',
            address: '',
            notes: '',
        });
        setInterviewTarget(application);
    };

    const closeInterviewDialog = () => {
        setInterviewTarget(null);
    };

    const openWhatsappDialog = (application: CandidateApplication) => {
        setWhatsappTarget(application);
        setWhatsappMessage(
            buildWhatsappTemplate('intro', application, company.name, t),
        );
    };

    const closeWhatsappDialog = () => {
        setWhatsappTarget(null);
        setWhatsappMessage('');
    };

    const applyWhatsappTemplate = (template: WhatsappTemplateKey) => {
        if (!whatsappTarget) {
            return;
        }
        setWhatsappMessage(
            buildWhatsappTemplate(template, whatsappTarget, company.name, t),
        );
    };

    const sendWhatsappViaGateway = async () => {
        if (!whatsappTarget) {
            return;
        }
        setSendingWhatsapp(true);
        try {
            const response = await fetch(
                `/employer/applications/${whatsappTarget.id}/whatsapp`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-XSRF-TOKEN': getXsrfToken(),
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({ message: whatsappMessage }),
                },
            );
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message ?? t('employer.candidates.toast_whatsapp_failed'));
            }
            toast.success(data.message ?? t('employer.candidates.toast_whatsapp_sent'));
            closeWhatsappDialog();
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : t('employer.candidates.toast_whatsapp_failed'),
            );
        } finally {
            setSendingWhatsapp(false);
        }
    };

    const sendWhatsappViaWebFallback = () => {
        if (!whatsappTarget?.candidate.whatsapp_phone) {
            return;
        }
        const url = `https://wa.me/${whatsappTarget.candidate.whatsapp_phone}?text=${encodeURIComponent(whatsappMessage)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
        closeWhatsappDialog();
    };

    const generateMeetLink = async () => {
        if (!interviewTarget) {
            return;
        }
        if (!google_calendar.connected) {
            toast.error(t('employer.candidates.toast_google_calendar'));
            return;
        }
        if (!interviewForm.data.scheduled_at) {
            toast.error(t('employer.candidates.toast_fill_schedule'));
            return;
        }

        setGeneratingMeet(true);
        try {
            const response = await fetch(
                `/employer/applications/${interviewTarget.id}/google-meet`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-XSRF-TOKEN': getXsrfToken(),
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({
                        scheduled_at: interviewForm.data.scheduled_at,
                        duration_minutes: interviewForm.data.duration_minutes,
                    }),
                },
            );

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message ?? t('employer.candidates.toast_meet_failed'));
            }
            interviewForm.setData('meeting_url', data.meet_url);
            toast.success(t('employer.candidates.toast_meet_success'));
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : t('employer.candidates.toast_meet_failed'),
            );
        } finally {
            setGeneratingMeet(false);
        }
    };

    const submitInterview = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!interviewTarget) {
            return;
        }

        interviewForm.post(
            EmployerInterviewController.store.url(interviewTarget.id),
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        t('employer.candidates.toast_interview_success', { name: interviewTarget.candidate.name }),
                    );
                    closeInterviewDialog();
                },
                onError: () => {
                    toast.error(t('employer.candidates.toast_interview_error'));
                },
            },
        );
    };

    return (
        <>
            <Head title={t('employer.candidates.head_title')} />

            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title={t('employer.candidates.page_title')}
                    description={t('employer.candidates.page_desc', { company: company.name })}
                />

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <MetricCard
                        label={t('employer.candidates.metric_total')}
                        value={metrics.total}
                        icon={Users}
                        tone="orange"
                    />
                    <MetricCard
                        label={t('employer.candidates.metric_shortlisted')}
                        value={metrics.shortlisted}
                        icon={CheckCircle2}
                        tone="green"
                    />
                    <MetricCard
                        label={t('employer.candidates.metric_interviews')}
                        value={metrics.interviews}
                        icon={CalendarClock}
                        tone="blue"
                    />
                    <MetricCard
                        label={t('employer.candidates.metric_avg_ai_fit')}
                        value={`${metrics.average_ai_fit || 0}%`}
                        icon={Sparkles}
                        tone="slate"
                    />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('employer.candidates.filter_title')}</CardTitle>
                        <CardDescription>
                            {t('employer.candidates.filter_desc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={submitFilter}
                            className="grid gap-3 lg:grid-cols-[1fr_220px_220px_auto]"
                        >
                            <div className="relative">
                                <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
                                <Input
                                    name="search"
                                    defaultValue={filters.search ?? ''}
                                    className="pl-9"
                                    placeholder={t('employer.candidates.search_placeholder')}
                                />
                            </div>
                            <select
                                name="job_id"
                                defaultValue={filters.job_id ?? ''}
                                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            >
                                <option value="">{t('employer.candidates.all_jobs')}</option>
                                {jobOptions.map((job) => (
                                    <option key={job.value} value={job.value}>
                                        {job.label}
                                    </option>
                                ))}
                            </select>
                            <select
                                name="ai_interview_status"
                                defaultValue={filters.ai_interview_status ?? ''}
                                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            >
                                <option value="">{t('employer.candidates.all_ai_status')}</option>
                                <option value="none">{t('employer.candidates.ai_not_scheduled')}</option>
                                <option value="pending">{t('employer.candidates.ai_pending')}</option>
                                <option value="scheduled">{t('employer.candidates.ai_scheduled')}</option>
                                <option value="in_progress">
                                    {t('employer.candidates.ai_in_progress')}
                                </option>
                                <option value="completed">{t('employer.candidates.ai_completed')}</option>
                                <option value="cancelled">{t('employer.candidates.ai_cancelled')}</option>
                            </select>
                            <Button type="submit" variant="outline">
                                {t('employer.candidates.apply_filter')}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Tabs
                    value={filters.status ?? ''}
                    onValueChange={setStatusTab}
                    className="-mt-2"
                >
                    <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
                        {STATUS_TABS.map((tab) => (
                            <TabsTrigger
                                key={tab.value || 'all'}
                                value={tab.value}
                                className="h-8 rounded-full border border-border bg-white px-3 text-xs font-medium data-[state=active]:border-primary-500 data-[state=active]:bg-primary-50 data-[state=active]:text-primary-700"
                            >
                                {tab.label}
                                <Badge
                                    variant="outline"
                                    className="ml-1 border-transparent bg-muted text-[11px] tabular-nums data-[state=active]:bg-primary-100"
                                >
                                    {status_counts[tab.countKey] ?? 0}
                                </Badge>
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>

                {applications.data.length > 0 ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3 shadow-sm">
                        <label className="flex items-center gap-2 text-sm">
                            <Checkbox
                                checked={allSelectableSelected}
                                onCheckedChange={toggleSelectAll}
                                disabled={selectableApplications.length === 0}
                            />
                            <span>
                                {t('employer.candidates.select_all_page')}
                                {selectedIds.length > 0
                                    ? t('employer.candidates.selected_count', { count: selectedIds.length })
                                    : ''}
                            </span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {effectiveJob ? (
                                <Button asChild size="sm" variant="outline">
                                    <Link
                                        href={
                                            compareAiInterviews(effectiveJob.id)
                                                .url
                                        }
                                    >
                                        <BarChart3 className="size-3.5" />
                                        {t('employer.candidates.compare_ai')}
                                    </Link>
                                </Button>
                            ) : (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled
                                    title={t('employer.candidates.compare_ai')}
                                >
                                    <BarChart3 className="size-3.5" />
                                    {t('employer.candidates.compare_ai')}
                                </Button>
                            )}
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={selectedIds.length === 0}
                                onClick={() => setSelectedIds([])}
                            >
                                {t('employer.candidates.cancel_select')}
                            </Button>
                            <Button
                                size="sm"
                                className="bg-primary-500 text-white hover:bg-primary-600 disabled:bg-primary-200"
                                disabled={
                                    selectedIds.length === 0 || !effectiveJob
                                }
                                onClick={openBulkDialog}
                            >
                                <Mic className="size-3.5" />
                                {t('employer.candidates.schedule_ai', { count: selectedIds.length })}
                            </Button>
                        </div>
                    </div>
                ) : null}

                {selectionMixedJobs ? (
                    <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        {t('employer.candidates.mixed_jobs_warning')}
                    </p>
                ) : null}

                <div className="space-y-4">
                    {applications.data.length > 0 ? (
                        applications.data.map((application) => (
                            <CandidateRow
                                key={application.id}
                                application={application}
                                selected={selectedIds.includes(application.id)}
                                onToggle={() => toggleSelected(application.id)}
                                selectionDisabled={
                                    application.latest_ai_session != null &&
                                    ACTIVE_AI_INTERVIEW_STATUSES.includes(
                                        application.latest_ai_session.status,
                                    )
                                }
                                onScheduleInterview={() =>
                                    openInterviewDialog(application)
                                }
                                onWhatsapp={() =>
                                    openWhatsappDialog(application)
                                }
                            />
                        ))
                    ) : (
                        <div className="rounded-lg border bg-white p-8 text-center">
                            <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-[#f8fafc] text-[#64748b]">
                                <Users className="size-6" />
                            </div>
                            <h2 className="mt-4 text-lg font-semibold">
                                {t('employer.candidates.no_candidates_title')}
                            </h2>
                            <p className="mx-auto mt-1 max-w-xl text-sm text-muted-foreground">
                                {t('employer.candidates.no_candidates_desc')}
                            </p>
                        </div>
                    )}
                </div>

                {shouldRenderPagination(applications.links) ? (
                    <div className="flex flex-wrap justify-end gap-2">
                        {applications.links.map((link) => (
                            <Button
                                key={`${link.label}-${link.url}`}
                                asChild={Boolean(link.url)}
                                disabled={!link.url}
                                size="sm"
                                variant={link.active ? 'default' : 'outline'}
                            >
                                {link.url ? (
                                    <Link href={link.url}>
                                        {cleanPaginationLabel(link.label)}
                                    </Link>
                                ) : (
                                    <span>
                                        {cleanPaginationLabel(link.label)}
                                    </span>
                                )}
                            </Button>
                        ))}
                    </div>
                ) : null}
            </div>

            <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
                <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-6xl">
                    <DialogHeader>
                        <DialogTitle>{t('employer.candidates.bulk_dialog_title')}</DialogTitle>
                        <DialogDescription>
                            {effectiveJob
                                ? t('employer.candidates.bulk_dialog_desc_job', { count: selectedIds.length, title: effectiveJob.title })
                                : t('employer.candidates.bulk_dialog_desc_generic')}
                        </DialogDescription>
                    </DialogHeader>

                    <form className="space-y-5" onSubmit={submitBulk}>
                        <div className="rounded-2xl border border-primary-200 bg-primary-50/70 p-5">
                            <p className="text-xs font-bold tracking-[0.3em] text-primary-600 uppercase">
                                {t('employer.candidates.bulk_selected_label')}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {selectedApplicants.map((app) => (
                                    <Badge
                                        key={app.id}
                                        className="bg-white text-primary-700 hover:bg-white"
                                    >
                                        {app.candidate.name}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <FieldGroup
                                label={t('employer.candidates.bulk_mode_label')}
                                error={bulkForm.errors.interview_mode}
                                required
                            >
                                <select
                                    value={bulkForm.data.interview_mode}
                                    onChange={(e) =>
                                        bulkForm.setData(
                                            'interview_mode',
                                            e.target.value as 'voice' | 'text',
                                        )
                                    }
                                    className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                >
                                    <option value="voice">{t('employer.candidates.bulk_mode_voice')}</option>
                                    <option value="text">{t('employer.candidates.bulk_mode_text')}</option>
                                </select>
                            </FieldGroup>
                            <FieldGroup
                                label={t('employer.candidates.bulk_schedule_label')}
                                error={bulkForm.errors.scheduled_at}
                                required
                            >
                                <Input
                                    type="datetime-local"
                                    value={bulkForm.data.scheduled_at}
                                    onChange={(e) =>
                                        bulkForm.setData(
                                            'scheduled_at',
                                            e.target.value,
                                        )
                                    }
                                />
                            </FieldGroup>
                            <FieldGroup
                                label={t('employer.candidates.bulk_duration_label')}
                                error={bulkForm.errors.duration_minutes}
                                required
                            >
                                <select
                                    value={bulkForm.data.duration_minutes}
                                    onChange={(e) =>
                                        bulkForm.setData(
                                            'duration_minutes',
                                            Number(e.target.value),
                                        )
                                    }
                                    className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                >
                                    {[15, 30, 45, 60].map((d) => (
                                        <option key={d} value={d}>
                                            {t('employer.candidates.duration_minutes_option', { count: d })}
                                        </option>
                                    ))}
                                </select>
                            </FieldGroup>
                            <FieldGroup
                                label={t('employer.candidates.bulk_voice_label')}
                                error={bulkForm.errors.voice}
                                required={
                                    bulkForm.data.interview_mode === 'voice'
                                }
                            >
                                <select
                                    value={bulkForm.data.voice}
                                    disabled={
                                        bulkForm.data.interview_mode === 'text'
                                    }
                                    onChange={(e) =>
                                        bulkForm.setData(
                                            'voice',
                                            e.target.value,
                                        )
                                    }
                                    className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {[
                                        'marin',
                                        'cedar',
                                        'alloy',
                                        'coral',
                                        'sage',
                                        'verse',
                                    ].map((v) => (
                                        <option key={v} value={v}>
                                            {v}
                                        </option>
                                    ))}
                                </select>
                            </FieldGroup>
                        </div>

                        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                            {t('employer.candidates.bulk_notice')}
                        </p>

                        <div className="space-y-3">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="font-medium">
                                        {t('employer.candidates.bulk_questions_title')}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {t('employer.candidates.bulk_questions_desc')}
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        bulkForm.setData('questions', [
                                            ...bulkForm.data.questions,
                                            emptyQuestion(),
                                        ])
                                    }
                                >
                                    <Plus className="size-4" />
                                    {t('employer.candidates.bulk_add')}
                                </Button>
                            </div>

                            {bulkForm.data.questions.map((q, idx) => (
                                <div
                                    key={idx}
                                    className="space-y-3 rounded-lg border p-4"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm font-semibold">
                                            {t('employer.candidates.bulk_question_label', { number: idx + 1 })}
                                        </p>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            disabled={
                                                bulkForm.data.questions
                                                    .length === 1
                                            }
                                            onClick={() =>
                                                bulkForm.setData(
                                                    'questions',
                                                    bulkForm.data.questions.filter(
                                                        (_, i) => i !== idx,
                                                    ),
                                                )
                                            }
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </div>
                                    <FieldGroup
                                        label={t('employer.candidates.bulk_question_field')}
                                        error={
                                            (
                                                bulkForm.errors as Record<
                                                    string,
                                                    string
                                                >
                                            )[`questions.${idx}.question`]
                                        }
                                        required
                                    >
                                        <Textarea
                                            value={q.question}
                                            onChange={(e) =>
                                                updateBulkQuestion(
                                                    idx,
                                                    'question',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </FieldGroup>
                                    <div className="grid gap-3 md:grid-cols-[1fr_120px_160px]">
                                        <FieldGroup label={t('employer.candidates.bulk_category')}>
                                            <select
                                                value={q.category}
                                                onChange={(e) =>
                                                    updateBulkQuestion(
                                                        idx,
                                                        'category',
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                            >
                                                {QUESTION_CATEGORY_OPTIONS.map(
                                                    (opt) => (
                                                        <option
                                                            key={opt.value}
                                                            value={opt.value}
                                                        >
                                                            {opt.label}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                        </FieldGroup>
                                        <FieldGroup label={t('employer.candidates.bulk_weight')}>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={100}
                                                value={q.weight}
                                                onChange={(e) =>
                                                    updateBulkQuestion(
                                                        idx,
                                                        'weight',
                                                        Number(e.target.value),
                                                    )
                                                }
                                            />
                                        </FieldGroup>
                                        <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={q.allow_ai_followup}
                                                onChange={(e) =>
                                                    updateBulkQuestion(
                                                        idx,
                                                        'allow_ai_followup',
                                                        e.target.checked,
                                                    )
                                                }
                                            />
                                            {t('employer.candidates.bulk_ai_followup')}
                                        </label>
                                    </div>
                                    <FieldGroup label={t('employer.candidates.bulk_rubric')}>
                                        <Textarea
                                            value={q.rubric}
                                            className="min-h-20"
                                            onChange={(e) =>
                                                updateBulkQuestion(
                                                    idx,
                                                    'rubric',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </FieldGroup>
                                </div>
                            ))}
                        </div>

                        <DialogFooter className="gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setBulkOpen(false)}
                            >
                                {t('employer.candidates.bulk_cancel')}
                            </Button>
                            <Button disabled={bulkForm.processing}>
                                {bulkForm.processing
                                    ? t('employer.candidates.bulk_sending')
                                    : t('employer.candidates.bulk_send', { count: selectedIds.length })}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={whatsappTarget !== null}
                onOpenChange={(open) => !open && closeWhatsappDialog()}
            >
                <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{t('employer.candidates.whatsapp_title')}</DialogTitle>
                        <DialogDescription>
                            {whatsappTarget
                                ? t('employer.candidates.whatsapp_desc_candidate', { name: whatsappTarget.candidate.name, title: whatsappTarget.job.title })
                                : t('employer.candidates.whatsapp_desc_generic')}
                        </DialogDescription>
                    </DialogHeader>

                    {whatsappTarget ? (
                        <div className="space-y-4">
                            <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                                <span className="text-muted-foreground">
                                    {t('employer.candidates.whatsapp_number_label')}
                                </span>
                                <span className="font-medium">
                                    {whatsappTarget.candidate.phone ??
                                        t('employer.candidates.whatsapp_not_registered')}
                                </span>
                            </div>

                            {whatsapp_gateway.configured &&
                            whatsapp_gateway.has_session ? (
                                <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800">
                                    {t('employer.candidates.whatsapp_gateway_active')}
                                </p>
                            ) : (
                                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                    {t('employer.candidates.whatsapp_gateway_inactive')}{' '}
                                    <a
                                        href="/employer/whatsapp"
                                        className="font-medium underline"
                                    >
                                        {t('employer.candidates.whatsapp_connect_link')}
                                    </a>
                                </p>
                            )}

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-muted-foreground">
                                    {t('employer.candidates.whatsapp_template_label')}
                                </Label>
                                <div className="flex flex-wrap gap-2">
                                    {WHATSAPP_TEMPLATES.map((template) => (
                                        <Button
                                            key={template.key}
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                applyWhatsappTemplate(
                                                    template.key,
                                                )
                                            }
                                        >
                                            {template.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-muted-foreground">
                                    {t('employer.candidates.whatsapp_message_label')}
                                </Label>
                                <Textarea
                                    rows={10}
                                    value={whatsappMessage}
                                    onChange={(e) =>
                                        setWhatsappMessage(e.target.value)
                                    }
                                    placeholder={t('employer.candidates.whatsapp_placeholder')}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {t('employer.candidates.whatsapp_char_count', { count: whatsappMessage.length })}
                                </p>
                            </div>
                        </div>
                    ) : null}

                    <DialogFooter className="gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={closeWhatsappDialog}
                        >
                            {t('employer.candidates.bulk_cancel')}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={
                                !whatsappTarget?.candidate.whatsapp_phone ||
                                whatsappMessage.trim() === '' ||
                                sendingWhatsapp
                            }
                            onClick={sendWhatsappViaWebFallback}
                        >
                            <MessageCircle className="size-4" />
                            {t('employer.candidates.whatsapp_open_personal')}
                        </Button>
                        <Button
                            type="button"
                            className="bg-[#25D366] text-white hover:bg-[#1ea952]"
                            disabled={
                                !whatsappTarget?.candidate.whatsapp_phone ||
                                whatsappMessage.trim() === '' ||
                                !whatsapp_gateway.configured ||
                                !whatsapp_gateway.has_session ||
                                sendingWhatsapp
                            }
                            onClick={sendWhatsappViaGateway}
                        >
                            {sendingWhatsapp ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <MessageCircle className="size-4" />
                            )}
                            {t('employer.candidates.whatsapp_send_gateway')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={interviewTarget !== null}
                onOpenChange={(open) => !open && closeInterviewDialog()}
            >
                <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{t('employer.candidates.interview_dialog_title')}</DialogTitle>
                        <DialogDescription>
                            {interviewTarget
                                ? t('employer.candidates.interview_desc_candidate', { name: interviewTarget.candidate.name, title: interviewTarget.job.title })
                                : t('employer.candidates.interview_desc_generic')}
                        </DialogDescription>
                    </DialogHeader>

                    <form className="space-y-5" onSubmit={submitInterview}>
                        <div className="space-y-2">
                            <Label>{t('employer.candidates.interview_mode_label')}</Label>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <label
                                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 ${interviewForm.data.mode === 'online' ? 'border-primary-500 bg-primary-50/50' : 'border-border'}`}
                                >
                                    <input
                                        type="radio"
                                        name="mode"
                                        value="online"
                                        checked={
                                            interviewForm.data.mode === 'online'
                                        }
                                        onChange={() =>
                                            interviewForm.setData(
                                                'mode',
                                                'online',
                                            )
                                        }
                                        className="mt-1"
                                    />
                                    <div>
                                        <p className="font-medium">{t('employer.candidates.interview_mode_online')}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {t('employer.candidates.interview_mode_online_desc')}
                                        </p>
                                    </div>
                                </label>
                                <label
                                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 ${interviewForm.data.mode === 'onsite' ? 'border-primary-500 bg-primary-50/50' : 'border-border'}`}
                                >
                                    <input
                                        type="radio"
                                        name="mode"
                                        value="onsite"
                                        checked={
                                            interviewForm.data.mode === 'onsite'
                                        }
                                        onChange={() =>
                                            interviewForm.setData(
                                                'mode',
                                                'onsite',
                                            )
                                        }
                                        className="mt-1"
                                    />
                                    <div>
                                        <p className="font-medium">{t('employer.candidates.interview_mode_onsite')}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {t('employer.candidates.interview_mode_onsite_desc')}
                                        </p>
                                    </div>
                                </label>
                            </div>
                            <InputError message={interviewForm.errors.mode} />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <FieldGroup
                                label={t('employer.candidates.interview_datetime_label')}
                                required
                                error={interviewForm.errors.scheduled_at}
                            >
                                <Input
                                    type="datetime-local"
                                    value={interviewForm.data.scheduled_at}
                                    onChange={(e) =>
                                        interviewForm.setData(
                                            'scheduled_at',
                                            e.target.value,
                                        )
                                    }
                                />
                            </FieldGroup>
                            <FieldGroup
                                label={t('employer.candidates.interview_duration_label')}
                                required
                                error={interviewForm.errors.duration_minutes}
                            >
                                <select
                                    value={interviewForm.data.duration_minutes}
                                    onChange={(e) =>
                                        interviewForm.setData(
                                            'duration_minutes',
                                            Number(e.target.value),
                                        )
                                    }
                                    className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                >
                                    {[15, 30, 45, 60, 90, 120].map((d) => (
                                        <option key={d} value={d}>
                                            {t('employer.candidates.duration_minutes_option', { count: d })}
                                        </option>
                                    ))}
                                </select>
                            </FieldGroup>
                        </div>

                        {interviewForm.data.mode === 'online' ? (
                            <FieldGroup
                                label={t('employer.candidates.interview_meeting_url_label')}
                                required
                                error={interviewForm.errors.meeting_url}
                            >
                                <div className="flex gap-2">
                                    <Input
                                        type="url"
                                        placeholder="https://meet.google.com/..."
                                        value={interviewForm.data.meeting_url}
                                        onChange={(e) =>
                                            interviewForm.setData(
                                                'meeting_url',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    {google_calendar.connected ? (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={generatingMeet}
                                            onClick={generateMeetLink}
                                            className="shrink-0"
                                        >
                                            {generatingMeet ? (
                                                <Loader2 className="size-4 animate-spin" />
                                            ) : (
                                                <Video className="size-4" />
                                            )}
                                            Auto-generate Meet
                                        </Button>
                                    ) : (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            asChild
                                            className="shrink-0"
                                        >
                                            <a href="/employer/google-calendar/connect">
                                                <Video className="size-4" />
                                                {t('employer.candidates.row_connect_calendar')}
                                            </a>
                                        </Button>
                                    )}
                                </div>
                                {google_calendar.connected ? (
                                    <p className="text-xs text-muted-foreground">
                                        {t('employer.candidates.row_google_calendar_connected', { email: google_calendar.email ?? '' })}
                                    </p>
                                ) : null}
                            </FieldGroup>
                        ) : (
                            <FieldGroup
                                label={t('employer.candidates.interview_address_label')}
                                required
                                error={interviewForm.errors.address}
                            >
                                <Textarea
                                    rows={2}
                                    placeholder={t('employer.candidates.row_address_placeholder')}
                                    value={interviewForm.data.address}
                                    onChange={(e) =>
                                        interviewForm.setData(
                                            'address',
                                            e.target.value,
                                        )
                                    }
                                />
                            </FieldGroup>
                        )}

                        <FieldGroup
                            label={t('employer.candidates.interview_notes_label')}
                            error={interviewForm.errors.notes}
                        >
                            <Textarea
                                rows={3}
                                placeholder={t('employer.candidates.row_notes_placeholder')}
                                value={interviewForm.data.notes}
                                onChange={(e) =>
                                    interviewForm.setData(
                                        'notes',
                                        e.target.value,
                                    )
                                }
                            />
                        </FieldGroup>

                        <DialogFooter className="gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={closeInterviewDialog}
                            >
                                {t('employer.candidates.bulk_cancel')}
                            </Button>
                            <Button disabled={interviewForm.processing}>
                                {interviewForm.processing
                                    ? t('employer.candidates.interview_submitting')
                                    : t('employer.candidates.interview_submit')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

function FieldGroup({
    label,
    error,
    required,
    children,
}: {
    label: string;
    error?: string;
    required?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">
                {label}
                {required ? <span className="text-red-500"> *</span> : null}
            </Label>
            {children}
            {error ? <InputError message={error} /> : null}
        </div>
    );
}

type WhatsappTemplateKey = 'intro' | 'interview' | 'followup';

// WHATSAPP_TEMPLATES is constructed inside the component using t()

function buildWhatsappTemplate(
    template: WhatsappTemplateKey,
    application: CandidateApplication,
    companyName: string,
    t: (key: string, replacements?: Record<string, string | number>) => string,
): string {
    const name = application.candidate.name;
    const position = application.job.title;
    const params = { name, position, company: companyName };

    switch (template) {
        case 'interview':
            return t('employer.candidates.whatsapp_interview_template', params);
        case 'followup':
            return t('employer.candidates.whatsapp_followup_template', params);
        case 'intro':
        default:
            return t('employer.candidates.whatsapp_intro_template', params);
    }
}

function getXsrfToken(): string {
    const raw = document.cookie
        .split('; ')
        .find((row) => row.startsWith('XSRF-TOKEN='))
        ?.split('=')[1];
    return raw ? decodeURIComponent(raw) : '';
}

function emptyQuestion(): InterviewQuestionForm {
    return {
        question: '',
        category: 'technical',
        rubric: '',
        weight: 20,
        allow_ai_followup: true,
    };
}

function defaultDateTimeLocal(): string {
    const now = new Date(Date.now() + 60 * 60 * 1000);
    const offsetMinutes = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offsetMinutes * 60 * 1000);
    return local.toISOString().slice(0, 16);
}

function CandidateRow({
    application,
    selected,
    onToggle,
    selectionDisabled,
    onScheduleInterview,
    onWhatsapp,
}: {
    application: CandidateApplication;
    selected: boolean;
    onToggle: () => void;
    selectionDisabled: boolean;
    onScheduleInterview: () => void;
    onWhatsapp: () => void;
}) {
    const { t } = useTranslate();
    const fitScore = application.ai_fit_score ?? 0;
    const aiSession = application.latest_ai_session;
    const hasActiveInterview =
        application.interview?.status === 'scheduled' ||
        application.interview?.status === 'rescheduled';

    return (
        <article
            className={cn(
                'rounded-lg border bg-white p-5 shadow-sm transition-colors',
                selected ? 'border-primary-400 ring-1 ring-primary-200' : '',
            )}
        >
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                        <div className="flex items-start gap-3">
                            <Checkbox
                                checked={selected}
                                disabled={selectionDisabled}
                                onCheckedChange={onToggle}
                                aria-label={t('employer.candidates.row_select_label', { name: application.candidate.name })}
                                className="mt-1"
                            />
                            <Avatar
                                name={application.candidate.name}
                                src={application.candidate.avatar_url}
                            />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-lg font-semibold text-foreground">
                                    {application.candidate.name}
                                </h2>
                                <StatusBadge
                                    status={application.status}
                                    label={application.status_label}
                                />
                                {aiSession ? (
                                    <Badge
                                        variant="outline"
                                        className="gap-1 border-violet-200 bg-violet-50 text-violet-700"
                                    >
                                        <Bot className="size-3" />
                                        AI:{' '}
                                        {AI_INTERVIEW_STATUS_LABELS[
                                            aiSession.status
                                        ] ?? aiSession.status}
                                    </Badge>
                                ) : null}
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {application.candidate.headline ||
                                    application.candidate.preferred_role ||
                                    t('employer.candidates.row_default_headline')}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                <span>
                                    {application.candidate.location || '-'}
                                </span>
                                <span>•</span>
                                <span>
                                    {application.candidate.work_mode_pref}
                                </span>
                                <span>•</span>
                                <span>
                                    {t('employer.candidates.row_available')}{' '}
                                    {application.candidate.availability}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        {application.candidate.skills.length > 0 ? (
                            application.candidate.skills.map((skill) => (
                                <Badge
                                    key={skill}
                                    variant="outline"
                                    className="bg-[#f8fafc]"
                                >
                                    {skill}
                                </Badge>
                            ))
                        ) : (
                            <span className="text-sm text-muted-foreground">
                                {t('employer.candidates.row_skills_empty')}
                            </span>
                        )}
                    </div>

                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                        {application.cover_letter ||
                            t('employer.candidates.row_no_cover_letter')}
                    </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:w-[420px] xl:grid-cols-1">
                    <InfoBlock
                        icon={BriefcaseBusiness}
                        label={t('employer.candidates.row_job_label')}
                        value={application.job.title}
                        helper={t('employer.candidates.row_applied_at', { date: application.applied_at })}
                    />
                    <div className="rounded-lg border p-4">
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground uppercase">
                                AI fit score
                            </span>
                            <span className="text-sm font-semibold">
                                {fitScore}%
                            </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-[#e5e7eb]">
                            <div
                                className={scoreBarClass(fitScore)}
                                style={{
                                    width: `${Math.min(Math.max(fitScore, 0), 100)}%`,
                                }}
                            />
                        </div>
                        <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                            <p>
                                Match:{' '}
                                {application.ai_skill_match.matched.length > 0
                                    ? application.ai_skill_match.matched.join(
                                          ', ',
                                      )
                                    : '-'}
                            </p>
                            <p>
                                Gap:{' '}
                                {application.ai_skill_match.missing.length > 0
                                    ? application.ai_skill_match.missing.join(
                                          ', ',
                                      )
                                    : '-'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-5 grid gap-3 border-t pt-4 md:grid-cols-2 xl:grid-cols-4">
                <SmallDetail
                    label={t('employer.candidates.row_salary')}
                    value={application.candidate.expected_salary}
                />
                <SmallDetail
                    label={t('employer.candidates.row_profile')}
                    value={t('employer.candidates.row_profile_complete', { percent: application.candidate.profile_completion })}
                />
                <SmallDetail
                    label={t('employer.candidates.row_interview')}
                    value={
                        application.interview
                            ? `${application.interview.mode}, ${application.interview.scheduled_at ?? '-'}`
                            : t('employer.candidates.row_interview_count', { count: application.interviews_count })
                    }
                />
                <SmallDetail
                    label={t('employer.candidates.row_last_update')}
                    value={application.latest_history?.created_at ?? '-'}
                />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                    <Button
                        size="sm"
                        asChild
                        className="bg-[#01296A] text-white hover:bg-[#001D4D]"
                    >
                        <Link href={showCandidate(application.id).url}>
                            <UserRound className="size-4" />
                            {t('employer.candidates.row_view_profile')}
                        </Link>
                    </Button>
                    {application.candidate.email ? (
                        <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                        >
                            <a href={`mailto:${application.candidate.email}`}>
                                <Mail className="size-4" />
                                Email
                            </a>
                        </Button>
                    ) : null}
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={!application.candidate.whatsapp_phone}
                        title={
                            application.candidate.whatsapp_phone
                                ? undefined
                                : t('employer.candidates.row_whatsapp_no_number')
                        }
                        onClick={onWhatsapp}
                        className="border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 disabled:border-input disabled:bg-transparent disabled:text-muted-foreground"
                    >
                        <MessageCircle className="size-4" />
                        WhatsApp
                    </Button>
                    {application.cv ? (
                        <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                        >
                            <a
                                href={application.cv.file_url}
                                target="_blank"
                                rel="noreferrer"
                            >
                                Lihat CV
                            </a>
                        </Button>
                    ) : null}
                    {aiSession ? (
                        <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 hover:text-violet-800"
                        >
                            <Link href={showAiInterview(aiSession.id).url}>
                                <Bot className="size-4" />
                                {t('employer.candidates.row_ai_interview_result')}
                                {aiSession.fit_score != null
                                    ? ` (${aiSession.fit_score}%)`
                                    : ''}
                            </Link>
                        </Button>
                    ) : null}
                    {hasActiveInterview ? (
                        <Button
                            size="sm"
                            variant="outline"
                            disabled
                            className="border-emerald-200 bg-emerald-50 text-emerald-700 disabled:opacity-100"
                        >
                            <CalendarClock className="size-4" />
                            {t('employer.candidates.row_interview_scheduled')}
                            {application.interview?.scheduled_at
                                ? ` · ${application.interview.scheduled_at}`
                                : ''}
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            className="bg-primary-500 text-white hover:bg-primary-600"
                            onClick={onScheduleInterview}
                        >
                            <CalendarClock className="size-4" />
                            {t('employer.candidates.row_schedule_interview')}
                        </Button>
                    )}
                </div>
                {application.first_responded_at ? (
                    <p className="text-xs text-muted-foreground">
                        {t('employer.candidates.row_first_response', { date: application.first_responded_at })}
                    </p>
                ) : (
                    <p className="text-xs font-medium text-primary-700">
                        {t('employer.candidates.row_no_response')}
                    </p>
                )}
            </div>
        </article>
    );
}

function MetricCard({
    label,
    value,
    icon: Icon,
    tone,
}: {
    label: string;
    value: number | string;
    icon: typeof Users;
    tone: 'blue' | 'green' | 'orange' | 'slate';
}) {
    const tones = {
        blue: 'bg-[#eff6ff] text-[#2563eb]',
        green: 'bg-[#ecfdf5] text-[#059669]',
        orange: 'bg-primary-50 text-primary-700',
        slate: 'bg-[#f8fafc] text-[#475569]',
    };

    return (
        <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div
                className={`mb-4 flex size-10 items-center justify-center rounded-lg ${tones[tone]}`}
            >
                <Icon className="size-5" />
            </div>
            <p className="text-2xl font-semibold">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
        </div>
    );
}

function Avatar({ name, src }: { name: string; src: string | null }) {
    if (src) {
        return (
            <img
                src={src}
                alt={name}
                className="size-12 rounded-lg object-cover"
            />
        );
    }

    return (
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[#111827] text-sm font-semibold text-white">
            {name
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
        </div>
    );
}

function InfoBlock({
    icon: Icon,
    label,
    value,
    helper,
}: {
    icon: typeof BriefcaseBusiness;
    label: string;
    value: string;
    helper: string;
}) {
    return (
        <div className="rounded-lg border p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase">
                <Icon className="size-4" />
                {label}
            </div>
            <p className="font-semibold">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
        </div>
    );
}

function SmallDetail({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs font-medium text-muted-foreground uppercase">
                {label}
            </p>
            <p className="mt-1 text-sm font-medium">{value || '-'}</p>
        </div>
    );
}

function StatusBadge({ status, label }: { status: string; label: string }) {
    const className =
        status === 'hired' || status === 'offer'
            ? 'bg-[#ecfdf5] text-[#047857] border-transparent'
            : status === 'interview' || status === 'shortlisted'
              ? 'bg-[#eff6ff] text-[#1d4ed8] border-transparent'
              : status === 'rejected' || status === 'withdrawn'
                ? 'bg-[#fef2f2] text-[#b91c1c] border-transparent'
                : 'bg-[#f8fafc] text-[#475569]';

    return (
        <Badge variant="outline" className={className}>
            {label}
        </Badge>
    );
}

function scoreBarClass(score: number) {
    const color =
        score >= 80
            ? 'bg-[#10b981]'
            : score >= 60
              ? 'bg-[#3b82f6]'
              : 'bg-secondary-500';

    return `h-full rounded-full ${color}`;
}

EmployerCandidates.layout = {
    breadcrumbs: [
        {
            title: 'Candidates',
            href: index(),
        },
    ],
};
