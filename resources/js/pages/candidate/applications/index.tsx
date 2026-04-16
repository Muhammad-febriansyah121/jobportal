import { Head, Link, router } from '@inertiajs/react';
import Heading from '@/components/heading';
import {
    EmptyState,
    PaginationLinks,
    StatusBadge,
} from '@/components/candidate/candidate-ui';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Select } from '@/components/candidate/candidate-form';
import { index, show } from '@/routes/candidate/applications';

type Application = {
    id: number;
    job_title?: string | null;
    company?: string | null;
    status: string;
    status_label: string;
    ai_fit_score?: number | null;
    applied_at?: string | null;
    updated_at?: string | null;
};

type ApplicationsIndexProps = {
    filters: {
        status?: string;
    };
    applications: {
        data: Application[];
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
};

export default function CandidateApplicationsIndex({
    filters,
    applications,
}: ApplicationsIndexProps) {
    return (
        <>
            <Head title="Lamaran Saya" />
            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title="Lamaran Saya"
                    description="Pantau semua lamaran, status tracker, dan riwayat respon perusahaan."
                />

                <Card>
                    <CardHeader>
                        <CardTitle>Filter status</CardTitle>
                        <CardDescription>
                            Saring lamaran berdasarkan tahap rekrutmen.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form
                            className="flex flex-col gap-3 md:flex-row"
                            onSubmit={(event) => {
                                event.preventDefault();
                                const formData = new FormData(
                                    event.currentTarget,
                                );

                                router.get(
                                    index(),
                                    {
                                        status:
                                            formData
                                                .get('status')
                                                ?.toString() ?? '',
                                    },
                                    {
                                        preserveScroll: true,
                                        preserveState: true,
                                    },
                                );
                            }}
                        >
                            <Select
                                name="status"
                                defaultValue={filters.status ?? ''}
                                className="md:max-w-64"
                            >
                                <option value="">Semua status</option>
                                <option value="applied">Terkirim</option>
                                <option value="screened">Screening</option>
                                <option value="shortlisted">Shortlist</option>
                                <option value="interview">Interview</option>
                                <option value="offer">Offer</option>
                                <option value="hired">Diterima</option>
                                <option value="rejected">Ditolak</option>
                                <option value="withdrawn">Ditarik</option>
                            </Select>
                            <Button type="submit" variant="outline">
                                Terapkan
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="grid gap-4">
                    {applications.data.length ? (
                        applications.data.map((application) => (
                            <Card key={application.id}>
                                <CardContent className="p-5">
                                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                        <div>
                                            <p className="font-semibold">
                                                {application.job_title}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {application.company} · Lamar{' '}
                                                {application.applied_at}
                                            </p>
                                            <div className="mt-3">
                                                <StatusBadge
                                                    status={application.status}
                                                    label={
                                                        application.status_label
                                                    }
                                                />
                                            </div>
                                        </div>
                                        <Button asChild>
                                            <Link href={show(application.id)}>
                                                Detail
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <EmptyState
                            title="Belum ada lamaran"
                            description="Lamaran yang kamu kirim akan muncul di sini."
                        />
                    )}
                </div>

                <PaginationLinks links={applications.links} />
            </div>
        </>
    );
}

CandidateApplicationsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Lamaran Saya',
            href: index(),
        },
    ],
};
