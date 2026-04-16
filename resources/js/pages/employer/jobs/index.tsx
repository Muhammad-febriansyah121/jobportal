import { Head, Link, router } from '@inertiajs/react';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    close,
    create,
    destroy,
    edit,
    index,
    publish,
} from '@/routes/employer/jobs';

type JobsIndexProps = {
    company: {
        id: number;
        name: string;
    };
    filters: {
        search?: string;
        status?: string;
    };
    jobs: {
        data: Array<{
            id: number;
            title: string;
            status: string;
            status_label: string;
            work_mode: string;
            job_type: string;
            applications_count: number;
            published_at: string;
        }>;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
};

export default function EmployerJobsIndex({
    company,
    filters,
    jobs,
}: JobsIndexProps) {
    return (
        <>
            <Head title="Kelola Lowongan" />

            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <Heading
                        title="Kelola Lowongan"
                        description={`Daftar lowongan milik ${company.name} dengan status publish dan jumlah pelamar.`}
                    />
                    <Button asChild>
                        <Link href={create()}>Buat Lowongan</Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Filter lowongan</CardTitle>
                        <CardDescription>
                            Saring lowongan berdasarkan judul dan status
                            workflow.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form
                            className="grid gap-4 md:grid-cols-[1fr_220px_auto]"
                            onSubmit={(event) => {
                                event.preventDefault();

                                const formData = new FormData(
                                    event.currentTarget,
                                );

                                router.get(
                                    index(),
                                    {
                                        search:
                                            formData
                                                .get('search')
                                                ?.toString() ?? '',
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
                            <Input
                                name="search"
                                defaultValue={filters.search ?? ''}
                                placeholder="Cari judul lowongan"
                            />
                            <select
                                name="status"
                                defaultValue={filters.status ?? ''}
                                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none"
                            >
                                <option value="">Semua status</option>
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                                <option value="closed">Closed</option>
                                <option value="rejected">Rejected</option>
                                <option value="suspended">Suspended</option>
                            </select>
                            <Button type="submit" variant="outline">
                                Terapkan Filter
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Daftar lowongan</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Judul</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Mode kerja</TableHead>
                                    <TableHead>Jenis kerja</TableHead>
                                    <TableHead>Pelamar</TableHead>
                                    <TableHead>Publish</TableHead>
                                    <TableHead className="text-right">
                                        Aksi
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {jobs.data.length > 0 ? (
                                    jobs.data.map((job) => (
                                        <TableRow key={job.id}>
                                            <TableCell className="font-medium">
                                                {job.title}
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge
                                                    status={job.status}
                                                    label={job.status_label}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {job.work_mode}
                                            </TableCell>
                                            <TableCell>
                                                {job.job_type}
                                            </TableCell>
                                            <TableCell>
                                                {job.applications_count}
                                            </TableCell>
                                            <TableCell>
                                                {job.published_at}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={edit(job.id)}
                                                        >
                                                            Edit
                                                        </Link>
                                                    </Button>
                                                    {job.status === 'draft' ? (
                                                        <Button
                                                            size="sm"
                                                            asChild
                                                        >
                                                            <Link
                                                                href={publish(
                                                                    job.id,
                                                                )}
                                                                method="patch"
                                                                as="button"
                                                            >
                                                                Publish
                                                            </Link>
                                                        </Button>
                                                    ) : null}
                                                    {job.status ===
                                                    'published' ? (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            asChild
                                                        >
                                                            <Link
                                                                href={close(
                                                                    job.id,
                                                                )}
                                                                method="patch"
                                                                as="button"
                                                            >
                                                                Tutup
                                                            </Link>
                                                        </Button>
                                                    ) : null}
                                                    {job.status === 'draft' ? (
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            asChild
                                                        >
                                                            <Link
                                                                href={destroy(
                                                                    job.id,
                                                                )}
                                                                method="delete"
                                                                as="button"
                                                            >
                                                                Hapus
                                                            </Link>
                                                        </Button>
                                                    ) : null}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="h-24 text-center text-muted-foreground"
                                        >
                                            Belum ada lowongan yang cocok dengan
                                            filter ini.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>

                        {jobs.links.length > 0 ? (
                            <div className="flex flex-wrap justify-end gap-2">
                                {jobs.links.map((link) => (
                                    <Button
                                        key={`${link.label}-${link.url}`}
                                        asChild={Boolean(link.url)}
                                        disabled={!link.url}
                                        size="sm"
                                        variant={
                                            link.active ? 'default' : 'outline'
                                        }
                                    >
                                        {link.url ? (
                                            <Link href={link.url}>
                                                {cleanLabel(link.label)}
                                            </Link>
                                        ) : (
                                            <span>
                                                {cleanLabel(link.label)}
                                            </span>
                                        )}
                                    </Button>
                                ))}
                            </div>
                        ) : null}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

function StatusBadge({ status, label }: { status: string; label: string }) {
    const variant =
        status === 'published'
            ? 'default'
            : status === 'draft'
              ? 'outline'
              : 'secondary';

    return <Badge variant={variant}>{label}</Badge>;
}

function cleanLabel(label: string) {
    return label
        .replace('&laquo;', '«')
        .replace('&raquo;', '»')
        .replace('pagination.previous', '«')
        .replace('pagination.next', '»');
}

EmployerJobsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Kelola Lowongan',
            href: index(),
        },
    ],
};
