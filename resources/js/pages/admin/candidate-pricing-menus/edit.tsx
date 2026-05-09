import { Head } from '@inertiajs/react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { CandidatePricingMenuForm } from './form';
import type { CandidatePricingMenuValue } from './form';

type CandidatePricingMenuEditProps = {
    title: string;
    description?: string;
    backHref: string;
    updateAction: string;
    menu: CandidatePricingMenuValue;
};

export default function CandidatePricingMenuEdit({
    title,
    description,
    backHref,
    updateAction,
    menu,
}: CandidatePricingMenuEditProps) {
    return (
        <>
            <Head title={title} />

            <div className="flex flex-col gap-6 p-6">
                <AdminPageHeader
                    title={title}
                    description={description}
                    backHref={backHref}
                />
                <CandidatePricingMenuForm
                    action={updateAction}
                    method="patch"
                    menu={menu}
                />
            </div>
        </>
    );
}
