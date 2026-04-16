import { Head, Link } from '@inertiajs/react';
import CandidateApplicationController from '@/actions/App/Http/Controllers/Candidate/CandidateApplicationController';
import Heading from '@/components/heading';
import { StatusBadge } from '@/components/candidate/candidate-ui';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { show as applicationShow, index } from '@/routes/candidate/applications';
import { show as jobShow } from '@/routes/candidate/jobs';

type ApplicationShowProps = {
    application: {
        id: number;
        status: string;
        status_label: string;
        cover_letter?: string | null;
        screening_answers: Record<string, string>;
        ai_fit_score?: number | null;
        applied_at?: string | null;
        cv_url?: string | null;
        job: {
            id?: number | null;
            slug?: string | null;
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
    };
};

export default function CandidateApplicationShow({
    application,
}: ApplicationShowProps) {
    return (
        <>
            <Head title="Detail Lamaran" />
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <Heading
                        title={application.job.title ?? 'Detail Lamaran'}
                        description={`${application.job.company ?? 'Perusahaan'} · ${application.applied_at ?? '-'}`}
                    />
                    <div className="flex flex-wrap gap-2">
                        {application.job.slug ? (
                            <Button asChild variant="outline">
                                <Link href={jobShow(application.job.slug)}>
                                    Detail lowongan
                                </Link>
                            </Button>
                        ) : null}
                        {!['hired', 'rejected', 'withdrawn'].includes(
                            application.status,
                        ) ? (
                            <Button asChild variant="destructive">
                                <Link
                                    href={CandidateApplicationController.withdraw(
                                        application.id,
                                    )}
                                    method="patch"
                                    as="button"
                                >
                                    Tarik lamaran
                                </Link>
                            </Button>
                        ) : null}
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle>Status lamaran</CardTitle>
                            <CardDescription>
                                Tahap terkini dan ringkasan AI fit.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <StatusBadge
                                status={application.status}
                                label={application.status_label}
                            />
                            <Info label="AI fit">
                                {application.ai_fit_score
                                    ? `${application.ai_fit_score}%`
                                    : '-'}
                            </Info>
                            <Info label="CV">
                                {application.cv_url ? (
                                    <a
                                        className="text-primary underline-offset-4 hover:underline"
                                        href={application.cv_url}
                                        target="_blank"
                                    >
                                        Lihat CV
                                    </a>
                                ) : (
                                    '-'
                                )}
                            </Info>
                            <Info label="Mode kerja">
                                {application.job.work_mode ?? '-'}
                            </Info>
                            <Info label="Tipe">
                                {application.job.job_type ?? '-'}
                            </Info>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Cover letter</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">
                                {application.cover_letter ?? '-'}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Status history</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {application.histories.map((history) => (
                                <div
                                    className="rounded-lg border p-3"
                                    key={history.id}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <StatusBadge
                                            status={history.to_status}
                                            label={history.to_status_label}
                                        />
                                        <span className="text-sm text-muted-foreground">
                                            {history.created_at}
                                        </span>
                                    </div>
                                    {history.note ? (
                                        <p className="mt-2 text-sm text-muted-foreground">
                                            {history.note}
                                        </p>
                                    ) : null}
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Interview</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {application.interviews.length ? (
                                application.interviews.map((interview) => (
                                    <div
                                        className="rounded-lg border p-3"
                                        key={interview.id}
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
                                                Buka link interview
                                            </a>
                                        ) : null}
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Belum ada jadwal interview.
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
