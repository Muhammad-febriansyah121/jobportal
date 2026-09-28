import { Head, Link, router } from '@inertiajs/react';
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import {
    ArrowUpDown,
    BookmarkX,
    Bookmark,
    Building2,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    MapPin,
    Search,
} from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useTranslate } from '@/hooks/use-translate';
import { show, unsave } from '@/routes/candidate/jobs';
import { index } from '@/routes/candidate/saved-jobs';

type SavedJob = {
    id: number;
    job_id: number;
    slug: string;
    title: string;
    status?: string | null;
    is_open: boolean;
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

const STATUS_LABEL_KEYS: Record<string, string> = {
    draft: 'candidate.saved_jobs.status_draft',
    pending_review: 'candidate.saved_jobs.status_pending_review',
    closed: 'candidate.saved_jobs.status_closed',
    suspended: 'candidate.saved_jobs.status_suspended',
    rejected: 'candidate.saved_jobs.status_rejected',
    published: 'candidate.saved_jobs.status_published',
};

function StatusBadgeCell({
    status,
    t,
}: {
    status?: string | null;
    t: (key: string) => string;
}) {
    const statusLabel = (value?: string | null) => {
        if (!value) {
            return '-';
        }

        return t(STATUS_LABEL_KEYS[value] ?? value);
    };

    if (!status || status === 'published') {
        return (
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400">
                {t('candidate.saved_jobs.status_published')}
            </Badge>
        );
    }

    const danger = ['suspended', 'rejected', 'closed'];
    const warning = ['pending_review'];

    if (danger.includes(status)) {
        return <Badge variant="destructive">{statusLabel(status)}</Badge>;
    }

    if (warning.includes(status)) {
        return (
            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400">
                {statusLabel(status)}
            </Badge>
        );
    }

    return <Badge variant="secondary">{statusLabel(status)}</Badge>;
}

function createColumns(t: (key: string) => string): ColumnDef<SavedJob>[] {
    return [
        {
            accessorKey: 'title',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8 font-semibold"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                >
                    {t('candidate.saved_jobs.col_position')}
                    <ArrowUpDown className="size-3.5" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="space-y-0.5">
                    {row.original.is_open ? (
                        <Link
                            href={show(row.original.slug).url}
                            className="font-semibold text-foreground hover:text-primary-600 hover:underline"
                        >
                            {row.getValue('title')}
                        </Link>
                    ) : (
                        <span className="font-semibold text-muted-foreground">
                            {row.getValue('title')}
                        </span>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Building2 className="size-3" />
                        {row.original.company ?? '—'}
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'location',
            header: t('candidate.saved_jobs.col_location'),
            cell: ({ row }) => (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="size-3 shrink-0" />
                    {(row.getValue('location') as string) ||
                        t('candidate.saved_jobs.remote')}
                </div>
            ),
        },
        {
            accessorKey: 'work_mode',
            header: t('candidate.saved_jobs.col_work_mode'),
            cell: ({ row }) => (
                <Badge variant="outline" className="capitalize">
                    {row.getValue('work_mode')}
                </Badge>
            ),
        },
        {
            accessorKey: 'job_type',
            header: t('candidate.saved_jobs.col_type'),
            cell: ({ row }) => (
                <Badge variant="secondary" className="capitalize">
                    {row.getValue('job_type')}
                </Badge>
            ),
        },
        {
            accessorKey: 'salary_range',
            header: t('candidate.saved_jobs.col_salary'),
            cell: ({ row }) => (
                <span className="text-sm font-medium text-foreground">
                    {row.getValue('salary_range')}
                </span>
            ),
        },
        {
            accessorKey: 'status',
            header: t('candidate.saved_jobs.col_status'),
            cell: ({ row }) => (
                <StatusBadgeCell status={row.getValue('status')} t={t} />
            ),
        },
        {
            accessorKey: 'saved_at',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8 font-semibold"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                >
                    {t('candidate.saved_jobs.col_saved_at')}
                    <ArrowUpDown className="size-3.5" />
                </Button>
            ),
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {row.getValue('saved_at') ?? '-'}
                </span>
            ),
        },
        {
            id: 'actions',
            header: '',
            cell: ({ row }) => {
                const job = row.original;
                const isActive = job.is_open;

                return (
                    <div className="flex items-center gap-2">
                        {isActive && (
                            <Button
                                asChild
                                size="sm"
                                variant="outline"
                                className="gap-1.5"
                            >
                                <Link href={show(job.slug).url}>
                                    <ExternalLink className="size-3.5" />
                                    {t('candidate.saved_jobs.view')}
                                </Link>
                            </Button>
                        )}
                        <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-destructive hover:border-destructive hover:bg-destructive/5 hover:text-destructive"
                            onClick={() => {
                                if (
                                    confirm(
                                        t(
                                            'candidate.saved_jobs.confirm_delete',
                                        ),
                                    )
                                ) {
                                    router.delete(unsave(job.job_id).url);
                                }
                            }}
                        >
                            <BookmarkX className="size-3.5" />
                            {t('candidate.saved_jobs.delete')}
                        </Button>
                    </div>
                );
            },
        },
    ];
}

export default function CandidateSavedJobs({ savedJobs }: SavedJobsProps) {
    const { t } = useTranslate();
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const columns = createColumns(t);

    const table = useReactTable({
        data: savedJobs.data,
        columns,
        state: { sorting, globalFilter },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize: 10 } },
    });

    const totalFiltered = table.getFilteredRowModel().rows.length;
    const pageIndex = table.getState().pagination.pageIndex;
    const pageSize = table.getState().pagination.pageSize;
    const pageCount = table.getPageCount();

    return (
        <>
            <Head title={t('candidate.saved_jobs.page_title')} />
            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title={t('candidate.saved_jobs.page_title')}
                    description={t('candidate.saved_jobs.page_description')}
                />

                <div className="space-y-4">
                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder={t(
                                    'candidate.saved_jobs.search_placeholder',
                                )}
                                value={globalFilter}
                                onChange={(e) =>
                                    setGlobalFilter(e.target.value)
                                }
                                className="h-9 pl-9"
                            />
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                                {t('candidate.saved_jobs.rows')}
                            </span>
                            <Select
                                value={String(
                                    table.getState().pagination.pageSize,
                                )}
                                onValueChange={(v) =>
                                    table.setPageSize(Number(v))
                                }
                            >
                                <SelectTrigger className="h-9 w-20">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[10, 20, 50].map((size) => (
                                        <SelectItem
                                            key={size}
                                            value={String(size)}
                                        >
                                            {size}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-hidden rounded-xl border bg-white shadow-sm dark:bg-card">
                        <Table>
                            <TableHeader>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow
                                        key={headerGroup.id}
                                        className="bg-slate-50 hover:bg-slate-50 dark:bg-muted/30 dark:hover:bg-muted/30"
                                    >
                                        {headerGroup.headers.map((header) => (
                                            <TableHead
                                                key={header.id}
                                                className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                                            >
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                          header.column
                                                              .columnDef.header,
                                                          header.getContext(),
                                                      )}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow
                                            key={row.id}
                                            className="hover:bg-slate-50/80 dark:hover:bg-muted/20"
                                        >
                                            {row
                                                .getVisibleCells()
                                                .map((cell) => (
                                                    <TableCell
                                                        key={cell.id}
                                                        className="py-3.5"
                                                    >
                                                        {flexRender(
                                                            cell.column
                                                                .columnDef.cell,
                                                            cell.getContext(),
                                                        )}
                                                    </TableCell>
                                                ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length}
                                            className="py-16 text-center"
                                        >
                                            <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                                <Bookmark className="size-10 opacity-30" />
                                                <div>
                                                    <p className="font-medium">
                                                        {t(
                                                            'candidate.saved_jobs.empty_title',
                                                        )}
                                                    </p>
                                                    <p className="text-sm">
                                                        {globalFilter
                                                            ? t(
                                                                  'candidate.saved_jobs.empty_try_other',
                                                              )
                                                            : t(
                                                                  'candidate.saved_jobs.empty_description',
                                                              )}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <p className="text-sm text-muted-foreground">
                            {t('candidate.saved_jobs.showing')}{' '}
                            <span className="font-medium text-foreground">
                                {totalFiltered === 0
                                    ? 0
                                    : pageIndex * pageSize + 1}
                                –
                                {Math.min(
                                    (pageIndex + 1) * pageSize,
                                    totalFiltered,
                                )}
                            </span>{' '}
                            {t('candidate.saved_jobs.of')}{' '}
                            <span className="font-medium text-foreground">
                                {totalFiltered}
                            </span>{' '}
                            {t('candidate.saved_jobs.jobs')}
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                            >
                                <ChevronLeft className="size-4" />
                                {t('candidate.saved_jobs.previous')}
                            </Button>
                            <span className="rounded-md border bg-white px-3 py-1 text-sm font-medium dark:bg-card">
                                {pageIndex + 1} / {pageCount || 1}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                            >
                                {t('candidate.saved_jobs.next')}
                                <ChevronRight className="size-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

CandidateSavedJobs.layout = {
    breadcrumbs: [
        {
            title: 'Lowongan Tersimpan',
            href: index(),
        },
    ],
};
