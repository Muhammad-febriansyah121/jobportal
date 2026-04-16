import { Head, Link } from '@inertiajs/react';
import { BookmarkCheck } from 'lucide-react';
import Heading from '@/components/heading';
import { EmptyState, PaginationLinks } from '@/components/candidate/candidate-ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { show, unsave } from '@/routes/candidate/jobs';
import { index } from '@/routes/candidate/saved-jobs';

type SavedJob = {
    id: number;
    job_id: number;
    slug: string;
    title: string;
    company?: string | null;
    company_verified: boolean;
    location: string;
    work_mode: string;
    job_type: string;
    salary_range: string;
    saved_at?: string | null;
};

type SavedJobsProps = {
    savedJobs: {
        data: SavedJob[];
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
};

export default function CandidateSavedJobs({ savedJobs }: SavedJobsProps) {
    return (
        <>
            <Head title="Saved Jobs" />
            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title="Saved Jobs"
                    description="Lowongan yang kamu simpan untuk dibandingkan dan dilamar nanti."
                />

                <div className="grid gap-4">
                    {savedJobs.data.length ? (
                        savedJobs.data.map((job) => (
                            <Card key={job.id}>
                                <CardContent className="p-5">
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                        <div>
                                            <Link
                                                className="text-lg font-semibold underline-offset-4 hover:underline"
                                                href={show(job.slug)}
                                            >
                                                {job.title}
                                            </Link>
                                            <p className="text-sm text-muted-foreground">
                                                {job.company} ·{' '}
                                                {job.location || 'Remote'}
                                            </p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {job.company_verified ? (
                                                    <Badge>Verified</Badge>
                                                ) : null}
                                                <Badge variant="secondary">
                                                    {job.work_mode}
                                                </Badge>
                                                <Badge variant="secondary">
                                                    {job.job_type}
                                                </Badge>
                                            </div>
                                            <p className="mt-3 text-sm text-muted-foreground">
                                                {job.salary_range} · Disimpan{' '}
                                                {job.saved_at}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <Button asChild variant="outline">
                                                <Link
                                                    href={unsave(job.job_id)}
                                                    method="delete"
                                                    as="button"
                                                >
                                                    <BookmarkCheck />
                                                    Hapus simpanan
                                                </Link>
                                            </Button>
                                            <Button asChild>
                                                <Link href={show(job.slug)}>
                                                    Detail
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <EmptyState
                            title="Belum ada saved jobs"
                            description="Simpan lowongan menarik dari halaman cari lowongan."
                        />
                    )}
                </div>

                <PaginationLinks links={savedJobs.links} />
            </div>
        </>
    );
}

CandidateSavedJobs.layout = {
    breadcrumbs: [
        {
            title: 'Saved Jobs',
            href: index(),
        },
    ],
};
