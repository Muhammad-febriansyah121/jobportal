import { Head } from '@inertiajs/react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { CareerResourceForm } from './form';

type TypeOption = {
    value: string;
    label: string;
};

type CareerResourceCreateProps = {
    title: string;
    description?: string;
    backHref: string;
    storeAction: string;
    typeOptions: TypeOption[];
};

export default function CareerResourceCreate({
    title,
    description,
    backHref,
    storeAction,
    typeOptions,
}: CareerResourceCreateProps) {
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
                    action={storeAction}
                    typeOptions={typeOptions}
                />
            </div>
        </>
    );
}
