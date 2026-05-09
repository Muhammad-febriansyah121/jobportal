import { Head } from '@inertiajs/react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { PricingPlanForm } from './form';

type PricingPlanCreateProps = {
    title: string;
    description?: string;
    backHref: string;
    storeAction: string;
};

export default function PricingPlanCreate({
    title,
    description,
    backHref,
    storeAction,
}: PricingPlanCreateProps) {
    return (
        <>
            <Head title={title} />

            <div className="flex flex-col gap-6 p-6">
                <AdminPageHeader
                    title={title}
                    description={description}
                    backHref={backHref}
                />
                <PricingPlanForm action={storeAction} />
            </div>
        </>
    );
}
