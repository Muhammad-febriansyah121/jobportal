import { Head } from '@inertiajs/react';
import { AdminDataTable } from '@/components/admin/admin-data-table';
import { AdminFilterBar } from '@/components/admin/admin-filter-bar';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import type { AdminAction, AdminColumn, AdminField, AdminPaginatedRows } from '@/types';

type AdminResourceIndexProps = {
    title: string;
    description?: string;
    indexAction: string;
    createAction?: AdminAction;
    filters?: AdminField[];
    columns: AdminColumn[];
    rows: AdminPaginatedRows;
    emptyState?: string;
};

export default function AdminResourceIndex({
    title,
    description,
    indexAction,
    createAction,
    filters,
    columns,
    rows,
    emptyState,
}: AdminResourceIndexProps) {
    return (
        <>
            <Head title={title} />

            <div className="flex flex-col gap-6 p-6">
                <AdminPageHeader title={title} description={description} action={createAction} />
                <AdminFilterBar fields={filters} indexAction={indexAction} />
                <AdminDataTable columns={columns} rows={rows} emptyState={emptyState} />
            </div>
        </>
    );
}
