import { Form, Head, Link } from '@inertiajs/react';
import EmployerCompanyVerificationController from '@/actions/App/Http/Controllers/Employer/EmployerCompanyVerificationController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit as companyEdit } from '@/routes/employer/company';
import { index } from '@/routes/employer/verification';

type VerificationPageProps = {
    company: {
        id: number;
        name: string;
        verification_status: string;
        is_verified: boolean;
    };
    verification: {
        id: number;
        legal_name: string;
        nib?: string | null;
        npwp?: string | null;
        document_url?: string | null;
        status: string;
        status_label: string;
        rejection_reason?: string | null;
        submitted_by?: string | null;
        submitted_at?: string | null;
        reviewed_at?: string | null;
    } | null;
    canSubmit: boolean;
};

export default function EmployerVerification({
    company,
    verification,
    canSubmit,
}: VerificationPageProps) {
    return (
        <>
            <Head title="Verifikasi Perusahaan" />

            <div className="space-y-6 p-4 md:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <Heading
                        title="Verifikasi Perusahaan"
                        description="Kirim dokumen legal agar trust badge perusahaan siap dipakai di lowongan dan profil publik."
                    />
                    <Button variant="outline" asChild>
                        <Link href={companyEdit()}>Edit profil perusahaan</Link>
                    </Button>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <Card>
                        <CardHeader>
                            <CardTitle>Dokumen legal</CardTitle>
                            <CardDescription>
                                Submit NIB, NPWP, dan dokumen pendukung untuk
                                direview admin Karivia.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {canSubmit ? (
                                <Form
                                    {...EmployerCompanyVerificationController.store.form()}
                                    className="space-y-6"
                                    encType="multipart/form-data"
                                >
                                    {({ processing, errors, progress }) => (
                                        <>
                                            <Field
                                                label="Nama legal perusahaan"
                                                name="legal_name"
                                                error={errors.legal_name}
                                            >
                                                <Input
                                                    name="legal_name"
                                                    defaultValue={
                                                        verification?.legal_name ??
                                                        company.name
                                                    }
                                                    placeholder="PT Karivia Indonesia"
                                                />
                                            </Field>

                                            <div className="grid gap-4 md:grid-cols-2">
                                                <Field
                                                    label="NIB"
                                                    name="nib"
                                                    error={errors.nib}
                                                >
                                                    <Input
                                                        name="nib"
                                                        defaultValue={
                                                            verification?.nib ??
                                                            ''
                                                        }
                                                        placeholder="Nomor Induk Berusaha"
                                                    />
                                                </Field>
                                                <Field
                                                    label="NPWP"
                                                    name="npwp"
                                                    error={errors.npwp}
                                                >
                                                    <Input
                                                        name="npwp"
                                                        defaultValue={
                                                            verification?.npwp ??
                                                            ''
                                                        }
                                                        placeholder="Nomor NPWP perusahaan"
                                                    />
                                                </Field>
                                            </div>

                                            <Field
                                                label="Upload dokumen legal"
                                                name="document"
                                                error={errors.document}
                                            >
                                                <Input
                                                    type="file"
                                                    name="document"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                />
                                            </Field>

                                            <Field
                                                label="Atau URL dokumen"
                                                name="document_url"
                                                error={errors.document_url}
                                            >
                                                <Input
                                                    name="document_url"
                                                    defaultValue={
                                                        verification?.document_url ??
                                                        ''
                                                    }
                                                    placeholder="https://.../dokumen.pdf"
                                                />
                                            </Field>

                                            {progress ? (
                                                <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                                                    Upload {progress.percentage}%
                                                </div>
                                            ) : null}

                                            <Button disabled={processing}>
                                                Submit Verifikasi
                                            </Button>
                                        </>
                                    )}
                                </Form>
                            ) : (
                                <div className="rounded-lg border bg-muted/30 p-5 text-sm text-muted-foreground">
                                    {company.is_verified
                                        ? 'Perusahaan sudah terverifikasi. Hubungi admin jika data legal perlu diperbarui.'
                                        : 'Submission sedang direview. Anda dapat mengirim ulang setelah admin meminta revisi atau menolak dokumen.'}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Status verifikasi</CardTitle>
                                <CardDescription>
                                    Status terbaru dari submission legal
                                    perusahaan.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Tile label="Perusahaan">
                                    <span className="text-sm font-medium text-foreground">
                                        {company.name}
                                    </span>
                                </Tile>
                                <Tile label="Status">
                                    <StatusBadge
                                        status={company.verification_status}
                                        label={
                                            verification?.status_label ??
                                            company.verification_status
                                        }
                                    />
                                </Tile>
                                <Tile label="Submit terakhir">
                                    <span className="text-sm text-foreground">
                                        {verification?.submitted_at ??
                                            'Belum pernah submit'}
                                    </span>
                                </Tile>
                                {verification?.document_url ? (
                                    <Button variant="outline" asChild>
                                        <a
                                            href={verification.document_url}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            Lihat dokumen
                                        </a>
                                    </Button>
                                ) : null}
                            </CardContent>
                        </Card>

                        {verification?.rejection_reason ? (
                            <Card className="border-amber-200 bg-amber-50/80">
                                <CardHeader>
                                    <CardTitle>Catatan reviewer</CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm text-amber-800">
                                    {verification.rejection_reason}
                                </CardContent>
                            </Card>
                        ) : null}
                    </div>
                </div>
            </div>
        </>
    );
}

function Field({
    label,
    name,
    error,
    children,
}: {
    label: string;
    name: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={name}>{label}</Label>
            {children}
            <InputError message={error} />
        </div>
    );
}

function Tile({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-lg border bg-background p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <div className="mt-2">{children}</div>
        </div>
    );
}

function StatusBadge({ status, label }: { status: string; label: string }) {
    const variant =
        status === 'approved'
            ? 'default'
            : status === 'pending' || status === 'need_revision'
              ? 'outline'
              : 'secondary';

    return <Badge variant={variant}>{label.replaceAll('_', ' ')}</Badge>;
}

EmployerVerification.layout = {
    breadcrumbs: [
        {
            title: 'Verifikasi Perusahaan',
            href: index(),
        },
    ],
};
