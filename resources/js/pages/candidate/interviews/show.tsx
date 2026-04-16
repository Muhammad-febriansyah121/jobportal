import { Head, Link } from '@inertiajs/react';
import CandidateInterviewController from '@/actions/App/Http/Controllers/Candidate/CandidateInterviewController';
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
import { index, show } from '@/routes/candidate/interviews';

type InterviewShowProps = {
    interview: {
        id: number;
        application_id: number;
        job_title?: string | null;
        company?: string | null;
        scheduled_at?: string | null;
        mode: string;
        location_url?: string | null;
        status: string;
        participants: Array<{
            id: number;
            name?: string | null;
            email?: string | null;
            role: string;
        }>;
    };
};

export default function CandidateInterviewShow({
    interview,
}: InterviewShowProps) {
    return (
        <>
            <Head title="Detail Interview" />
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <Heading
                        title={interview.job_title ?? 'Detail Interview'}
                        description={`${interview.company ?? 'Perusahaan'} · ${interview.scheduled_at ?? '-'}`}
                    />
                    <div className="flex flex-wrap gap-2">
                        <Button asChild>
                            <Link
                                href={CandidateInterviewController.confirm(
                                    interview.id,
                                )}
                                method="patch"
                                as="button"
                            >
                                Konfirmasi
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link
                                href={CandidateInterviewController.decline(
                                    interview.id,
                                )}
                                method="patch"
                                as="button"
                            >
                                Tolak
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle>Jadwal</CardTitle>
                            <CardDescription>
                                Detail jadwal interview dari perusahaan.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <Info label="Status">
                                <StatusBadge status={interview.status} />
                            </Info>
                            <Info label="Waktu">
                                {interview.scheduled_at ?? '-'}
                            </Info>
                            <Info label="Mode">{interview.mode}</Info>
                            <Info label="Link">
                                {interview.location_url ? (
                                    <a
                                        className="text-primary underline-offset-4 hover:underline"
                                        href={interview.location_url}
                                        target="_blank"
                                    >
                                        Buka interview
                                    </a>
                                ) : (
                                    '-'
                                )}
                            </Info>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Participant</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {interview.participants.map((participant) => (
                                <div
                                    className="rounded-lg border p-3"
                                    key={participant.id}
                                >
                                    <p className="font-medium">
                                        {participant.name ?? '-'}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {participant.email ?? '-'} ·{' '}
                                        {participant.role}
                                    </p>
                                </div>
                            ))}
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
        <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium">{children}</span>
        </div>
    );
}

CandidateInterviewShow.layout = ({ interview }: InterviewShowProps) => ({
    breadcrumbs: [
        {
            title: 'Interview',
            href: index(),
        },
        {
            title: interview.job_title ?? 'Detail Interview',
            href: show(interview.id),
        },
    ],
});
