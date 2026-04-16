import { Head, Link, router } from '@inertiajs/react';
import {
    BriefcaseBusiness,
    CalendarClock,
    CheckCircle2,
    Mail,
    Search,
    Sparkles,
    Users,
} from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { index } from '@/routes/employer/candidates';

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
            <Head title="Kandidat" />

            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title="Kandidat"
                    description={`Kandidat yang melamar ke lowongan ${company.name}, lengkap dengan status pipeline dan sinyal AI.`}
                />

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <MetricCard
                        label="Total kandidat"
                        value={metrics.total}
                        icon={Users}
                        tone="orange"
                    />
                    <MetricCard
                        label="Prioritas pipeline"
                        value={metrics.shortlisted}
                        icon={CheckCircle2}
                        tone="green"
                    />
                    <MetricCard
                        label="Interview"
                        value={metrics.interviews}
                        icon={CalendarClock}
                        tone="blue"
                    />
                    <MetricCard
                        label="Rata-rata AI fit"
                        value={`${metrics.average_ai_fit || 0}%`}
                        icon={Sparkles}
                        tone="slate"
                    />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Filter kandidat</CardTitle>
                        <CardDescription>
                            Cari nama, email, headline, role, atau judul
                            lowongan.
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
                                    placeholder="Cari kandidat atau lowongan"
                                />
                            </div>
                            <select
                                name="status"
                                defaultValue={filters.status ?? ''}
                                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            >
                                <option value="">Semua status</option>
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
                                <option value="">Semua lowongan</option>
                                {jobOptions.map((job) => (
                                    <option key={job.value} value={job.value}>
                                        {job.label}
                                    </option>
                                ))}
                            </select>
                            <Button type="submit" variant="outline">
                                Terapkan
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    {applications.data.length > 0 ? (
                        applications.data.map((application) => (
                            <CandidateRow
                                key={application.id}
                                application={application}
                            />
                        ))
                    ) : (
                        <div className="rounded-lg border bg-white p-8 text-center">
                            <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-[#f8fafc] text-[#64748b]">
                                <Users className="size-6" />
                            </div>
                            <h2 className="mt-4 text-lg font-semibold">
                                Belum ada kandidat
                            </h2>
                            <p className="mx-auto mt-1 max-w-xl text-sm text-muted-foreground">
                                Kandidat akan muncul setelah ada lamaran masuk
                                ke lowongan perusahaan ini.
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
}: {
    application: CandidateApplication;
}) {
    const fitScore = application.ai_fit_score ?? 0;

    return (
        <article className="rounded-lg border bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                        <Avatar
                            name={application.candidate.name}
                            src={application.candidate.avatar_url}
                        />
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-lg font-semibold text-foreground">
                                    {application.candidate.name}
                                </h2>
                                <StatusBadge
                                    status={application.status}
                                    label={application.status_label}
                                />
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {application.candidate.headline ||
                                    application.candidate.preferred_role ||
                                    'Kandidat Karivia'}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                <span>{application.candidate.location || '-'}</span>
                                <span>•</span>
                                <span>
                                    {application.candidate.work_mode_pref}
                                </span>
                                <span>•</span>
                                <span>
                                    Available: {application.candidate.availability}
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
                                Skill belum dilengkapi.
                            </span>
                        )}
                    </div>

                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                        {application.cover_letter ||
                            'Belum ada cover letter untuk lamaran ini.'}
                    </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:w-[420px] xl:grid-cols-1">
                    <InfoBlock
                        icon={BriefcaseBusiness}
                        label="Lowongan"
                        value={application.job.title}
                        helper={`Dilamar ${application.applied_at}`}
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
                                    ? application.ai_skill_match.matched.join(', ')
                                    : '-'}
                            </p>
                            <p>
                                Gap:{' '}
                                {application.ai_skill_match.missing.length > 0
                                    ? application.ai_skill_match.missing.join(', ')
                                    : '-'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-5 grid gap-3 border-t pt-4 md:grid-cols-2 xl:grid-cols-4">
                <SmallDetail
                    label="Salary"
                    value={application.candidate.expected_salary}
                />
                <SmallDetail
                    label="Profile"
                    value={`${application.candidate.profile_completion}% lengkap`}
                />
                <SmallDetail
                    label="Interview"
                    value={
                        application.interview
                            ? `${application.interview.mode}, ${application.interview.scheduled_at ?? '-'}`
                            : `${application.interviews_count} jadwal`
                    }
                />
                <SmallDetail
                    label="Update terakhir"
                    value={application.latest_history?.created_at ?? '-'}
                />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                    {application.candidate.email ? (
                        <Button variant="outline" size="sm" asChild>
                            <a href={`mailto:${application.candidate.email}`}>
                                <Mail className="size-4" />
                                Email kandidat
                            </a>
                        </Button>
                    ) : null}
                    {application.cv ? (
                        <Button variant="outline" size="sm" asChild>
                            <a
                                href={application.cv.file_url}
                                target="_blank"
                                rel="noreferrer"
                            >
                                Lihat CV
                            </a>
                        </Button>
                    ) : null}
                </div>
                {application.first_responded_at ? (
                    <p className="text-xs text-muted-foreground">
                        First response {application.first_responded_at}
                    </p>
                ) : (
                    <p className="text-xs font-medium text-[#b45309]">
                        Belum ada response pertama
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
            title: 'Kandidat',
            href: index(),
        },
    ],
};
