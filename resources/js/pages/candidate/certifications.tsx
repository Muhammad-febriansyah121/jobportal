import { Form, Head, Link } from '@inertiajs/react';
import { ExternalLink, Trash2 } from 'lucide-react';
import Heading from '@/components/heading';
import {
    DatePickerInput,
    Field,
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
    return (
        <>
            <Head title="Sertifikasi" />
            <div className="space-y-6 p-4 md:p-6">
                <Heading
                    title="Sertifikasi"
                    description="Kelola sertifikat dan credential link yang memperkuat profil kamu."
                />
                <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
                    <CertificationForm />
                    <Card>
                        <CardHeader>
                            <CardTitle>Daftar sertifikasi</CardTitle>
                            <CardDescription>
                                Sertifikasi terbaru tampil di atas.
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
                                                        Credential
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
                                                    Hapus
                                                </Link>
                                            </Button>
                                        </div>
                                        <details className="mt-4">
                                            <summary className="cursor-pointer text-sm font-medium text-primary">
                                                Edit sertifikasi
                                            </summary>
                                            <div className="mt-4">
                                                <CertificationForm
                                                    certification={
                                                        certification
                                                    }
                                                />
                                            </div>
                                        </details>
                                    </div>
                                ))
                            ) : (
                                <EmptyState
                                    title="Belum ada sertifikasi"
                                    description="Tambahkan sertifikat profesional, bootcamp, atau lisensi yang relevan."
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
}: {
    certification?: Certification;
}) {
    const isEdit = Boolean(certification);

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    {isEdit ? 'Edit sertifikasi' : 'Tambah sertifikasi'}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Form
                    {...(isEdit
                        ? updateCertification.form(
                              certification!.id,
                          )
                        : storeCertification.form())}
                    className="space-y-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <Field
                                label="Nama sertifikasi"
                                name="name"
                                error={errors.name}
                            >
                                <Input
                                    name="name"
                                    defaultValue={certification?.name ?? ''}
                                    placeholder="AWS Certified Cloud Practitioner"
                                />
                            </Field>
                            <Field
                                label="Penerbit"
                                name="issuing_org"
                                error={errors.issuing_org}
                            >
                                <Input
                                    name="issuing_org"
                                    defaultValue={
                                        certification?.issuing_org ?? ''
                                    }
                                    placeholder="Amazon Web Services"
                                />
                            </Field>
                            <Field
                                label="Tanggal terbit"
                                name="issue_date"
                                error={errors.issue_date}
                            >
                                <DatePickerInput
                                    name="issue_date"
                                    defaultValue={certification?.issue_date}
                                    placeholder="Pilih tanggal terbit"
                                />
                            </Field>
                            <Field
                                label="Credential URL"
                                name="credential_url"
                                error={errors.credential_url}
                            >
                                <Input
                                    name="credential_url"
                                    defaultValue={
                                        certification?.credential_url ?? ''
                                    }
                                    placeholder="https://..."
                                />
                            </Field>
                            <Button disabled={processing}>
                                {processing
                                    ? 'Menyimpan...'
                                    : isEdit
                                      ? 'Simpan perubahan'
                                      : 'Tambah sertifikasi'}
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
