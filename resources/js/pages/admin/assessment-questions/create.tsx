import { Head } from '@inertiajs/react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AssessmentQuestionForm } from './form';

type Option = {
    value: string;
    label: string;
};

type AssessmentQuestionCreateProps = {
    title: string;
    description?: string;
    backHref: string;
    storeAction: string;
    skillOptions: Option[];
    difficultyOptions: Option[];
};

export default function AssessmentQuestionCreate({
    title,
    description,
    backHref,
    storeAction,
    skillOptions,
    difficultyOptions,
}: AssessmentQuestionCreateProps) {
    return (
        <>
            <Head title={title} />

            <div className="flex flex-col gap-6 p-6">
                <AdminPageHeader
                    title={title}
                    description={description}
                    backHref={backHref}
                />
                <AssessmentQuestionForm
                    action={storeAction}
                    difficultyOptions={difficultyOptions}
                    skillOptions={skillOptions}
                />
            </div>
        </>
    );
}
