import { Head, Link, router } from '@inertiajs/react';
import {
    Ban,
    ChevronLeft,
    ChevronRight,
    Eye,
    Filter,
    Pencil,
    Plus,
    Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
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
import { useTranslate } from '@/hooks/use-translate';
import {
    cleanPaginationLabel,
    isNextPaginationLabel,
    isPreviousPaginationLabel,
    shouldRenderPagination,
} from '@/lib/pagination';
import {
    close,
    create,
    destroy,
    edit,
    index,
    show,
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
            is_anonymous: boolean;
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
    const { t } = useTranslate();
    const handleClose = (jobId: number): void => {
        router.patch(
            close(jobId),
            {},
            {
                preserveScroll: true,
                onError: (errors) => {
                    toast.error(
                        resolveErrorMessage(
                            errors,
                            t('employer.jobs_index.close_job_failed'),
                        ),
                    );
                },
            },
        );
    };

    const handleDelete = (jobId: number): void => {
        router.delete(destroy(jobId), {
            preserveScroll: true,
            onError: (errors) => {
                toast.error(
                    resolveErrorMessage(
                        errors,
                        t('employer.jobs_index.delete_draft_failed'),
                    ),
                );
            },
        });
    };

    return (
        <>
            <Head title={t('employer.jobs_index.page_title')} />

            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <Heading
                        title={t('employer.jobs_index.page_title')}
                        description={t('employer.jobs_index.page_description', {
                            company: company.name,
                        })}
                    />
                    <Button
                        asChild
                        className="bg-primary-500 text-white hover:bg-primary-600"
                    >
                        <Link href={create()}>
                            <Plus className="size-4" />
                            {t('employer.jobs_index.create_job')}
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>
                            {t('employer.jobs_index.filter_jobs')}
                        </CardTitle>
                        <CardDescription>
                            {t('employer.jobs_index.filter_description')}
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
                                placeholder={t(
                                    'employer.jobs_index.search_placeholder',
                                )}
                            />
                            <select
                                name="status"
                                defaultValue={filters.status ?? ''}
                                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none"
                            >
                                <option value="">
                                    {t('employer.jobs_index.all_status')}
                                </option>
                                <option value="draft">
                                    {t('employer.jobs_index.status_draft')}
                                </option>
                                <option value="published">
                                    {t('employer.jobs_index.status_published')}
                                </option>
                                <option value="closed">
                                    {t('employer.jobs_index.status_closed')}
                                </option>
                                <option value="rejected">
                                    {t('employer.jobs_index.status_rejected')}
                                </option>
                                <option value="suspended">
                                    {t('employer.jobs_index.status_suspended')}
                                </option>
                            </select>
                            <Button
                                type="submit"
                                variant="outline"
                                className="border-slate-300 text-slate-700 hover:bg-slate-100"
                            >
                                <Filter className="size-4" />
                                {t('employer.jobs_index.apply_filter')}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>
                            {t('employer.jobs_index.jobs_list')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="overflow-x-auto">
                            <Table className="min-w-180">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>
                                            {t('employer.jobs_index.title')}
                                        </TableHead>
                                        <TableHead>
                                            {t('employer.jobs_index.status')}
                                        </TableHead>
                                        <TableHead>
                                            {t('employer.jobs_index.work_mode')}
                                        </TableHead>
                                        <TableHead>
                                            {t('employer.jobs_index.job_type')}
                                        </TableHead>
                                        <TableHead>
                                            {t(
                                                'employer.jobs_index.applicants',
                                            )}
                                        </TableHead>
                                        <TableHead>
                                            {t('employer.jobs_index.publish')}
                                        </TableHead>
                                        <TableHead className="text-right">
                                            {t('employer.jobs_index.actions')}
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {jobs.data.length > 0 ? (
                                        jobs.data.map((job) => (
                                            <TableRow key={job.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex flex-col gap-1">
                                                        {job.title}
                                                        {job.is_anonymous ? (
                                                            <span className="inline-flex w-fit items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                                                                {t(
                                                                    'employer.jobs_index.anonymous',
                                                                )}
                                                            </span>
                                                        ) : null}
                                                    </div>
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
                                                            className="border-sky-200 text-sky-700 hover:bg-sky-50 hover:text-sky-800"
                                                            asChild
                                                        >
                                                            <Link
                                                                href={show(
                                                                    job.id,
                                                                )}
                                                            >
                                                                <Eye className="size-4" />
                                                                {t(
                                                                    'employer.jobs_index.detail',
                                                                )}
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800"
                                                            asChild
                                                        >
                                                            <Link
                                                                href={edit(
                                                                    job.id,
                                                                )}
                                                            >
                                                                <Pencil className="size-4" />
                                                                {t(
                                                                    'employer.jobs_index.edit',
                                                                )}
                                                            </Link>
                                                        </Button>
                                                        {job.status ===
                                                        'published' ? (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="border-secondary-300 text-secondary-700 hover:bg-secondary-50 hover:text-secondary-800"
                                                                onClick={() =>
                                                                    handleClose(
                                                                        job.id,
                                                                    )
                                                                }
                                                            >
                                                                <Ban className="size-4" />
                                                                {t(
                                                                    'employer.jobs_index.close',
                                                                )}
                                                            </Button>
                                                        ) : null}
                                                        {job.status ===
                                                        'draft' ? (
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        job.id,
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 className="size-4" />
                                                                {t(
                                                                    'employer.jobs_index.delete',
                                                                )}
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
                                                {t(
                                                    'employer.jobs_index.empty_message',
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {shouldRenderPagination(jobs.links) ? (
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
                                                {isPreviousPaginationLabel(
                                                    link.label,
                                                ) ? (
                                                    <ChevronLeft className="size-4" />
                                                ) : null}
                                                {cleanPaginationLabel(
                                                    link.label,
                                                )}
                                                {isNextPaginationLabel(
                                                    link.label,
                                                ) ? (
                                                    <ChevronRight className="size-4" />
                                                ) : null}
                                            </Link>
                                        ) : (
                                            <span>
                                                {isPreviousPaginationLabel(
                                                    link.label,
                                                ) ? (
                                                    <ChevronLeft className="size-4" />
                                                ) : null}
                                                {cleanPaginationLabel(
                                                    link.label,
                                                )}
                                                {isNextPaginationLabel(
                                                    link.label,
                                                ) ? (
                                                    <ChevronRight className="size-4" />
                                                ) : null}
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

function resolveErrorMessage(
    errors: Record<string, string | string[]>,
    fallback: string,
): string {
    const first = Object.values(errors)[0];

    if (Array.isArray(first) && first.length > 0) {
        return first[0] ?? fallback;
    }

    if (typeof first === 'string' && first.length > 0) {
        return first;
    }

    return fallback;
}

EmployerJobsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Kelola Lowongan',
            href: index(),
        },
    ],
};
