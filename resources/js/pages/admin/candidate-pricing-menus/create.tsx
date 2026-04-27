import { Head } from '@inertiajs/react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { CandidatePricingMenuForm } from './form';

type CandidatePricingMenuCreateProps = {
    title: string;
    description?: string;
    backHref: string;
    storeAction: string;
};

export default function CandidatePricingMenuCreate({
    title,
    description,
    backHref,
    storeAction,
}: CandidatePricingMenuCreateProps) {
    return (
        <>
            <Head title={title} />

            <div className="flex flex-col gap-6 p-6">
                <AdminPageHeader
                    title={title}
                    description={description}
                    backHref={backHref}
                />
                <CandidatePricingMenuForm action={storeAction} />
            </div>
        </>
    );
}
