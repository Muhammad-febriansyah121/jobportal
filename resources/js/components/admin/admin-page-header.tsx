import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { AdminActionButton } from '@/components/admin/admin-action';
import { Button } from '@/components/ui/button';
import type { AdminAction } from '@/types';

export function AdminPageHeader({
    title,
    description,
    action,
    backHref,
}: {
    title: string;
    description?: string;
    action?: AdminAction;
    backHref?: string;
}) {
    return (
        <div className="flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
                {backHref && (
                    <Button asChild variant="outline" size="sm">
                        <Link href={backHref}>
                            <ArrowLeft />
                            Kembali
                        </Link>
                    </Button>
                )}
                <div>
                    <h1 className="text-2xl font-semibold tracking-normal">{title}</h1>
                    {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
                </div>
            </div>
            {action && <AdminActionButton action={action} />}
        </div>
    );
}
