import { Head, Link, router } from '@inertiajs/react';
import {
    type ColumnDef,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    type SortingState,
    useReactTable,
} from '@tanstack/react-table';
import {
    ArrowLeft,
    ArrowUpDown,
    CheckCircle2,
    Clock3,
    ExternalLink,
    FileText,
    Headphones,
    PlayCircle,
    Search,
    Sparkles,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { StatusBadge } from '@/components/candidate/candidate-ui';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import {
    destroy,
    feedback,
    history,
    index as simulatorIndex,
    show,
} from '@/routes/candidate/ai-interviews';

type Session = {
    id: number;
    application_id: number;
    job_title?: string | null;
    company?: string | null;
    status: string;
    interview_mode?: string | null;
    interview_language?: string | null;
    scheduled_at?: string | null;
    started_at?: string | null;
    completed_at?: string | null;
    duration_minutes?: number | null;
};

type HistoryProps = {
    sessions: Session[];
    filters: {
        status: string;
        mode: string;
    };
    stats: {
        total: number;
        completed: number;
        in_progress: number;
        scheduled: number;
    };
};

type TranslateFn = (key: string) => string;

const DELETABLE_STATUSES = ['completed', 'declined', 'cancelled'];

function buildColumns(t: TranslateFn, onDeleteRequest: (id: number) => void): ColumnDef<Session>[] {
    return [
        {
            accessorKey: 'job_title',
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8 font-semibold"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                >
                    {t('candidate.ai_interview_history.col_position')}
                    <ArrowUpDown className="size-3.5" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="space-y-0.5">
                    <p className="font-semibold text-foreground">
                        {row.original.job_title ?? '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {row.original.company ?? '—'}
                    </p>
                </div>
            ),
        },
        {
            id: 'tanggal',
            accessorFn: (row) =>
                row.completed_at ?? row.started_at ?? row.scheduled_at ?? null,
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8 font-semibold"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                >
                    {t('candidate.ai_interview_history.col_date')}
                    <ArrowUpDown className="size-3.5" />
                </Button>
            ),
            cell: ({ getValue }) => (
                <span className="text-sm text-muted-foreground">
                    {(getValue() as string | null) ?? '—'}
                </span>
            ),
        },
        {
            accessorKey: 'duration_minutes',
            header: t('candidate.ai_interview_history.col_duration'),
            cell: ({ getValue }) => {
                const val = getValue() as number | null;
                return (
                    <span className="text-sm text-muted-foreground">
                        {val ? `${val} menit` : '—'}
                    </span>
                );
            },
        },
        {
            accessorKey: 'interview_mode',
            header: t('candidate.ai_interview_history.col_mode'),
            cell: ({ getValue }) => {
                const mode = getValue() as string | null;
                return (
                    <Badge variant="outline" className="gap-1">
                        {mode === 'text' ? (
                            <>
                                <FileText className="size-3" />
                                {t('candidate.ai_interview_history.mode_text')}
                            </>
                        ) : (
                            <>
                                <Headphones className="size-3" />
                                {t('candidate.ai_interview_history.mode_voice')}
                            </>
                        )}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'status',
            header: t('candidate.ai_interview_history.col_status'),
            cell: ({ getValue }) => (
                <StatusBadge status={getValue() as string} />
            ),
        },
        {
            id: 'actions',
            header: '',
            cell: ({ row }) => {
                const session = row.original;
                return (
                    <div className="flex items-center justify-end gap-2">
                        {session.status === 'completed' && (
                            <Button asChild size="sm" variant="secondary">
                                <Link href={feedback(session.id)}>{t('candidate.ai_interview_history.btn_feedback')}</Link>
                            </Button>
                        )}
                        <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                        >
                            <Link href={show(session.id)}>
                                <ExternalLink className="size-3.5" />
                                {t('candidate.ai_interview_history.btn_open')}
                            </Link>
                        </Button>
                        {DELETABLE_STATUSES.includes(session.status) && (
                            <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => onDeleteRequest(session.id)}
                            >
                                <Trash2 className="size-3.5" />
                            </Button>
                        )}
                    </div>
                );
            },
        },
    ];
}

export default function CandidateAiInterviewHistory({
    sessions,
    filters,
    stats,
}: HistoryProps) {
    const { t } = useTranslate();
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    const statusOptions = [
        { value: 'all', label: t('candidate.ai_interview_history.status_all') },
        { value: 'scheduled', label: t('candidate.ai_interview_history.status_scheduled') },
        { value: 'in_progress', label: t('candidate.ai_interview_history.status_in_progress') },
        { value: 'completed', label: t('candidate.ai_interview_history.status_completed') },
        { value: 'declined', label: t('candidate.ai_interview_history.status_declined') },
    ];

    const modeOptions = [
        { value: 'all', label: t('candidate.ai_interview_history.mode_all') },
        { value: 'text', label: t('candidate.ai_interview_history.mode_text') },
        { value: 'voice', label: t('candidate.ai_interview_history.mode_voice') },
    ];

    const handleDelete = () => {
        if (!deleteId) { return; }
        setDeleting(true);
        router.delete(destroy(deleteId).url, {
            onFinish: () => {
                setDeleting(false);
                setDeleteId(null);
            },
        });
    };

    const applyFilter = (key: 'status' | 'mode', value: string) => {
        const resolved = value === 'all' ? '' : value;
        router.get(
            history({
                query: {
                    status: key === 'status' ? resolved : filters.status,
                    mode: key === 'mode' ? resolved : filters.mode,
                },
            }).url,
            {},
            { preserveScroll: true, preserveState: true },
        );
    };

    const columns = buildColumns(t, (id) => setDeleteId(id));

    const table = useReactTable({
        data: sessions,
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

    const pageCount = table.getPageCount();
    const pageIndex = table.getState().pagination.pageIndex;

    return (
        <>
            <Head title={t('candidate.ai_interview_history.page_title')} />
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <Heading
                        title={t('candidate.ai_interview_history.heading_title')}
                        description={t('candidate.ai_interview_history.heading_desc')}
                    />
                    <Button asChild variant="outline">
                        <Link href={simulatorIndex().url}>
                            <ArrowLeft className="size-4" />
                            {t('candidate.ai_interview_history.btn_back')}
                        </Link>
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        icon={Sparkles}
                        label={t('candidate.ai_interview_history.stat_total')}
                        value={stats.total}
                    />
                    <StatCard
                        icon={CheckCircle2}
                        label={t('candidate.ai_interview_history.stat_completed')}
                        value={stats.completed}
                        tone="text-green-700"
                    />
                    <StatCard
                        icon={PlayCircle}
                        label={t('candidate.ai_interview_history.stat_in_progress')}
                        value={stats.in_progress}
                        tone="text-blue-700"
                    />
                    <StatCard
                        icon={Clock3}
                        label={t('candidate.ai_interview_history.stat_scheduled')}
                        value={stats.scheduled}
                        tone="text-amber-700"
                    />
                </div>

                {/* DataTable */}
                <Card>
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle>{t('candidate.ai_interview_history.card_title')}</CardTitle>
                        <div className="flex flex-wrap gap-2">
                            <Select
                                value={filters.status || 'all'}
                                onValueChange={(value) =>
                                    applyFilter('status', value)
                                }
                            >
                                <SelectTrigger className="w-44">
                                    <SelectValue placeholder={t('candidate.ai_interviews.filter_status_placeholder')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptions.map((opt) => (
                                        <SelectItem
                                            key={opt.value}
                                            value={opt.value}
                                        >
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={filters.mode || 'all'}
                                onValueChange={(value) =>
                                    applyFilter('mode', value)
                                }
                            >
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder={t('candidate.ai_interviews.filter_mode_placeholder')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {modeOptions.map((opt) => (
                                        <SelectItem
                                            key={opt.value}
                                            value={opt.value}
                                        >
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {/* Search + page size */}
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative w-full max-w-sm">
                                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder={t('candidate.ai_interview_history.search_placeholder')}
                                    value={globalFilter}
                                    onChange={(e) =>
                                        setGlobalFilter(e.target.value)
                                    }
                                    className="h-9 pl-9"
                                />
                            </div>
                            <div className="ml-auto flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                    {t('candidate.ai_interview_history.rows_label')}
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
                                    {table
                                        .getHeaderGroups()
                                        .map((headerGroup) => (
                                            <TableRow
                                                key={headerGroup.id}
                                                className="bg-slate-50 hover:bg-slate-50 dark:bg-muted/30 dark:hover:bg-muted/30"
                                            >
                                                {headerGroup.headers.map(
                                                    (header) => (
                                                        <TableHead
                                                            key={header.id}
                                                        >
                                                            {header.isPlaceholder
                                                                ? null
                                                                : flexRender(
                                                                      header
                                                                          .column
                                                                          .columnDef
                                                                          .header,
                                                                      header.getContext(),
                                                                  )}
                                                        </TableHead>
                                                    ),
                                                )}
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
                                                                    .columnDef
                                                                    .cell,
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
                                                className="py-16 text-center text-muted-foreground"
                                            >
                                                {t('candidate.ai_interview_history.empty_text')}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {pageCount > 1 && (
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">
                                    {t('candidate.ai_interview_history.page_label', { current: String(pageIndex + 1), total: String(pageCount) })}
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            table.previousPage()
                                        }
                                        disabled={!table.getCanPreviousPage()}
                                    >
                                        {t('candidate.ai_interview_history.btn_prev')}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => table.nextPage()}
                                        disabled={!table.getCanNextPage()}
                                    >
                                        {t('candidate.ai_interview_history.btn_next')}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            <Dialog open={deleteId !== null} onOpenChange={(open) => { if (!open) { setDeleteId(null); } }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('candidate.ai_interview_history.delete_title')}</DialogTitle>
                        <DialogDescription>
                            {t('candidate.ai_interview_history.delete_desc')}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>
                            {t('candidate.ai_interview_history.btn_cancel')}
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                            {deleting ? t('candidate.ai_interview_history.btn_deleting') : t('candidate.ai_interview_history.btn_delete')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function StatCard({
    icon: Icon,
    label,
    value,
    tone,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: number;
    tone?: string;
}) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                    <Icon className="size-4" />
                    {label}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className={tone ? `text-3xl font-semibold ${tone}` : 'text-3xl font-semibold'}>
                    {value}
                </p>
            </CardContent>
        </Card>
    );
}

CandidateAiInterviewHistory.layout = {
    breadcrumbs: [
        {
            title: 'AI Simulator',
            href: simulatorIndex(),
        },
        {
            title: 'Riwayat',
            href: history(),
        },
    ],
};
