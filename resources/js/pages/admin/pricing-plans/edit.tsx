import { Head } from '@inertiajs/react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { PricingPlanForm } from './form';
import type { PricingPlanValue } from './form';

type PricingPlanEditProps = {
    title: string;
    description?: string;
    backHref: string;
    updateAction: string;
    plan: PricingPlanValue;
};

export default function PricingPlanEdit({
    title,
    description,
    backHref,
    updateAction,
    plan,
}: PricingPlanEditProps) {
    return (
        <>
            <Head title={title} />

            <div className="flex flex-col gap-6 p-6">
                <AdminPageHeader
                    title={title}
                    description={description}
                    backHref={backHref}
                />
                <PricingPlanForm
                    action={updateAction}
                    method="patch"
                    plan={plan}
                />
            </div>
        </>
    );
}
