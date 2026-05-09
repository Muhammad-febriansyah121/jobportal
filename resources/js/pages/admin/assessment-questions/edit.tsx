import { Head } from '@inertiajs/react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AssessmentQuestionForm } from './form';
import type { AssessmentQuestionValue } from './form';

type Option = {
    value: string;
    label: string;
};

type AssessmentQuestionEditProps = {
    title: string;
    description?: string;
    backHref: string;
    updateAction: string;
    skillOptions: Option[];
    difficultyOptions: Option[];
    question: AssessmentQuestionValue;
};

export default function AssessmentQuestionEdit({
    title,
    description,
    backHref,
    updateAction,
    skillOptions,
    difficultyOptions,
    question,
}: AssessmentQuestionEditProps) {
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
                    action={updateAction}
                    method="patch"
                    difficultyOptions={difficultyOptions}
                    question={question}
                    skillOptions={skillOptions}
                />
            </div>
        </>
    );
}
