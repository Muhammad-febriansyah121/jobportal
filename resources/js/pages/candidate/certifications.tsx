import { Form, Head, Link } from '@inertiajs/react';
import { ExternalLink, Trash2 } from 'lucide-react';
import { DatePickerInput, Field } from '@/components/candidate/candidate-form';
import { EmptyState } from '@/components/candidate/candidate-ui';
import Heading from '@/components/heading';
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
    destroy as destroyCertification,
    index,
    store as storeCertification,
    update as updateCertification,
} from '@/routes/candidate/certifications';

type Certification = {
    id: number;
    name: string;
    issuing_org?: string | null;
    issue_date?: string | null;
    credential_url?: string | null;
};

export default function CandidateCertifications({
    certifications,
}: {
    certifications: Certification[];
}) {
    const { t } = useTranslate();

    return (
        <>
            <Head title={t('candidate.certifications.page_title')} />
            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title={t('candidate.certifications.heading_title')}
                    description={t(
                        'candidate.certifications.heading_description',
                    )}
                />
                <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
                    <CertificationForm t={t} />
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {t('candidate.certifications.list_title')}
                            </CardTitle>
                            <CardDescription>
                                {t('candidate.certifications.list_description')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {certifications.length ? (
                                certifications.map((certification) => (
                                    <div
                                        className="rounded-lg border p-4"
                                        key={certification.id}
                                    >
                                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                            <div>
                                                <p className="font-medium">
                                                    {certification.name}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {certification.issuing_org ??
                                                        '-'}{' '}
                                                    ·{' '}
                                                    {certification.issue_date ??
                                                        '-'}
                                                </p>
                                                {certification.credential_url ? (
                                                    <a
                                                        className="mt-2 inline-flex items-center gap-2 text-sm text-primary underline-offset-4 hover:underline"
                                                        href={
                                                            certification.credential_url
                                                        }
                                                        target="_blank"
                                                    >
                                                        <ExternalLink className="size-4" />
                                                        {t(
                                                            'candidate.certifications.credential',
                                                        )}
                                                    </a>
                                                ) : null}
                                            </div>
                                            <Button
                                                asChild
                                                size="sm"
                                                variant="destructive"
                                            >
                                                <Link
                                                    href={destroyCertification(
                                                        certification.id,
                                                    )}
                                                    method="delete"
                                                    as="button"
                                                >
                                                    <Trash2 />
                                                    {t(
                                                        'candidate.certifications.delete',
                                                    )}
                                                </Link>
                                            </Button>
                                        </div>
                                        <details className="mt-4">
                                            <summary className="cursor-pointer text-sm font-medium text-primary">
                                                {t(
                                                    'candidate.certifications.edit',
                                                )}
                                            </summary>
                                            <div className="mt-4">
                                                <CertificationForm
                                                    certification={
                                                        certification
                                                    }
                                                    t={t}
                                                />
                                            </div>
                                        </details>
                                    </div>
                                ))
                            ) : (
                                <EmptyState
                                    title={t(
                                        'candidate.certifications.empty_title',
                                    )}
                                    description={t(
                                        'candidate.certifications.empty_description',
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

function CertificationForm({
    certification,
    t,
}: {
    certification?: Certification;
    t: (key: string) => string;
}) {
    const isEdit = Boolean(certification);

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    {isEdit
                        ? t('candidate.certifications.form_edit_title')
                        : t('candidate.certifications.form_add_title')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Form
                    {...(isEdit
                        ? updateCertification.form(certification!.id)
                        : storeCertification.form())}
                    className="space-y-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <Field
                                label={t('candidate.certifications.name')}
                                name="name"
                                error={errors.name}
                            >
                                <Input
                                    name="name"
                                    defaultValue={certification?.name ?? ''}
                                    placeholder={t(
                                        'candidate.certifications.name_placeholder',
                                    )}
                                />
                            </Field>
                            <Field
                                label={t('candidate.certifications.issuer')}
                                name="issuing_org"
                                error={errors.issuing_org}
                            >
                                <Input
                                    name="issuing_org"
                                    defaultValue={
                                        certification?.issuing_org ?? ''
                                    }
                                    placeholder={t(
                                        'candidate.certifications.issuer_placeholder',
                                    )}
                                />
                            </Field>
                            <Field
                                label={t('candidate.certifications.issue_date')}
                                name="issue_date"
                                error={errors.issue_date}
                            >
                                <DatePickerInput
                                    name="issue_date"
                                    defaultValue={certification?.issue_date}
                                    placeholder={t(
                                        'candidate.certifications.issue_date_placeholder',
                                    )}
                                />
                            </Field>
                            <Field
                                label={t(
                                    'candidate.certifications.credential_url',
                                )}
                                name="credential_url"
                                error={errors.credential_url}
                            >
                                <Input
                                    name="credential_url"
                                    defaultValue={
                                        certification?.credential_url ?? ''
                                    }
                                    placeholder={t(
                                        'candidate.certifications.credential_url_placeholder',
                                    )}
                                />
                            </Field>
                            <Button disabled={processing}>
                                {processing
                                    ? t('candidate.form.saving')
                                    : isEdit
                                      ? t('candidate.form.save_changes')
                                      : t(
                                            'candidate.certifications.form_add_button',
                                        )}
                            </Button>
                        </>
                    )}
                </Form>
            </CardContent>
        </Card>
    );
}

CandidateCertifications.layout = {
    breadcrumbs: [
        {
            title: 'Sertifikasi',
            href: index(),
        },
    ],
};
