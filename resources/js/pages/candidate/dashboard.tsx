import { Head, Link } from '@inertiajs/react';
import {
    BriefcaseBusiness,
    CalendarClock,
    FileText,
    Search,
    Star,
} from 'lucide-react';
import Heading from '@/components/heading';
import {
    EmptyState,
    ProgressBar,
    StatusBadge,
} from '@/components/candidate/candidate-ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { dashboard } from '@/routes/candidate';
import { index as applicationsIndex } from '@/routes/candidate/applications';
import { index as cvsIndex } from '@/routes/candidate/cvs';
import { index as interviewsIndex } from '@/routes/candidate/interviews';
import { show as jobShow, index as jobsIndex } from '@/routes/candidate/jobs';
import { edit as profileEdit } from '@/routes/candidate/profile';
import { index as savedJobsIndex } from '@/routes/candidate/saved-jobs';

type JobCard = {
    id: number;
    slug: string;
    title: string;
    company: string | null;
    company_verified: boolean;
    location: string;
    work_mode: string;
    job_type: string;
    salary_range: string;
    published_at: string | null;
};

type DashboardProps = {
    profile: {
        full_name: string;
        headline?: string | null;
        location: string;
        profile_completion: number;
        preferred_role?: string | null;
        preferred_industry?: string | null;
        ai_cv_summary?: string | null;
    };
    metrics: {
        saved_jobs: number;
        active_applications: number;
        upcoming_interviews: number;
        verified_skills: number;
    };
    primaryCv: {
        file_url: string;
        uploaded_at: string | null;
    } | null;
    recommendedJobs: JobCard[];
    savedJobs: JobCard[];
    activeApplications: Array<{
        id: number;
        job_title: string | null;
        company: string | null;
        status: string;
        status_label: string;
        ai_fit_score?: number | null;
        applied_at?: string | null;
    }>;
    applicationTracker: Array<{
        status: string;
        label: string;
        total: number;
    }>;
    interviews: Array<{
        id: number;
        job_title: string | null;
        company: string | null;
        mode: string;
        location_url?: string | null;
        scheduled_at?: string | null;
        status: string;
    }>;
    skills: Array<{
        id: number;
        name: string;
        proficiency?: string | null;
        years_exp?: number | null;
        verified: boolean;
    }>;
    assessmentSuggestions: Array<{ id: number; name: string }>;
    careerTips: Array<{
        id: number;
        title: string;
        type: string;
        category?: string | null;
        published_at?: string | null;
    }>;
};

export default function CandidateDashboard({
    profile,
    metrics,
    primaryCv,
    recommendedJobs,
    savedJobs,
    activeApplications,
    applicationTracker,
    interviews,
    skills,
    assessmentSuggestions,
    careerTips,
}: DashboardProps) {
    const metricCards = [
        {
            label: 'Lowongan tersimpan',
            value: metrics.saved_jobs,
            href: savedJobsIndex(),
            icon: Star,
        },
        {
            label: 'Lamaran aktif',
            value: metrics.active_applications,
            href: applicationsIndex(),
            icon: BriefcaseBusiness,
        },
        {
            label: 'Interview',
            value: metrics.upcoming_interviews,
            href: interviewsIndex(),
            icon: CalendarClock,
        },
        {
            label: 'Skill verified',
            value: metrics.verified_skills,
            href: profileEdit(),
            icon: FileText,
        },
    ];

    return (
        <>
            <Head title="Dashboard Kandidat" />

            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <Heading
                        title={`Hai, ${profile.full_name}`}
                        description={
                            profile.headline ??
                            'Rapikan profil, cari lowongan yang cocok, dan pantau semua lamaran kamu.'
                        }
                    />
                    <Button asChild>
                        <Link href={jobsIndex()}>
                            <Search />
                            Cari Lowongan
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {metricCards.map((metric) => (
                        <Card key={metric.label}>
                            <CardHeader className="gap-2">
                                <CardDescription className="flex items-center gap-2">
                                    <metric.icon className="size-4" />
                                    {metric.label}
                                </CardDescription>
                                <CardTitle className="text-3xl">
                                    {metric.value}
                                </CardTitle>
                                <Button asChild variant="outline" size="sm">
                                    <Link href={metric.href}>Buka</Link>
                                </Button>
                            </CardHeader>
                        </Card>
                    ))}
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle>Kelengkapan profil</CardTitle>
                            <CardDescription>
                                Profil yang lengkap membantu AI match dan
                                recruiter membaca konteks kamu.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Completion
                                    </p>
                                    <p className="text-2xl font-semibold">
                                        {profile.profile_completion}%
                                    </p>
                                </div>
                                <Button asChild variant="outline">
                                    <Link href={profileEdit()}>
                                        Edit profil
                                    </Link>
                                </Button>
                            </div>
                            <ProgressBar value={profile.profile_completion} />
                            <div className="grid gap-3 md:grid-cols-2">
                                <Info label="Target role">
                                    {profile.preferred_role ?? '-'}
                                </Info>
                                <Info label="Industri minat">
                                    {profile.preferred_industry ?? '-'}
                                </Info>
                                <Info label="Lokasi">
                                    {profile.location || '-'}
                                </Info>
                                <Info label="CV utama">
                                    {primaryCv ? (
                                        <a
                                            className="text-primary underline-offset-4 hover:underline"
                                            href={primaryCv.file_url}
                                            target="_blank"
                                        >
                                            Dibuka {primaryCv.uploaded_at}
                                        </a>
                                    ) : (
                                        <Link
                                            className="text-primary underline-offset-4 hover:underline"
                                            href={cvsIndex()}
                                        >
                                            Upload CV
                                        </Link>
                                    )}
                                </Info>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Ringkasan AI CV</CardTitle>
                            <CardDescription>
                                Snapshot kekuatan utama dari CV aktif.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm leading-6 text-muted-foreground">
                                {profile.ai_cv_summary ??
                                    'Upload CV utama agar ringkasan kandidat siap dipakai untuk rekomendasi dan match score.'}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                    <Card>
                        <CardHeader className="flex-row items-start justify-between gap-4">
                            <div>
                                <CardTitle>Rekomendasi lowongan</CardTitle>
                                <CardDescription>
                                    Lowongan aktif yang paling dekat dengan
                                    profil dan skill kamu.
                                </CardDescription>
                            </div>
                            <Button asChild variant="outline">
                                <Link href={jobsIndex({ query: { tab: 'recommended' } })}>
                                    Lihat semua
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="grid gap-3">
                            {recommendedJobs.length ? (
                                recommendedJobs.map((job) => (
                                    <JobRow job={job} key={job.id} />
                                ))
                            ) : (
                                <EmptyState
                                    title="Belum ada rekomendasi"
                                    description="Tambahkan skill dan preferensi role agar rekomendasi makin tajam."
                                />
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Tracker lamaran</CardTitle>
                            <CardDescription>
                                Jumlah lamaran kamu di setiap tahap.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-3 sm:grid-cols-2">
                            {applicationTracker.map((item) => (
                                <div
                                    className="rounded-lg border p-3"
                                    key={item.status}
                                >
                                    <p className="text-sm text-muted-foreground">
                                        {item.label}
                                    </p>
                                    <p className="mt-1 text-2xl font-semibold">
                                        {item.total}
                                    </p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 xl:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Lamaran terbaru</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {activeApplications.length ? (
                                activeApplications.map((application) => (
                                    <div
                                        className="rounded-lg border p-3"
                                        key={application.id}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="font-medium">
                                                    {application.job_title}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {application.company}
                                                </p>
                                            </div>
                                            <StatusBadge
                                                status={application.status}
                                                label={application.status_label}
                                            />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <EmptyState
                                    title="Belum ada lamaran aktif"
                                    description="Mulai dari lowongan yang sesuai skill kamu."
                                />
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Interview</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {interviews.length ? (
                                interviews.map((interview) => (
                                    <div
                                        className="rounded-lg border p-3"
                                        key={interview.id}
                                    >
                                        <p className="font-medium">
                                            {interview.job_title}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {interview.company} ·{' '}
                                            {interview.scheduled_at}
                                        </p>
                                        <StatusBadge
                                            className="mt-3"
                                            status={interview.status}
                                        />
                                    </div>
                                ))
                            ) : (
                                <EmptyState
                                    title="Belum ada jadwal"
                                    description="Interview yang masuk akan tampil di sini."
                                />
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Skill badge</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-2">
                            {skills.length ? (
                                skills.map((skill) => (
                                    <Badge
                                        key={skill.id}
                                        variant={
                                            skill.verified
                                                ? 'default'
                                                : 'secondary'
                                        }
                                    >
                                        {skill.name}
                                    </Badge>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Tambahkan skill utama kamu.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Saved jobs</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3">
                            {savedJobs.length ? (
                                savedJobs.map((job) => (
                                    <JobRow job={job} key={job.id} />
                                ))
                            ) : (
                                <EmptyState
                                    title="Belum ada lowongan tersimpan"
                                    description="Simpan lowongan menarik untuk dibandingkan nanti."
                                />
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Assessment dan tips</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                {assessmentSuggestions.length ? (
                                    assessmentSuggestions.map((skill) => (
                                        <Badge
                                            key={skill.id}
                                            variant="outline"
                                        >
                                            {skill.name}
                                        </Badge>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        Semua skill utama siap dicoba saat
                                        assessment tersedia.
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                {careerTips.map((tip) => (
                                    <div
                                        className="rounded-lg border p-3"
                                        key={tip.id}
                                    >
                                        <p className="font-medium">
                                            {tip.title}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {tip.category ?? tip.type}
                                        </p>
                                    </div>
                                ))}
                            </div>
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
        <div className="rounded-lg border p-3">
            <p className="text-sm text-muted-foreground">{label}</p>
            <div className="mt-1 text-sm font-medium">{children}</div>
        </div>
    );
}

function JobRow({ job }: { job: JobCard }) {
    return (
        <Link
            className="rounded-lg border p-3 transition-colors hover:bg-muted/50"
            href={jobShow(job.slug)}
        >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                    <p className="font-medium">{job.title}</p>
                    <p className="text-sm text-muted-foreground">
                        {job.company} · {job.location || 'Remote'}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {job.company_verified ? (
                        <Badge variant="default">Verified</Badge>
                    ) : null}
                    <Badge variant="secondary">{job.work_mode}</Badge>
                </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
                {job.salary_range}
            </p>
        </Link>
    );
}

CandidateDashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard Kandidat',
            href: dashboard(),
        },
    ],
};
