import { Form, Head, Link } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import { Field } from '@/components/candidate/candidate-form';
import { EmptyState } from '@/components/candidate/candidate-ui';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useTranslate } from '@/hooks/use-translate';
import {
    destroy as destroyEducation,
    index,
    store as storeEducation,
    update as updateEducation,
} from '@/routes/candidate/educations';

type Education = {
    id: number;
    institution: string;
    degree?: string | null;
    field_of_study?: string | null;
    start_year?: number | null;
    end_year?: number | null;
    gpa?: string | number | null;
};

export default function CandidateEducations({
    educations,
}: {
    educations: Education[];
}) {
    const { t } = useTranslate();

    return (
        <>
            <Head title={t('candidate.educations.page_title')} />
            <div className="space-y-6">
                <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
                    <EducationForm t={t} />
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {t('candidate.educations.history_title')}
                            </CardTitle>
                            <CardDescription>
                                {t('candidate.educations.history_description')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {educations.length ? (
                                educations.map((education) => (
                                    <div
                                        className="rounded-lg border p-4"
                                        key={education.id}
                                    >
                                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                            <div>
                                                <p className="font-medium">
                                                    {education.institution}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {education.degree ?? '-'} ·{' '}
                                                    {education.field_of_study ??
                                                        '-'}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {education.start_year ??
                                                        '-'}{' '}
                                                    -{' '}
                                                    {education.end_year ?? '-'}
                                                </p>
                                            </div>
                                            <Button
                                                asChild
                                                size="sm"
                                                variant="destructive"
                                            >
                                                <Link
                                                    href={destroyEducation(
                                                        education.id,
                                                    )}
                                                    method="delete"
                                                    as="button"
                                                >
                                                    <Trash2 />
                                                    {t(
                                                        'candidate.educations.delete',
                                                    )}
                                                </Link>
                                            </Button>
                                        </div>
                                        <details className="mt-4">
                                            <summary className="cursor-pointer text-sm font-medium text-primary">
                                                {t('candidate.educations.edit')}
                                            </summary>
                                            <div className="mt-4">
                                                <EducationForm
                                                    education={education}
                                                    t={t}
                                                />
                                            </div>
                                        </details>
                                    </div>
                                ))
                            ) : (
                                <EmptyState
                                    title={t(
                                        'candidate.educations.empty_title',
                                    )}
                                    description={t(
                                        'candidate.educations.empty_description',
                                    )}
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

function EducationForm({
    education,
    t,
}: {
    education?: Education;
    t: (key: string) => string;
}) {
    const isEdit = Boolean(education);

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    {isEdit
                        ? t('candidate.educations.form_edit_title')
                        : t('candidate.educations.form_add_title')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Form
                    {...(isEdit
                        ? updateEducation.form(education!.id)
                        : storeEducation.form())}
                    className="space-y-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <Field
                                label={t('candidate.educations.institution')}
                                name="institution"
                                error={errors.institution}
                            >
                                <Input
                                    name="institution"
                                    defaultValue={education?.institution ?? ''}
                                    placeholder={t(
                                        'candidate.educations.institution_placeholder',
                                    )}
                                />
                            </Field>
                            <div className="grid gap-4 md:grid-cols-2">
                                <Field
                                    label={t('candidate.educations.degree')}
                                    name="degree"
                                    error={errors.degree}
                                >
                                    <Input
                                        name="degree"
                                        defaultValue={education?.degree ?? ''}
                                        placeholder={t(
                                            'candidate.educations.degree_placeholder',
                                        )}
                                    />
                                </Field>
                                <Field
                                    label={t(
                                        'candidate.educations.field_of_study',
                                    )}
                                    name="field_of_study"
                                    error={errors.field_of_study}
                                >
                                    <Input
                                        name="field_of_study"
                                        defaultValue={
                                            education?.field_of_study ?? ''
                                        }
                                        placeholder={t(
                                            'candidate.educations.field_of_study_placeholder',
                                        )}
                                    />
                                </Field>
                            </div>
                            <div className="grid gap-4 md:grid-cols-3">
                                <Field
                                    label={t('candidate.educations.start_year')}
                                    name="start_year"
                                    error={errors.start_year}
                                >
                                    <Input
                                        type="number"
                                        name="start_year"
                                        defaultValue={
                                            education?.start_year ?? ''
                                        }
                                        placeholder={t(
                                            'candidate.educations.start_year_placeholder',
                                        )}
                                    />
                                </Field>
                                <Field
                                    label={t('candidate.educations.end_year')}
                                    name="end_year"
                                    error={errors.end_year}
                                >
                                    <Input
                                        type="number"
                                        name="end_year"
                                        defaultValue={education?.end_year ?? ''}
                                        placeholder={t(
                                            'candidate.educations.end_year_placeholder',
                                        )}
                                    />
                                </Field>
                                <Field
                                    label={t('candidate.educations.gpa')}
                                    name="gpa"
                                    error={errors.gpa}
                                >
                                    <Input
                                        type="number"
                                        step="0.01"
                                        name="gpa"
                                        defaultValue={education?.gpa ?? ''}
                                        placeholder={t(
                                            'candidate.educations.gpa_placeholder',
                                        )}
                                    />
                                </Field>
                            </div>
                            <Button disabled={processing}>
                                {processing
                                    ? t('candidate.form.saving')
                                    : isEdit
                                      ? t('candidate.form.save_changes')
                                      : t(
                                            'candidate.educations.form_add_button',
                                        )}
                            </Button>
                        </>
                    )}
                </Form>
            </CardContent>
        </Card>
    );
}

CandidateEducations.layout = {
    breadcrumbs: [
        {
            title: 'Pendidikan',
            href: index(),
        },
    ],
};
