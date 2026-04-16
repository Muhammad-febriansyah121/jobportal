import { Head, Link } from '@inertiajs/react';
import Heading from '@/components/heading';
import {
    EmptyState,
    PaginationLinks,
    StatusBadge,
} from '@/components/candidate/candidate-ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { index, show } from '@/routes/candidate/interviews';

type Interview = {
    id: number;
    job_title?: string | null;
    company?: string | null;
    scheduled_at?: string | null;
    mode: string;
    location_url?: string | null;
    status: string;
};

type InterviewsIndexProps = {
    interviews: {
        data: Interview[];
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
};

export default function CandidateInterviewsIndex({
    interviews,
}: InterviewsIndexProps) {
    return (
        <>
            <Head title="Interview" />
            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title="Interview"
                    description="Lihat jadwal, link, dan status interview yang masuk dari perusahaan."
                />

                <div className="grid gap-4">
                    {interviews.data.length ? (
                        interviews.data.map((interview) => (
                            <Card key={interview.id}>
                                <CardContent className="p-5">
                                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                        <div>
                                            <p className="font-semibold">
                                                {interview.job_title}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {interview.company} ·{' '}
                                                {interview.scheduled_at} ·{' '}
                                                {interview.mode}
                                            </p>
                                            <div className="mt-3">
                                                <StatusBadge
                                                    status={interview.status}
                                                />
                                            </div>
                                        </div>
                                        <Button asChild>
                                            <Link href={show(interview.id)}>
                                                Detail
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <EmptyState
                            title="Belum ada interview"
                            description="Undangan interview akan muncul di halaman ini."
                        />
                    )}
                </div>

                <PaginationLinks links={interviews.links} />
            </div>
        </>
    );
}

CandidateInterviewsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Interview',
            href: index(),
        },
    ],
};
