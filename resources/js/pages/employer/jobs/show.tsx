import { Head, Link, router } from '@inertiajs/react';
import {
    BadgeCheck,
    Ban,
    Bot,
    Briefcase,
    CalendarDays,
    CircleDollarSign,
    ClipboardList,
    Clock3,
    FileText,
    Filter,
    Globe,
    Layers,
    MapPin,
    Mic,
    Search,
    Sparkles,
    Star,
    UserCheck,
    Users,
} from 'lucide-react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    cleanPaginationLabel,
    shouldRenderPagination,
} from '@/lib/pagination';
import { cn } from '@/lib/utils';
import { index as employerCandidatesIndex } from '@/routes/employer/candidates';
import { edit, index, show as showJob } from '@/routes/employer/jobs';
import { compare as compareAiInterviews } from '@/routes/employer/jobs/ai-interviews';

type JobShowProps = {
    company: {
        id: number;
        name: string;
    };
    job: {
        id: number;
        title: string;
        slug: string;
        status: string;
        status_label: string;
        industry?: string | null;
        work_mode: string;
        job_type: string;
        experience_level: string;
        location: string;
        salary_range: string;
        is_anonymous: boolean;
        is_salary_visible: boolean;
        response_sla_hours?: number | null;
        published_at: string;
        closes_at: string;
        created_at: string;
        description?: string | null;
        responsibilities?: string | null;
        required_qualifications?: string | null;
        preferred_qualifications?: string | null;
        skills: Array<{
            id: number;
            name: string;
        }>;
        applications_count: number;
        shortlisted_applications_count: number;
        interview_applications_count: number;
        offer_applications_count: number;
        hired_applications_count: number;
    };
    filters: {
        search?: string;
        status?: string;
        ai_interview_status?: string;
    };
    recent_filters: {
        recent_search?: string;
    };
    recent_applications: {
        data: Array<{
            id: number;
            candidate_name: string;
            candidate_headline?: string | null;
            status: string;
            status_label: string;
            ai_fit_score?: number | null;
            applied_at?: string | null;
        }>;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
    applications: {
        data: Array<{
            id: number;
            candidate_name: string;
            candidate_headline?: string | null;
            candidate_email?: string | null;
            candidate_location?: string | null;
            status: string;
            status_label: string;
            ai_fit_score?: number | null;
            applied_at?: string | null;
            latest_ai_session?: {
                id: number;
                status: string;
                scheduled_at?: string | null;
                completed_at?: string | null;
                fit_score?: number | null;
                interview_mode?: string | null;
            } | null;
        }>;
        total?: number;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
    suggested_questions: InterviewQuestionForm[];
};

type InterviewQuestionForm = {
    question: string;
    category: string;
    rubric: string;
    weight: number;
    allow_ai_followup: boolean;
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    published: {
        label: 'Published',
        className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    },
    draft: {
        label: 'Draft',
        className: 'bg-zinc-100 text-zinc-600 border-zinc-200',
    },
    closed: {
        label: 'Ditutup',
        className: 'bg-red-100 text-red-600 border-red-200',
    },
    suspended: {
        label: 'Suspended',
        className: 'bg-secondary-100 text-secondary-700 border-secondary-200',
    },
};

const APPLICATION_STATUS_CONFIG: Record<string, { className: string }> = {
    applied: { className: 'bg-blue-100 text-blue-700' },
    shortlisted: { className: 'bg-violet-100 text-violet-700' },
    interview: { className: 'bg-secondary-100 text-secondary-700' },
    offer: { className: 'bg-primary-100 text-primary-700' },
    hired: { className: 'bg-emerald-100 text-emerald-700' },
    rejected: { className: 'bg-red-100 text-red-600' },
};



export default function EmployerJobShow({
    company,
    job,
    filters,
    recent_filters,
    recent_applications,
    applications,
    suggested_questions,
}: JobShowProps) {

    const statusCfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG['draft'];

    const pipelineStages = [
        {
            label: 'Total Pelamar',
            value: job.applications_count,
            icon: Users,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            ring: 'ring-blue-100',
            accent: 'from-blue-500 to-blue-400',
        },
        {
            label: 'Terpilih',
            value: job.shortlisted_applications_count,
            icon: Layers,
            color: 'text-violet-600',
            bg: 'bg-violet-50',
            ring: 'ring-violet-100',
            accent: 'from-violet-500 to-violet-400',
        },
        {
            label: 'Wawancara',
            value: job.interview_applications_count,
            icon: Mic,
            color: 'text-secondary-600',
            bg: 'bg-secondary-50',
            ring: 'ring-secondary-100',
            accent: 'from-secondary-500 to-secondary-400',
        },
        {
            label: 'Penawaran',
            value: job.offer_applications_count,
            icon: CircleDollarSign,
            color: 'text-primary-600',
            bg: 'bg-primary-50',
            ring: 'ring-primary-100',
            accent: 'from-primary-500 to-primary-400',
        },
        {
            label: 'Diterima',
            value: job.hired_applications_count,
            icon: UserCheck,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            ring: 'ring-emerald-100',
            accent: 'from-emerald-500 to-emerald-400',
        },
    ];

    const submitRecentFilter = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);

        router.get(
            showJob(job.id),
            {
                search: filters.search ?? '',
                status: filters.status ?? '',
                ai_interview_status: filters.ai_interview_status ?? '',
                recent_search: formData.get('recent_search')?.toString() ?? '',
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    return (
        <>
            <Head title={`Detail Lowongan - ${job.title}`} />

            <div className="space-y-6 p-4 md:p-6">
                {/* Page header */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <Heading
                        title="Detail Lowongan"
                        description={`Ringkasan lowongan ${job.title} untuk ${company.name}.`}
                    />
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href={index()}>Kembali</Link>
                        </Button>
                        <Button
                            className="bg-primary-500 text-white hover:bg-primary-600"
                            asChild
                        >
                            <Link href={edit(job.id)}>Edit Lowongan</Link>
                        </Button>
                    </div>
                </div>

                {/* Job hero card */}
                <Card className="overflow-hidden border-0 shadow-sm">
                    <div className="bg-gradient-to-r from-primary-500 to-primary-400 px-6 py-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    {job.title}
                                </h2>
                                <p className="mt-0.5 text-sm text-primary-100">
                                    {company.name}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <span
                                    className={cn(
                                        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold',
                                        statusCfg.className,
                                    )}
                                >
                                    {statusCfg.label}
                                </span>
                                {job.is_anonymous ? (
                                    <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                                        Anonim
                                    </span>
                                ) : null}
                                {job.industry ? (
                                    <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                                        {job.industry}
                                    </span>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    <CardContent className="p-0">
                        <div className="grid gap-0 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
                            <MetaCell
                                icon={MapPin}
                                label="Lokasi"
                                value={job.location || '-'}
                            />
                            <MetaCell
                                icon={Globe}
                                label="Mode Kerja"
                                value={job.work_mode}
                            />
                            <MetaCell
                                icon={Briefcase}
                                label="Jenis Kerja"
                                value={job.job_type}
                            />
                            <MetaCell
                                icon={Sparkles}
                                label="Level"
                                value={job.experience_level}
                            />
                        </div>
                        <div className="grid gap-0 divide-y divide-border border-t sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
                            <MetaCell
                                icon={CalendarDays}
                                label="Dipublikasikan"
                                value={job.published_at}
                            />
                            <MetaCell
                                icon={Ban}
                                label="Ditutup"
                                value={job.closes_at}
                            />
                            <MetaCell
                                icon={CalendarDays}
                                label="Dibuat"
                                value={job.created_at}
                            />
                            <MetaCell
                                icon={Clock3}
                                label="SLA Respon"
                                value={
                                    job.response_sla_hours
                                        ? `${job.response_sla_hours} jam`
                                        : '-'
                                }
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Pipeline stats */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    {pipelineStages.map((stage) => {
                        const Icon = stage.icon;

                        return (
                            <Card
                                key={stage.label}
                                className="group overflow-hidden border-0 shadow-sm transition-shadow hover:shadow-md"
                            >
                                <div
                                    className={cn(
                                        'h-1 w-full bg-linear-to-r',
                                        stage.accent,
                                    )}
                                />
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-3xl font-bold tracking-tight text-foreground">
                                                {stage.value}
                                            </p>
                                            <p className="mt-1 text-xs font-medium text-muted-foreground">
                                                {stage.label}
                                            </p>
                                        </div>
                                        <div
                                            className={cn(
                                                'flex size-9 items-center justify-center rounded-xl ring-1',
                                                stage.bg,
                                                stage.ring,
                                            )}
                                        >
                                            <Icon
                                                className={cn(
                                                    'size-4',
                                                    stage.color,
                                                )}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Info + Compensation */}
                <div className="grid gap-5 lg:grid-cols-2">
                    <Card className="overflow-hidden border-0 shadow-sm">
                        <div className="flex items-center gap-3 border-b bg-muted/30 px-5 py-4">
                            <div className="flex size-8 items-center justify-center rounded-lg bg-primary-100">
                                <Briefcase className="size-4 text-primary-600" />
                            </div>
                            <h3 className="font-semibold text-foreground">
                                Informasi Posisi
                            </h3>
                        </div>
                        <div className="divide-y">
                            <InfoSection
                                icon={
                                    <FileText className="size-3.5 text-primary-500" />
                                }
                                title="Deskripsi"
                                text={job.description ?? '-'}
                            />
                            <InfoSection
                                icon={
                                    <ClipboardList className="size-3.5 text-primary-500" />
                                }
                                title="Tanggung Jawab"
                                text={job.responsibilities ?? '-'}
                            />
                            <InfoSection
                                icon={
                                    <BadgeCheck className="size-3.5 text-primary-500" />
                                }
                                title="Kualifikasi Wajib"
                                text={job.required_qualifications ?? '-'}
                            />
                            <InfoSection
                                icon={
                                    <Star className="size-3.5 text-primary-500" />
                                }
                                title="Kualifikasi Tambahan"
                                text={job.preferred_qualifications ?? '-'}
                            />
                        </div>
                    </Card>

                    <div className="space-y-5">
                        <Card className="shadow-xs">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <CircleDollarSign className="size-4 text-primary-500" />
                                    Kompensasi
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                    Rentang Gaji
                                </p>
                                <p className="mt-1.5 text-xl font-bold text-foreground">
                                    {job.is_salary_visible
                                        ? job.salary_range
                                        : 'Tidak ditampilkan ke kandidat'}
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="shadow-xs">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Sparkles className="size-4 text-primary-500" />
                                    Skill Dibutuhkan
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {job.skills.length > 0 ? (
                                    <ul className="space-y-2">
                                        {job.skills.map((skill, index) => (
                                            <li
                                                key={skill.id}
                                                className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2"
                                            >
                                                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-100 text-[10px] font-bold text-primary-600">
                                                    {index + 1}
                                                </span>
                                                <span className="text-sm font-medium text-foreground">
                                                    {skill.name}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        Belum ada skill ditetapkan.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* AI Interview summary */}
                <Card className="shadow-xs">
                    <CardHeader className="border-b">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-xl bg-primary-100 ring-1 ring-primary-200">
                                    <Bot className="size-5 text-primary-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-base">
                                        Interview AI
                                    </CardTitle>
                                    <p className="mt-0.5 text-sm text-muted-foreground">
                                        Kelola undangan AI interview untuk
                                        kandidat lowongan ini.
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline">
                                    {applications.total ??
                                        applications.data.length}{' '}
                                    kandidat
                                </Badge>
                                <Button size="sm" variant="outline" asChild>
                                    <Link href={compareAiInterviews(job.id)}>
                                        Bandingkan Kandidat
                                    </Link>
                                </Button>
                                <Button
                                    size="sm"
                                    className="bg-primary-500 text-white hover:bg-primary-600"
                                    asChild
                                >
                                    <Link
                                        href={employerCandidatesIndex({
                                            query: {
                                                job_id: String(job.id),
                                            },
                                        })}
                                    >
                                        <Mic className="size-3.5" />
                                        Kelola Kandidat
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* Recent applications */}
                <Card className="shadow-xs">
                    <CardHeader className="border-b">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 ring-1 ring-blue-200">
                                <Users className="size-5 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle className="text-base">
                                    Pelamar Terbaru
                                </CardTitle>
                                <p className="mt-0.5 text-sm text-muted-foreground">
                                    5 pelamar paling baru untuk lowongan ini.
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-5">
                        <form
                            onSubmit={submitRecentFilter}
                            className="mb-4 grid gap-3 rounded-lg border p-3 lg:grid-cols-[1fr_auto]"
                        >
                            <div className="relative">
                                <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
                                <Input
                                    name="recent_search"
                                    defaultValue={
                                        recent_filters.recent_search ?? ''
                                    }
                                    className="pl-9"
                                    placeholder="Cari pelamar terbaru"
                                />
                            </div>
                            <Button type="submit" variant="outline">
                                <Filter className="size-4" />
                                Cari
                            </Button>
                        </form>

                        {recent_applications.data.length > 0 ? (
                            <div className="space-y-4">
                                <div className="overflow-x-auto">
                                    <Table className="min-w-160">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Kandidat</TableHead>
                                            <TableHead>Headline</TableHead>
                                            <TableHead>Tahap</TableHead>
                                            <TableHead>AI Fit</TableHead>
                                            <TableHead>Dilamar</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recent_applications.data.map(
                                            (application) => {
                                                const statusStyle =
                                                    APPLICATION_STATUS_CONFIG[
                                                        application.status
                                                    ] ??
                                                    APPLICATION_STATUS_CONFIG[
                                                        'applied'
                                                    ];

                                                return (
                                                    <TableRow
                                                        key={application.id}
                                                    >
                                                        <TableCell className="font-medium">
                                                            {
                                                                application.candidate_name
                                                            }
                                                        </TableCell>
                                                        <TableCell>
                                                            {application.candidate_headline ??
                                                                '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            <span
                                                                className={cn(
                                                                    'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
                                                                    statusStyle.className,
                                                                )}
                                                            >
                                                                {
                                                                    application.status_label
                                                                }
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>
                                                            {application.ai_fit_score ??
                                                                '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {application.applied_at ??
                                                                '-'}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            },
                                        )}
                                    </TableBody>
                                    </Table>
                                </div>

                                {shouldRenderPagination(
                                    recent_applications.links,
                                ) ? (
                                    <div className="flex flex-wrap justify-end gap-2">
                                        {recent_applications.links.map((link) => (
                                            <Button
                                                key={`${link.label}-${link.url}`}
                                                asChild={Boolean(link.url)}
                                                disabled={!link.url}
                                                size="sm"
                                                variant={
                                                    link.active
                                                        ? 'default'
                                                        : 'outline'
                                                }
                                            >
                                                {link.url ? (
                                                    <Link href={link.url}>
                                                        {cleanPaginationLabel(
                                                            link.label,
                                                        )}
                                                    </Link>
                                                ) : (
                                                    <span>
                                                        {cleanPaginationLabel(
                                                            link.label,
                                                        )}
                                                    </span>
                                                )}
                                            </Button>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
                                <Users className="size-10 text-muted-foreground/40" />
                                <p className="mt-3 text-sm font-medium text-muted-foreground">
                                    Belum ada pelamar
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

        </>
    );
}

function MetaCell({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-center gap-3 px-5 py-4">
            <Icon className="size-4 shrink-0 text-muted-foreground" />
            <div>
                <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                    {label}
                </p>
                <p className="mt-0.5 text-sm font-medium text-foreground">
                    {value}
                </p>
            </div>
        </div>
    );
}

function InfoSection({
    icon,
    title,
    text,
}: {
    icon: React.ReactNode;
    title: string;
    text: string;
}) {
    const normalizedText = text.trim();
    const hasHtmlTags = /<[^>]+>/.test(normalizedText);
    const isEmpty = normalizedText === '-' || normalizedText === '';

    return (
        <div className="px-5 py-4">
            <div className="mb-2 flex items-center gap-1.5">
                {icon}
                <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {title}
                </span>
            </div>
            {isEmpty ? (
                <p className="text-sm text-muted-foreground/60 italic">
                    Belum diisi.
                </p>
            ) : hasHtmlTags ? (
                <div
                    className="prose prose-sm max-w-none text-sm text-foreground/80 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5"
                    dangerouslySetInnerHTML={{ __html: normalizedText }}
                />
            ) : (
                <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/80">
                    {normalizedText}
                </p>
            )}
        </div>
    );
}

EmployerJobShow.layout = {
    breadcrumbs: [
        {
            title: 'Kelola Lowongan',
            href: index(),
        },
        {
            title: 'Detail Lowongan',
            href: showJob(0),
        },
    ],
};
