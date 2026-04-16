import { Link } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export function EmptyState({
    title,
    description,
    children,
}: {
    title: string;
    description: string;
    children?: React.ReactNode;
}) {
    return (
        <Card className="border-dashed">
            <CardContent className="flex min-h-40 flex-col items-center justify-center gap-3 text-center">
                <div>
                    <p className="font-medium text-foreground">{title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {description}
                    </p>
                </div>
                {children}
            </CardContent>
        </Card>
    );
}

export function PaginationLinks({ links = [] }: { links?: PaginationLink[] }) {
    if (!links.length) {
        return null;
    }

    return (
        <div className="flex flex-wrap justify-end gap-2">
            {links.map((link, index) =>
                link.url ? (
                    <Button
                        key={`${link.label}-${index}`}
                        asChild
                        size="sm"
                        variant={link.active ? 'default' : 'outline'}
                    >
                        <Link href={link.url}>{cleanPaginationLabel(link.label)}</Link>
                    </Button>
                ) : (
                    <Button
                        key={`${link.label}-${index}`}
                        size="sm"
                        variant="outline"
                        disabled
                    >
                        {cleanPaginationLabel(link.label)}
                    </Button>
                ),
            )}
        </div>
    );
}

function cleanPaginationLabel(label: string): string {
    return label
        .replace('&laquo;', '«')
        .replace('&raquo;', '»')
        .replace('pagination.previous', '«')
        .replace('pagination.next', '»');
}

export function StatusBadge({
    status,
    label,
    className,
}: {
    status: string;
    label?: string;
    className?: string;
}) {
    const tone =
        status === 'hired' ||
        status === 'offer' ||
        status === 'confirmed' ||
        status === 'published'
            ? 'default'
            : status === 'rejected' ||
                status === 'withdrawn' ||
                status === 'cancelled'
              ? 'destructive'
              : 'secondary';

    return (
        <Badge className={cn('capitalize', className)} variant={tone}>
            {label ?? status.replaceAll('_', ' ')}
        </Badge>
    );
}

export function ProgressBar({ value }: { value: number }) {
    return (
        <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
            />
        </div>
    );
}
