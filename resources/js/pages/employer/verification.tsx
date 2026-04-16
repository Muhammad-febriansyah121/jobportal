import { Form, Head, Link } from '@inertiajs/react';
import { CheckCircle2, FileText, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
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

                                            <DocumentUploadField
                                                name="document"
                                                currentUrl={
                                                    verification?.document_url
                                                }
                                                error={errors.document}
                                            />

                                            {progress ? (
                                                <div className="space-y-1.5">
                                                    <div className="flex justify-between text-xs text-muted-foreground">
                                                        <span>
                                                            Mengunggah dokumen…
                                                        </span>
                                                        <span>
                                                            {
                                                                progress.percentage
                                                            }
                                                            %
                                                        </span>
                                                    </div>
                                                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                                        <div
                                                            className="h-full rounded-full bg-primary transition-all"
                                                            style={{
                                                                width: `${progress.percentage}%`,
                                                            }}
                                                        />
                                                    </div>
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

function DocumentUploadField({
    name,
    currentUrl,
    error,
}: {
    name: string;
    currentUrl?: string | null;
    error?: string;
}) {
    const [file, setFile] = useState<File | null>(null);
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const isPdf = (f: File) => f.type === 'application/pdf';
    const formatSize = (bytes: number) =>
        bytes >= 1_000_000
            ? `${(bytes / 1_000_000).toFixed(1)} MB`
            : `${Math.round(bytes / 1024)} KB`;

    const handleFiles = (files: FileList | null) => {
        if (files?.[0]) {
            setFile(files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
    };

    const handleClear = () => {
        setFile(null);
        if (inputRef.current) inputRef.current.value = '';
    };

    const hasExistingDoc = !!currentUrl && !file;

    return (
        <div className="grid gap-2">
            <Label>Dokumen legal</Label>
            <p className="text-xs text-muted-foreground">
                Upload NIB, NPWP, akta pendirian, atau dokumen legalitas
                lainnya. Format: PDF, JPG, PNG — maks 5 MB.
            </p>

            {/* Current document indicator */}
            {hasExistingDoc && (
                <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                    <CheckCircle2 className="size-5 shrink-0 text-green-600" />
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-green-800">
                            Dokumen sebelumnya tersimpan
                        </p>
                        <a
                            href={currentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="truncate text-xs text-green-700 underline-offset-2 hover:underline"
                        >
                            Lihat dokumen
                        </a>
                    </div>
                    <span className="shrink-0 text-xs text-green-600">
                        Upload baru untuk mengganti
                    </span>
                </div>
            )}

            {/* Selected file preview */}
            {file ? (
                <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-background">
                        <FileText className="size-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                            {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {formatSize(file.size)}
                            {isPdf(file) ? ' · PDF' : ' · Gambar'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleClear}
                        className="rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        title="Hapus pilihan"
                    >
                        <X className="size-4" />
                    </button>
                </div>
            ) : (
                /* Drop zone */
                <div
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                    className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
                        dragging
                            ? 'border-primary bg-primary/5'
                            : 'border-input bg-muted/20 hover:border-ring hover:bg-muted/40'
                    }`}
                >
                    <div className="flex size-12 items-center justify-center rounded-full border bg-background">
                        <Upload className="size-5 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-sm font-medium">
                            Klik untuk pilih file, atau drag &amp; drop
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            PDF, JPG, PNG hingga 5 MB
                        </p>
                    </div>
                </div>
            )}

            <input
                ref={inputRef}
                type="file"
                name={name}
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
            />
            <InputError message={error} />
        </div>
    );
}

EmployerVerification.layout = {
    breadcrumbs: [
        {
            title: 'Verifikasi Perusahaan',
            href: index(),
        },
    ],
};
