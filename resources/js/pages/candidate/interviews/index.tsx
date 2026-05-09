import { Head, Link } from '@inertiajs/react';
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    useReactTable,
} from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import { Bot, ExternalLink, MapPin, Monitor, Video } from 'lucide-react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
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
import { index } from '@/routes/candidate/interviews';

type Interview = {
    id: number;
    source: 'manual' | 'ai';
    source_label: string;
    job_title?: string | null;
    company?: string | null;
    scheduled_at?: string | null;
    mode: string;
    mode_label: string;
    location_url?: string | null;
    show_meeting_link: boolean;
    status: string;
    detail_url: string;
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

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    pending: {
        label: 'candidate.interviews.status_pending',
        className: 'bg-secondary-50 text-secondary-700 border-secondary-200',
    },
    scheduled: {
        label: 'candidate.interviews.status_scheduled',
        className: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    confirmed: {
        label: 'candidate.interviews.status_confirmed',
        className: 'bg-green-50 text-green-700 border-green-200',
    },
    completed: {
        label: 'candidate.interviews.status_completed',
        className: 'bg-slate-50 text-slate-600 border-slate-200',
    },
    cancelled: {
        label: 'candidate.interviews.status_cancelled',
        className: 'bg-red-50 text-red-600 border-red-200',
    },
    rescheduled: {
        label: 'candidate.interviews.status_rescheduled',
        className: 'bg-secondary-50 text-secondary-700 border-secondary-200',
    },
    in_progress: {
        label: 'candidate.interviews.status_in_progress',
        className: 'bg-primary-50 text-primary-700 border-primary-200',
    },
};

function StatusBadge({
    status,
    t,
}: {
    status: string;
    t: (key: string) => string;
}) {
    const config = STATUS_CONFIG[status] ?? {
        label: '',
        className: 'bg-slate-50 text-slate-600 border-slate-200',
    };

    const label = config.label ? t(config.label) : status;

    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.className}`}
        >
            {label}
        </span>
    );
}

function ModeIcon({ mode }: { mode: string }) {
    if (mode === 'voice_ai' || mode === 'text_ai') {
        return <Bot className="size-3.5" />;
    }

    if (mode === 'online') {
        return <Video className="size-3.5" />;
    }

    if (mode === 'offline') {
        return <MapPin className="size-3.5" />;
    }

    return <Monitor className="size-3.5" />;
}

function createColumns(t: (key: string) => string): ColumnDef<Interview>[] {
    return [
        {
            accessorKey: 'job_title',
            header: t('candidate.interviews.col_position'),
            cell: ({ row }) => (
                <div>
                    <p className="font-medium text-foreground">
                        {row.original.job_title ?? '-'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {row.original.company ?? '-'}
                    </p>
                </div>
            ),
        },
        {
            accessorKey: 'scheduled_at',
            header: t('candidate.interviews.col_schedule'),
            cell: ({ row }) => (
                <span className="text-sm">
                    {row.original.scheduled_at ?? '-'}
                </span>
            ),
        },
        {
            accessorKey: 'mode_label',
            header: t('candidate.interviews.col_mode'),
            cell: ({ row }) => (
                <span className="inline-flex items-center gap-1.5 text-sm capitalize">
                    <ModeIcon mode={row.original.mode} />
                    {row.original.mode_label}
                </span>
            ),
        },
        {
            accessorKey: 'source_label',
            header: t('candidate.interviews.col_type'),
            cell: ({ row }) => (
                <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${
                        row.original.source === 'ai'
                            ? 'border-primary-200 bg-primary-50 text-primary-700'
                            : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                >
                    {row.original.source_label}
                </span>
            ),
        },
        {
            accessorKey: 'status',
            header: t('candidate.interviews.col_status'),
            cell: ({ row }) => (
                <StatusBadge status={row.original.status} t={t} />
            ),
        },
        {
            id: 'actions',
            header: t('candidate.interviews.col_action'),
            cell: ({ row }) => {
                const interview = row.original;

                return (
                    <div className="flex items-center gap-2">
                        {interview.show_meeting_link &&
                            interview.location_url &&
                            interview.status !== 'cancelled' && (
                                <Button size="sm" variant="outline" asChild>
                                    <a
                                        href={interview.location_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="gap-1.5"
                                    >
                                        <ExternalLink className="size-3.5" />
                                        {t('candidate.interviews.open_link')}
                                    </a>
                                </Button>
                            )}
                        <Button size="sm" asChild>
                            <Link href={interview.detail_url}>
                                {interview.source === 'ai'
                                    ? interview.status === 'completed'
                                        ? t(
                                              'candidate.interviews.view_ai_result',
                                          )
                                        : t(
                                              'candidate.interviews.start_ai_interview',
                                          )
                                    : t('candidate.interviews.detail')}
                            </Link>
                        </Button>
                    </div>
                );
            },
        },
    ];
}

export default function CandidateInterviewsIndex({
    interviews,
}: InterviewsIndexProps) {
    const { t } = useTranslate();
    const columns = createColumns(t);

    const table = useReactTable({
        data: interviews.data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageSize: 10 } },
    });

    return (
        <>
            <Head title={t('candidate.interviews.page_title')} />
            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title={t('candidate.interviews.page_title')}
                    description={t('candidate.interviews.page_description')}
                />

                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Input
                            placeholder={t(
                                'candidate.interviews.search_placeholder',
                            )}
                            value={
                                (table
                                    .getColumn('job_title')
                                    ?.getFilterValue() as string) ?? ''
                            }
                            onChange={(e) =>
                                table
                                    .getColumn('job_title')
                                    ?.setFilterValue(e.target.value)
                            }
                            className="max-w-sm"
                        />
                    </div>

                    <div className="overflow-x-auto rounded-md border bg-white">
                        <Table className="min-w-180">
                            <TableHeader>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <TableHead key={header.id}>
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
                                        <TableRow key={row.id}>
                                            {row
                                                .getVisibleCells()
                                                .map((cell) => (
                                                    <TableCell key={cell.id}>
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
                                            className="h-24 text-center text-muted-foreground"
                                        >
                                            {t('candidate.interviews.empty')}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-muted-foreground">
                            {table.getFilteredRowModel().rows.length}{' '}
                            {t('candidate.interviews.data_count_suffix')}
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                            >
                                {t('candidate.interviews.previous')}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                            >
                                {t('candidate.interviews.next')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

CandidateInterviewsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Jadwal Interview',
            href: index(),
        },
    ],
};
