import { Head } from '@inertiajs/react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { CareerResourceForm } from './form';
import type { CareerResourceFormValue } from './form';

type TypeOption = {
    value: string;
    label: string;
};

type CareerResourceEditProps = {
    title: string;
    description?: string;
    backHref: string;
    updateAction: string;
    typeOptions: TypeOption[];
    resource: CareerResourceFormValue;
};

export default function CareerResourceEdit({
    title,
    description,
    backHref,
    updateAction,
    typeOptions,
    resource,
}: CareerResourceEditProps) {
    return (
        <>
            <Head title={title} />

            <div className="flex flex-col gap-6 p-6">
                <AdminPageHeader
                    title={title}
                    description={description}
                    backHref={backHref}
                />
                <CareerResourceForm
                    action={updateAction}
                    method="patch"
                    resource={resource}
                    typeOptions={typeOptions}
                />
            </div>
        </>
    );
}
