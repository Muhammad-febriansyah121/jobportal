import { Head, Link, router, useForm } from '@inertiajs/react';
import { useTranslate } from '@/hooks/use-translate';
import {
    type ColumnDef,
    type ExpandedState,
    flexRender,
    getCoreRowModel,
    getExpandedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import {
    Check,
    ChevronDown,
    ChevronRight,
    Clock,
    Flag,
    History,
    MessageCircle,
    RotateCcw,
    Search,
    Star,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { cleanPaginationLabel, shouldRenderPagination } from '@/lib/pagination';
import {
    approve,
    index as adminCompanyReviewsIndex,
    reject,
} from '@/routes/admin/company-reviews';

type Review = {
    id: number;
    rating: number;
    title: string | null;
    review: string | null;
    status: string;
    created_at: string | null;
    reviewed_at: string | null;
    reviewer_name: string | null;
    rejection_reason: string | null;
    company: { id: number | null; name: string | null; slug: string | null };
    candidate: { name: string; email: string | null };
    employer_reply: string | null;
    employer_replied_at: string | null;
    flag_reason: string | null;
    flagged_at: string | null;
    flagged_by: string | null;
    flag_resolved_at: string | null;
};

type IndexProps = {
    tab: 'pending' | 'history' | 'flagged';
    search: string;
    reviews: {
        data: Review[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    counts: { pending: number; flagged: number; history: number };
};

/* ─── Small helpers ─── */

function StarRating({ rating }: { rating: number }) {
    return (
        <span className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
                <Star
                    key={i}
                    className={cn(
                        'size-3.5',
                        i < rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/25',
                    )}
                />
            ))}
        </span>
    );
}

function StatusBadge({ status }: { status: string }) {
    const { t } = useTranslate();

    if (status === 'approved')
        return (
            <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
                {t('admin.company_reviews_index.badge_approved')}
            </Badge>
        );
    if (status === 'rejected')
        return (
            <Badge className="border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
                {t('admin.company_reviews_index.badge_rejected')}
            </Badge>
        );
    return (
        <Badge className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
            {t('admin.company_reviews_index.badge_pending')}
        </Badge>
    );
}

function ApproveButton({ review }: { review: Review }) {
    const { t } = useTranslate();

    return (
        <Button
            size="sm"
            className="h-8 gap-1.5 bg-emerald-600 px-3 text-xs text-white hover:bg-emerald-700"
            onClick={() => router.patch(approve(review.id).url, {}, { preserveScroll: true })}
        >
            <Check className="size-3" />
            {t('admin.company_reviews_index.approve_btn')}
        </Button>
    );
}

function RejectButton({ review }: { review: Review }) {
    const { t } = useTranslate();
    const [open, setOpen] = useState(false);
    const form = useForm<{ rejection_reason: string }>({ rejection_reason: '' });

    const submit = () => {
        form.patch(reject(review.id).url, {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                form.reset('rejection_reason');
            },
        });
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 border-red-200 px-3 text-xs text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20"
                >
                    <X className="size-3" />
                    {t('admin.company_reviews_index.reject_btn')}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('admin.company_reviews_index.reject_dialog_title')}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('admin.company_reviews_index.reject_dialog_desc')}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <Textarea
                    rows={3}
                    value={form.data.rejection_reason}
                    onChange={(e) => form.setData('rejection_reason', e.target.value)}
                    placeholder={t('admin.company_reviews_index.reject_placeholder')}
                />
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={form.processing}>{t('admin.company_reviews_index.cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={submit}
                        disabled={form.processing}
                        className="bg-red-600 text-white hover:bg-red-700"
                    >
                        {form.processing ? t('admin.company_reviews_index.rejecting') : t('admin.company_reviews_index.reject_confirm')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function buildColumns(tab: string, t: (key: string) => string): ColumnDef<Review>[] {
    const isFlaggedTab = tab === 'flagged';
    const isHistoryTab = tab === 'history';
    const showActions = tab !== 'history';

    return [
        {
            id: 'expander',
            header: '',
            size: 36,
            cell: ({ row }) => (
                <Button
                    variant="ghost"
                    size="sm"
                    className="size-7 p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => row.toggleExpanded()}
                >
                    {row.getIsExpanded() ? (
                        <ChevronDown className="size-4" />
                    ) : (
                        <ChevronRight className="size-4" />
                    )}
                </Button>
            ),
        },
        {
            id: 'company',
            header: t('admin.company_reviews_index.col_company'),
            cell: ({ row }) => {
                const { company } = row.original;
                return (
                    <div className="flex items-center gap-2.5">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                            {(company.name ?? '?').charAt(0).toUpperCase()}
                        </div>
                        {company.slug ? (
                            <Link
                                href={`/companies/${company.slug}`}
                                className="text-sm font-medium hover:text-primary hover:underline"
                            >
                                {company.name ?? '-'}
                            </Link>
                        ) : (
                            <span className="text-sm font-medium">{company.name ?? '-'}</span>
                        )}
                    </div>
                );
            },
        },
        {
            id: 'candidate',
            header: t('admin.company_reviews_index.col_candidate'),
            cell: ({ row }) => (
                <div className="space-y-0.5">
                    <p className="text-sm font-medium">{row.original.candidate.name}</p>
                    {row.original.candidate.email && (
                        <p className="text-xs text-muted-foreground">{row.original.candidate.email}</p>
                    )}
                </div>
            ),
        },
        {
            accessorKey: 'rating',
            header: t('admin.company_reviews_index.col_rating'),
            cell: ({ row }) => (
                <div className="space-y-0.5">
                    <StarRating rating={row.original.rating} />
                    <p className="text-[10px] font-semibold text-muted-foreground">
                        {row.original.rating}/5
                    </p>
                </div>
            ),
        },
        {
            id: 'content',
            header: t('admin.company_reviews_index.col_content'),
            cell: ({ row }) => (
                <div className="max-w-xs space-y-0.5">
                    {row.original.title && (
                        <p className="truncate text-sm font-semibold">{row.original.title}</p>
                    )}
                    {row.original.review && (
                        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                            {row.original.review}
                        </p>
                    )}
                </div>
            ),
        },
        {
            id: 'flags',
            header: '',
            cell: ({ row }) => {
                const isFlagged =
                    Boolean(row.original.flagged_at) && !row.original.flag_resolved_at;
                if (!isFlagged) return null;
                return (
                    <Badge className="gap-1 border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-400">
                        <Flag className="size-3" />
                        {t('admin.company_reviews_index.col_flagged')}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'status',
            header: t('admin.company_reviews_index.col_status'),
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
        },
        {
            id: 'date',
            header: isFlaggedTab ? t('admin.company_reviews_index.col_date_flagged') : isHistoryTab ? t('admin.company_reviews_index.col_date_reviewed') : t('admin.company_reviews_index.col_date_submitted'),
            cell: ({ row }) => {
                const date = isFlaggedTab
                    ? row.original.flagged_at
                    : isHistoryTab
                      ? row.original.reviewed_at
                      : row.original.created_at;
                return (
                    <span className="whitespace-nowrap text-xs text-muted-foreground">{date ?? '-'}</span>
                );
            },
        },
        ...(showActions
            ? [
                  {
                      id: 'actions',
                      header: '',
                      cell: ({ row }: { row: { original: Review } }) => (
                          <div className="flex items-center gap-1.5">
                              <ApproveButton review={row.original} />
                              <RejectButton review={row.original} />
                          </div>
                      ),
                  } satisfies ColumnDef<Review>,
              ]
            : []),
    ];
}

function ExpandedDetail({ review }: { review: Review }) {
    const { t } = useTranslate();

    return (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm dark:border-slate-700 dark:bg-slate-900/40">
            {(review.title || review.review) && (
                <div className="space-y-1.5">
                    {review.title && (
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {review.title}
                        </p>
                    )}
                    {review.review && (
                        <p className="whitespace-pre-wrap leading-6 text-slate-600 dark:text-slate-400">
                            {review.review}
                        </p>
                    )}
                </div>
            )}

            {review.flag_reason && (
                <div className="flex gap-3 rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-800/40 dark:bg-orange-950/20">
                    <Flag className="mt-0.5 size-4 shrink-0 text-orange-500" />
                    <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-orange-700 dark:text-orange-400">
                            {t('admin.company_reviews_index.flag_from_employer')}
                        </p>
                        <p className="text-sm text-orange-900 dark:text-orange-300">
                            {review.flag_reason}
                        </p>
                        <p className="text-xs text-orange-600 dark:text-orange-500">
                            {t('admin.company_reviews_index.flag_reported_at', { date: review.flagged_at ?? '-', name: review.flagged_by ?? '-' })}
                        </p>
                    </div>
                </div>
            )}

            {review.employer_reply && (
                <div className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800/40 dark:bg-blue-950/20">
                    <MessageCircle className="mt-0.5 size-4 shrink-0 text-blue-500" />
                    <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
                            {t('admin.company_reviews_index.employer_reply')}
                        </p>
                        <p className="whitespace-pre-wrap text-sm text-blue-900 dark:text-blue-300">
                            {review.employer_reply}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-500">
                            {review.employer_replied_at}
                        </p>
                    </div>
                </div>
            )}

            {review.status !== 'pending' && (
                <div className="flex items-center gap-1.5 border-t pt-2.5 text-xs text-muted-foreground">
                    <span
                        className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium',
                            review.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-red-50 text-red-700',
                        )}
                    >
                        {review.status === 'approved' ? (
                            <Check className="size-3" />
                        ) : (
                            <X className="size-3" />
                        )}
                        {review.status === 'approved' ? t('admin.company_reviews_index.badge_approved') : t('admin.company_reviews_index.badge_rejected')}
                    </span>
                    <span>{t('admin.company_reviews_index.reviewed_by', { name: review.reviewer_name ?? '-', date: review.reviewed_at ?? '-' })}</span>
                    {review.rejection_reason && (
                        <span className="italic">— {review.rejection_reason}</span>
                    )}
                </div>
            )}
        </div>
    );
}

/* ─── Main page ─── */

export default function AdminCompanyReviewsIndex({
    tab,
    search,
    reviews,
    counts,
}: IndexProps) {
    const { t } = useTranslate();
    const [searchValue, setSearchValue] = useState(search);
    const [expanded, setExpanded] = useState<ExpandedState>({});
    const columns = buildColumns(tab, t);

    const table = useReactTable({
        data: reviews.data,
        columns,
        state: { expanded },
        onExpandedChange: setExpanded,
        getCoreRowModel: getCoreRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
    });

    const setTab = (next: string) => {
        router.get(
            adminCompanyReviewsIndex({ query: { tab: next } }).url,
            {},
            { preserveScroll: true, preserveState: false },
        );
    };

    const submitSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            adminCompanyReviewsIndex({ query: { tab, search: searchValue } }).url,
            {},
            { preserveScroll: true, preserveState: false },
        );
    };

    const TAB_CONFIG = [
        {
            value: 'pending',
            label: t('admin.company_reviews_index.tab_pending'),
            count: counts.pending,
            icon: Clock,
            activeColor: 'border-amber-500 text-amber-700 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400',
            badgeColor: 'bg-amber-500 text-white',
        },
        {
            value: 'flagged',
            label: t('admin.company_reviews_index.tab_flagged'),
            count: counts.flagged,
            icon: Flag,
            activeColor: 'border-orange-500 text-orange-700 bg-orange-50 dark:bg-orange-950/20 dark:text-orange-400',
            badgeColor: 'bg-orange-500 text-white',
        },
        {
            value: 'history',
            label: t('admin.company_reviews_index.tab_history'),
            count: counts.history,
            icon: History,
            activeColor: 'border-primary text-primary bg-primary/5',
            badgeColor: 'bg-muted text-muted-foreground',
        },
    ] as const;

    return (
        <>
            <Head title={t('admin.company_reviews_index.page_title')} />

            <div className="space-y-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight">{t('admin.company_reviews_index.page_title')}</h1>
                    <p className="text-sm text-muted-foreground">
                        {t('admin.company_reviews_index.description')}
                    </p>
                </div>

                {/* Stat summary */}
                <div className="grid grid-cols-3 gap-3">
                    {TAB_CONFIG.map((cfg) => {
                        const Icon = cfg.icon;
                        const isActive = tab === cfg.value;
                        return (
                            <button
                                key={cfg.value}
                                type="button"
                                onClick={() => setTab(cfg.value)}
                                className={cn(
                                    'flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all hover:shadow-sm md:p-4',
                                    isActive
                                        ? cfg.activeColor + ' shadow-sm'
                                        : 'border-border bg-white dark:bg-card hover:border-border/80',
                                )}
                            >
                                <div
                                    className={cn(
                                        'flex size-9 shrink-0 items-center justify-center rounded-lg',
                                        isActive ? 'bg-white/60 dark:bg-white/10' : 'bg-muted',
                                    )}
                                >
                                    <Icon className="size-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-muted-foreground">{cfg.label}</p>
                                    <p className="text-xl font-bold tabular-nums">{cfg.count}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Table card */}
                <Card className="overflow-hidden p-0">
                    {/* Card header: active tab label + search */}
                    <CardHeader className="border-b bg-slate-50/80 px-4 py-3 dark:bg-muted/30">
                        <form
                            key={`${tab}-${search}`}
                            onSubmit={submitSearch}
                            className="flex flex-wrap items-center gap-2"
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-foreground">
                                    {TAB_CONFIG.find((c) => c.value === tab)?.label}
                                </span>
                                <Badge variant="secondary" className="tabular-nums">
                                    {t('admin.company_reviews_index.count_shown', { n: String(reviews.data.length) })}
                                </Badge>
                            </div>
                            <div className="ml-auto flex items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={searchValue}
                                        onChange={(e) => setSearchValue(e.target.value)}
                                        placeholder={t('admin.company_reviews_index.search_placeholder')}
                                        className="h-8 w-64 pl-8 text-sm"
                                    />
                                </div>
                                <Button type="submit" size="sm" className="h-8 gap-1.5 px-3 text-xs">
                                    <Search className="size-3" />
                                    {t('admin.company_reviews_index.search_btn')}
                                </Button>
                                {search && (
                                    <Button
                                        asChild
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="h-8 gap-1.5 px-3 text-xs"
                                    >
                                        <Link href={adminCompanyReviewsIndex({ query: { tab } }).url}>
                                            <RotateCcw className="size-3" />
                                            {t('admin.company_reviews_index.reset_btn')}
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </form>
                    </CardHeader>

                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    {table.getHeaderGroups().map((hg) => (
                                        <TableRow
                                            key={hg.id}
                                            className="bg-white hover:bg-white dark:bg-card dark:hover:bg-card"
                                        >
                                            {hg.headers.map((header) => (
                                                <TableHead
                                                    key={header.id}
                                                    className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase"
                                                >
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(
                                                              header.column.columnDef.header,
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
                                            <>
                                                <TableRow
                                                    key={row.id}
                                                    className={cn(
                                                        'group border-b transition-colors hover:bg-slate-50/80 dark:hover:bg-muted/30',
                                                        row.getIsExpanded() &&
                                                            'bg-slate-50/60 dark:bg-muted/20',
                                                    )}
                                                >
                                                    {row.getVisibleCells().map((cell) => (
                                                        <TableCell key={cell.id} className="py-3">
                                                            {flexRender(
                                                                cell.column.columnDef.cell,
                                                                cell.getContext(),
                                                            )}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                                {row.getIsExpanded() && (
                                                    <TableRow
                                                        key={`${row.id}-expanded`}
                                                        className="hover:bg-transparent dark:hover:bg-transparent"
                                                    >
                                                        <TableCell
                                                            colSpan={columns.length}
                                                            className="px-4 pb-4 pt-0 pl-12"
                                                        >
                                                            <ExpandedDetail review={row.original} />
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={columns.length}
                                                className="h-40 text-center"
                                            >
                                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                    <Star className="size-8 opacity-20" />
                                                    <p className="text-sm">{t('admin.company_reviews_index.empty_state')}</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {shouldRenderPagination(reviews.links) && (
                            <div className="flex flex-wrap items-center justify-end gap-2 border-t px-4 py-3">
                                {reviews.links.map((link) => (
                                    <Button
                                        key={`${link.label}-${link.url}`}
                                        asChild={Boolean(link.url)}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        className="h-8 min-w-8 px-2.5 text-xs"
                                        disabled={!link.url}
                                    >
                                        {link.url ? (
                                            <Link href={link.url}>{cleanPaginationLabel(link.label)}</Link>
                                        ) : (
                                            <span>{cleanPaginationLabel(link.label)}</span>
                                        )}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
