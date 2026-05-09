import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { AdminActionButton, AdminActionList } from '@/components/admin/admin-action';
import { useTranslate } from '@/hooks/use-translate';
import { Button } from '@/components/ui/button';
import type { AdminAction } from '@/types';

export function AdminPageHeader({
    title,
    description,
    action,
    actions,
    backHref,
}: {
    title: string;
    description?: string;
    action?: AdminAction;
    actions?: AdminAction[];
    backHref?: string;
}) {
    const { t } = useTranslate();
    const resolvedActions = actions ?? (action ? [action] : []);

    return (
        <div className="flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
                {backHref && (
                    <Button asChild variant="outline" size="sm">
                        <Link href={backHref}>
                            <ArrowLeft />
                            {t('admin.components.admin_page_header.back')}
                        </Link>
                    </Button>
                )}
                <div>
                    <h1 className="text-2xl font-semibold tracking-normal">{title}</h1>
                    {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
                </div>
            </div>
            {resolvedActions.length === 1 ? (
                <AdminActionButton action={resolvedActions[0]} />
            ) : resolvedActions.length > 1 ? (
                <AdminActionList actions={resolvedActions} />
            ) : null}
        </div>
    );
}
