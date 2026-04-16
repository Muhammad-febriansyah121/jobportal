import { Head, Link } from '@inertiajs/react';
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { edit as companyEdit } from '@/routes/employer/company';
import { dashboard } from '@/routes/employer';
import { index as verificationIndex } from '@/routes/employer/verification';
import {
    create as createJob,
    index as jobsIndex,
} from '@/routes/employer/jobs';

type DashboardProps = {
    company: {
        id: number;
        name: string;
        verification_status: string;
        is_verified: boolean;
        subscription: string | null;
    } | null;
    metrics: {
        active_jobs: number;
        total_applications: number;
        team_members: number;
        avg_response_hours: number | null;
    };
    pipelineSummary: Array<{
        status: string;
        label: string;
        total: number;
    }>;
    recentApplications: Array<{
        id: number;
        candidate_name: string;
        headline?: string | null;
        job_title?: string | null;
        status: string;
        ai_fit_score?: number | null;
        applied_at?: string | null;
    }>;
    recentJobs: Array<{
        id: number;
        title: string;
        status: string;
        applications_count: number;
        published_at: string;
    }>;
};

export default function EmployerDashboard({
    company,
    metrics,
    pipelineSummary,
    recentApplications,
    recentJobs,
}: DashboardProps) {
    const metricCards = [
        { label: 'Lowongan aktif', value: metrics.active_jobs },
        { label: 'Total pelamar', value: metrics.total_applications },
        { label: 'Recruiter aktif', value: metrics.team_members },
        {
            label: 'Median response',
            value:
                metrics.avg_response_hours === null
                    ? '-'
                    : `${metrics.avg_response_hours} jam`,
        },
    ];

    return (
        <>
            <Head title="Dashboard Perusahaan" />

            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title="Dashboard Perusahaan"
                    description="Pantau trust perusahaan, performa lowongan, dan arus kandidat dari satu tempat."
                />

                {company === null ? (
                    <Card className="border-orange-200 bg-orange-50/80">
                        <CardHeader>
                            <CardTitle>Perusahaan belum disiapkan</CardTitle>
                            <CardDescription>
                                Lengkapi profil perusahaan lebih dulu sebelum
                                membuat lowongan dan menerima pelamar.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild>
                                <Link href={companyEdit()}>
                                    Mulai onboarding perusahaan
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            {metricCards.map((metric) => (
                                <Card key={metric.label}>
                                    <CardHeader className="gap-2">
                                        <CardDescription>
                                            {metric.label}
                                        </CardDescription>
                                        <CardTitle className="text-3xl">
                                            {metric.value}
                                        </CardTitle>
                                    </CardHeader>
                                </Card>
                            ))}
                        </div>

                        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                            <Card>
                                <CardHeader className="flex-row items-start justify-between gap-4">
                                    <div>
                                        <CardTitle>{company.name}</CardTitle>
                                        <CardDescription>
                                            Status trust dan readiness
                                            perusahaan untuk hiring.
                                        </CardDescription>
                                    </div>
                                    <Button variant="outline" asChild>
                                        <Link href={companyEdit()}>
                                            Edit profil
                                        </Link>
                                    </Button>
                                </CardHeader>
                                <CardContent className="grid gap-4 md:grid-cols-3">
                                    <InfoTile label="Status verifikasi">
                                        <StatusBadge
                                            status={company.verification_status}
                                        />
                                    </InfoTile>
                                    <InfoTile label="Trust badge">
                                        <span className="text-sm font-medium text-foreground">
                                            {company.is_verified
                                                ? 'Perusahaan terverifikasi'
                                                : 'Menunggu verifikasi'}
                                        </span>
                                    </InfoTile>
                                    <InfoTile label="Paket aktif">
                                        <span className="text-sm font-medium text-foreground">
                                            {company.subscription ??
                                                'Belum ada paket aktif'}
                                        </span>
                                    </InfoTile>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Aksi cepat</CardTitle>
                                    <CardDescription>
                                        Shortcut untuk aksi harian recruiter dan
                                        employer admin.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-3">
                                    <Button asChild>
                                        <Link href={createJob()}>
                                            Buat Lowongan
                                        </Link>
                                    </Button>
                                    <Button variant="outline" asChild>
                                        <Link href={jobsIndex()}>
                                            Kelola Lowongan
                                        </Link>
                                    </Button>
                                    <Button variant="outline" asChild>
                                        <Link href={verificationIndex()}>
                                            Submit Verifikasi
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Pipeline kandidat</CardTitle>
                                    <CardDescription>
                                        Ringkasan pelamar per tahap rekrutmen
                                        untuk semua lowongan aktif.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-3 md:grid-cols-2">
                                    {pipelineSummary.map((item) => (
                                        <div
                                            key={item.status}
                                            className="rounded-xl border p-4"
                                        >
                                            <p className="text-sm text-muted-foreground">
                                                {item.label}
                                            </p>
                                            <p className="mt-2 text-2xl font-semibold text-foreground">
                                                {item.total}
                                            </p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Lamaran terbaru</CardTitle>
                                    <CardDescription>
                                        Kandidat terbaru yang baru masuk ke
                                        pipeline perusahaan.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Kandidat</TableHead>
                                                <TableHead>Lowongan</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>AI Fit</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {recentApplications.length > 0 ? (
                                                recentApplications.map(
                                                    (application) => (
                                                        <TableRow
                                                            key={application.id}
                                                        >
                                                            <TableCell>
                                                                <div>
                                                                    <p className="font-medium text-foreground">
                                                                        {
                                                                            application.candidate_name
                                                                        }
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {application.headline ??
                                                                            application.applied_at ??
                                                                            '-'}
                                                                    </p>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                {application.job_title ??
                                                                    '-'}
                                                            </TableCell>
                                                            <TableCell>
                                                                {
                                                                    application.status
                                                                }
                                                            </TableCell>
                                                            <TableCell>
                                                                {application.ai_fit_score ===
                                                                    null ||
                                                                application.ai_fit_score ===
                                                                    undefined
                                                                    ? '-'
                                                                    : `${application.ai_fit_score}%`}
                                                            </TableCell>
                                                        </TableRow>
                                                    ),
                                                )
                                            ) : (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={4}
                                                        className="h-20 text-center text-muted-foreground"
                                                    >
                                                        Belum ada lamaran masuk.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader className="flex-row items-start justify-between gap-4">
                                <div>
                                    <CardTitle>Lowongan terbaru</CardTitle>
                                    <CardDescription>
                                        Snapshot cepat untuk lowongan yang
                                        paling baru diupdate.
                                    </CardDescription>
                                </div>
                                <Button variant="outline" asChild>
                                    <Link href={jobsIndex()}>
                                        Lihat semua lowongan
                                    </Link>
                                </Button>
                            </CardHeader>
                            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                {recentJobs.length > 0 ? (
                                    recentJobs.map((job) => (
                                        <div
                                            key={job.id}
                                            className="rounded-xl border p-4"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <h3 className="font-medium text-foreground">
                                                    {job.title}
                                                </h3>
                                                <StatusBadge
                                                    status={job.status}
                                                    label={job.status}
                                                />
                                            </div>
                                            <dl className="mt-4 space-y-2 text-sm text-muted-foreground">
                                                <div className="flex items-center justify-between gap-3">
                                                    <dt>Pelamar</dt>
                                                    <dd>
                                                        {job.applications_count}
                                                    </dd>
                                                </div>
                                                <div className="flex items-center justify-between gap-3">
                                                    <dt>Publish</dt>
                                                    <dd>{job.published_at}</dd>
                                                </div>
                                            </dl>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        Belum ada lowongan yang dibuat.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </>
    );
}

function InfoTile({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-xl border bg-background p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <div className="mt-2">{children}</div>
        </div>
    );
}

function StatusBadge({ status, label }: { status: string; label?: string }) {
    const normalized = status.toLowerCase();
    const variant =
        normalized === 'approved' || normalized === 'published'
            ? 'default'
            : normalized === 'pending' || normalized === 'need_revision'
              ? 'outline'
              : 'secondary';

    return (
        <Badge variant={variant}>
            {label ?? normalized.replaceAll('_', ' ')}
        </Badge>
    );
}

EmployerDashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard Perusahaan',
            href: dashboard(),
        },
    ],
};
