import { Link } from '@inertiajs/react';
import { useState } from 'react';
import { AdminActionList } from '@/components/admin/admin-action';
import { useTranslate } from '@/hooks/use-translate';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cleanPaginationLabel, shouldRenderPagination } from '@/lib/pagination';
import { cn } from '@/lib/utils';
import type {
    AdminBadgeCell,
    AdminCell,
    AdminColumn,
    AdminImageCell,
    AdminLinkCell,
    AdminPaginatedRows,
    AdminRow,
} from '@/types';

export function AdminDataTable({
    columns,
    rows,
    emptyState,
}: {
    columns: AdminColumn[];
    rows: AdminPaginatedRows | AdminRow[];
    emptyState?: string;
}) {
    const { t } = useTranslate();
    const data = Array.isArray(rows) ? rows : rows.data;
    const links = Array.isArray(rows) ? [] : (rows.links ?? []);
    const hasActions = data.some((row) => row.actions && row.actions.length > 0);
    const resolvedEmptyState = emptyState ?? t('admin.components.admin_data_table.empty');

    return (
        <div className="space-y-4">
            <Card className="overflow-hidden p-0">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table className="min-w-180">
                            <TableHeader>
                                <TableRow className="bg-slate-50 hover:bg-slate-50 dark:bg-muted/30 dark:hover:bg-muted/30">
                                    {columns.map((column) => (
                                        <TableHead
                                            key={column.key}
                                            className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                                        >
                                            {column.label}
                                        </TableHead>
                                    ))}
                                    {hasActions && (
                                        <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            {t('admin.components.admin_data_table.actions')}
                                        </TableHead>
                                    )}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.length ? (
                                    data.map((row) => (
                                        <TableRow
                                            key={row.id}
                                            className="hover:bg-slate-50/80 dark:hover:bg-muted/20"
                                        >
                                            {columns.map((column) => (
                                                <TableCell key={`${row.id}-${column.key}`}>
                                                    <Cell value={row[column.key] as AdminCell} />
                                                </TableCell>
                                            ))}
                                            {hasActions && (
                                                <TableCell className="min-w-52">
                                                    <AdminActionList actions={row.actions} />
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length + (hasActions ? 1 : 0)}
                                            className="h-32 text-center text-muted-foreground"
                                        >
                                            {resolvedEmptyState}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {shouldRenderPagination(links) && (
                <div className="flex flex-wrap items-center justify-end gap-2">
                    {links.map((link) => (
                        <Button
                            asChild={Boolean(link.url)}
                            variant={link.active ? 'default' : 'outline'}
                            size="sm"
                            disabled={!link.url}
                            key={`${link.label}-${link.url}`}
                        >
                            {link.url ? (
                                <Link href={normalizeInternalUrl(link.url)}>
                                    {cleanPaginationLabel(link.label)}
                                </Link>
                            ) : (
                                <span>{cleanPaginationLabel(link.label)}</span>
                            )}
                        </Button>
                    ))}
                </div>
            )}
        </div>
    );
}

function normalizeInternalUrl(url: string): string {
    if (typeof window === 'undefined') {
        return url;
    }

    try {
        const parsedUrl = new URL(url, window.location.href);

        if (parsedUrl.hostname !== window.location.hostname) {
            return url;
        }

        return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
    } catch {
        return url;
    }
}

function Cell({ value }: { value: AdminCell }) {
    const { t } = useTranslate();

    if (value === null || value === undefined || value === '') {
        return <span className="text-muted-foreground">-</span>;
    }

    if (typeof value === 'object' && 'type' in value && value.type === 'image') {
        return <ImageCell value={value} />;
    }

    if (typeof value === 'object' && 'type' in value && value.type === 'link') {
        return <LinkCell value={value} />;
    }

    if (typeof value === 'object' && 'label' in value) {
        return <BadgeCell value={value} />;
    }

    if (typeof value === 'boolean') {
        return value ? t('admin.components.admin_data_table.yes') : t('admin.components.admin_data_table.no');
    }

    return <span className="break-words">{String(value)}</span>;
}

function ImageCell({ value }: { value: AdminImageCell }) {
    if (!value.src) {
        return (
            <div className="flex size-10 items-center justify-center rounded-md border bg-muted text-xs font-semibold text-muted-foreground">
                {value.alt?.slice(0, 1) ?? '-'}
            </div>
        );
    }

    return (
        <img
            src={value.src}
            alt={value.alt ?? ''}
            className="size-10 rounded-md border object-cover"
        />
    );
}

function LinkCell({ value }: { value: AdminLinkCell }) {
    const { t } = useTranslate();
    const [open, setOpen] = useState(false);
    const isImage = /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(value.href);
    const isPdf = /\.pdf(\?.*)?$/i.test(value.href);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="text-left text-sm break-all text-blue-600 underline hover:text-blue-800"
            >
                {value.label}
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{value.label}</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center gap-4">
                        {isImage && (
                            <img
                                src={value.href}
                                alt={value.label}
                                className="max-h-[60vh] w-full rounded-md border object-contain"
                            />
                        )}
                        {isPdf && (
                            <iframe
                                src={value.href}
                                className="h-[60vh] w-full rounded-md border"
                                title={value.label}
                            />
                        )}
                        {!isImage && !isPdf && (
                            <p className="text-sm text-muted-foreground">
                                {t('admin.components.admin_data_table.preview_unavailable')}
                            </p>
                        )}
                        <a
                            href={value.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 underline hover:text-blue-800"
                        >
                            {t('admin.components.admin_data_table.open_new_tab')}
                        </a>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

function BadgeCell({ value }: { value: AdminBadgeCell }) {
    const tone = value.tone ?? 'neutral';

    return (
        <Badge
            variant={tone === 'danger' ? 'destructive' : tone === 'success' ? 'default' : 'outline'}
            className={cn(
                tone === 'success' && 'border-emerald-600 bg-emerald-600 text-white',
                tone === 'warning' && 'border-secondary-500 bg-secondary-50 text-secondary-700',
                tone === 'neutral' && 'text-muted-foreground',
            )}
        >
            {value.label}
        </Badge>
    );
}
