import React from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useTranslate } from '@/hooks/use-translate';
import {
    Bot,
    BriefcaseBusiness,
    CalendarClock,
    CalendarPlus,
    CheckCircle2,
    ChevronDown,
    Mail,
    Mic,
    Plus,
    Search,
    Sparkles,
    Trash2,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { index, show } from '@/routes/employer/candidates';
import { store as storeInterview } from '@/routes/employer/applications/interviews';
import {
    store as storeAiInterview,
    storeBulk as storeBulkAiInterview,
    generateQuestions,
} from '@/routes/employer/jobs/ai-interviews';
import { update as updateStatus } from '@/routes/employer/applications/status';

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
        skill_score?: number | null;
        experience_score?: number | null;
        position_score?: number | null;
        seniority_score?: number | null;
        industry_score?: number | null;
        work_preference_score?: number | null;
    };
    cover_letter: string;
    candidate: {
        id: number | null;
        name: string;
        email: string | null;
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
};

type CandidatesPageProps = {
    company: {
        id: number;
        name: string;
    };
    filters: {
        search?: string;
        status?: string;
        job_id?: string;
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
};

export default function EmployerCandidates({
    company,
    filters,
    jobOptions,
    statusOptions,
    metrics,
    applications,
}: CandidatesPageProps) {
    const { t } = useTranslate();
    const [selectedApplicationIds, setSelectedApplicationIds] = useState<
        number[]
    >([]);
    const selectedApplications = applications.data.filter((application) =>
        selectedApplicationIds.includes(application.id),
    );
    const selectableApplications = applications.data.filter(
        (application) => application.job.id !== null,
    );
    const selectedJobIds = new Set(
        selectedApplications
            .map((application) => application.job.id)
            .filter((jobId): jobId is number => jobId !== null),
    );
    const canBulkSchedule =
        selectedApplications.length > 0 && selectedJobIds.size === 1;

    function toggleApplicationSelection(applicationId: number) {
        setSelectedApplicationIds((current) =>
            current.includes(applicationId)
                ? current.filter((id) => id !== applicationId)
                : [...current, applicationId],
        );
    }

    function toggleAllVisibleApplications() {
        const visibleIds = selectableApplications.map(
            (application) => application.id,
        );
        const allVisibleSelected =
            visibleIds.length > 0 &&
            visibleIds.every((id) => selectedApplicationIds.includes(id));

        setSelectedApplicationIds((current) =>
            allVisibleSelected
                ? current.filter((id) => !visibleIds.includes(id))
                : Array.from(new Set([...current, ...visibleIds])),
        );
    }

    function submitFilter(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);

        router.get(
            index(),
            {
                search: formData.get('search')?.toString() ?? '',
                status: formData.get('status')?.toString() ?? '',
                job_id: formData.get('job_id')?.toString() ?? '',
            },
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    }

    return (
        <>
            <Head title={t('employer.candidates.head_title')} />

            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title={t('employer.candidates.page_title')}
                    description={t('employer.candidates.page_desc', {
                        company: company.name,
                    })}
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
                        <CardTitle>
                            {t('employer.candidates.filter_title')}
                        </CardTitle>
                        <CardDescription>
                            {t('employer.candidates.filter_desc')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={submitFilter}
                            className="grid gap-3 lg:grid-cols-[1fr_220px_260px_auto]"
                        >
                            <div className="relative">
                                <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
                                <Input
                                    name="search"
                                    defaultValue={filters.search ?? ''}
                                    className="pl-9"
                                    placeholder={t(
                                        'employer.candidates.search_placeholder',
                                    )}
                                />
                            </div>
                            <select
                                name="status"
                                defaultValue={filters.status ?? ''}
                                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            >
                                <option value="">
                                    {t('employer.candidates.tab_all')}
                                </option>
                                {statusOptions.map((status) => (
                                    <option
                                        key={status.value}
                                        value={status.value}
                                    >
                                        {status.label}
                                    </option>
                                ))}
                            </select>
                            <select
                                name="job_id"
                                defaultValue={filters.job_id ?? ''}
                                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            >
                                <option value="">
                                    {t('employer.candidates.all_jobs')}
                                </option>
                                {jobOptions.map((job) => (
                                    <option key={job.value} value={job.value}>
                                        {job.label}
                                    </option>
                                ))}
                            </select>
                            <Button type="submit" variant="outline">
                                {t('employer.candidates.apply_filter')}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {applications.data.length > 0 ? (
                    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                        <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                            <input
                                type="checkbox"
                                checked={
                                    selectableApplications.length > 0 &&
                                    selectableApplications.every(
                                        (application) =>
                                            selectedApplicationIds.includes(
                                                application.id,
                                            ),
                                    )
                                }
                                onChange={toggleAllVisibleApplications}
                                className="size-4 rounded border-slate-300"
                            />
                            Pilih semua kandidat di halaman ini
                        </label>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <p className="text-sm text-muted-foreground">
                                {selectedApplications.length} kandidat terpilih
                                {selectedApplications.length > 0 &&
                                !canBulkSchedule
                                    ? ' · pilih kandidat dari lowongan yang sama untuk bulk interview'
                                    : ''}
                            </p>
                            <BulkAiInterviewDialog
                                applications={selectedApplications}
                                disabled={!canBulkSchedule}
                                onScheduled={() =>
                                    setSelectedApplicationIds([])
                                }
                            />
                        </div>
                    </div>
                ) : null}

                <div className="space-y-4">
                    {applications.data.length > 0 ? (
                        applications.data.map((application) => (
                            <CandidateRow
                                key={application.id}
                                application={application}
                                selected={selectedApplicationIds.includes(
                                    application.id,
                                )}
                                onToggleSelected={() =>
                                    toggleApplicationSelection(application.id)
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

                {applications.links.length > 0 ? (
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
                                        {cleanLabel(link.label)}
                                    </Link>
                                ) : (
                                    <span>{cleanLabel(link.label)}</span>
                                )}
                            </Button>
                        ))}
                    </div>
                ) : null}
            </div>
        </>
    );
}

function CandidateRow({
    application,
    selected,
    onToggleSelected,
}: {
    application: CandidateApplication;
    selected: boolean;
    onToggleSelected: () => void;
}) {
    const { t } = useTranslate();
    const fitScore = application.ai_fit_score ?? 0;
    const hasScoreBreakdown = [
        application.ai_skill_match.skill_score,
        application.ai_skill_match.experience_score,
        application.ai_skill_match.position_score,
        application.ai_skill_match.seniority_score,
        application.ai_skill_match.work_preference_score,
        application.ai_skill_match.industry_score,
    ].every((score) => typeof score === 'number');
    const scoreBreakdown = hasScoreBreakdown
        ? [
              {
                  label: 'Skill',
                  score: application.ai_skill_match.skill_score ?? 0,
              },
              {
                  label: 'Pengalaman',
                  score: application.ai_skill_match.experience_score ?? 0,
              },
              {
                  label: 'Posisi',
                  score: application.ai_skill_match.position_score ?? 0,
              },
              {
                  label: 'Senioritas',
                  score: application.ai_skill_match.seniority_score ?? 0,
              },
              {
                  label: 'Preferensi',
                  score: application.ai_skill_match.work_preference_score ?? 0,
              },
              {
                  label: 'Industri',
                  score: application.ai_skill_match.industry_score ?? 0,
              },
          ].filter((item) => item.score > 0)
        : [];

    return (
        <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="grid xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="min-w-0 p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 flex-1 gap-4">
                            <label className="mt-3 flex size-5 shrink-0 items-center justify-center">
                                <input
                                    type="checkbox"
                                    checked={selected}
                                    onChange={onToggleSelected}
                                    className="size-4 rounded border-slate-300"
                                    aria-label={`Pilih ${application.candidate.name}`}
                                />
                            </label>
                            <Avatar
                                name={application.candidate.name}
                                src={application.candidate.avatar_url}
                            />
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="min-w-0 text-lg leading-tight font-semibold text-foreground">
                                        {application.candidate.name}
                                    </h2>
                                    <StatusBadge
                                        status={application.status}
                                        label={application.status_label}
                                    />
                                </div>
                                <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">
                                    {application.candidate.headline ||
                                        application.candidate.preferred_role ||
                                        t(
                                            'employer.candidates.row_default_headline',
                                        )}
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <MetaPill
                                        value={
                                            application.candidate.location ||
                                            '-'
                                        }
                                    />
                                    <MetaPill
                                        value={
                                            application.candidate.work_mode_pref
                                        }
                                    />
                                    <MetaPill
                                        value={`${t('employer.candidates.row_available')} ${application.candidate.availability}`}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left sm:text-right">
                            <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                                AI Fit
                            </p>
                            <p
                                className={`text-lg leading-none font-bold ${fitScore >= 70 ? 'text-emerald-600' : fitScore >= 40 ? 'text-amber-600' : 'text-red-500'}`}
                            >
                                {fitScore}%
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                        {application.candidate.skills.length > 0 ? (
                            application.candidate.skills
                                .slice(0, 8)
                                .map((skill) => (
                                    <Badge
                                        key={skill}
                                        variant="outline"
                                        className="rounded-md border-slate-200 bg-slate-50 text-slate-700"
                                    >
                                        {skill}
                                    </Badge>
                                ))
                        ) : (
                            <span className="text-sm text-muted-foreground">
                                {t('employer.candidates.row_skills_empty')}
                            </span>
                        )}
                        {application.candidate.skills.length > 8 ? (
                            <Badge
                                variant="outline"
                                className="rounded-md border-slate-200 bg-white text-slate-500"
                            >
                                +{application.candidate.skills.length - 8}
                            </Badge>
                        ) : null}
                    </div>

                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">
                        {application.cover_letter ||
                            t('employer.candidates.row_no_cover_letter')}
                    </p>

                    <div className="mt-5 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 xl:grid-cols-4">
                        <SmallDetail
                            label={t('employer.candidates.row_salary')}
                            value={application.candidate.expected_salary}
                        />
                        <SmallDetail
                            label={t('employer.candidates.row_profile')}
                            value={t(
                                'employer.candidates.row_profile_complete',
                                {
                                    percent:
                                        application.candidate
                                            .profile_completion,
                                },
                            )}
                        />
                        <SmallDetail
                            label={t('employer.candidates.row_interview')}
                            value={
                                application.interview
                                    ? `${application.interview.mode}, ${application.interview.scheduled_at ?? '-'}`
                                    : t(
                                          'employer.candidates.row_interview_count',
                                          {
                                              count: application.interviews_count,
                                          },
                                      )
                            }
                        />
                        <SmallDetail
                            label={t('employer.candidates.row_last_update')}
                            value={
                                application.latest_history?.created_at ?? '-'
                            }
                        />
                    </div>
                </div>

                <aside className="border-t border-slate-200 bg-slate-50/80 p-5 xl:border-t-0 xl:border-l">
                    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                        <div className="mb-1 flex items-center gap-2 text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
                            <BriefcaseBusiness className="size-3.5" />
                            {t('employer.candidates.row_job_label')}
                        </div>
                        <p className="line-clamp-2 text-sm font-semibold text-slate-900">
                            {application.job.title}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {t('employer.candidates.row_applied_at', {
                                date: application.applied_at,
                            })}
                        </p>
                    </div>

                    <div className="mt-3 rounded-lg border border-slate-200 bg-white p-4 shadow-xs">
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
                                AI Fit Score
                            </span>
                            <span
                                className={`text-sm font-bold ${fitScore >= 70 ? 'text-emerald-600' : fitScore >= 40 ? 'text-amber-600' : 'text-red-500'}`}
                            >
                                {fitScore}%
                            </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                                className={scoreBarClass(fitScore)}
                                style={{
                                    width: `${Math.min(Math.max(fitScore, 0), 100)}%`,
                                }}
                            />
                        </div>

                        {scoreBreakdown.length > 0 ? (
                            <div className="mt-4 space-y-2.5">
                                {scoreBreakdown.map((item) => (
                                    <div
                                        key={item.label}
                                        className="grid grid-cols-[84px_minmax(0,1fr)_42px] items-center gap-2"
                                    >
                                        <span className="truncate text-[11px] text-muted-foreground">
                                            {item.label}
                                        </span>
                                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className={scoreBarClass(
                                                    item.score,
                                                )}
                                                style={{
                                                    width: `${Math.min(item.score, 100)}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="text-right text-[11px] font-medium text-muted-foreground">
                                            {item.score}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-3">
                                <p className="text-xs font-semibold text-slate-700">
                                    Detail komponen belum tersedia
                                </p>
                                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                    Skor total sudah dihitung. Rincian Skill,
                                    Pengalaman, Posisi, Senioritas, Preferensi,
                                    dan Industri akan muncul setelah analisis AI
                                    detail selesai.
                                </p>
                            </div>
                        )}
                    </div>

                    {application.ai_skill_match.matched.length > 0 ||
                    application.ai_skill_match.missing.length > 0 ? (
                        <SkillMatchSummary
                            matched={application.ai_skill_match.matched}
                            missing={application.ai_skill_match.missing}
                        />
                    ) : null}
                </aside>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-200 text-slate-700 hover:bg-slate-50"
                        asChild
                    >
                        <Link href={show(application.id)}>
                            {t('employer.candidates.row_view_profile')}
                        </Link>
                    </Button>
                    {application.candidate.email ? (
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-sky-200 text-sky-700 hover:bg-sky-50"
                            asChild
                        >
                            <a href={`mailto:${application.candidate.email}`}>
                                <Mail className="size-4" />
                                {t('employer.candidates.row_email')}
                            </a>
                        </Button>
                    ) : null}
                    {application.cv ? (
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-teal-200 text-teal-700 hover:bg-teal-50"
                            asChild
                        >
                            <a
                                href={application.cv.file_url}
                                target="_blank"
                                rel="noreferrer"
                            >
                                {t('employer.candidates.row_view_cv')}
                            </a>
                        </Button>
                    ) : null}
                    <StatusUpdateButton application={application} t={t} />
                    <ScheduleDialog application={application} t={t} />
                </div>

                {application.first_responded_at ? (
                    <p className="text-xs text-muted-foreground">
                        {t('employer.candidates.row_first_response', {
                            date: application.first_responded_at,
                        })}
                    </p>
                ) : (
                    <p className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                        {t('employer.candidates.row_no_response')}
                    </p>
                )}
            </div>
        </article>
    );
}

function MetaPill({ value }: { value: string }) {
    return (
        <span className="inline-flex max-w-full items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
            <span className="truncate">{value || '-'}</span>
        </span>
    );
}

function SkillMatchSummary({
    matched,
    missing,
}: {
    matched: string[];
    missing: string[];
}) {
    if (matched.length === 0 && missing.length === 0) {
        return null;
    }

    return (
        <div className="mt-3 space-y-2 rounded-lg border border-slate-200 bg-white p-3">
            {matched.length > 0 ? (
                <div>
                    <p className="text-[10px] font-bold tracking-wide text-emerald-700 uppercase">
                        Skill Dimiliki
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-emerald-700">
                        {matched.join(', ')}
                    </p>
                </div>
            ) : null}
            {missing.length > 0 ? (
                <div>
                    <p className="text-[10px] font-bold tracking-wide text-rose-600 uppercase">
                        Skill Belum Dimiliki
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-rose-600">
                        {missing.join(', ')}
                    </p>
                </div>
            ) : null}
        </div>
    );
}

const STATUS_OPTIONS = [
    { value: 'screened', label: 'Diseleksi', color: 'text-blue-600' },
    { value: 'shortlisted', label: 'Diprioritaskan', color: 'text-indigo-600' },
    { value: 'interview', label: 'Interview', color: 'text-amber-600' },
    { value: 'offer', label: 'Penawaran', color: 'text-violet-600' },
    { value: 'hired', label: 'Diterima', color: 'text-emerald-600' },
    { value: 'rejected', label: 'Ditolak', color: 'text-red-600' },
] as const;

function StatusUpdateButton({
    application,
}: {
    application: CandidateApplication;
    t: (key: string, replacements?: Record<string, string | number>) => string;
}) {
    const [pending, setPending] = useState<
        (typeof STATUS_OPTIONS)[number] | null
    >(null);
    const [note, setNote] = useState('');
    const [processing, setProcessing] = useState(false);

    function openConfirm(opt: (typeof STATUS_OPTIONS)[number]) {
        setPending(opt);
        setNote('');
    }

    function submit() {
        if (!pending) return;
        setProcessing(true);
        router.patch(
            updateStatus(application.id).url,
            { status: pending.value, note: note.trim() || undefined },
            {
                preserveScroll: true,
                onFinish: () => {
                    setProcessing(false);
                    setPending(null);
                },
            },
        );
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-amber-200 text-amber-700 hover:bg-amber-50"
                        disabled={processing}
                    >
                        <ChevronDown className="size-4" />
                        Update Status
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44">
                    {STATUS_OPTIONS.map((opt, i) => (
                        <React.Fragment key={opt.value}>
                            {i === STATUS_OPTIONS.length - 1 && (
                                <DropdownMenuSeparator />
                            )}
                            <DropdownMenuItem
                                disabled={application.status === opt.value}
                                onClick={() => openConfirm(opt)}
                                className={opt.color}
                            >
                                {opt.label}
                                {application.status === opt.value && (
                                    <span className="ml-auto text-xs opacity-50">
                                        aktif
                                    </span>
                                )}
                            </DropdownMenuItem>
                        </React.Fragment>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog
                open={!!pending}
                onOpenChange={(open) => {
                    if (!open) setPending(null);
                }}
            >
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Update Status</DialogTitle>
                        <DialogDescription>
                            <span className={pending?.color ?? ''}>
                                {application.candidate.name}
                            </span>
                            {' → '}
                            <span
                                className={`font-semibold ${pending?.color ?? ''}`}
                            >
                                {pending?.label}
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-1.5">
                        <Label htmlFor={`note_${application.id}`}>
                            Catatan (opsional)
                        </Label>
                        <textarea
                            id={`note_${application.id}`}
                            rows={3}
                            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground"
                            placeholder="Alasan perubahan status, feedback, dll."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 pt-1">
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => setPending(null)}
                        >
                            Batal
                        </Button>
                        <Button
                            size="sm"
                            className="flex-1 bg-[#0F4C94] hover:bg-[#093579]"
                            disabled={processing}
                            onClick={submit}
                        >
                            {processing ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

type AiQuestion = {
    question: string;
    category: string;
    rubric: string;
    weight: number;
    allow_ai_followup: boolean;
    question_type: 'open' | 'multiple_choice';
    options: string[];
};

const DEFAULT_AI_QUESTIONS: AiQuestion[] = [
    {
        question: 'Ceritakan pengalaman paling relevan Anda untuk posisi ini.',
        category: 'behavioral',
        rubric: 'Cari contoh konkret, konteks masalah, aksi, dan dampaknya.',
        weight: 25,
        allow_ai_followup: true,
        question_type: 'open',
        options: [],
    },
    {
        question:
            'Bagaimana Anda menyelesaikan masalah teknis paling sulit di pekerjaan sebelumnya?',
        category: 'technical',
        rubric: 'Nilai kedalaman teknis, cara berpikir, trade-off, dan ownership.',
        weight: 25,
        allow_ai_followup: true,
        question_type: 'open',
        options: [],
    },
    {
        question:
            'Apa pendekatan Anda saat harus bekerja dengan deadline ketat dan kebutuhan berubah?',
        category: 'problem_solving',
        rubric: 'Nilai prioritas, komunikasi, adaptasi, dan manajemen risiko.',
        weight: 25,
        allow_ai_followup: false,
        question_type: 'open',
        options: [],
    },
    {
        question: 'Mengapa Anda tertarik dengan posisi dan perusahaan ini?',
        category: 'motivation',
        rubric: 'Cari kecocokan nilai, motivasi riil, dan rencana jangka panjang.',
        weight: 25,
        allow_ai_followup: false,
        question_type: 'open',
        options: [],
    },
];

type InterviewType = 'online' | 'onsite' | 'ai';

function BulkAiInterviewDialog({
    applications,
    disabled,
    onScheduled,
}: {
    applications: CandidateApplication[];
    disabled: boolean;
    onScheduled: () => void;
}) {
    const [open, setOpen] = useState(false);
    const jobId = applications[0]?.job.id;
    const jobTitle = applications[0]?.job.title ?? '-';
    const form = useForm({
        application_ids: applications.map((application) => application.id),
        interview_mode: 'voice' as 'voice' | 'text',
        scheduled_at: '',
        duration_minutes: 30,
        meeting_url: '',
        voice: 'marin',
        questions: DEFAULT_AI_QUESTIONS,
    });

    const [generatingQuestions, setGeneratingQuestions] = useState(false);

    async function generateAiQuestions() {
        if (!jobId) return;
        setGeneratingQuestions(true);
        try {
            const res = await fetch(generateQuestions(jobId).url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
                },
                body: JSON.stringify({ interview_mode: form.data.interview_mode }),
            });
            if (res.ok) {
                const data: { questions: AiQuestion[] } = await res.json();
                form.setData('questions', data.questions);
            }
        } finally {
            setGeneratingQuestions(false);
        }
    }

    function updateQuestion(
        index: number,
        field: keyof AiQuestion,
        value: string | number | boolean | string[],
    ) {
        form.setData(
            'questions',
            form.data.questions.map((question, questionIndex) =>
                questionIndex === index
                    ? { ...question, [field]: value }
                    : question,
            ),
        );
    }

    function addQuestion() {
        form.setData('questions', [
            ...form.data.questions,
            {
                question: '',
                category: 'custom',
                rubric: 'Nilai jawaban berdasarkan relevansi, contoh konkret, dan kejelasan komunikasi.',
                weight: 10,
                allow_ai_followup: true,
                question_type: 'open' as const,
                options: [],
            },
        ]);
    }

    function removeQuestion(index: number) {
        if (form.data.questions.length <= 1) return;

        form.setData(
            'questions',
            form.data.questions.filter(
                (_, questionIndex) => questionIndex !== index,
            ),
        );
    }

    function updateQuestionOptions(index: number, options: string[]) {
        form.setData(
            'questions',
            form.data.questions.map((q, i) =>
                i === index ? { ...q, options } : q,
            ),
        );
    }

    function submit(event: React.FormEvent) {
        event.preventDefault();

        if (!jobId) return;

        form.transform((data) => ({
            ...data,
            application_ids: applications.map((application) => application.id),
        }));

        form.post(storeBulkAiInterview(jobId).url, {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                setOpen(false);
                onScheduled();
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    type="button"
                    className="bg-violet-600 hover:bg-violet-700"
                    disabled={disabled}
                >
                    <CalendarPlus className="size-4" />
                    Jadwalkan AI Interview
                </Button>
            </DialogTrigger>
            <DialogContent className="top-4 right-4 bottom-4 left-4 h-auto w-auto max-w-none translate-x-0 translate-y-0 overflow-hidden p-0 sm:max-w-none">
                <form
                    onSubmit={submit}
                    className="flex h-full min-h-0 flex-col"
                >
                    <div className="border-b border-slate-200 px-6 py-5">
                        <DialogHeader>
                            <DialogTitle>
                                Jadwalkan AI Interview Serentak
                            </DialogTitle>
                            <DialogDescription>
                                {applications.length} kandidat · {jobTitle}
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                        <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
                            <div className="space-y-4 xl:sticky xl:top-0 xl:self-start">
                                <div className="rounded-lg border border-violet-200 bg-violet-50 p-4">
                                    <p className="text-sm font-semibold text-violet-800">
                                        Kandidat yang diundang
                                    </p>
                                    <div className="mt-3 max-h-56 space-y-2 overflow-y-auto">
                                        {applications.map((application) => (
                                            <div
                                                key={application.id}
                                                className="rounded-md bg-white px-3 py-2 text-sm text-slate-700"
                                            >
                                                <p className="font-medium">
                                                    {application.candidate.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {
                                                        application.candidate
                                                            .headline
                                                    }
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label>Mode AI</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(['voice', 'text'] as const).map(
                                            (mode) => (
                                                <button
                                                    key={mode}
                                                    type="button"
                                                    onClick={() =>
                                                        form.setData(
                                                            'interview_mode',
                                                            mode,
                                                        )
                                                    }
                                                    className={[
                                                        'flex flex-col gap-0.5 rounded-xl border-2 px-3 py-2.5 text-left text-sm transition-all focus:outline-none',
                                                        form.data
                                                            .interview_mode ===
                                                        mode
                                                            ? 'border-violet-500 bg-violet-50'
                                                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
                                                    ].join(' ')}
                                                >
                                                    <p className={['flex items-center gap-1.5 font-semibold text-xs', form.data.interview_mode === mode ? 'text-violet-700' : 'text-slate-600'].join(' ')}>
                                                        {mode === 'voice' ? (
                                                            <Mic className="size-3.5" />
                                                        ) : (
                                                            <Bot className="size-3.5" />
                                                        )}
                                                        {mode === 'voice'
                                                            ? 'Voice AI'
                                                            : 'Text AI'}
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground">
                                                        {mode === 'voice'
                                                            ? 'Interview via suara'
                                                            : 'Interview via teks'}
                                                    </p>
                                                </button>
                                            ),
                                        )}
                                    </div>
                                </div>

                                {form.data.interview_mode === 'voice' && (
                                    <div className="space-y-1.5">
                                        <Label htmlFor="bulk_ai_voice">Suara AI</Label>
                                        <select
                                            id="bulk_ai_voice"
                                            value={form.data.voice}
                                            onChange={(event) =>
                                                form.setData('voice', event.target.value)
                                            }
                                            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                        >
                                            {['alloy', 'ash', 'ballad', 'coral', 'echo', 'marin', 'sage', 'shimmer', 'verse', 'cedar'].map((v) => (
                                                <option key={v} value={v}>
                                                    {v.charAt(0).toUpperCase() + v.slice(1)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <Label htmlFor="bulk_ai_sched">
                                        Tanggal & jam
                                    </Label>
                                    <Input
                                        id="bulk_ai_sched"
                                        type="datetime-local"
                                        value={form.data.scheduled_at}
                                        onChange={(event) =>
                                            form.setData(
                                                'scheduled_at',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    {form.errors.scheduled_at && (
                                        <p className="text-xs text-destructive">
                                            {form.errors.scheduled_at}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="bulk_ai_duration">
                                        Durasi
                                    </Label>
                                    <select
                                        id="bulk_ai_duration"
                                        value={form.data.duration_minutes}
                                        onChange={(event) =>
                                            form.setData(
                                                'duration_minutes',
                                                Number(event.target.value),
                                            )
                                        }
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                    >
                                        {[15, 30, 45, 60].map((duration) => (
                                            <option
                                                key={duration}
                                                value={duration}
                                            >
                                                {duration} menit
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <AiQuestionEditor
                                questions={form.data.questions}
                                errors={form.errors}
                                onAdd={addQuestion}
                                onRemove={removeQuestion}
                                onUpdate={updateQuestion}
                                onUpdateOptions={updateQuestionOptions}
                                onGenerate={generateAiQuestions}
                                generating={generatingQuestions}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 border-t border-slate-200 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-muted-foreground">
                            Semua kandidat terpilih akan menerima pertanyaan dan
                            jadwal yang sama.
                        </p>
                        <Button
                            type="submit"
                            disabled={form.processing || !jobId}
                            className="bg-violet-600 hover:bg-violet-700"
                        >
                            {form.processing
                                ? 'Menjadwalkan...'
                                : 'Kirim Undangan Serentak'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function AiQuestionEditor({
    questions,
    errors,
    onAdd,
    onRemove,
    onUpdate,
    onUpdateOptions,
    onGenerate,
    generating,
}: {
    questions: AiQuestion[];
    errors: Record<string, string | undefined>;
    onAdd: () => void;
    onRemove: (index: number) => void;
    onUpdate: (
        index: number,
        field: keyof AiQuestion,
        value: string | number | boolean | string[],
    ) => void;
    onUpdateOptions: (index: number, options: string[]) => void;
    onGenerate: () => void;
    generating: boolean;
}) {
    const [visibleCount, setVisibleCount] = useState(questions.length);
    const prevGenerating = React.useRef(generating);
    const timeouts = React.useRef<ReturnType<typeof setTimeout>[]>([]);

    const clearAllTimeouts = () => {
        timeouts.current.forEach(clearTimeout);
        timeouts.current = [];
    };

    React.useEffect(() => {
        if (prevGenerating.current && !generating) {
            clearAllTimeouts();
            setVisibleCount(0);
            questions.forEach((_, i) => {
                const id = setTimeout(() => setVisibleCount(i + 1), i * 120);
                timeouts.current.push(id);
            });
        } else if (!generating) {
            clearAllTimeouts();
            setVisibleCount(questions.length);
        }
        prevGenerating.current = generating;
    }, [generating, questions.length]);

    React.useEffect(() => () => clearAllTimeouts(), []);

    return (
        <div className="space-y-3">
            <div className="sticky top-0 z-10 -mx-1 rounded-lg bg-white/95 px-1 py-2 backdrop-blur-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <Label>{questions.length} pertanyaan</Label>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            Edit pertanyaan sebelum undangan dikirim.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onGenerate}
                            disabled={generating}
                            className="border-violet-200 text-violet-700 hover:bg-violet-50 disabled:opacity-70"
                        >
                            <Sparkles className={['size-3.5', generating ? 'animate-spin' : ''].join(' ')} />
                            {generating ? 'Generating...' : 'Generate dengan AI'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onAdd}
                            disabled={questions.length >= 12 || generating}
                        >
                            <Plus className="size-4" />
                            Tambah
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
                {generating ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className="animate-pulse rounded-lg border border-slate-200 bg-white p-4 shadow-xs"
                        >
                            <div className="mb-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="size-6 rounded-full bg-violet-100" />
                                    <div className="h-4 w-24 rounded bg-slate-200" />
                                </div>
                                <div className="h-6 w-16 rounded-lg bg-slate-100" />
                            </div>
                            <div className="space-y-2">
                                <div className="h-3 w-full rounded bg-slate-200" />
                                <div className="h-3 w-4/5 rounded bg-slate-200" />
                                <div className="h-3 w-3/5 rounded bg-slate-200" />
                            </div>
                            <div className="mt-4 grid grid-cols-[minmax(0,1fr)_80px] gap-3">
                                <div className="h-8 rounded bg-slate-100" />
                                <div className="h-8 rounded bg-slate-100" />
                            </div>
                            <div className="mt-3 space-y-1.5">
                                <div className="h-3 w-20 rounded bg-slate-200" />
                                <div className="h-14 rounded bg-slate-100" />
                            </div>
                        </div>
                    ))
                ) : questions.map((question, index) => {
                    const isVisible = index < visibleCount;
                    return (
                    <div
                        key={index}
                        className={[
                            'rounded-lg border border-slate-200 bg-white p-4 shadow-xs transition-all duration-300',
                            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
                        ].join(' ')}
                    >
                        <div className="mb-3 flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-2 text-sm font-semibold text-violet-700">
                                <span className="flex size-6 items-center justify-center rounded-full bg-violet-100 text-xs">
                                    {index + 1}
                                </span>
                                Pertanyaan {index + 1}
                            </span>
                            <div className="flex items-center gap-1">
                                <div className="flex rounded-lg border border-slate-200 text-xs overflow-hidden">
                                    <button
                                        type="button"
                                        onClick={() => onUpdate(index, 'question_type', 'open')}
                                        className={[
                                            'px-2.5 py-1 font-medium transition-colors',
                                            question.question_type === 'open'
                                                ? 'bg-violet-600 text-white'
                                                : 'text-slate-500 hover:bg-slate-50',
                                        ].join(' ')}
                                    >
                                        Essay
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onUpdate(index, 'question_type', 'multiple_choice')}
                                        className={[
                                            'px-2.5 py-1 font-medium transition-colors border-l border-slate-200',
                                            question.question_type === 'multiple_choice'
                                                ? 'bg-violet-600 text-white'
                                                : 'text-slate-500 hover:bg-slate-50',
                                        ].join(' ')}
                                    >
                                        PG
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-600 disabled:pointer-events-none disabled:opacity-40"
                                    onClick={() => onRemove(index)}
                                    disabled={questions.length <= 1}
                                    aria-label="Hapus pertanyaan"
                                >
                                    <Trash2 className="size-4" />
                                </button>
                            </div>
                        </div>

                        <textarea
                            rows={3}
                            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            placeholder="Tulis pertanyaan interview..."
                            value={question.question}
                            onChange={(event) =>
                                onUpdate(index, 'question', event.target.value)
                            }
                        />

                        {question.question_type === 'multiple_choice' && (
                            <div className="mt-3 space-y-1.5">
                                <Label className="text-xs font-semibold text-violet-700">
                                    Pilihan jawaban
                                </Label>
                                {(question.options.length === 0 ? ['', '', '', ''] : question.options).map((opt, optIdx) => (
                                    <div key={optIdx} className="flex items-center gap-2">
                                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                                            {String.fromCharCode(65 + optIdx)}
                                        </span>
                                        <Input
                                            value={opt}
                                            placeholder={`Pilihan ${String.fromCharCode(65 + optIdx)}`}
                                            className="h-8 text-xs"
                                            onChange={(e) => {
                                                const base = question.options.length === 0 ? ['', '', '', ''] : [...question.options];
                                                while (base.length <= optIdx) base.push('');
                                                base[optIdx] = e.target.value;
                                                onUpdateOptions(index, base);
                                            }}
                                        />
                                        {question.options.length > 2 && optIdx >= 2 && (
                                            <button
                                                type="button"
                                                className="shrink-0 text-slate-400 hover:text-red-500"
                                                onClick={() => {
                                                    const updated = [...question.options];
                                                    updated.splice(optIdx, 1);
                                                    onUpdateOptions(index, updated);
                                                }}
                                            >
                                                <Trash2 className="size-3.5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {(question.options.length === 0 ? 4 : question.options.length) < 6 && (
                                    <button
                                        type="button"
                                        className="mt-1 flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800"
                                        onClick={() => {
                                            const base = question.options.length === 0 ? ['', '', '', ''] : [...question.options];
                                            onUpdateOptions(index, [...base, '']);
                                        }}
                                    >
                                        <Plus className="size-3" />
                                        Tambah pilihan
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_110px]">
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">
                                    Kategori
                                </Label>
                                <Input
                                    value={question.category}
                                    placeholder="behavioral"
                                    onChange={(event) =>
                                        onUpdate(
                                            index,
                                            'category',
                                            event.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">
                                    Bobot
                                </Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={question.weight}
                                    onChange={(event) =>
                                        onUpdate(
                                            index,
                                            'weight',
                                            Number(event.target.value),
                                        )
                                    }
                                />
                            </div>
                        </div>

                        <div className="mt-3 space-y-1">
                            <Label className="text-xs text-muted-foreground">
                                Rubrik penilaian
                            </Label>
                            <textarea
                                rows={3}
                                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-xs placeholder:text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                placeholder="Rubrik penilaian..."
                                value={question.rubric}
                                onChange={(event) =>
                                    onUpdate(
                                        index,
                                        'rubric',
                                        event.target.value,
                                    )
                                }
                            />
                        </div>

                        {question.question_type === 'open' && (
                            <label className="mt-3 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                                <input
                                    type="checkbox"
                                    checked={question.allow_ai_followup}
                                    onChange={(event) =>
                                        onUpdate(
                                            index,
                                            'allow_ai_followup',
                                            event.target.checked,
                                        )
                                    }
                                    className="mt-0.5 size-4 rounded border-input"
                                />
                                Izinkan AI bertanya lanjutan berdasarkan jawaban
                                kandidat
                            </label>
                        )}
                    </div>
                    );
                })}
            </div>

            {errors.questions && (
                <p className="text-xs text-destructive">{errors.questions}</p>
            )}

            <p className="text-xs text-muted-foreground">
                Maksimal 12 pertanyaan. Pertanyaan yang dikirim dari halaman ini
                akan disimpan untuk AI interview kandidat.
            </p>
        </div>
    );
}

function ScheduleDialog({
    application,
    t,
}: {
    application: CandidateApplication;
    t: (key: string, replacements?: Record<string, string | number>) => string;
}) {
    const [open, setOpen] = useState(false);
    const [type, setType] = useState<InterviewType>('online');

    const regular = useForm({
        mode: 'online' as 'online' | 'onsite',
        scheduled_at: '',
        duration_minutes: 60,
        meeting_url: '',
        address: '',
        notes: '',
    });

    const ai = useForm({
        application_id: application.id,
        interview_mode: 'voice' as 'voice' | 'text',
        scheduled_at: '',
        duration_minutes: 30,
        meeting_url: '',
        voice: 'marin',
        questions: DEFAULT_AI_QUESTIONS,
    });

    function handleTypeChange(t: InterviewType) {
        setType(t);
        if (t !== 'ai') regular.setData('mode', t as 'online' | 'onsite');
    }

    function submitRegular(e: React.FormEvent) {
        e.preventDefault();
        regular.post(storeInterview(application.id).url, {
            onSuccess: () => {
                regular.reset();
                setOpen(false);
            },
        });
    }

    function submitAi(e: React.FormEvent) {
        e.preventDefault();
        ai.post(storeAiInterview(application.job.id ?? 0).url, {
            onSuccess: () => {
                ai.reset();
                setOpen(false);
            },
        });
    }

    const MODES: {
        key: InterviewType;
        label: string;
        desc: string;
        icon: React.ReactNode;
    }[] = [
        {
            key: 'online',
            label: 'Online',
            desc: 'Via Google Meet, Zoom, dll.',
            icon: <CalendarPlus className="size-3.5" />,
        },
        {
            key: 'onsite',
            label: 'Onsite',
            desc: 'Datang ke kantor.',
            icon: <BriefcaseBusiness className="size-3.5" />,
        },
        {
            key: 'ai',
            label: 'AI Interview',
            desc: 'Otomatis via AI (voice/text).',
            icon: <Bot className="size-3.5" />,
        },
    ];

    function updateAiQuestion(
        index: number,
        field: keyof AiQuestion,
        value: string | number | boolean | string[],
    ) {
        ai.setData(
            'questions',
            ai.data.questions.map((question, questionIndex) =>
                questionIndex === index
                    ? {
                          ...question,
                          [field]: value,
                      }
                    : question,
            ),
        );
    }

    function addAiQuestion() {
        ai.setData('questions', [
            ...ai.data.questions,
            {
                question: '',
                category: 'custom',
                rubric: 'Nilai jawaban berdasarkan relevansi, contoh konkret, dan kejelasan komunikasi.',
                weight: 10,
                allow_ai_followup: true,
                question_type: 'open' as const,
                options: [],
            },
        ]);
    }

    function removeAiQuestion(index: number) {
        if (ai.data.questions.length <= 1) return;

        ai.setData(
            'questions',
            ai.data.questions.filter(
                (_, questionIndex) => questionIndex !== index,
            ),
        );
    }

    function updateAiQuestionOptions(index: number, options: string[]) {
        ai.setData(
            'questions',
            ai.data.questions.map((q, i) =>
                i === index ? { ...q, options } : q,
            ),
        );
    }

    const [generatingAiQuestions, setGeneratingAiQuestions] = useState(false);

    async function generateAiQuestionsForSchedule() {
        const jobId = application.job.id;
        if (!jobId) return;
        setGeneratingAiQuestions(true);
        try {
            const res = await fetch(generateQuestions(jobId).url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
                },
                body: JSON.stringify({ interview_mode: ai.data.interview_mode }),
            });
            if (res.ok) {
                const data: { questions: AiQuestion[] } = await res.json();
                ai.setData('questions', data.questions);
            }
        } finally {
            setGeneratingAiQuestions(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="bg-violet-600 hover:bg-violet-700">
                    <CalendarPlus className="size-4" />
                    {t('employer.candidates.row_schedule_interview')}
                </Button>
            </DialogTrigger>
            <DialogContent
                className={
                    type === 'ai'
                        ? 'top-4 right-4 bottom-4 left-4 h-auto w-auto max-w-none translate-x-0 translate-y-0 overflow-hidden p-0 sm:max-w-none'
                        : 'w-full overflow-hidden p-0 sm:max-w-lg'
                }
            >
                <div className="flex h-full min-h-0 flex-col">
                    <div className="border-b border-slate-100 px-6 pt-5 pb-4">
                        <DialogHeader>
                            <DialogTitle className="text-base font-semibold">
                                {t(
                                    'employer.candidates.interview_dialog_title',
                                )}
                            </DialogTitle>
                            <DialogDescription className="mt-0.5 text-sm">
                                <span className="font-medium text-slate-700">
                                    {application.candidate.name}
                                </span>
                                {' · '}
                                {application.job.title}
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="grid grid-cols-3 gap-2 border-b border-slate-100 px-6 py-4">
                        {MODES.map((m) => (
                            <button
                                key={m.key}
                                type="button"
                                onClick={() => handleTypeChange(m.key)}
                                className={[
                                    'flex flex-col gap-1 rounded-xl border-2 px-3 py-2.5 text-left transition-all focus:outline-none',
                                    type === m.key
                                        ? m.key === 'ai'
                                            ? 'border-violet-500 bg-violet-50'
                                            : 'border-[#0F4C94] bg-[#EEF3FB]'
                                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
                                ].join(' ')}
                            >
                                <div
                                    className={[
                                        'flex items-center gap-1.5 text-xs font-semibold',
                                        type === m.key
                                            ? m.key === 'ai'
                                                ? 'text-violet-700'
                                                : 'text-[#0F4C94]'
                                            : 'text-slate-600',
                                    ].join(' ')}
                                >
                                    <span
                                        className={[
                                            'flex size-5 items-center justify-center rounded-md',
                                            type === m.key
                                                ? m.key === 'ai'
                                                    ? 'bg-violet-100'
                                                    : 'bg-[#0F4C94]/10'
                                                : 'bg-slate-100',
                                        ].join(' ')}
                                    >
                                        {m.icon}
                                    </span>
                                    {m.label}
                                </div>
                                <p className="line-clamp-1 text-[11px] leading-4 text-muted-foreground">
                                    {m.desc}
                                </p>
                            </button>
                        ))}
                    </div>

                    <div
                        className={
                            type === 'ai'
                                ? 'min-h-0 flex-1 overflow-y-auto px-6 py-5'
                                : 'px-6 py-5'
                        }
                    >
                        {type !== 'ai' && (
                            <form
                                onSubmit={submitRegular}
                                className="space-y-4"
                            >
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor={`r_sched_${application.id}`}
                                            className="text-sm font-medium text-slate-700"
                                        >
                                            {t(
                                                'employer.candidates.interview_datetime_label',
                                            )}
                                        </Label>
                                        <Input
                                            id={`r_sched_${application.id}`}
                                            type="datetime-local"
                                            value={regular.data.scheduled_at}
                                            onChange={(e) =>
                                                regular.setData(
                                                    'scheduled_at',
                                                    e.target.value,
                                                )
                                            }
                                            className="h-9 text-sm"
                                        />
                                        {regular.errors.scheduled_at && (
                                            <p className="text-xs text-destructive">
                                                {regular.errors.scheduled_at}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor={`r_dur_${application.id}`}
                                            className="text-sm font-medium text-slate-700"
                                        >
                                            {t(
                                                'employer.candidates.interview_duration_label',
                                            )}
                                        </Label>
                                        <select
                                            id={`r_dur_${application.id}`}
                                            value={regular.data.duration_minutes}
                                            onChange={(e) =>
                                                regular.setData(
                                                    'duration_minutes',
                                                    Number(e.target.value),
                                                )
                                            }
                                            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                        >
                                            {[15, 30, 45, 60, 90, 120].map(
                                                (d) => (
                                                    <option key={d} value={d}>
                                                        {d} menit
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                    </div>
                                </div>

                                {type === 'online' ? (
                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor={`r_url_${application.id}`}
                                            className="text-sm font-medium text-slate-700"
                                        >
                                            {t(
                                                'employer.candidates.interview_meeting_url_label',
                                            )}
                                        </Label>
                                        <Input
                                            id={`r_url_${application.id}`}
                                            type="url"
                                            placeholder="https://meet.google.com/..."
                                            value={regular.data.meeting_url}
                                            onChange={(e) =>
                                                regular.setData(
                                                    'meeting_url',
                                                    e.target.value,
                                                )
                                            }
                                            className="h-9 text-sm"
                                        />
                                        {regular.errors.meeting_url && (
                                            <p className="text-xs text-destructive">
                                                {regular.errors.meeting_url}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor={`r_addr_${application.id}`}
                                            className="text-sm font-medium text-slate-700"
                                        >
                                            {t(
                                                'employer.candidates.interview_address_label',
                                            )}
                                        </Label>
                                        <Input
                                            id={`r_addr_${application.id}`}
                                            placeholder="Jl. Sudirman No.1, Ruang Meeting A"
                                            value={regular.data.address}
                                            onChange={(e) =>
                                                regular.setData(
                                                    'address',
                                                    e.target.value,
                                                )
                                            }
                                            className="h-9 text-sm"
                                        />
                                        {regular.errors.address && (
                                            <p className="text-xs text-destructive">
                                                {regular.errors.address}
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor={`r_notes_${application.id}`}
                                        className="text-sm font-medium text-slate-700"
                                    >
                                        {t(
                                            'employer.candidates.interview_notes_label',
                                        )}
                                    </Label>
                                    <textarea
                                        id={`r_notes_${application.id}`}
                                        rows={3}
                                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                        placeholder="Siapkan portofolio, dress code formal, dll."
                                        value={regular.data.notes}
                                        onChange={(e) =>
                                            regular.setData(
                                                'notes',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={regular.processing}
                                    className="h-10 w-full bg-[#0F4C94] text-sm font-semibold hover:bg-[#093579]"
                                >
                                    {regular.processing
                                        ? t(
                                              'employer.candidates.interview_submitting',
                                          )
                                        : t(
                                              'employer.candidates.interview_submit',
                                          )}
                                </Button>
                            </form>
                        )}

                        {type === 'ai' && (
                            <form onSubmit={submitAi} className="space-y-5">
                                <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
                                    <div className="space-y-4 xl:sticky xl:top-0 xl:self-start">
                                        <div className="space-y-1.5">
                                            <Label>Mode AI</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {(
                                                    ['voice', 'text'] as const
                                                ).map((m) => (
                                                    <button
                                                        key={m}
                                                        type="button"
                                                        onClick={() =>
                                                            ai.setData(
                                                                'interview_mode',
                                                                m,
                                                            )
                                                        }
                                                        className={[
                                                            'flex flex-col gap-0.5 rounded-xl border-2 px-3 py-2.5 text-left text-sm transition-all focus:outline-none',
                                                            ai.data
                                                                .interview_mode ===
                                                            m
                                                                ? 'border-violet-500 bg-violet-50'
                                                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
                                                        ].join(' ')}
                                                    >
                                                        <p className={['flex items-center gap-1.5 font-semibold text-xs', ai.data.interview_mode === m ? 'text-violet-700' : 'text-slate-600'].join(' ')}>
                                                            {m === 'voice' ? (
                                                                <Mic className="size-3.5" />
                                                            ) : (
                                                                <Bot className="size-3.5" />
                                                            )}
                                                            {m === 'voice'
                                                                ? 'Voice AI'
                                                                : 'Text AI'}
                                                        </p>
                                                        <p className="text-[11px] text-muted-foreground">
                                                            {m === 'voice'
                                                                ? 'Interview via suara'
                                                                : 'Interview via teks'}
                                                        </p>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {ai.data.interview_mode === 'voice' && (
                                            <div className="space-y-1.5">
                                                <Label htmlFor={`ai_voice_${application.id}`}>
                                                    Suara AI
                                                </Label>
                                                <select
                                                    id={`ai_voice_${application.id}`}
                                                    value={ai.data.voice}
                                                    onChange={(e) =>
                                                        ai.setData('voice', e.target.value)
                                                    }
                                                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                                >
                                                    {['alloy', 'ash', 'ballad', 'coral', 'echo', 'marin', 'sage', 'shimmer', 'verse', 'cedar'].map((v) => (
                                                        <option key={v} value={v}>
                                                            {v.charAt(0).toUpperCase() + v.slice(1)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        <div className="space-y-1.5">
                                            <Label
                                                htmlFor={`ai_sched_${application.id}`}
                                            >
                                                Tanggal & jam
                                            </Label>
                                            <Input
                                                id={`ai_sched_${application.id}`}
                                                type="datetime-local"
                                                value={ai.data.scheduled_at}
                                                onChange={(e) =>
                                                    ai.setData(
                                                        'scheduled_at',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            {ai.errors.scheduled_at && (
                                                <p className="text-xs text-destructive">
                                                    {ai.errors.scheduled_at}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label
                                                htmlFor={`ai_dur_${application.id}`}
                                            >
                                                Durasi
                                            </Label>
                                            <select
                                                id={`ai_dur_${application.id}`}
                                                value={ai.data.duration_minutes}
                                                onChange={(e) =>
                                                    ai.setData(
                                                        'duration_minutes',
                                                        Number(e.target.value),
                                                    )
                                                }
                                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                            >
                                                {[15, 30, 45, 60].map((d) => (
                                                    <option key={d} value={d}>
                                                        {d} menit
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <AiQuestionEditor
                                        questions={ai.data.questions}
                                        errors={ai.errors}
                                        onAdd={addAiQuestion}
                                        onRemove={removeAiQuestion}
                                        onUpdate={updateAiQuestion}
                                        onUpdateOptions={updateAiQuestionOptions}
                                        onGenerate={generateAiQuestionsForSchedule}
                                        generating={generatingAiQuestions}
                                    />
                                </div>

                                <div className="flex justify-end border-t border-slate-200 pt-4">
                                    <Button
                                        type="submit"
                                        disabled={ai.processing}
                                        className="w-full bg-violet-600 hover:bg-violet-700 sm:w-auto"
                                    >
                                        {ai.processing
                                            ? 'Menjadwalkan...'
                                            : 'Kirim Undangan AI Interview'}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
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
        orange: 'bg-[#fff7ed] text-[#ea580c]',
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
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[#0F2747] text-sm font-semibold text-white">
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
              ? 'bg-[#319FC9]'
              : 'bg-[#f59e0b]';

    return `h-full rounded-full ${color}`;
}

function cleanLabel(label: string) {
    return label
        .replace('&laquo;', '«')
        .replace('&raquo;', '»')
        .replace('pagination.previous', '«')
        .replace('pagination.next', '»');
}

EmployerCandidates.layout = {
    breadcrumbs: [
        {
            title: 'Candidates',
            href: index(),
        },
    ],
};
