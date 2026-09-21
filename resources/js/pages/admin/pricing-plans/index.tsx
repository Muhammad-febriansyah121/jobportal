import { Head, Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { AdminDataTable } from '@/components/admin/admin-data-table';
import { AdminFilterBar } from '@/components/admin/admin-filter-bar';
import { Button } from '@/components/ui/button';
import { useTranslate } from '@/hooks/use-translate';
import type { AdminColumn, AdminField, AdminPaginatedRows } from '@/types';

type PricingPlanIndexProps = {
    title: string;
    description?: string;
    indexAction: string;
    createHref: string;
    filters?: AdminField[];
    columns: AdminColumn[];
    rows: AdminPaginatedRows;
    emptyState?: string;
};

export default function PricingPlanIndex({
    title,
    description,
    indexAction,
    createHref,
    filters,
    columns,
    rows,
    emptyState,
}: PricingPlanIndexProps) {
    const { t } = useTranslate();
    return (
        <>
            <Head title={title} />

            <div className="flex flex-col gap-6 p-6">
                <div className="flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-normal">
                            {title}
                        </h1>
                        {description ? (
                            <p className="mt-1 text-sm text-muted-foreground">
                                {description}
                            </p>
                        ) : null}
                    </div>
                    <Button asChild className="bg-[#0F4C94] hover:bg-[#093579]">
                        <Link href={createHref} prefetch>
                            <Plus />
                            {t('admin.pricing_plans_index.add_plan')}
                        </Link>
                    </Button>
                </div>

                <AdminFilterBar fields={filters} indexAction={indexAction} />
                <AdminDataTable
                    columns={columns}
                    rows={rows}
                    emptyState={emptyState}
                />
            </div>
        </>
    );
}
