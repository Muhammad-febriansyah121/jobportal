import { Link } from '@inertiajs/react';
import { AdminActionList } from '@/components/admin/admin-action';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type {
    AdminBadgeCell,
    AdminCell,
    AdminColumn,
    AdminImageCell,
    AdminPaginatedRows,
    AdminRow,
} from '@/types';

export function AdminDataTable({
    columns,
    rows,
    emptyState = 'Belum ada data.',
}: {
    columns: AdminColumn[];
    rows: AdminPaginatedRows | AdminRow[];
    emptyState?: string;
}) {
    const data = Array.isArray(rows) ? rows : rows.data;
    const links = Array.isArray(rows) ? [] : (rows.links ?? []);

    return (
        <div className="space-y-4">
            <div className="overflow-hidden rounded-md border bg-background">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map((column) => (
                                <TableHead key={column.key}>{column.label}</TableHead>
                            ))}
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length ? (
                            data.map((row) => (
                                <TableRow key={row.id}>
                                    {columns.map((column) => (
                                        <TableCell key={`${row.id}-${column.key}`}>
                                            <Cell value={row[column.key] as AdminCell} />
                                        </TableCell>
                                    ))}
                                    <TableCell className="min-w-52">
                                        <AdminActionList actions={row.actions} />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length + 1} className="h-24 text-center text-muted-foreground">
                                    {emptyState}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {links.length > 0 && (
                <div className="flex flex-wrap items-center justify-end gap-2">
                    {links.map((link) => (
                        <Button
                            asChild={Boolean(link.url)}
                            variant={link.active ? 'default' : 'outline'}
                            size="sm"
                            disabled={!link.url}
                            key={`${link.label}-${link.url}`}
                        >
                            {link.url ? <Link href={link.url}>{cleanLabel(link.label)}</Link> : <span>{cleanLabel(link.label)}</span>}
                        </Button>
                    ))}
                </div>
            )}
        </div>
    );
}

function Cell({ value }: { value: AdminCell }) {
    if (value === null || value === undefined || value === '') {
        return <span className="text-muted-foreground">-</span>;
    }

    if (typeof value === 'object' && 'type' in value && value.type === 'image') {
        return <ImageCell value={value} />;
    }

    if (typeof value === 'object' && 'label' in value) {
        return <BadgeCell value={value} />;
    }

    if (typeof value === 'boolean') {
        return value ? 'Ya' : 'Tidak';
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

    return <img src={value.src} alt={value.alt ?? ''} className="size-10 rounded-md border object-cover" />;
}

function BadgeCell({ value }: { value: AdminBadgeCell }) {
    const tone = value.tone ?? 'neutral';

    return (
        <Badge
            variant={tone === 'danger' ? 'destructive' : tone === 'success' ? 'default' : 'outline'}
            className={cn(
                tone === 'success' && 'border-emerald-600 bg-emerald-600 text-white',
                tone === 'warning' && 'border-amber-500 bg-amber-50 text-amber-700',
                tone === 'neutral' && 'text-muted-foreground',
            )}
        >
            {value.label}
        </Badge>
    );
}

function cleanLabel(label: string): string {
    return label
        .replace('&laquo;', '«')
        .replace('&raquo;', '»')
        .replace('pagination.previous', '« Sebelumnya')
        .replace('pagination.next', 'Selanjutnya »');
}
