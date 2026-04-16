import { Form, Head, Link } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import Heading from '@/components/heading';
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
    return (
        <>
            <Head title="Pendidikan" />
            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title="Pendidikan"
                    description="Kelola riwayat pendidikan formal yang mendukung profil kamu."
                />
                <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
                    <EducationForm />
                    <Card>
                        <CardHeader>
                            <CardTitle>Riwayat pendidikan</CardTitle>
                            <CardDescription>
                                Pendidikan terbaru tampil lebih dulu.
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
                                                    {education.start_year ?? '-'} -{' '}
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
                                                    Hapus
                                                </Link>
                                            </Button>
                                        </div>
                                        <details className="mt-4">
                                            <summary className="cursor-pointer text-sm font-medium text-primary">
                                                Edit pendidikan
                                            </summary>
                                            <div className="mt-4">
                                                <EducationForm
                                                    education={education}
                                                />
                                            </div>
                                        </details>
                                    </div>
                                ))
                            ) : (
                                <EmptyState
                                    title="Belum ada pendidikan"
                                    description="Tambahkan pendidikan terakhir atau yang paling relevan."
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

function EducationForm({ education }: { education?: Education }) {
    const isEdit = Boolean(education);

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    {isEdit ? 'Edit pendidikan' : 'Tambah pendidikan'}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Form
                    {...(isEdit
                        ? updateEducation.form(
                              education!.id,
                          )
                        : storeEducation.form())}
                    className="space-y-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <Field
                                label="Institusi"
                                name="institution"
                                error={errors.institution}
                            >
                                <Input
                                    name="institution"
                                    defaultValue={education?.institution ?? ''}
                                    placeholder="Universitas Indonesia"
                                />
                            </Field>
                            <div className="grid gap-4 md:grid-cols-2">
                                <Field
                                    label="Gelar"
                                    name="degree"
                                    error={errors.degree}
                                >
                                    <Input
                                        name="degree"
                                        defaultValue={education?.degree ?? ''}
                                        placeholder="S1"
                                    />
                                </Field>
                                <Field
                                    label="Bidang studi"
                                    name="field_of_study"
                                    error={errors.field_of_study}
                                >
                                    <Input
                                        name="field_of_study"
                                        defaultValue={
                                            education?.field_of_study ?? ''
                                        }
                                        placeholder="Informatika"
                                    />
                                </Field>
                            </div>
                            <div className="grid gap-4 md:grid-cols-3">
                                <Field
                                    label="Tahun mulai"
                                    name="start_year"
                                    error={errors.start_year}
                                >
                                    <Input
                                        type="number"
                                        name="start_year"
                                        defaultValue={
                                            education?.start_year ?? ''
                                        }
                                        placeholder="2019"
                                    />
                                </Field>
                                <Field
                                    label="Tahun selesai"
                                    name="end_year"
                                    error={errors.end_year}
                                >
                                    <Input
                                        type="number"
                                        name="end_year"
                                        defaultValue={education?.end_year ?? ''}
                                        placeholder="2023"
                                    />
                                </Field>
                                <Field
                                    label="GPA"
                                    name="gpa"
                                    error={errors.gpa}
                                >
                                    <Input
                                        type="number"
                                        step="0.01"
                                        name="gpa"
                                        defaultValue={education?.gpa ?? ''}
                                        placeholder="3.75"
                                    />
                                </Field>
                            </div>
                            <Button disabled={processing}>
                                {processing
                                    ? 'Menyimpan...'
                                    : isEdit
                                      ? 'Simpan perubahan'
                                      : 'Tambah pendidikan'}
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
