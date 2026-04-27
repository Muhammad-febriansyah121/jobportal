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

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
    { value: 'all', label: 'Semua status' },
    { value: 'scheduled', label: 'Terjadwal' },
    { value: 'in_progress', label: 'Sedang berlangsung' },
    { value: 'completed', label: 'Selesai' },
    { value: 'declined', label: 'Ditolak' },
];

const MODE_OPTIONS: Array<{ value: string; label: string }> = [
    { value: 'all', label: 'Semua mode' },
    { value: 'text', label: 'Teks' },
    { value: 'voice', label: 'Voice AI' },
];

const DELETABLE_STATUSES = ['completed', 'declined', 'cancelled'];

const columns: ColumnDef<Session>[] = [
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
                Posisi
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
                Tanggal
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
        header: 'Durasi',
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
        header: 'Mode',
        cell: ({ getValue }) => {
            const mode = getValue() as string | null;
            return (
                <Badge variant="outline" className="gap-1">
                    {mode === 'text' ? (
                        <>
                            <FileText className="size-3" />
                            Teks
                        </>
                    ) : (
                        <>
                            <Headphones className="size-3" />
                            Voice AI
                        </>
                    )}
                </Badge>
            );
        },
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => (
            <StatusBadge status={getValue() as string} />
        ),
    },
    {
        id: 'actions',
        header: '',
        cell: ({ row, table }) => {
            const session = row.original;
            const { onDeleteRequest } = table.options.meta as { onDeleteRequest: (id: number) => void };
            return (
                <div className="flex items-center justify-end gap-2">
                    {session.status === 'completed' && (
                        <Button asChild size="sm" variant="secondary">
                            <Link href={feedback(session.id)}>Feedback</Link>
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
                            Buka
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

export default function CandidateAiInterviewHistory({
    sessions,
    filters,
    stats,
}: HistoryProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

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
        meta: { onDeleteRequest: (id: number) => setDeleteId(id) },
    });

    const pageCount = table.getPageCount();
    const pageIndex = table.getState().pagination.pageIndex;

    return (
        <>
            <Head title="Riwayat Latihan AI" />
            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <Heading
                        title="Riwayat Latihan AI"
                        description="Daftar sesi simulasi & interview AI dari semua lamaran kamu."
                    />
                    <Button asChild variant="outline">
                        <Link href={simulatorIndex().url}>
                            <ArrowLeft className="size-4" />
                            Kembali ke AI Simulator
                        </Link>
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        icon={Sparkles}
                        label="Total sesi"
                        value={stats.total}
                    />
                    <StatCard
                        icon={CheckCircle2}
                        label="Selesai"
                        value={stats.completed}
                        tone="text-green-700"
                    />
                    <StatCard
                        icon={PlayCircle}
                        label="Sedang berjalan"
                        value={stats.in_progress}
                        tone="text-blue-700"
                    />
                    <StatCard
                        icon={Clock3}
                        label="Terjadwal"
                        value={stats.scheduled}
                        tone="text-amber-700"
                    />
                </div>

                {/* DataTable */}
                <Card>
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle>Daftar sesi</CardTitle>
                        <div className="flex flex-wrap gap-2">
                            <Select
                                value={filters.status || 'all'}
                                onValueChange={(value) =>
                                    applyFilter('status', value)
                                }
                            >
                                <SelectTrigger className="w-44">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUS_OPTIONS.map((opt) => (
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
                                    <SelectValue placeholder="Mode" />
                                </SelectTrigger>
                                <SelectContent>
                                    {MODE_OPTIONS.map((opt) => (
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
                                    placeholder="Cari posisi atau perusahaan..."
                                    value={globalFilter}
                                    onChange={(e) =>
                                        setGlobalFilter(e.target.value)
                                    }
                                    className="h-9 pl-9"
                                />
                            </div>
                            <div className="ml-auto flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                    Baris:
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
                                                Belum ada riwayat sesi.
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
                                    Halaman {pageIndex + 1} dari {pageCount}
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
                                        Sebelumnya
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => table.nextPage()}
                                        disabled={!table.getCanNextPage()}
                                    >
                                        Selanjutnya
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
                        <DialogTitle>Hapus sesi interview?</DialogTitle>
                        <DialogDescription>
                            Data sesi ini, termasuk rekaman dan feedback AI, akan dihapus permanen dan tidak bisa dipulihkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                            {deleting ? 'Menghapus...' : 'Hapus'}
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
