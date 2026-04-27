import { Form, Head, Link } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import {
    DatePickerInput,
    Field,
    Textarea,
} from '@/components/candidate/candidate-form';
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
    destroy as destroyExperience,
    index,
    store as storeExperience,
    update as updateExperience,
} from '@/routes/candidate/experiences';

type Experience = {
    id: number;
    company_name: string;
    job_title: string;
    start_date: string;
    end_date?: string | null;
    is_current: boolean;
    description?: string | null;
    location?: string | null;
    period: string;
};

export default function CandidateExperiences({
    experiences,
}: {
    experiences: Experience[];
}) {
    const { t } = useTranslate();

    return (
        <>
            <Head title={t('candidate.experiences.page_title')} />

            <div className="space-y-6">
                <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
                    <ExperienceForm t={t} />

                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {t('candidate.experiences.history_title')}
                            </CardTitle>
                            <CardDescription>
                                {t('candidate.experiences.history_description')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {experiences.length ? (
                                experiences.map((experience) => (
                                    <div
                                        className="rounded-lg border p-4"
                                        key={experience.id}
                                    >
                                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                            <div>
                                                <p className="font-medium">
                                                    {experience.job_title}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {experience.company_name} ·{' '}
                                                    {experience.period}
                                                </p>
                                                <p className="mt-2 text-sm text-muted-foreground">
                                                    {experience.location}
                                                </p>
                                            </div>
                                            <Button
                                                asChild
                                                size="sm"
                                                variant="destructive"
                                            >
                                                <Link
                                                    href={destroyExperience(
                                                        experience.id,
                                                    )}
                                                    method="delete"
                                                    as="button"
                                                >
                                                    <Trash2 />
                                                    {t(
                                                        'candidate.experiences.delete',
                                                    )}
                                                </Link>
                                            </Button>
                                        </div>
                                        {experience.description ? (
                                            <p className="mt-3 text-sm leading-6">
                                                {experience.description}
                                            </p>
                                        ) : null}
                                        <details className="mt-4">
                                            <summary className="cursor-pointer text-sm font-medium text-primary">
                                                {t(
                                                    'candidate.experiences.edit',
                                                )}
                                            </summary>
                                            <div className="mt-4">
                                                <ExperienceForm
                                                    experience={experience}
                                                    t={t}
                                                />
                                            </div>
                                        </details>
                                    </div>
                                ))
                            ) : (
                                <EmptyState
                                    title={t(
                                        'candidate.experiences.empty_title',
                                    )}
                                    description={t(
                                        'candidate.experiences.empty_description',
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

function ExperienceForm({
    experience,
    t,
}: {
    experience?: Experience;
    t: (key: string) => string;
}) {
    const isEdit = Boolean(experience);

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    {isEdit
                        ? t('candidate.experiences.form_edit_title')
                        : t('candidate.experiences.form_add_title')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Form
                    {...(isEdit
                        ? updateExperience.form(experience!.id)
                        : storeExperience.form())}
                    className="space-y-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <Field
                                label={t('candidate.experiences.company_name')}
                                name="company_name"
                                error={errors.company_name}
                            >
                                <Input
                                    name="company_name"
                                    defaultValue={
                                        experience?.company_name ?? ''
                                    }
                                    placeholder={t(
                                        'candidate.experiences.company_name_placeholder',
                                    )}
                                />
                            </Field>
                            <Field
                                label={t('candidate.experiences.job_title')}
                                name="job_title"
                                error={errors.job_title}
                            >
                                <Input
                                    name="job_title"
                                    defaultValue={experience?.job_title ?? ''}
                                    placeholder={t(
                                        'candidate.experiences.job_title_placeholder',
                                    )}
                                />
                            </Field>
                            <div className="grid gap-4 md:grid-cols-2">
                                <Field
                                    label={t(
                                        'candidate.experiences.start_date',
                                    )}
                                    name="start_date"
                                    error={errors.start_date}
                                >
                                    <DatePickerInput
                                        name="start_date"
                                        defaultValue={experience?.start_date}
                                        placeholder={t(
                                            'candidate.experiences.start_date_placeholder',
                                        )}
                                    />
                                </Field>
                                <Field
                                    label={t('candidate.experiences.end_date')}
                                    name="end_date"
                                    error={errors.end_date}
                                >
                                    <DatePickerInput
                                        name="end_date"
                                        defaultValue={experience?.end_date}
                                        placeholder={t(
                                            'candidate.experiences.end_date_placeholder',
                                        )}
                                    />
                                </Field>
                            </div>
                            <input type="hidden" name="is_current" value="0" />
                            <label className="flex items-center gap-3 text-sm">
                                <input
                                    className="size-4 rounded border-input"
                                    type="checkbox"
                                    name="is_current"
                                    value="1"
                                    defaultChecked={
                                        experience?.is_current ?? false
                                    }
                                />
                                {t('candidate.experiences.is_current')}
                            </label>
                            <Field
                                label={t('candidate.experiences.location')}
                                name="location"
                                error={errors.location}
                            >
                                <Input
                                    name="location"
                                    defaultValue={experience?.location ?? ''}
                                    placeholder={t(
                                        'candidate.experiences.location_placeholder',
                                    )}
                                />
                            </Field>
                            <Field
                                label={t('candidate.experiences.description')}
                                name="description"
                                error={errors.description}
                            >
                                <Textarea
                                    name="description"
                                    defaultValue={experience?.description ?? ''}
                                    placeholder={t(
                                        'candidate.experiences.description_placeholder',
                                    )}
                                />
                            </Field>
                            <Button disabled={processing}>
                                {processing
                                    ? t('candidate.form.saving')
                                    : isEdit
                                      ? t('candidate.form.save_changes')
                                      : t(
                                            'candidate.experiences.form_add_button',
                                        )}
                            </Button>
                        </>
                    )}
                </Form>
            </CardContent>
        </Card>
    );
}

CandidateExperiences.layout = {
    breadcrumbs: [
        {
            title: 'Pengalaman Kerja',
            href: index(),
        },
    ],
};
